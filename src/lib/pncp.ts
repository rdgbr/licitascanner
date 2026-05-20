/**
 * Cliente da API PNCP — Portal Nacional de Contratações Públicas.
 * Docs: https://www.gov.br/pncp/pt-br/acesso-a-informacao/manuais
 * Base URL: https://pncp.gov.br/api/consulta/v1/
 *
 * 100% aberta, sem auth.
 */

const BASE = "https://pncp.gov.br/api/consulta/v1";

export type PNCPModalidade = {
  id: number;
  nome: string;
};

// Modalidades comuns (Lei 14.133/2021)
export const MODALIDADES: Record<number, string> = {
  1: "Leilão Eletrônico",
  2: "Diálogo Competitivo",
  3: "Concurso",
  4: "Concorrência Eletrônica",
  5: "Concorrência Presencial",
  6: "Pregão Eletrônico",
  7: "Pregão Presencial",
  8: "Dispensa de Licitação",
  9: "Inexigibilidade",
  10: "Manifestação de Interesse",
  11: "Pré-qualificação",
  12: "Credenciamento",
  13: "Leilão Presencial",
};

export type PNCPLicitacao = {
  numeroControlePNCP: string;
  modalidadeId: number;
  modalidadeNome: string;
  objetoCompra: string;
  valorTotalEstimado?: number;
  valorTotalHomologado?: number;
  orgaoEntidade: {
    cnpj: string;
    razaoSocial: string;
    poderId?: string;
    esferaId?: string;
  };
  unidadeOrgao?: {
    codigoUnidade?: string;
    nomeUnidade?: string;
    ufSigla?: string;
    municipioNome?: string;
  };
  dataPublicacaoPncp: string; // ISO
  dataAberturaProposta?: string;
  dataEncerramentoProposta?: string;
  situacaoCompraNome?: string;
  linkSistemaOrigem?: string;
  linkProcessoEletronico?: string;
  modoDisputaNome?: string;
  numeroCompra?: string;
  anoCompra?: number;
  sequencialCompra?: number;
  // ...muitos outros campos (incluímos os usados; raw fica como Json)
};

export type PNCPListResponse = {
  data: PNCPLicitacao[];
  totalRegistros: number;
  totalPaginas: number;
  numeroPagina: number;
  paginasRestantes: number;
};

/**
 * Busca contratações por data de publicação.
 *
 * @param dataInicial formato YYYYMMDD
 * @param dataFinal formato YYYYMMDD
 * @param uf opcional
 * @param modalidade opcional (1-13)
 * @param pagina default 1
 * @param tamanhoPagina default 50, max 50
 */
export async function listContratacoesByPublicacao(opts: {
  dataInicial: string;
  dataFinal: string;
  uf?: string;
  codigoModalidadeContratacao?: number;
  pagina?: number;
  tamanhoPagina?: number;
}): Promise<PNCPListResponse> {
  const params = new URLSearchParams({
    dataInicial: opts.dataInicial,
    dataFinal: opts.dataFinal,
    pagina: String(opts.pagina ?? 1),
    tamanhoPagina: String(opts.tamanhoPagina ?? 50),
  });
  if (opts.uf) params.set("uf", opts.uf.toUpperCase());
  if (opts.codigoModalidadeContratacao) {
    params.set("codigoModalidadeContratacao", String(opts.codigoModalidadeContratacao));
  }

  const url = `${BASE}/contratacoes/publicacao?${params.toString()}`;
  const r = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "LicitaScanner/1.0 (+https://licitascanner.com.br)" },
  });
  if (!r.ok) {
    throw new Error(`PNCP ${r.status}: ${url}`);
  }
  return (await r.json()) as PNCPListResponse;
}

/**
 * Busca contratações atualizadas no período (útil pra import incremental).
 */
export async function listContratacoesByAtualizacao(opts: {
  dataInicial: string;
  dataFinal: string;
  uf?: string;
  codigoModalidadeContratacao?: number;
  pagina?: number;
  tamanhoPagina?: number;
}): Promise<PNCPListResponse> {
  const params = new URLSearchParams({
    dataInicial: opts.dataInicial,
    dataFinal: opts.dataFinal,
    pagina: String(opts.pagina ?? 1),
    tamanhoPagina: String(opts.tamanhoPagina ?? 50),
  });
  if (opts.uf) params.set("uf", opts.uf.toUpperCase());
  if (opts.codigoModalidadeContratacao) {
    params.set("codigoModalidadeContratacao", String(opts.codigoModalidadeContratacao));
  }

  const url = `${BASE}/contratacoes/atualizacao?${params.toString()}`;
  const r = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "LicitaScanner/1.0" },
  });
  if (!r.ok) throw new Error(`PNCP ${r.status}: ${url}`);
  return (await r.json()) as PNCPListResponse;
}

export function modalidadeNome(id: number): string {
  return MODALIDADES[id] || "Outro";
}

export function formatBRL(v: number | null | undefined): string {
  if (v == null) return "—";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function licitacaoSlug(numeroControle: string): string {
  // numeroControlePNCP format: "00000000000000-1-000001/2026"
  return numeroControle.replace(/[/\\]/g, "-");
}
