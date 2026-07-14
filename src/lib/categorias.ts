/**
 * Categorização de licitações por keyword no objeto.
 * Compartilhado entre import_pncp.ts e import_qd.ts — mesma fonte de verdade
 * pra não divergir a taxonomia entre origens de dado diferentes.
 *
 * Ordem importa: primeiro match vence.
 */
export const CATEGORIAS_KEYWORDS: { slug: string; keywords: string[] }[] = [
  { slug: "saas", keywords: ["saas","software como serviç","plataforma em nuvem","sistema em nuvem","assinatura de software","licença cloud","microsoft 365","google workspace","office 365","licença de uso de software","licenciamento de software"] },
  { slug: "crm_erp", keywords: ["erp","crm","sistema de gestão","sistema integrado de gestão","software de gestão","gestão empresarial","sistema administrativo","sistema financeiro","contabilidade sistema","folha de pagamento sistema","sistema de rh","gestão escolar","sistema educacional","sistema de arrecadação","sistema tributário"] },
  { slug: "desenvolvimento", keywords: ["desenvolvimento de software","desenvolvimento de sistema","desenvolvimento de aplicativo","desenvolvimento web","aplicativo móvel","app mobile","portal web","sistema de informação","desenvolvimento de site","fábrica de software","desenvolvimento de app","plataforma digital"] },
  { slug: "hospedagem", keywords: ["hospedagem","data center","link dedicado","firewall","infraestrutura de ti","colocation","datacenter","servidor dedicado","nuvem computacional","storage","backup cloud","disaster recovery"] },
  { slug: "suporte", keywords: ["suporte técnico","helpdesk","help desk","service desk","manutenção de computador","suporte de ti","assistência técnica de ti","suporte e manutenção de ti","manutenção preventiva de ti","sustentação de sistemas"] },
  { slug: "consultoria_ti", keywords: ["consultoria em ti","consultoria de tecnologia","gestão de ti","governança de ti","arquitetura de sistemas","consultoria de informática","planejamento de ti","pmbok","scrum","gestão de projetos de ti"] },
  { slug: "marketing", keywords: ["marketing digital","gestão de redes sociais","assessoria de imprensa","comunicação digital","inbound marketing","publicidade digital","mídias sociais","gestão de mídias"] },
  { slug: "api_integracao", keywords: ["integração de sistemas","middleware","webservice","web service","barramento","interoperabilidade","integração e implantação","etl","troca de dados","mensageria"] },
  // "escola"/"creche" removidos daqui de propósito: colidiam com a categoria "educacao" (que vem
  // depois) e capturavam praticamente todo edital escolar como "obras_engenharia", mesmo quando não
  // era sobre construção civil. Termos compostos específicos de obra em escola continuam abaixo.
  { slug: "obras_engenharia", keywords: ["pavimentação","drenagem","construção civil","obra","recapeamento","engenharia","calçamento","asfalto","ciclovia","calçada","terraplenagem","infraestrutura viária","reforma predial","revitalização","implantação de rede","esgoto","abastecimento d","saneamento básico","muro de contenção","quadra poliesportiva","unidade básica de saúde","ubs","obra de implantação"] },
  { slug: "saude", keywords: ["medicamento","fármaco","insumo farmacêutico","equipamento médico","equipamento hospitalar","serviço médico","serviço de saúde","laboratorial","análises clínicas","material hospitalar","material médico","manutenção de equipamento médico","raio-x","tomógrafo","ultrassom","ortopedia","cirurgia","internação","pronto-socorro","uti","fisioterapia","odontologia","ambulância","psicologia","saúde mental","vacina","hemodiálise","samu","terapia"] },
  { slug: "educacao", keywords: ["material escolar","material pedagógico","merenda escolar","livro didático","material didático","equipamento escolar","transporte escolar","uniforme escolar","reforma de escola","construção de escola","laboratório escolar","mobiliário escolar","kit escolar","educação infantil","ensino fundamental","estágio supervisionado","bolsa de estudo","escola","creche"] },
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

export const CATEGORIAS_META: { slug: string; label: string }[] = [
  { slug: "saas", label: "Software como Serviço (SaaS)" },
  { slug: "crm_erp", label: "CRM e ERP" },
  { slug: "desenvolvimento", label: "Desenvolvimento de Software" },
  { slug: "hospedagem", label: "Hospedagem e Infraestrutura TI" },
  { slug: "suporte", label: "Suporte e Manutenção TI" },
  { slug: "consultoria_ti", label: "Consultoria de TI" },
  { slug: "api_integracao", label: "APIs e Integrações" },
  { slug: "marketing", label: "Marketing Digital" },
  { slug: "obras_engenharia", label: "Obras e Engenharia" },
  { slug: "saude", label: "Saúde" },
  { slug: "educacao", label: "Educação" },
  { slug: "veiculos_frota", label: "Veículos e Frota" },
  { slug: "alimentacao", label: "Alimentação e Gêneros" },
  { slug: "limpeza_conservacao", label: "Limpeza e Conservação" },
  { slug: "seguranca_vigilancia", label: "Segurança e Vigilância" },
  { slug: "eventos_cultura", label: "Eventos e Cultura" },
  { slug: "mobiliario_equipamentos", label: "Mobiliário e Equipamentos" },
  { slug: "material_expediente", label: "Material de Expediente" },
  { slug: "energia_eletrica", label: "Energia Elétrica" },
  { slug: "transporte", label: "Transporte e Logística" },
  { slug: "publicidade_impressao", label: "Publicidade e Impressão" },
  { slug: "combustivel_lubrificantes", label: "Combustível e Lubrificantes" },
  { slug: "hardware_informatica", label: "Hardware e Informática" },
  { slug: "uniforme_vestuario", label: "Uniformes e Vestuário" },
  { slug: "saneamento_meio_ambiente", label: "Saneamento e Meio Ambiente" },
];

export function categorizarObjeto(objeto: string): string | null {
  const lower = objeto.toLowerCase();
  for (const cat of CATEGORIAS_KEYWORDS) {
    if (cat.keywords.some((kw) => lower.includes(kw))) return cat.slug;
  }
  return null;
}
