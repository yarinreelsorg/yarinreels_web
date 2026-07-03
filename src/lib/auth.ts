const MENSAGENS: Record<string, string> = {
  "Invalid login credentials": "E-mail ou senha inválidos.",
  "User already registered": "Este e-mail já está cadastrado.",
  "Email not confirmed": "Confirme seu e-mail antes de entrar.",
  "Signup requires a valid password": "Informe uma senha válida.",
  "Unable to validate email address: invalid format": "Informe um e-mail válido.",
};

export function traduzirErroAuth(mensagem: string) {
  return MENSAGENS[mensagem] ?? mensagem;
}
