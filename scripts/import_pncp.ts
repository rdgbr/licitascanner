/**
 * Importer PNCP — roda no node via `npm run import` ou cron.
 * Pega licitações publicadas/atualizadas nas últimas N horas e upserta.
 */
import { PrismaClient } from "@prisma/client";
import { listContratacoesByAtualizacao, modalidadeNome } from "../src/lib/pncp.js";

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

  // Iterate all modalidades 1..13 (PNCP API requires modalidadeId for some queries)
  // Use page-by-page across all UFs implicitly (no uf filter)
  for (let pagina = 1; pagina <= 100; pagina++) {
    try {
      const resp = await listContratacoesByAtualizacao({
        dataInicial,
        dataFinal,
        pagina,
        tamanhoPagina: 50,
      });

      if (!resp.data?.length) break;

      for (const item of resp.data) {
        try {
          const data = {
            id: item.numeroControlePNCP,
            modalidadeId: item.modalidadeId,
            modalidadeNome: item.modalidadeNome || modalidadeNome(item.modalidadeId),
            objeto: item.objetoCompra || "",
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

      console.log(`[import] page ${pagina}/${resp.totalPaginas} (+${inserted}, ~${updated}, !${errors})`);
      if (pagina >= resp.totalPaginas) break;
    } catch (e) {
      console.error(`[import] page ${pagina} error`, e);
      errors++;
      if (errors > 10) {
        console.error("[import] too many errors, aborting");
        break;
      }
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
