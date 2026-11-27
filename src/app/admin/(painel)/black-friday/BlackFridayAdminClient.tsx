"use client";

import { useState, useTransition } from "react";
import { useToast } from "@/components/admin/ToastProvider";
import type { EstadoBlackFriday } from "@/lib/black-friday";
import { aplicarDescontoBlackFriday, encerrarDescontoBlackFriday } from "./actions";

const ATALHOS = [10, 20, 30, 40, 50];

function formatarDataHora(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function BlackFridayAdminClient({
  estadoInicial,
}: {
  estadoInicial: EstadoBlackFriday;
}) {
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const [estado, setEstado] = useState(estadoInicial);
  const [percentual, setPercentual] = useState(
    estadoInicial.percentual ? String(estadoInicial.percentual) : ""
  );
  const [incluirPlanos, setIncluirPlanos] = useState(estadoInicial.incluiPlanos);

  const ativa = estado.percentual !== null;
  const valor = Number(percentual);
  const valido = Number.isInteger(valor) && valor >= 1 && valor <= 90;

  const aoAplicar = () => {
    if (!valido) {
      toast.erro("Informe um percentual inteiro entre 1 e 90.");
      return;
    }
    const alvo = incluirPlanos ? "todos os títulos e todos os planos" : "todos os títulos";
    if (
      !window.confirm(
        `Aplicar ${valor}% de desconto em ${alvo}?\n\nOs preços mudam NA HORA, no site e no bot do Telegram.`
      )
    )
      return;

    startTransition(async () => {
      try {
        const resultado = await aplicarDescontoBlackFriday(valor, incluirPlanos);
        if (resultado.erro) {
          toast.erro(resultado.erro);
          return;
        }
        setEstado({
          percentual: valor,
          incluiPlanos: incluirPlanos,
          tsInicio: estado.tsInicio ?? new Date().toISOString(),
          totalConteudos: resultado.conteudos ?? 0,
          totalPlanos: resultado.planos ?? 0,
        });
        toast.sucesso(`${valor}% de desconto aplicado em ${resultado.conteudos} título(s).`);
      } catch (err) {
        toast.erro(err instanceof Error ? err.message : "Erro ao aplicar o desconto.");
      }
    });
  };

  const aoEncerrar = () => {
    if (
      !window.confirm(
        "Encerrar a Black Friday? Todos os preços voltam ao valor de antes da promoção, no site e no bot."
      )
    )
      return;

    startTransition(async () => {
      try {
        const resultado = await encerrarDescontoBlackFriday();
        if (resultado.erro) {
          toast.erro(resultado.erro);
          return;
        }
        setEstado({
          percentual: null,
          incluiPlanos: false,
          tsInicio: null,
          totalConteudos: 0,
          totalPlanos: 0,
        });
        setPercentual("");
        setIncluirPlanos(false);
        toast.sucesso("Black Friday encerrada. Preços restaurados.");
      } catch (err) {
        toast.erro(err instanceof Error ? err.message : "Erro ao encerrar a promoção.");
      }
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white flex items-center gap-3">
          🛍️ Black Friday
        </h1>
        <p className="text-sm text-[#A78BFA] mt-1">
          Dê um desconto percentual em todo o catálogo com um clique. Vale no site e no bot do
          Telegram, e dá pra desfazer a qualquer momento.
        </p>
      </div>

      <div
        className={`rounded-lg border p-5 ${
          ativa
            ? "border-emerald-500/30 bg-emerald-500/10"
            : "border-[rgba(139,92,246,0.15)] bg-[#0D0A1A]"
        }`}
      >
        {ativa ? (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-lg font-black text-emerald-300">
                🔥 Black Friday ATIVA — {estado.percentual}% de desconto
              </p>
              <p className="mt-1 text-xs text-emerald-200/80">
                {estado.totalConteudos} título(s)
                {estado.incluiPlanos ? ` e ${estado.totalPlanos} plano(s)` : ""} com preço
                promocional
                {estado.tsInicio ? ` · desde ${formatarDataHora(estado.tsInicio)}` : ""}
              </p>
            </div>
            <button
              type="button"
              disabled={isPending}
              onClick={aoEncerrar}
              className="rounded border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-300 hover:bg-red-500/20 transition-colors cursor-pointer disabled:opacity-50"
            >
              ⏹️ Encerrar e voltar os preços
            </button>
          </div>
        ) : (
          <p className="text-sm font-semibold text-[#A78BFA]">
            Nenhuma promoção ativa — os preços estão normais.
          </p>
        )}
      </div>

      <div className="max-w-xl rounded-lg border border-[rgba(139,92,246,0.15)] bg-[#0D0A1A] p-6 shadow-lg space-y-5">
        <div>
          <label
            htmlFor="percentual"
            className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1"
          >
            Percentual de desconto (%)
          </label>
          <input
            id="percentual"
            type="number"
            inputMode="numeric"
            min={1}
            max={90}
            step={1}
            placeholder="Ex: 30"
            value={percentual}
            onChange={(e) => setPercentual(e.target.value)}
            className="w-full bg-[#0D0A1A] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] p-2.5 text-white text-lg"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {ATALHOS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPercentual(String(p))}
                className="rounded-full border border-[#7B2FBE]/40 bg-[#7B2FBE]/20 px-3 py-1 text-xs font-bold text-[#A78BFA] hover:bg-[#7B2FBE]/40 transition-colors cursor-pointer"
              >
                {p}%
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-[#A78BFA]/70">
            Máximo de 90% (evita zerar o catálogo por engano). Aplicar de novo com outro
            percentual não acumula: o cálculo sempre parte do preço original.
          </p>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={incluirPlanos}
            onChange={(e) => setIncluirPlanos(e.target.checked)}
            className="h-4 w-4 cursor-pointer accent-[#9D4EDD]"
          />
          <span className="text-xs font-semibold text-[#A78BFA] uppercase">
            Incluir também os planos de assinatura
          </span>
        </label>

        <button
          type="button"
          disabled={isPending || !valido}
          onClick={aoAplicar}
          className="w-full rounded-[6px] bg-gradient-to-r from-[#7B2FBE] to-[#9D4EDD] px-4 py-3 text-sm font-black text-white hover:opacity-90 transition-opacity cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isPending
            ? "Aplicando..."
            : ativa
              ? `Atualizar desconto para ${valido ? valor : "…"}%`
              : `Aplicar ${valido ? valor : "…"}% de desconto em tudo`}
        </button>
      </div>

      <div className="max-w-xl rounded-lg border border-[rgba(139,92,246,0.15)] bg-[#0D0A1A] p-5 text-xs text-[#A78BFA] space-y-2">
        <p className="font-bold uppercase">Como funciona</p>
        <ul className="list-disc space-y-1 pl-4">
          <li>
            O desconto vale pro aluguel e pro vitalício de cada título (e pros planos, se
            marcado). Preços em branco continuam em branco.
          </li>
          <li>
            O preço de antes fica guardado: ao encerrar, tudo volta exatamente como era.
          </li>
          <li>
            Títulos criados durante a promoção entram sem desconto — clique em Atualizar pra
            incluí-los.
          </li>
          <li>
            Se você editar o preço de um título no Catálogo durante a promoção, ao encerrar ele
            volta ao preço de antes da promoção.
          </li>
        </ul>
      </div>
    </div>
  );
}
