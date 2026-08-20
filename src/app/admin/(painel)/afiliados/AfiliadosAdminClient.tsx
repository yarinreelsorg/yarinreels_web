"use client";

import { useState } from "react";
import { motion } from "motion/react";
import type { ResumoAfiliado } from "@/lib/afiliados";
import { formatarPreco } from "@/lib/catalogo";
import { buttonTap } from "@/lib/motion";
import { useToast } from "@/components/admin/ToastProvider";
import { marcarComissoesPagasAction } from "./actions";

export default function AfiliadosAdminClient({ afiliados }: { afiliados: ResumoAfiliado[] }) {
  const toast = useToast();
  const [processando, setProcessando] = useState<string | null>(null);

  const totalPendente = afiliados.reduce((soma, a) => soma + Number(a.vl_comissao_pendente), 0);

  async function aoMarcarPago(cdUsuario: string, nome: string) {
    if (!window.confirm(`Marcar todas as comissões pendentes de ${nome} como pagas? Isso não desfaz automaticamente — só use depois de já ter transferido o Pix.`)) {
      return;
    }
    setProcessando(cdUsuario);
    try {
      await marcarComissoesPagasAction(cdUsuario);
      toast.sucesso("Comissões marcadas como pagas.");
    } catch (err) {
      toast.erro(err instanceof Error ? err.message : "Erro ao marcar como pago.");
    } finally {
      setProcessando(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">Afiliados</h1>
        <p className="text-sm text-[#A78BFA]">
          Clientes que indicaram outros clientes pelo link próprio (gerado em Minha Conta) —
          comissão calculada automaticamente sobre compras/assinaturas aprovadas. Pagamento é
          manual (Pix por fora); marque como pago depois de transferir.
        </p>
      </div>

      <div className="rounded-lg border border-[rgba(139,92,246,0.15)] bg-[#0D0A1A] p-6 shadow-lg max-w-xs">
        <span className="text-sm font-medium text-[#A78BFA]">Comissão pendente (total)</span>
        <h3 className="mt-4 text-3xl font-bold text-amber-400">{formatarPreco(totalPendente) ?? "R$ 0,00"}</h3>
      </div>

      <div className="rounded-lg border border-[rgba(139,92,246,0.15)] bg-[#0D0A1A] overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[rgba(139,92,246,0.15)] bg-[#050208]/50 text-xs font-semibold text-[#A78BFA] uppercase tracking-wider">
                <th className="px-6 py-3">Afiliado</th>
                <th className="px-6 py-3">Código</th>
                <th className="px-6 py-3">Indicados</th>
                <th className="px-6 py-3">Vendas aprovadas</th>
                <th className="px-6 py-3">Comissão pendente</th>
                <th className="px-6 py-3">Já pago</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(139,92,246,0.15)] text-sm text-white">
              {afiliados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-[#A78BFA]/70">
                    Ninguém indicou clientes ainda.
                  </td>
                </tr>
              ) : (
                afiliados.map((a) => (
                  <tr key={a.cd_usuario} className="hover:bg-[rgba(139,92,246,0.05)] transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium">{a.nm_nome || "—"}</p>
                      <p className="text-xs text-[#A78BFA]/70">{a.nm_email}</p>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">{a.cd_codigo_afiliado ?? "—"}</td>
                    <td className="px-6 py-4">{a.total_indicados}</td>
                    <td className="px-6 py-4">{a.total_vendas_aprovadas}</td>
                    <td className="px-6 py-4 font-semibold text-amber-400">
                      {formatarPreco(Number(a.vl_comissao_pendente)) ?? "R$ 0,00"}
                    </td>
                    <td className="px-6 py-4 text-[#A78BFA]">
                      {formatarPreco(Number(a.vl_comissao_paga)) ?? "R$ 0,00"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {Number(a.vl_comissao_pendente) > 0 && (
                        <motion.button
                          type="button"
                          disabled={processando === a.cd_usuario}
                          onClick={() => aoMarcarPago(a.cd_usuario, a.nm_nome || a.nm_email)}
                          {...buttonTap}
                          className="rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 px-3 py-1.5 text-xs font-bold text-white transition-colors cursor-pointer"
                        >
                          {processando === a.cd_usuario ? "Marcando..." : "✓ Marcar como pago"}
                        </motion.button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
