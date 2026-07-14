/**
 * Sinais de qualidade de dado do PNCP — baseado em achados documentados
 * pelo TCU (Acórdãos 2209/2023 e 53/2025) e Transparência Brasil (relatório
 * "Qualidade de dados", dez/2024): 86,4% dos registros do PNCP têm ao menos
 * uma inconsistência; itens de dispensa/inexigibilidade sem valor estimado
 * violam os arts. 29 e 72 da Lei 14.133/2021; processos ficam em média 277
 * dias (dispensa: 383 dias) sem homologação registrada.
 *
 * Não temos campo de data de homologação — os sinais abaixo são proxies
 * honestos a partir do que o PNCP disponibiliza (situacao + datas), não uma
 * reprodução exata da métrica do TCU.
 */

const DISPENSA_INEXIGIBILIDADE = /dispensa|inexigib/i;

export function isContratacaoDireta(modalidadeNome: string): boolean {
  return DISPENSA_INEXIGIBILIDADE.test(modalidadeNome);
}

/** Falta valor estimado numa contratação direta = descumpre arts. 29/72 da Lei 14.133/2021 */
export function semValorEstimadoIrregular(modalidadeNome: string, valorEstimado: number | null): boolean {
  return valorEstimado == null && isContratacaoDireta(modalidadeNome);
}

/**
 * Dias desde o encerramento do prazo de proposta, só quando a licitação
 * ainda aparece como "Divulgada no PNCP" (ativa) — ou seja, o prazo passou
 * mas o sistema não registrou avanço (homologação, revogação etc.).
 * Retorna null se não há sinal de atraso.
 */
export function diasParadoSemAtualizacao(
  situacao: string,
  dataEncerramento: Date | string | null
): number | null {
  if (situacao !== "Divulgada no PNCP" || !dataEncerramento) return null;
  const encerrada = new Date(dataEncerramento);
  const dias = Math.floor((Date.now() - encerrada.getTime()) / (1000 * 60 * 60 * 24));
  return dias >= 90 ? dias : null;
}
