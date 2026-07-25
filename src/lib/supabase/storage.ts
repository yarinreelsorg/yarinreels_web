import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const BUCKET_POSTERS = "posters";
const TAMANHO_MAXIMO_BYTES = 5 * 1024 * 1024;
const TIPOS_ACEITOS = ["image/jpeg", "image/png", "image/webp"];

/**
 * Envia um arquivo de poster pro bucket "posters" e retorna a URL pública.
 * Validação de tipo/tamanho é feita aqui de novo (além do client) porque o
 * client é facilmente contornável — quem chama essa função não deve confiar
 * só na validação do <input>.
 */
export async function enviarPoster(file: File, cdConteudo: string): Promise<string> {
  if (!TIPOS_ACEITOS.includes(file.type)) {
    throw new Error("Formato de imagem inválido. Use JPEG, PNG ou WebP.");
  }
  if (file.size > TAMANHO_MAXIMO_BYTES) {
    throw new Error("Imagem muito grande. O limite é 5MB.");
  }

  const extensao = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const caminho = `${cdConteudo}/${Date.now()}.${extensao}`;

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.storage.from(BUCKET_POSTERS).upload(caminho, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) throw new Error(`Erro ao enviar imagem: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET_POSTERS).getPublicUrl(caminho);
  return data.publicUrl;
}
