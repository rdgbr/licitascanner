/**
 * Importer Querido Diário — lê licitações já classificadas pelo JeP
 * (banco juridicoempauta, tabela Ato tipo LICITACAO) e faz upsert no
 * Licitacao do LicitaScanner.
 *
 * Fonte complementar ao PNCP: cobre diários oficiais municipais, inclusive
 * de municípios que ainda não publicam no PNCP (obrigatoriedade plena só em
 * abril/2027 pra municípios com até 20 mil habitantes).
 *
 * O JeP já roda a extração via API do Querido Diário todo dia às 2h
 * (scripts/import_qd.ts do juridicoempauta) — este script só lê o resultado
 * classificado, não faz scraping de novo.
 */
import { PrismaClient } from "@prisma/client";
import { categorizarObjeto } from "../src/lib/categorias.js";

const prisma = new PrismaClient();

const QD_SOURCE_URL = process.env.QD_SOURCE_DATABASE_URL;
if (!QD_SOURCE_URL) {
  console.error("[qd-import] QD_SOURCE_DATABASE_URL não configurada — abortando");
  process.exit(1);
}
const qd = new PrismaClient({ datasources: { db: { url: QD_SOURCE_URL } } });

// Dias atrás — maior que o do JeP (2d) pra dar folga contra atraso entre os dois crons.
const DAYS_BACK = Number(process.env.QD_LICITA_DAYS_BACK || 3);

type Entity = { type: string; value: string };

type QdRow = {
  ato_id: string;
  title: string;
  excerpt: string;
  body: string;
  entities: Entity[] | null;
  territory_id: string;
  municipio: string;
  uf: string;
  date: Date;
  url: string;
};

function parseMoneyBRL(v: string): number | null {
  // "R$ 48.125.000,00" -> 48125000.00
  const cleaned = v
    .replace(/[^\d.,]/g, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function extractValor(entities: Entity[] | null): number | null {
  if (!entities?.length) return null;
  const valores = entities
    .filter((e) => e.type === "money")
    .map((e) => parseMoneyBRL(e.value))
    .filter((n): n is number => n != null);
  if (!valores.length) return null;
  // O maior valor citado no bloco costuma ser o valor total do objeto
  // (valores unitários menores aparecem em listas de item).
  return Math.max(...valores);
}

function extractCnpj(entities: Entity[] | null): string | null {
  return entities?.find((e) => e.type === "cnpj")?.value ?? null;
}

function inferModalidade(text: string): { id: number; nome: string } {
  const t = text.toLowerCase();
  if (/preg[ãa]o eletr[ôo]nico/.test(t)) return { id: 6, nome: "Pregão Eletrônico" };
  if (/preg[ãa]o presencial/.test(t)) return { id: 7, nome: "Pregão Presencial" };
  if (/inexigibilidade/.test(t)) return { id: 9, nome: "Inexigibilidade" };
  if (/dispensa/.test(t)) return { id: 8, nome: "Dispensa de Licitação" };
  if (/concorr[êe]ncia/.test(t)) return { id: 4, nome: "Concorrência" };
  if (/credenciamento/.test(t)) return { id: 12, nome: "Credenciamento" };
  if (/concurso/.test(t)) return { id: 3, nome: "Concurso" };
  return { id: 0, nome: "Aviso de Licitação (Diário Oficial)" };
}

// Corta a captura antes de verbos de continuação de frase ("torna público",
// "comunica", "no uso de suas atribuições"...) pra não engolir a frase inteira
// quando não há vírgula/ponto logo após o nome do órgão.
const ORGAO_STOP_WORDS =
  "torna|comunica|informa|faz saber|atrav[ée]s|por meio|no uso|através|vem|resolve|realizar[aá]|torna[- ]se";

function inferOrgao(text: string, municipio: string): string {
  const stopRe = new RegExp(`(?!\\b(?:${ORGAO_STOP_WORDS})\\b)[^.\\n,;]`, "i");
  const m = text.match(
    new RegExp(
      `\\b((?:PREFEITURA|SECRETARIA|FUNDA[ÇC][ÃA]O|INSTITUTO|C[ÂA]MARA|AUTARQUIA|COMPANHIA|AG[ÊE]NCIA)(?:${stopRe.source}){0,80})`,
      "i"
    )
  );
  if (m) {
    const cleaned = m[1].trim().replace(/\s{2,}/g, " ").slice(0, 150);
    // Se sobrou pouca coisa depois de cortar nos stop-words, o match não presta.
    if (cleaned.split(" ").length >= 2) return cleaned;
  }
  return `Prefeitura Municipal de ${municipio}`;
}

async function main() {
  const run = await prisma.importRun.create({ data: { source: "querido_diario" } });
  console.log(`[qd-import] run=${run.id} starting (last ${DAYS_BACK}d)`);

  const since = new Date(Date.now() - DAYS_BACK * 86400_000);

  // Filtra por a."createdAt" (quando o JeP processou o ato), não por d.date
  // (quando o diário foi publicado) — diário não sai todo dia em toda cidade,
  // então filtrar pela data de publicação pode ficar sem achar nada em dias
  // normais mesmo com o JeP processando atos novos.
  const rows = await qd.$queryRaw<QdRow[]>`
    SELECT a.id as ato_id, a.title, a.excerpt, a.body, a.entities,
           d."territoryId" as territory_id, d.municipio, d.uf, d.date, d.url
    FROM "Ato" a
    JOIN "DiarioOficial" d ON a."diarioId" = d.id
    WHERE a.type = 'LICITACAO' AND a."createdAt" >= ${since}
    ORDER BY d.date DESC
  `;

  console.log(`[qd-import] ${rows.length} atos tipo LICITACAO encontrados desde ${since.toISOString().slice(0, 10)}`);

  let inserted = 0;
  let updated = 0;
  let errors = 0;
  let skippedDupe = 0;
  const seenInRun = new Set<string>();

  for (const row of rows) {
    try {
      // Dedup: JeP às vezes classifica o mesmo aviso em 2 blocos de texto adjacentes
      // (resumo + corpo) como atos LICITACAO separados. Chave por município+data+
      // início do título evita duplicar o mesmo edital como 2 registros.
      const dedupeKey = `${row.uf}|${row.municipio}|${row.date.toISOString().slice(0, 10)}|${row.title
        .slice(0, 60)
        .toLowerCase()}`;
      if (seenInRun.has(dedupeKey)) {
        skippedDupe++;
        continue;
      }
      seenInRun.add(dedupeKey);

      const id = `qd-${row.ato_id}`;
      const objeto = row.excerpt || row.title;
      const modalidade = inferModalidade(`${row.title} ${row.excerpt}`);

      const data = {
        id,
        modalidadeId: modalidade.id,
        modalidadeNome: modalidade.nome,
        objeto,
        cnaePrincipal: categorizarObjeto(objeto),
        valorEstimado: extractValor(row.entities),
        orgaoNome: inferOrgao(row.body, row.municipio),
        orgaoCnpj: extractCnpj(row.entities),
        municipio: row.municipio,
        uf: row.uf,
        dataPublicacao: row.date,
        situacao: "Publicada em Diário Oficial",
        linkEdital: row.url,
        fonte: "diario_oficial",
        raw: {
          atoId: row.ato_id,
          territoryId: row.territory_id,
          title: row.title,
          excerpt: row.excerpt,
        } as any,
      };

      const existing = await prisma.licitacao.findUnique({ where: { id } });
      await prisma.licitacao.upsert({ where: { id }, create: data, update: data });
      if (existing) updated++;
      else inserted++;
    } catch (e) {
      console.error("[qd-import] row error", e);
      errors++;
    }
  }

  await prisma.importRun.update({
    where: { id: run.id },
    data: { finishedAt: new Date(), inserted, updated, errors },
  });
  console.log(
    `[qd-import] done — inserted=${inserted} updated=${updated} errors=${errors} skippedDupe=${skippedDupe}`
  );
  await prisma.$disconnect();
  await qd.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
