import Navbar from "@/components/layout/Navbar";

export default function TermosPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar categorias={[]} />

      <section className="mx-auto w-full max-w-2xl px-4 pb-16 pt-6 sm:px-8">
        <h1 className="text-3xl font-black text-foreground sm:text-4xl">
          Termos de Uso e Política de Reembolso
        </h1>
        <p className="mt-2 text-sm text-secondary">Última atualização: 05/08/2026</p>

        <div className="mt-8 flex flex-col gap-6 text-sm leading-relaxed text-secondary">
          <div>
            <h2 className="mb-2 text-base font-bold text-foreground">1. Natureza do produto</h2>
            <p>
              Os conteúdos disponibilizados nesta plataforma (aluguel, vitalício ou assinatura)
              são produtos digitais de acesso imediato: ao concluir o pagamento, o título fica
              disponível para assistir na hora, sem qualquer período de espera ou entrega física.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-base font-bold text-foreground">2. Política de não-reembolso</h2>
            <p>
              Por se tratar de conteúdo digital consumido imediatamente após a compra, e conforme
              o Art. 49 do Código de Defesa do Consumidor (que trata do direito de arrependimento
              em compras fora do estabelecimento comercial), o direito de arrependimento não se
              aplica a partir do momento em que o conteúdo é acessado. Não realizamos reembolsos de
              compras já assistidas, integral ou parcialmente.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-base font-bold text-foreground">3. Contestação de estorno (chargeback)</h2>
            <p>
              Ao confirmar o pagamento, você concorda que teve acesso ao conteúdo contratado e
              que qualquer estorno solicitado à operadora do cartão ou instituição de pagamento
              após o consumo do produto poderá ser contestado por nós junto ao banco, mediante
              apresentação do registro de aceite destes Termos (data, hora, IP e identificação do
              usuário) e do histórico de acesso ao conteúdo.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-base font-bold text-foreground">4. Assinaturas</h2>
            <p>
              Assinaturas podem ser canceladas a qualquer momento em Minha Conta. O cancelamento
              interrompe a renovação futura, mas não gera reembolso proporcional do período já
              pago — o acesso permanece ativo até o fim do ciclo vigente.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-base font-bold text-foreground">5. Uso da conta</h2>
            <p>
              O acesso é pessoal e intransferível. Compartilhamento de credenciais, tentativas de
              download não autorizado ou uso fraudulento podem resultar em suspensão da conta sem
              aviso prévio.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
