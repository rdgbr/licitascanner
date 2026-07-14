import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Política de privacidade do LicitaScanner: quais dados coletamos, para que usamos e como exercer seus direitos sob a LGPD.",
  alternates: { canonical: "https://licitascanner.com.br/privacidade" },
};

export default function PrivacidadePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-14">
      <h1 className="text-3xl font-semibold tracking-tight">Política de Privacidade</h1>
      <p className="mt-2 text-sm text-slate-400">Última atualização: julho de 2026</p>

      <div className="mt-8 space-y-8 text-slate-600 leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">1. Que dado coletamos</h2>
          <p>
            Coletamos o e-mail informado no cadastro (usado para login via link mágico) e os dados
            que você mesmo cria dentro do produto: os critérios dos seus alertas (palavra-chave, UF,
            categoria) e, se aplicável, o e-mail informado ao demonstrar interesse no plano Pro.
            Também registramos dados básicos de uso (acessos, erros) para manter o serviço estável.
            Não pedimos CPF, dado de pagamento ou qualquer dado sensível — não há gateway de
            pagamento integrado até o momento.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">2. Para que usamos</h2>
          <p>
            O e-mail é usado para autenticação (link mágico de login) e para o envio dos alertas de
            licitação que você configurar. Enviamos esses e-mails via Mailgun, nosso provedor de
            e-mail transacional. Não usamos seus dados para treinar modelos de terceiros nem os
            cruzamos com bases externas para fins de marketing.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">3. Compartilhamento</h2>
          <p>
            Não vendemos nem alugamos seus dados a terceiros. Compartilhamos dados apenas com
            provedores estritamente necessários para operar o serviço (hospedagem e envio de
            e-mail transacional), sob os termos de confidencialidade desses provedores.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">4. Seus direitos (LGPD)</h2>
          <p>
            Você pode pedir acesso aos dados que temos sobre você, correção, portabilidade ou
            exclusão da sua conta e dos seus alertas a qualquer momento. Basta enviar um e-mail para{" "}
            <a href="mailto:rodrigodgbr1@gmail.com" className="text-[#0F4C81] hover:underline">
              rodrigodgbr1@gmail.com
            </a>{" "}
            com o pedido; respondemos e executamos em até 15 dias úteis.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">5. Retenção</h2>
          <p>
            Mantemos seus dados de cadastro enquanto sua conta estiver ativa. Ao pedir exclusão,
            removemos e-mail e alertas associados à sua conta; registros agregados e anônimos de uso
            podem ser mantidos para fins estatísticos.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">6. Licitações e órgãos públicos</h2>
          <p>
            Os dados de licitações exibidos no site (objeto, valor, órgão contratante) são públicos
            por natureza — vêm do PNCP e de diários oficiais municipais. Isso não inclui dado
            pessoal seu; é informação sobre contratações públicas, já publicada oficialmente antes
            de chegar ao LicitaScanner.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">7. Contato</h2>
          <p>
            Dúvidas sobre esta política ou sobre seus dados:{" "}
            <a href="mailto:rodrigodgbr1@gmail.com" className="text-[#0F4C81] hover:underline">
              rodrigodgbr1@gmail.com
            </a>
            . Veja também os{" "}
            <Link href="/termos" className="text-[#0F4C81] hover:underline">
              termos de uso
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
