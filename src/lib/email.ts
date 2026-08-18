import "server-only";

interface EnviarEmailRecuperacaoParams {
  para: string;
  nome: string | null;
  linkRecuperacao: string;
}

export async function enviarEmailRecuperacaoSenha({
  para,
  nome,
  linkRecuperacao,
}: EnviarEmailRecuperacaoParams): Promise<{ enviado: boolean; linkDev?: string }> {
  const nomeExibicao = nome ? nome.split(" ")[0] : "Usuário";
  const resendApiKey = process.env.RESEND_API_KEY;
  const remetente = process.env.EMAIL_FROM || "Yarinreels <suporte@yarinreels.com>";

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Redefinição de Senha - Yarinreels</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0f0f0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0f0f0f; width: 100%; padding: 40px 10px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" style="max-width: 520px; background-color: #161618; border: 1px solid #27272a; border-radius: 12px; overflow: hidden; padding: 32px;">
              <!-- Header / Logo -->
              <tr>
                <td align="center" style="padding-bottom: 24px;">
                  <span style="font-size: 26px; font-weight: 900; letter-spacing: 1px; color: #e50914; text-decoration: none;">
                    YARINREELS
                  </span>
                </td>
              </tr>
              <!-- Body Content -->
              <tr>
                <td style="color: #e4e4e7; font-size: 15px; line-height: 1.6;">
                  <h1 style="font-size: 20px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 16px;">
                    Olá, ${nomeExibicao}!
                  </h1>
                  <p style="margin-top: 0; margin-bottom: 20px; color: #a1a1aa;">
                    Recebemos uma solicitação para redefinir a senha da sua conta no Yarinreels. Clique no botão abaixo para escolher uma nova senha:
                  </p>
                </td>
              </tr>
              <!-- Call to Action Button -->
              <tr>
                <td align="center" style="padding: 12px 0 28px 0;">
                  <a href="${linkRecuperacao}" target="_blank" style="display: inline-block; background-color: #e50914; color: #ffffff; font-weight: 700; font-size: 15px; padding: 14px 28px; text-decoration: none; border-radius: 8px; transition: background-color 0.2s;">
                    Redefinir Minha Senha
                  </a>
                </td>
              </tr>
              <!-- Link Text Alternative -->
              <tr>
                <td style="color: #71717a; font-size: 13px; line-height: 1.5; border-top: 1px solid #27272a; padding-top: 20px;">
                  <p style="margin-top: 0; margin-bottom: 8px;">
                    Se o botão acima não funcionar, copie e cole o link abaixo no seu navegador:
                  </p>
                  <p style="margin: 0; word-break: break-all;">
                    <a href="${linkRecuperacao}" style="color: #e50914; text-decoration: underline;">
                      ${linkRecuperacao}
                    </a>
                  </p>
                  <p style="margin-top: 16px; margin-bottom: 0; color: #71717a;">
                    Este link é válido por <strong>1 hora</strong>. Se você não solicitou a redefinição de senha, pode ignorar este e-mail com segurança.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  if (resendApiKey) {
    try {
      const resp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: remetente,
          to: [para],
          subject: "Redefinição de Senha - Yarinreels",
          html,
        }),
      });

      if (!resp.ok) {
        const errorText = await resp.text();
        console.error("[E-MAIL RESEND ERRO]:", resp.status, errorText);
        return { enviado: false, linkDev: process.env.NODE_ENV !== "production" ? linkRecuperacao : undefined };
      }

      return { enviado: true };
    } catch (err) {
      console.error("[E-MAIL RESEND EXCEÇÃO]:", err);
      return { enviado: false, linkDev: process.env.NODE_ENV !== "production" ? linkRecuperacao : undefined };
    }
  }

  // Fallback para dev ou quando RESEND_API_KEY não configurada
  console.log("--------------------------------------------------");
  console.log("[E-MAIL DE RECUPERAÇÃO DE SENHA - SIMULADO]");
  console.log(`Para: ${para} (${nomeExibicao})`);
  console.log(`Link: ${linkRecuperacao}`);
  console.log("--------------------------------------------------");

  return {
    enviado: true,
    linkDev: process.env.NODE_ENV !== "production" ? linkRecuperacao : undefined,
  };
}
