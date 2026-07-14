import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description: "Termos de uso do LicitaScanner: o que o serviço é, cobrança do plano Pro, cancelamento e uso aceitável.",
  alternates: { canonical: "https://licitascanner.com.br/termos" },
};

export default function TermosPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-14">
      <h1 className="text-3xl font-semibold tracking-tight">Termos de Uso</h1>
      <p className="mt-2 text-sm text-slate-400">Última atualização: julho de 2026</p>

      <div className="mt-8 space-y-8 text-slate-600 leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">1. O que é o LicitaScanner</h2>
          <p>
            O LicitaScanner é um agregador de dados públicos sobre licitações brasileiras. Reunimos
            informações do PNCP (Portal Nacional de Contratações Públicas) e de diários oficiais
            municipais e as organizamos para busca e alertas. Não somos um órgão público, não
            participamos das licitações que listamos e não representamos nenhum órgão contratante.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">2. Exatidão dos dados</h2>
          <p>
            Fazemos o possível para manter os dados atualizados e corretos, mas eles vêm de fontes
            de terceiros (PNCP, diários oficiais) que podem ter atraso, erro de digitação ou ficar
            fora do ar. Não garantimos exatidão, completude ou disponibilidade contínua dos dados.
            Antes de participar de qualquer licitação, confirme as informações diretamente na fonte
            oficial (PNCP ou o diário oficial do órgão responsável) e no edital publicado.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">3. Planos e cobrança</h2>
          <p>
            O plano Grátis dá direito a até 5 alertas simultâneos, sem custo, por tempo indeterminado.
            O plano Pro ({" "}
            <Link href="/planos" className="text-[#0F4C81] hover:underline">
              veja preço e detalhes
            </Link>
            ) libera alertas ilimitados. Por enquanto não temos cobrança recorrente automática: ao
            clicar em &quot;Quero o Pro&quot;, registramos seu interesse e combinamos o pagamento
            manualmente por e-mail. Isso pode mudar no futuro, com aviso prévio.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">4. Cancelamento</h2>
          <p>
            Como a cobrança do Pro ainda é manual, o cancelamento também é: basta enviar um e-mail
            pedindo para não renovar. Não há multa nem fidelidade. A conta grátis pode ser encerrada
            a qualquer momento pelo mesmo canal.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">5. Uso aceitável</h2>
          <p>
            Não é permitido raspar (scraping) em massa o site fora dos meios previstos, tentar
            burlar limites de alertas, revender o acesso ou usar o serviço para fins ilegais.
            Reservamo-nos o direito de suspender contas que abusem da plataforma ou comprometam sua
            estabilidade para os demais usuários.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">6. Alterações</h2>
          <p>
            Podemos atualizar estes termos conforme o produto evolui (por exemplo, ao ligar um
            processador de pagamento real). Mudanças relevantes serão comunicadas por e-mail aos
            usuários cadastrados.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">7. Contato</h2>
          <p>
            Dúvidas sobre estes termos:{" "}
            <a href="mailto:rodrigodgbr1@gmail.com" className="text-[#0F4C81] hover:underline">
              rodrigodgbr1@gmail.com
            </a>
            . Veja também nossa{" "}
            <Link href="/privacidade" className="text-[#0F4C81] hover:underline">
              política de privacidade
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
