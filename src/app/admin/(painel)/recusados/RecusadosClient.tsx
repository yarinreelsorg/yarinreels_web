"use client";

import { usePathname, useRouter } from "next/navigation";
import { motion } from "motion/react";
import type { Conteudo, Plano, TentativaCartaoRecusada } from "@/types/database";
import { formatarPreco } from "@/lib/catalogo";
import { formatarDataHora } from "@/lib/data";
import Pagination from "@/components/admin/Pagination";

export default function RecusadosClient({
  tentativas,
  conteudos,
  planos,
  totalRegistros,
  itensPorPagina,
  pagina,
}: {
  tentativas: TentativaCartaoRecusada[];
  conteudos: Conteudo[];
  planos: Plano[];
  totalRegistros: number;
  itensPorPagina: number;
  pagina: number;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const conteudosMap = new Map(conteudos.map((c) => [c.cd_conteudo, c]));
  const planosMap = new Map(planos.map((p) => [p.cd_plano, p]));

  const totalPaginas = Math.max(1, Math.ceil(totalRegistros / itensPorPagina));

  const totalPerdido = tentativas.reduce((s, t) => s + t.vl_tentativa, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">Cartão Recusado</h1>
        <p className="text-sm text-[#A78BFA]">
          Tentativas de pagamento com cartão que a Efí recusou — use pra identificar atrito no
          checkout.
        </p>
      </div>

      <div className="rounded-lg border border-[rgba(139,92,246,0.15)] bg-[#0D0A1A] p-6 shadow-lg max-w-xs">
        <span className="text-sm font-medium text-[#A78BFA]">Total de tentativas recusadas</span>
        <h3 className="mt-4 text-3xl font-bold text-white">{totalRegistros}</h3>
        <p className="mt-1 text-xs text-[#A78BFA]/70">
          {formatarPreco(totalPerdido)} em valor tentado (nesta página)
        </p>
      </div>

      <div className="rounded-lg border border-[rgba(139,92,246,0.15)] bg-[#0D0A1A] overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[rgba(139,92,246,0.15)] bg-[#050208]/50 text-xs font-semibold text-[#A78BFA] uppercase tracking-wider">
                <th className="px-6 py-3">Quando</th>
                <th className="px-6 py-3">ID Telegram</th>
                <th className="px-6 py-3">Item</th>
                <th className="px-6 py-3">Tipo</th>
                <th className="px-6 py-3">Valor</th>
                <th className="px-6 py-3">Motivo</th>
              </tr>
            </thead>
            <motion.tbody
              key={pagina}
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.02 } } }}
              className="divide-y divide-[rgba(139,92,246,0.15)] text-sm text-white"
            >
              {tentativas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-[#A78BFA]/70">
                    Nenhuma tentativa de cartão recusada registrada.
                  </td>
                </tr>
              ) : (
                tentativas.map((t) => {
                  let itemNome = "-";
                  if (t.tp_compra === "ASSINATURA") {
                    itemNome = (t.cd_plano && planosMap.get(t.cd_plano)?.nm_plano) ?? "-";
                  } else {
                    itemNome = (t.cd_conteudo && conteudosMap.get(t.cd_conteudo)?.nm_titulo) ?? "-";
                  }

                  return (
                    <motion.tr
                      key={t.cd_tentativa}
                      variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                      className="hover:bg-[rgba(139,92,246,0.05)] transition-colors"
                    >
                      <td className="px-6 py-4 text-xs text-[#A78BFA]/80 whitespace-nowrap">
                        {formatarDataHora(t.ts_criacao, {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">{t.nr_id_telegram}</td>
                      <td className="px-6 py-4 font-medium max-w-xs truncate">{itemNome}</td>
                      <td className="px-6 py-4 text-xs">
                        <span className="bg-[#050208] border border-[rgba(139,92,246,0.2)] px-2 py-0.5 rounded text-[#A78BFA]">
                          {t.tp_compra}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-[#A78BFA]">
                        {formatarPreco(t.vl_tentativa)}
                      </td>
                      <td className="px-6 py-4 text-xs text-red-400 max-w-xs truncate">
                        {t.ds_motivo ?? "—"}
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </motion.tbody>
          </table>
        </div>
        <Pagination
          paginaAtual={pagina}
          totalPaginas={totalPaginas}
          onChange={(p) => {
            const params = new URLSearchParams();
            if (p > 1) params.set("page", String(p));
            const query = params.toString();
            router.push(query ? `${pathname}?${query}` : pathname);
          }}
        />
      </div>
    </div>
  );
}
