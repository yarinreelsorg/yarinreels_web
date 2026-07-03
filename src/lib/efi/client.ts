// Placeholder: integração com Efí Bank (sdk-node-apis-efi) para Pix e cartão.
// Implementar quando o checkout for construído — ver "Business Rules" em CLAUDE.md
// (aprovação Pix via webhook + varredor de fallback já existem no bot legado).

export interface EfiPixCharge {
  txid: string;
  qrcode: string;
  qrcodeImage: string;
  valor: number;
}

export interface EfiCardCharge {
  txid: string;
  valor: number;
}

export async function criarCobrancaPix(): Promise<EfiPixCharge> {
  throw new Error("criarCobrancaPix não implementado");
}

export async function criarCobrancaCartao(): Promise<EfiCardCharge> {
  throw new Error("criarCobrancaCartao não implementado");
}
