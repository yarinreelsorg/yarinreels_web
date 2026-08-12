import Link from "next/link";
import { getSessaoUsuario } from "@/lib/user-auth";
import { obterIdsTelegramElegiveis, obterBanimentoUsuario } from "@/lib/acesso";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function BloqueadoPage() {
  const sessao = await getSessaoUsuario();
  let mensagem = "Sua conta foi suspensa permanentemente. Entre em contato com o suporte caso acredite ter havido um engano.";

  if (sessao) {
    const ids = await obterIdsTelegramElegiveis(sessao.cd_usuario);
    const banInfo = await obterBanimentoUsuario(ids);
    if (banInfo.ds_mensagem_bloqueio && banInfo.ds_mensagem_bloqueio.trim()) {
      mensagem = banInfo.ds_mensagem_bloqueio.trim();
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050208] px-4 text-white">
      <div className="w-full max-w-md rounded-xl border border-red-500/20 bg-[#0D0A1A] p-8 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-3xl text-red-500">
          🚫
        </div>

        <h1 className="text-2xl font-black text-white">Acesso Bloqueado</h1>
        <p className="mt-3 text-sm text-[#A78BFA] leading-relaxed">{mensagem}</p>

        <div className="mt-8 flex flex-col gap-3">
          <a
            href="https://t.me/YarinTV"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-700"
          >
            Falar com o Suporte
          </a>
          <Link
            href="/"
            className="rounded-md border border-[rgba(139,92,246,0.3)] px-5 py-2.5 text-sm font-bold text-[#A78BFA] transition-colors hover:bg-white/5"
          >
            Voltar ao Início
          </Link>
        </div>
      </div>
    </div>
  );
}
