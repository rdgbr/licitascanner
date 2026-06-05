/**
 * Importer PNCP — roda no node via `npm run import` ou cron.
 * Pega licitações publicadas/atualizadas nas últimas N horas e upserta.
 */
import { PrismaClient } from "@prisma/client";
import { listContratacoesByAtualizacao, modalidadeNome } from "../src/lib/pncp.js";

// Mapa de categorias por keywords no objeto da licitação.
// Ordem importa: primeiro match vence.
const CATEGORIAS_KEYWORDS: { slug: string; keywords: string[] }[] = [
  { slug: "saas", keywords: ["saas","software como serviç","plataforma em nuvem","sistema em nuvem","assinatura de software","licença cloud","microsoft 365","google workspace","office 365","licença de uso de software","licenciamento de software"] },
  { slug: "crm_erp", keywords: ["erp","crm","sistema de gestão","sistema integrado de gestão","software de gestão","gestão empresarial","sistema administrativo","sistema financeiro","contabilidade sistema","folha de pagamento sistema","sistema de rh","gestão escolar","sistema educacional","sistema de arrecadação","sistema tributário"] },
  { slug: "desenvolvimento", keywords: ["desenvolvimento de software","desenvolvimento de sistema","desenvolvimento de aplicativo","desenvolvimento web","aplicativo móvel","app mobile","portal web","sistema de informação","desenvolvimento de site","fábrica de software","desenvolvimento de app","plataforma digital"] },
  { slug: "hospedagem", keywords: ["hospedagem","data center","link dedicado","firewall","infraestrutura de ti","colocation","datacenter","servidor dedicado","nuvem computacional","storage","backup cloud","disaster recovery"] },
  { slug: "suporte", keywords: ["suporte técnico","helpdesk","help desk","service desk","manutenção de computador","suporte de ti","assistência técnica de ti","suporte e manutenção de ti","manutenção preventiva de ti","sustentação de sistemas"] },
  { slug: "consultoria_ti", keywords: ["consultoria em ti","consultoria de tecnologia","gestão de ti","governança de ti","arquitetura de sistemas","consultoria de informática","planejamento de ti","pmbok","scrum","gestão de projetos de ti"] },
  { slug: "marketing", keywords: ["marketing digital","gestão de redes sociais","assessoria de imprensa","comunicação digital","inbound marketing","publicidade digital","mídias sociais","gestão de mídias"] },
  { slug: "api_integracao", keywords: ["integração de sistemas","middleware","webservice","web service","barramento","interoperabilidade","integração e implantação","etl","troca de dados","mensageria"] },
  { slug: "obras_engenharia", keywords: ["pavimentação","drenagem","construção","obra","recapeamento","engenharia","calçamento","asfalto","ciclovia","calçada","terraplenagem","infraestrutura viária","reforma","revitalização","implantação de rede","esgoto","abastecimento d","saneamento básico","muro de contenção","quadra poliesportiva","unidade básica de saúde","ubs","escola","creche","obra de implantação"] },
  { slug: "saude", keywords: ["medicamento","fármaco","insumo farmacêutico","equipamento médico","equipamento hospitalar","serviço médico","serviço de saúde","laboratorial","análises clínicas","material hospitalar","material médico","manutenção de equipamento médico","raio-x","tomógrafo","ultrassom","ortopedia","cirurgia","internação","pronto-socorro","uti","fisioterapia","odontologia","ambulância","psicologia","saúde mental","vacina","hemodiálise","samu","terapia"] },
  { slug: "educacao", keywords: ["material escolar","material pedagógico","merenda escolar","livro didático","material didático","equipamento escolar","transporte escolar","uniforme escolar","reforma de escola","construção de escola","laboratório escolar","mobiliário escolar","kit escolar","educação infantil","ensino fundamental","estágio supervisionado","bolsa de estudo"] },
  { slug: "veiculos_frota", keywords: ["aquisição de veículo","compra de veículo","veículo","manutenção de veículo","manutenção veicular","frota","van","ônibus","micro-ônibus","caminhão","ambulância","viatura","motocicleta","peças e acessórios","revisão veicular","pneu","seguro veicular","manutenção corretiva de veículo"] },
  { slug: "alimentacao", keywords: ["gênero alimentício","alimento","merenda","refeição","alimentação escolar","kit de alimentos","cesta básica","marmita","rancho","produto alimentício","água mineral","material de cozinha","utensílio de cozinha"] },
  { slug: "limpeza_conservacao", keywords: ["limpeza","conservação predial","higienização","serviço de limpeza","material de limpeza","higiene","dedetização","desinsetização","jardinagem","coleta de lixo","material de higiene","produto de limpeza","portaria","zeladoria","copeiragem","limpeza e conservação"] },
  { slug: "seguranca_vigilancia", keywords: ["vigilância","monitoramento","câmera","cftv","alarme","portaria armada","segurança privada","seguro patrimonial","controle de acesso","rastreamento","gps veicular","bodycam"] },
  { slug: "eventos_cultura", keywords: ["show","atração artística","artista","evento","festa","festival","apresentação artística","contratação artística","forró","carnaval","são joão","natal","aniversário do município","banda","cantor","grupo musical","dança","teatro","cultura","entretenimento","parque de diversões","brinquedo inflável","tenda","palco","sonorização","iluminação de evento"] },
  { slug: "mobiliario_equipamentos", keywords: ["mobiliário","móvel","cadeira","mesa","armário","arquivo","sofá","eletrodoméstico","geladeira","fogão","ar condicionado","climatizador","ventilador","micro-ondas","máquina de lavar","televisão","projetor","equipamento permanente","fragmentadora","cofre","escrivaninha"] },
  { slug: "material_expediente", keywords: ["material de expediente","material de escritório","papelaria","toner","cartucho","impressão","encadernação","envelope","papel","caneta","pasta","fichário","material de consumo","suprimento","material gráfico"] },
  { slug: "energia_eletrica", keywords: ["energia elétrica","instalação elétrica","iluminação pública","rede elétrica","transformador","gerador","energia solar","fotovoltaico","placa solar","subestação","manutenção elétrica","poste","luminária","cabo elétrico","manutenção de rede elétrica"] },
  { slug: "transporte", keywords: ["transporte","passagem","frete","translado","serviço de transporte","turismo","excursão","viagem","locação de ônibus","transfer","logística","entrega"] },
  { slug: "publicidade_impressao", keywords: ["publicidade","propaganda","material gráfico","banner","outdoor","panfleto","folder","impressão","gráfica","sinalização","placa","letreiro","diagramação","assessoria de comunicação","comunicação institucional","jornal","revista"] },
  { slug: "combustivel_lubrificantes", keywords: ["combustível","gasolina","diesel","etanol","lubrificante","óleo","filtro","graxas","abastecimento","posto de combustível"] },
  { slug: "hardware_informatica", keywords: ["computador","notebook","desktop","impressora","scanner","roteador","switch","rack","nobreak","monitor","teclado","mouse","periférico","material de informática","equipamento de informática","servidor físico","câmera ip","acesso point"] },
  { slug: "uniforme_vestuario", keywords: ["uniforme","epi","calçado","bota","capacete","luva","colete","crachá","farda","vestimenta","roupa de trabalho","equipamento de proteção individual","vestuário"] },
  { slug: "saneamento_meio_ambiente", keywords: ["saneamento","resíduo sólido","lixo","aterro","coleta seletiva","água","esgoto","tratamento de água","estação de tratamento","eta","ete","drenagem pluvial","poluição","licença ambiental","gestão ambiental","fauna","flora","arborização","poda de árvore"] },
];

function categorizarObjeto(objeto: string): string | null {
  const lower = objeto.toLowerCase();
  for (const cat of CATEGORIAS_KEYWORDS) {
    if (cat.keywords.some((kw) => lower.includes(kw))) return cat.slug;
  }
  return null;
}

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
