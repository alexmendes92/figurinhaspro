import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Termos de Uso — FigurinhasPro",
  description: "Termos de uso da plataforma FigurinhasPro para revendedores de figurinhas.",
};

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-[#0b0e14]">
      <header className="border-b border-white/[0.04] bg-[#0b0e14]">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center">
              <span className="text-white text-[9px] font-black font-[family-name:var(--font-geist-mono)]">
                F
              </span>
            </div>
            <span className="text-sm font-bold text-white">FigurinhasPro</span>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-black text-white mb-2">Termos de Uso</h1>
        <p className="text-sm text-gray-500 mb-10">Ultima atualizacao: Abril de 2026</p>

        <div className="prose-custom space-y-8">
          <Section title="1. Aceitacao dos Termos">
            Ao acessar ou usar a plataforma FigurinhasPro, voce concorda com estes Termos de Uso. Se
            nao concordar, nao utilize a plataforma.
          </Section>

          <Section title="2. Descricao do Servico">
            O FigurinhasPro e uma plataforma SaaS que permite a revendedores de figurinhas
            colecionaveis gerenciar estoque, definir precos, criar vitrines online e processar
            pedidos. A plataforma nao compra, vende ou intermedia a venda de figurinhas diretamente.
          </Section>

          <Section title="3. Cadastro e Conta">
            Para utilizar a plataforma, voce deve criar uma conta fornecendo informacoes verdadeiras
            e atualizadas. Voce e responsavel por manter a confidencialidade da sua senha e por
            todas as atividades realizadas em sua conta. Voce deve notificar imediatamente qualquer
            uso nao autorizado.
          </Section>

          <Section title="4. Planos e Pagamentos">
            O FigurinhasPro oferece planos gratuitos e pagos. Os planos pagos sao cobrados
            mensalmente via Stripe. Ao assinar um plano pago, voce autoriza a cobranca recorrente no
            metodo de pagamento informado. Voce pode cancelar a qualquer momento, mantendo o acesso
            ate o fim do periodo pago. Nao oferecemos reembolso por periodos parciais.
          </Section>

          <Section title="5. Uso Aceitavel">
            Voce concorda em nao usar a plataforma para atividades ilegais, fraudulentas ou que
            violem direitos de terceiros. E proibido revender acesso a plataforma, realizar
            engenharia reversa, ou tentar acessar sistemas nao autorizados.
          </Section>

          <Section title="6. Propriedade Intelectual">
            Todo o conteudo da plataforma (codigo, design, textos, marcas) e de propriedade do
            FigurinhasPro ou de seus licenciadores. As imagens de figurinhas e albumns sao de
            propriedade da Panini e sao utilizadas para fins de catalogo e referencia.
          </Section>

          <Section title="7. Limitacao de Responsabilidade">
            O FigurinhasPro e fornecido &quot;como esta&quot;. Nao garantimos disponibilidade
            ininterrupta, ausencia de erros ou adequacao a finalidade especifica. Nao somos
            responsaveis por perdas decorrentes de transacoes entre vendedores e compradores.
          </Section>

          <Section title="8. Modificacoes">
            Podemos atualizar estes termos a qualquer momento. Mudancas significativas serao
            comunicadas por email ou pela plataforma. O uso continuado apos as mudancas constitui
            aceitacao.
          </Section>

          <Section title="9. Rescisao">
            Podemos suspender ou encerrar sua conta por violacao destes termos. Voce pode encerrar
            sua conta a qualquer momento entrando em contato conosco.
          </Section>

          <Section title="10. Contato">
            Duvidas sobre estes termos podem ser enviadas para o email de suporte disponivel na
            plataforma.
          </Section>
        </div>
      </main>

      <footer className="border-t border-white/[0.04] px-6 py-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <span className="text-xs text-gray-600">FigurinhasPro</span>
          <Link
            href="/privacidade"
            className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
          >
            Politica de Privacidade
          </Link>
        </div>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-lg font-bold text-white mb-3">{title}</h2>
      <p className="text-sm text-gray-400 leading-relaxed">{children}</p>
    </div>
  );
}
