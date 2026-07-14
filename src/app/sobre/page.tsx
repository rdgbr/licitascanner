import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sobre",
  description: "LicitaScanner é parte da Rede Jurídico. Agregamos licitações do PNCP e diários oficiais municipais (via Querido Diário) num só lugar, com alertas diários.",
  alternates: { canonical: "https://licitascanner.com.br/sobre" },
};

export default function SobrePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-14">
      <h1 className="text-3xl font-semibold tracking-tight">Sobre o LicitaScanner</h1>

      <div className="mt-6 space-y-5 text-slate-600 leading-relaxed">
        <p>
          O LicitaScanner monitora licitações públicas brasileiras e avisa quando sai um edital
          que combina com o que sua empresa vende. Ele existe porque acompanhar isso manualmente —
          abrindo o PNCP e os diários oficiais de dezenas de municípios todo dia — não escala.
        </p>
        <p>
          Os dados vêm de duas fontes: a API pública do{" "}
          <a href="https://pncp.gov.br" target="_blank" rel="noopener" className="text-[#0F4C81] hover:underline">
            PNCP
          </a>{" "}
          (Portal Nacional de Contratações Públicas, federal/estadual/municipal) e diários oficiais
          municipais processados pelo{" "}
          <a href="https://queridodiario.ok.org.br" target="_blank" rel="noopener" className="text-[#0F4C81] hover:underline">
            Querido Diário
          </a>
          , via a integração com o{" "}
          <a href="https://juridicoempauta.com.br" className="text-[#0F4C81] hover:underline">
            Jurídico em Pauta
          </a>
          , produto irmão que já classifica atos oficiais. A base é atualizada todo dia.
        </p>
        <p>
          O LicitaScanner é parte da <strong className="text-slate-800">Rede Jurídico</strong>, junto com o{" "}
          <a href="https://juridicoonline.com.br" className="text-[#0F4C81] hover:underline">
            Jurídico Online
          </a>{" "}
          (dados de empresas — CNPJ, sócios, contatos) e o Jurídico em Pauta (atos de órgãos
          públicos). Os três produtos são operados pela mesma equipe e compartilham a mesma base
          de dados públicos brasileiros, cada um olhando o mercado por um ângulo diferente.
        </p>
        <p>
          Hoje o LicitaScanner é grátis para até 5 alertas simultâneos. O plano Pro (
          <Link href="/planos" className="text-[#0F4C81] hover:underline">
            veja os planos
          </Link>
          ) libera alertas ilimitados — a cobrança ainda é combinada manualmente por e-mail,
          enquanto não ligamos um sistema de pagamento recorrente.
        </p>
      </div>

      <p className="mt-10 text-sm text-slate-400">
        Dúvidas, sugestões ou parcerias:{" "}
        <a href="mailto:rodrigodgbr1@gmail.com" className="text-[#0F4C81] hover:underline">
          rodrigodgbr1@gmail.com
        </a>
      </p>
    </div>
  );
}
