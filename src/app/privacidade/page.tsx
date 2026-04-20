import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politica de Privacidade — FigurinhasPro",
  description: "Politica de privacidade e protecao de dados da plataforma FigurinhasPro (LGPD).",
};

export default function PrivacidadePage() {
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
        <h1 className="text-3xl font-black text-white mb-2">Politica de Privacidade</h1>
        <p className="text-sm text-gray-500 mb-10">
          Ultima atualizacao: Abril de 2026 · Em conformidade com a LGPD (Lei 13.709/2018)
        </p>

        <div className="space-y-8">
          <Section title="1. Dados que coletamos">
            <ul className="list-disc list-inside space-y-1.5">
              <li>
                <strong className="text-gray-300">Dados de cadastro:</strong> nome, email, telefone
                (WhatsApp), nome da loja
              </li>
              <li>
                <strong className="text-gray-300">Dados de uso:</strong> figurinhas cadastradas,
                pedidos, precos configurados
              </li>
              <li>
                <strong className="text-gray-300">Dados de pagamento:</strong> processados pela
                Stripe — nao armazenamos dados de cartao
              </li>
              <li>
                <strong className="text-gray-300">Dados tecnicos:</strong> IP, navegador, sistema
                operacional (via cookies essenciais)
              </li>
            </ul>
          </Section>

          <Section title="2. Base legal (LGPD Art. 7)">
            <ul className="list-disc list-inside space-y-1.5">
              <li>
                <strong className="text-gray-300">Execucao de contrato:</strong> dados necessarios
                para fornecer o servico contratado
              </li>
              <li>
                <strong className="text-gray-300">Consentimento:</strong> para comunicacoes de
                marketing (voce pode revogar a qualquer momento)
              </li>
              <li>
                <strong className="text-gray-300">Interesse legitimo:</strong> melhoria do servico e
                prevencao de fraudes
              </li>
            </ul>
          </Section>

          <Section title="3. Como usamos seus dados">
            Usamos seus dados para: fornecer e manter a plataforma, processar pagamentos, enviar
            notificacoes sobre pedidos, melhorar a experiencia do usuario e cumprir obrigacoes
            legais. Nao vendemos seus dados a terceiros.
          </Section>

          <Section title="4. Compartilhamento de dados">
            Seus dados podem ser compartilhados com:
            <ul className="list-disc list-inside space-y-1.5 mt-2">
              <li>
                <strong className="text-gray-300">Stripe:</strong> processamento de pagamentos
              </li>
              <li>
                <strong className="text-gray-300">Vercel:</strong> hospedagem da plataforma
              </li>
              <li>
                <strong className="text-gray-300">Compradores:</strong> nome da loja e WhatsApp
                (quando voce configura na vitrine)
              </li>
            </ul>
            Todos os parceiros seguem padroes adequados de protecao de dados.
          </Section>

          <Section title="5. Seus direitos (LGPD Art. 18)">
            Voce tem direito a:
            <ul className="list-disc list-inside space-y-1.5 mt-2">
              <li>Confirmar a existencia de tratamento de seus dados</li>
              <li>Acessar, corrigir ou atualizar seus dados</li>
              <li>Solicitar anonimizacao, bloqueio ou eliminacao de dados desnecessarios</li>
              <li>Revogar consentimento a qualquer momento</li>
              <li>Solicitar portabilidade dos dados</li>
              <li>Solicitar exclusao da conta e dados associados</li>
            </ul>
          </Section>

          <Section title="6. Retencao de dados">
            Mantemos seus dados enquanto sua conta estiver ativa ou conforme necessario para
            fornecer o servico. Apos exclusao da conta, dados sao removidos em ate 30 dias, exceto
            dados que devemos reter por obrigacao legal (fiscal, por exemplo).
          </Section>

          <Section title="7. Seguranca">
            Adotamos medidas tecnicas e organizacionais para proteger seus dados, incluindo:
            criptografia de senhas (bcrypt), sessoes seguras (iron-session), HTTPS e acesso restrito
            ao banco de dados.
          </Section>

          <Section title="8. Cookies">
            Utilizamos apenas cookies essenciais para manter sua sessao de login. Nao utilizamos
            cookies de rastreamento ou marketing de terceiros.
          </Section>

          <Section title="9. Alteracoes nesta politica">
            Podemos atualizar esta politica periodicamente. Mudancas significativas serao
            comunicadas por email ou pela plataforma.
          </Section>

          <Section title="10. Contato e DPO">
            Para exercer seus direitos ou esclarecer duvidas sobre o tratamento de dados, entre em
            contato pelo email de suporte disponivel na plataforma.
          </Section>
        </div>
      </main>

      <footer className="border-t border-white/[0.04] px-6 py-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <span className="text-xs text-gray-600">FigurinhasPro</span>
          <Link
            href="/termos"
            className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
          >
            Termos de Uso
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
      <div className="text-sm text-gray-400 leading-relaxed">{children}</div>
    </div>
  );
}
