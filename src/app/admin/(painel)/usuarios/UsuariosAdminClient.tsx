"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Usuario } from "@/types/database";
import Avatar from "@/components/ui/Avatar";
import { formatarDataHora } from "@/lib/data";

export default function UsuariosAdminClient({
  usuarios,
  buscaAtual,
}: {
  usuarios: Usuario[];
  buscaAtual: string;
}) {
  const router = useRouter();
  const [buscaLocal, setBuscaLocal] = useState(buscaAtual);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const aoBuscar = (valor: string) => {
    setBuscaLocal(valor);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const query = valor ? `?busca=${encodeURIComponent(valor)}` : "";
      router.push(`/admin/usuarios${query}`);
    }, 400);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Usuários do Site</h1>
          <p className="text-sm text-[#A78BFA]">
            Contas criadas por e-mail/senha direto no site (não pelo bot). Use &quot;Conceder
            acesso&quot; pra liberar conteúdo ou assinatura pra quem não tem ID do Telegram.
          </p>
        </div>
      </div>

      <input
        type="text"
        value={buscaLocal}
        onChange={(e) => aoBuscar(e.target.value)}
        placeholder="Buscar por e-mail ou nome..."
        className="w-full max-w-sm bg-[#0D0A1A] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] p-2.5 text-white"
      />

      <div className="overflow-x-auto rounded-lg border border-[rgba(139,92,246,0.15)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[rgba(139,92,246,0.15)] text-left text-xs uppercase text-[#A78BFA]">
              <th className="p-3">E-mail</th>
              <th className="p-3">Nome</th>
              <th className="p-3">Telegram vinculado</th>
              <th className="p-3">Cadastro</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {usuarios.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-[#A78BFA]">
                  Nenhum usuário encontrado.
                </td>
              </tr>
            ) : (
              usuarios.map((usuario) => (
                <tr
                  key={usuario.cd_usuario}
                  className="border-b border-[rgba(139,92,246,0.08)] last:border-0"
                >
                  <td className="p-3 text-white">
                    <span className="mr-2 inline-flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-[#050208] text-base align-middle">
                      <Avatar valor={usuario.ds_avatar} className="h-full w-full" />
                    </span>
                    {usuario.nm_email}
                  </td>
                  <td className="p-3 text-[#A78BFA]">{usuario.nm_nome || "—"}</td>
                  <td className="p-3 text-[#A78BFA]">
                    {usuario.nr_id_telegram ? (
                      <span className="text-emerald-400">{usuario.nr_id_telegram}</span>
                    ) : (
                      "Não vinculado"
                    )}
                  </td>
                  <td className="p-3 text-[#A78BFA]">
                    {formatarDataHora(usuario.ts_criacao)}
                  </td>
                  <td className="p-3 text-right space-x-2 whitespace-nowrap">
                    {(usuario.nr_id_telegram || usuario.nr_id_telegram_web) && (
                      <a
                        href={`/admin/clientes?verHistorico=${
                          usuario.nr_id_telegram || usuario.nr_id_telegram_web
                        }`}
                        className="inline-block rounded-md border border-[rgba(139,92,246,0.3)] hover:bg-white/5 px-3 py-1.5 text-xs font-bold text-[#A78BFA] transition-colors"
                      >
                        Ver histórico
                      </a>
                    )}
                    <a
                      href={`/admin/clientes?concederEmail=${encodeURIComponent(usuario.nm_email)}`}
                      className="inline-block rounded-md bg-[#7B2FBE] hover:bg-[#6D28D9] px-3 py-1.5 text-xs font-bold text-white transition-colors"
                    >
                      Conceder acesso
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
