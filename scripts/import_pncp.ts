/**
 * Importer PNCP — roda no node via `npm run import` ou cron.
 * Pega licitações publicadas/atualizadas nas últimas N horas e upserta.
 */
import { PrismaClient } from "@prisma/client";
import { listContratacoesByAtualizacao, modalidadeNome } from "../src/lib/pncp.js";
import { categorizarObjeto } from "../src/lib/categorias.js";

const prisma = new PrismaClient();

// Dias atrás (default 1 = últimas 24h)
const DAYS_BACK = Number(process.env.PNCP_DAYS_BACK || 1);

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

async function main() {
  const run = await prisma.importRun.create({
    data: { source: "pncp", watermark: ymd(new Date()) },
  });
  console.log(`[import] run=${run.id} starting (last ${DAYS_BACK}d)`);

  const dataFinal = ymd(new Date());
  const dataInicial = ymd(new Date(Date.now() - DAYS_BACK * 86400_000));

  let inserted = 0;
  let updated = 0;
  let errors = 0;

  // PNCP exige codigoModalidadeContratacao no /atualizacao.
  // Iteramos modalidades 1..14 e paginas.
  const MODALIDADES_TO_IMPORT = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  for (const modId of MODALIDADES_TO_IMPORT) {
    for (let pagina = 1; pagina <= 50; pagina++) {
      let resp: Awaited<ReturnType<typeof listContratacoesByAtualizacao>>;
      try {
        // Rate limit: 600ms entre requests (~100 req/min)
        await sleep(700);
        resp = await listContratacoesByAtualizacao({
          dataInicial,
          dataFinal,
          codigoModalidadeContratacao: modId,
          pagina,
          tamanhoPagina: 50,
        });
      } catch (e) {
        const msg = String(e);
        if (msg.includes("429")) {
          console.warn(`[import] mod=${modId} p=${pagina} 429, sleeping 30s`);
          await sleep(30000);
          continue;
        }
        if (msg.includes("504") || msg.includes("503") || msg.includes("502")) {
          console.warn(`[import] mod=${modId} p=${pagina} server error, sleeping 60s then retry`);
          await sleep(60000);
          pagina--; // retry same page
          continue;
        }
        // 400 normalmente = modalidade sem dados, abandona essa modalidade
        console.warn(`[import] mod=${modId} p=${pagina} skip:`, msg.slice(0, 100));
        break;
      }

      if (!resp.data?.length) break;

      for (const item of resp.data) {
        try {
          const objeto = item.objetoCompra || "";
          const data = {
            id: item.numeroControlePNCP,
            modalidadeId: item.modalidadeId,
            modalidadeNome: item.modalidadeNome || modalidadeNome(item.modalidadeId),
            objeto,
            cnaePrincipal: categorizarObjeto(objeto),
            valorEstimado: item.valorTotalEstimado ?? null,
            valorHomologado: item.valorTotalHomologado ?? null,
            uasg: item.unidadeOrgao?.codigoUnidade ?? null,
            orgaoNome: item.orgaoEntidade?.razaoSocial || "Órgão não informado",
            orgaoCnpj: item.orgaoEntidade?.cnpj ?? null,
            municipio: item.unidadeOrgao?.municipioNome ?? null,
            uf: item.unidadeOrgao?.ufSigla ?? null,
            dataPublicacao: new Date(item.dataPublicacaoPncp),
            dataAbertura: item.dataAberturaProposta ? new Date(item.dataAberturaProposta) : null,
            dataEncerramento: item.dataEncerramentoProposta ? new Date(item.dataEncerramentoProposta) : null,
            situacao: item.situacaoCompraNome ?? "Desconhecida",
            linkEdital: item.linkProcessoEletronico ?? null,
            linkSistema: item.linkSistemaOrigem ?? null,
            raw: item as any,
          };

          const existing = await prisma.licitacao.findUnique({ where: { id: data.id } });
          await prisma.licitacao.upsert({
            where: { id: data.id },
            create: data,
            update: data,
          });
          if (existing) updated++;
          else inserted++;
        } catch (e) {
          console.error("[import] item error", e);
          errors++;
        }
      }

      console.log(`[import] mod=${modId} p=${pagina}/${resp.totalPaginas} (+${inserted}, ~${updated}, !${errors})`);
      if (pagina >= resp.totalPaginas) break;
    }
  }

  await prisma.importRun.update({
    where: { id: run.id },
    data: { finishedAt: new Date(), inserted, updated, errors },
  });
  console.log(`[import] done — inserted=${inserted} updated=${updated} errors=${errors}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
