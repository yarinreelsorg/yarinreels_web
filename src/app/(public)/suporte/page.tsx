import Navbar from "@/components/layout/Navbar";
import FaqItem from "@/components/suporte/FaqItem";

const FAQS = [
  {
    pergunta: "Como funciona o pagamento via Pix?",
    resposta:
      "Ao escolher um conteúdo ou plano, geramos um QR Code Pix. A aprovação costuma ser instantânea; em caso de atraso, verificamos automaticamente o pagamento em poucos minutos.",
  },
  {
    pergunta: "Qual a diferença entre aluguel e vitalício?",
    resposta:
      "O aluguel libera o acesso ao título por 7 dias. O vitalício libera o acesso permanentemente, sem data de expiração.",
  },
  {
    pergunta: "Como cancelo minha assinatura?",
    resposta:
      "Você pode cancelar quando quiser em Minha Conta > Minha Assinatura. O acesso permanece ativo até o fim do período já pago.",
  },
  {
    pergunta: "O vídeo não carrega ou trava, o que eu faço?",
    resposta:
      "Tente atualizar a página ou trocar de rede (Wi-Fi/dados móveis). Se o problema continuar, fale com a nossa equipe pelo e-mail de suporte.",
  },
  {
    pergunta: "Minha conta do Telegram ainda funciona?",
    resposta:
      "Sim. Sua conta na plataforma web é vinculada ao mesmo cadastro usado no bot do Telegram — suas compras continuam valendo dos dois lados.",
  },
];

export default function SuportePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar categorias={[]} />

      <section className="mx-auto w-full max-w-2xl px-4 pb-16 pt-6 sm:px-8">
        <h1 className="text-3xl font-black text-foreground sm:text-4xl">
          Suporte
        </h1>
        <p className="mt-3 text-secondary">
          Tire suas dúvidas sobre pagamentos, acesso e assinatura.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          {FAQS.map((faq) => (
            <FaqItem
              key={faq.pergunta}
              pergunta={faq.pergunta}
              resposta={faq.resposta}
            />
          ))}
        </div>

        <div className="mt-10 rounded-lg border border-border bg-surface p-6 sm:p-8">
          <p className="text-lg font-bold text-foreground text-center">
            Não encontrou o que procurava?
          </p>
          <p className="mt-1 text-sm text-secondary text-center">
            Fale com a gente por qualquer um desses canais.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <a
              href="https://t.me/YarinTV"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-5 py-3.5 transition-colors hover:border-primary/50"
            >
              <span className="flex items-center gap-3">
                <span className="text-xl">✈️</span>
                <span>
                  <span className="block text-sm font-bold text-foreground">Telegram</span>
                  <span className="block text-xs text-secondary">Canal principal — 08h às 22h</span>
                </span>
              </span>
              <span className="text-secondary">→</span>
            </a>

            <a
              href="https://wa.me/5500000000000"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-5 py-3.5 transition-colors hover:border-primary/50"
            >
              <span className="flex items-center gap-3">
                <span className="text-xl">📱</span>
                <span>
                  <span className="block text-sm font-bold text-foreground">WhatsApp</span>
                  <span className="block text-xs text-secondary">Horário comercial — 09h às 18h</span>
                </span>
              </span>
              <span className="text-secondary">→</span>
            </a>

            <a
              href="mailto:suporte@yarinreels.com"
              className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-5 py-3.5 transition-colors hover:border-primary/50"
            >
              <span className="flex items-center gap-3">
                <span className="text-xl">✉️</span>
                <span>
                  <span className="block text-sm font-bold text-foreground">E-mail</span>
                  <span className="block text-xs text-secondary">
                    Canal oficial fora de horário — resposta em até 2 dias úteis
                  </span>
                </span>
              </span>
              <span className="text-secondary">→</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
