/**
 * Migra licitações scraped do projeto antigo (SQLite) pro Postgres LicitaScanner.
 * Source: /root/CascadeProjects/licitacoes-poc/data/licitacoes.db
 */
import { PrismaClient } from "@prisma/client";
import Database from "better-sqlite3";

const prisma = new PrismaClient();
const SOURCE_DB = "/root/CascadeProjects/licitacoes-poc/data/licitacoes.db";

type OldRow = {
  id: string;
  titulo: string | null;
  descricao: string | null;
  objeto: string | null;
  orgao: string | null;
  orgao_cnpj: string | null;
  unidade: string | null;
  municipio: string | null;
  uf: string | null;
  esfera: string | null;
  modalidade: string | null;
  modalidade_id: number | null;
  situacao: string | null;
  status: string | null;
  data_publicacao: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  valor: number | null;
  valor_homologado: number | null;
  link_externo: string | null;
  url_pncp: string | null;
  numero_controle: string | null;
  categoria: string | null;
  keywords: string | null;
  modo_disputa: string | null;
};

function parseDate(s: string | null): Date | null {
  if (!s) return null;
  try {
    const d = new Date(s);
    if (isNaN(d.getTime())) return null;
    return d;
  } catch {
    return null;
  }
}

async function main() {
  const db = new Database(SOURCE_DB, { readonly: true });
  const totalRow = db.prepare("SELECT COUNT(*) as n FROM licitacoes").get() as { n: number };
  console.log(`[migrate] source has ${totalRow.n} rows`);

  const run = await prisma.importRun.create({
    data: { source: "sqlite_migration", watermark: "all" },
  });

  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  const BATCH = 500;
  const stmt = db.prepare(
    `SELECT id, titulo, descricao, objeto, orgao, orgao_cnpj, unidade, municipio, uf,
            esfera, modalidade, modalidade_id, situacao, status, data_publicacao,
            data_inicio, data_fim, valor, valor_homologado, link_externo, url_pncp,
            numero_controle, categoria, keywords, modo_disputa
     FROM licitacoes
     ORDER BY data_publicacao DESC`
  );

  const rows = stmt.all() as OldRow[];

  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    await prisma.$transaction(
      chunk.map((r) => {
        const id = r.numero_controle || r.id;
        const dataPublicacao = parseDate(r.data_publicacao);
        if (!dataPublicacao) {
          skipped++;
          return prisma.licitacao.findFirst({ where: { id: "__noop__" } }) as any;
        }
        const data = {
          id,
          modalidadeId: Number(r.modalidade_id) || 0,
          modalidadeNome: r.modalidade || "Outro",
          objeto: (r.objeto || r.descricao || r.titulo || "").slice(0, 8000),
          valorEstimado: r.valor ?? null,
          valorHomologado: r.valor_homologado ?? null,
          uasg: null,
          orgaoNome: r.orgao || "Órgão não informado",
          orgaoCnpj: r.orgao_cnpj ?? null,
          municipio: r.municipio ?? null,
          uf: r.uf ?? null,
          dataPublicacao,
          dataAbertura: parseDate(r.data_inicio),
          dataEncerramento: parseDate(r.data_fim),
          situacao: r.situacao || "Desconhecida",
          linkEdital: r.link_externo ?? null,
          linkSistema: r.url_pncp ?? null,
          cnaePrincipal: r.categoria ?? null,
          raw: { categoria: r.categoria, keywords: r.keywords, esfera: r.esfera, modo_disputa: r.modo_disputa } as any,
        };
        return prisma.licitacao.upsert({
          where: { id: data.id },
          create: data,
          update: data,
        });
      })
    ).catch((e) => {
      errors++;
      console.error(`[migrate] batch ${i}-${i + BATCH} error`, e);
    });

    inserted += chunk.length;
    console.log(`[migrate] ${inserted}/${rows.length} done`);
  }

  await prisma.importRun.update({
    where: { id: run.id },
    data: { finishedAt: new Date(), inserted, updated: 0, errors },
  });
  console.log(`[migrate] DONE — inserted=${inserted} skipped=${skipped} errors=${errors}`);
  db.close();
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
