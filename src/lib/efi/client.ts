import "server-only";
import EfiPay from "sdk-node-apis-efi";

let instancia: EfiPay | null = null;

function obterCliente() {
  if (instancia) return instancia;

  const { EFI_CLIENT_ID, EFI_CLIENT_SECRET, EFI_CERTIFICADO_BASE64, EFI_SANDBOX } = process.env;

  if (!EFI_CLIENT_ID || !EFI_CLIENT_SECRET || !EFI_CERTIFICADO_BASE64) {
    throw new Error(
      "Credenciais da Efí não configuradas (EFI_CLIENT_ID, EFI_CLIENT_SECRET, EFI_CERTIFICADO_BASE64)."
    );
  }

  instancia = new EfiPay({
    sandbox: EFI_SANDBOX !== "false",
    client_id: EFI_CLIENT_ID,
    client_secret: EFI_CLIENT_SECRET,
    certificate: EFI_CERTIFICADO_BASE64,
    cert_base64: true,
  });

  return instancia;
}

export interface CobrancaPix {
  txid: string;
  qrcodeImage: string;
  copiaECola: string;
}

export async function criarCobrancaPix(valor: number, mensagem: string): Promise<CobrancaPix> {
  const efipay = obterCliente();
  const chave = process.env.EFI_CHAVE_PIX;
  if (!chave) throw new Error("EFI_CHAVE_PIX não configurada.");

  const cobranca = await efipay.pixCreateImmediateCharge({
    calendario: { expiracao: 3600 },
    valor: { original: valor.toFixed(2) },
    chave,
    solicitacaoPagador: mensagem.slice(0, 140),
  });

  const qrcode = await efipay.pixGenerateQRCode({ id: cobranca.loc.id });

  return {
    txid: cobranca.txid,
    qrcodeImage: qrcode.imagemQrcode,
    copiaECola: qrcode.qrcode,
  };
}

export type StatusCobrancaPix = "PENDENTE" | "PAGA" | "CANCELADA";

export async function consultarCobrancaPix(txid: string): Promise<StatusCobrancaPix> {
  const efipay = obterCliente();
  const detalhe = await efipay.pixDetailCharge({ txid });

  if (detalhe.status === "CONCLUIDA") return "PAGA";
  if (
    detalhe.status === "REMOVIDA_PELO_USUARIO_RECEBEDOR" ||
    detalhe.status === "REMOVIDA_PELO_PSP"
  ) {
    return "CANCELADA";
  }
  return "PENDENTE";
}

/**
 * Reaproveita uma cobrança Pix ainda ativa (mesmo QR Code) em vez de criar
 * uma nova toda vez que o checkout é montado/recarregado. Retorna `null`
 * quando a cobrança original já não está mais ativa (paga, cancelada ou
 * expirada), sinalizando que uma nova cobrança precisa ser criada.
 */
export async function obterCobrancaPixAtiva(txid: string): Promise<CobrancaPix | null> {
  const efipay = obterCliente();
  const detalhe = await efipay.pixDetailCharge({ txid });

  if (detalhe.status !== "ATIVA") return null;

  const qrcode = await efipay.pixGenerateQRCode({ id: detalhe.loc.id });

  return {
    txid,
    qrcodeImage: qrcode.imagemQrcode,
    copiaECola: qrcode.qrcode,
  };
}

export interface CobrancaCartaoParams {
  valor: number;
  descricao: string;
  paymentToken: string;
  installments?: number;
  cliente: {
    email: string;
    nome?: string;
    cpf?: string;
    telefone?: string;
  };
}

export interface CobrancaCartaoResultado {
  /** Ausente quando a cobrança nem chegou a ser criada na Efí (erro de
   * validação, rede, etc — sem charge_id pra referenciar). */
  chargeId?: string;
  status: "APROVADO" | "RECUSADO" | "PROCESSANDO";
  motivoRecusa?: string;
}

/**
 * A Efí lança o corpo cru da resposta de erro quando a requisição falha
 * (ex: campo obrigatório faltando) — não é uma instância de Error, e
 * `error_description` às vezes é string, às vezes um objeto
 * `{ property, message }`. Aqui a gente extrai algo legível disso.
 */
function extrairMotivoRecusa(erro: unknown): string {
  if (erro && typeof erro === "object") {
    const e = erro as { error_description?: unknown; error?: unknown };
    if (typeof e.error_description === "string" && e.error_description.trim()) {
      return e.error_description;
    }
    if (e.error_description && typeof e.error_description === "object") {
      const detalhe = e.error_description as { message?: unknown };
      if (typeof detalhe.message === "string" && detalhe.message.trim()) return detalhe.message;
    }
    if (typeof e.error === "string" && e.error.trim()) return e.error;
  }
  return "Não foi possível processar o pagamento com esse cartão.";
}

/**
 * O número do cartão nunca passa pelo nosso servidor: o `paymentToken` é
 * gerado no navegador pelo script de tokenização da Efí (Efí.js) antes de
 * chegar aqui — é assim que a Efí evita que a gente precise de compliance PCI.
 */
export async function criarCobrancaCartao(
  params: CobrancaCartaoParams
): Promise<CobrancaCartaoResultado> {
  const efipay = obterCliente();

  let resposta: Awaited<ReturnType<typeof efipay.createOneStepCharge>>;
  try {
    resposta = await efipay.createOneStepCharge({
      items: [
        {
          name: params.descricao.slice(0, 255),
          value: Math.round(params.valor * 100),
          amount: 1,
        },
      ],
      payment: {
        credit_card: {
          customer: {
            email: params.cliente.email,
            name: params.cliente.nome,
            cpf: params.cliente.cpf,
            phone_number: params.cliente.telefone,
          },
          installments: params.installments ?? 1,
          payment_token: params.paymentToken,
        },
      },
    });
  } catch (erro) {
    return { status: "RECUSADO", motivoRecusa: extrairMotivoRecusa(erro) };
  }

  const dados = resposta.data;
  const chargeId = String(dados.charge_id);

  if ("refusal" in dados && dados.refusal) {
    return { chargeId, status: "RECUSADO", motivoRecusa: dados.refusal.reason };
  }
  if (dados.status === "paid" || dados.status === "approved" || dados.status === "settled") {
    return { chargeId, status: "APROVADO" };
  }
  return { chargeId, status: "PROCESSANDO" };
}
