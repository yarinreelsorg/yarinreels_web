"use client";

/**
 * Gera o payment_token no navegador via Efí.js — o número do cartão e o CVV
 * NUNCA passam pelo nosso backend, só esse token vai para a Server Action.
 */
export interface DadosCartao {
  numero: string;
  nome: string;
  cpf: string;
  validadeMes: string;
  validadeAno: string;
  cvv: string;
}

function ambiente(): "production" | "sandbox" {
  return process.env.NEXT_PUBLIC_EFI_SANDBOX === "false" ? "production" : "sandbox";
}

const MENSAGEM_GENERICA =
  "Não foi possível validar os dados do cartão. Confira o número, a validade e o CVV e tente novamente.";

/**
 * A Efí às vezes devolve `error_description` técnico/ilegível (ex: objeto
 * cru serializado). Só mostramos a mensagem original pro usuário quando ela
 * parece mesmo uma frase; senão caímos no texto genérico.
 */
function mensagemAmigavel(motivo: unknown): string {
  if (typeof motivo !== "string") return MENSAGEM_GENERICA;
  const texto = motivo.trim();
  if (!texto || texto.startsWith("{") || texto.includes("...")) return MENSAGEM_GENERICA;
  return texto;
}

export async function tokenizarCartao(dados: DadosCartao): Promise<string> {
  const payeeCode = process.env.NEXT_PUBLIC_EFI_PAYEE_CODE;
  if (!payeeCode) {
    throw new Error("Pagamento com cartão indisponível no momento. Pague com Pix por enquanto.");
  }

  try {
    // Import dinâmico: essa lib toca `window` já na avaliação do módulo, e
    // o Next.js avalia módulos "use client" também durante o SSR — um
    // `import` estático no topo do arquivo derruba a renderização no
    // servidor com "window is not defined".
    const { default: EfiPay } = await import("payment-token-efi");
    const { CreditCard } = EfiPay;

    const brand = await CreditCard.setCardNumber(dados.numero).verifyCardBrand();
    if (!brand) {
      throw new Error("Não reconhecemos a bandeira desse cartão. Confira o número e tente de novo.");
    }

    const resultado = await CreditCard.setAccount(payeeCode)
      .setEnvironment(ambiente())
      .setCreditCardData({
        brand,
        number: dados.numero,
        cvv: dados.cvv,
        expirationMonth: dados.validadeMes,
        expirationYear: dados.validadeAno,
        holderName: dados.nome,
        holderDocument: dados.cpf.replace(/\D/g, ""),
        reuse: false,
      })
      .getPaymentToken();

    if ("error" in resultado) {
      throw new Error(mensagemAmigavel(resultado.error_description));
    }

    return resultado.payment_token;
  } catch (err) {
    throw new Error(mensagemAmigavel(err instanceof Error ? err.message : undefined));
  }
}
