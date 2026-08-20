import Link from "next/link";
import { pool } from "@/lib/db";
import { getSessaoUsuario } from "@/lib/user-auth";
import { obterIdsTelegramElegiveis } from "@/lib/acesso";
import Navbar from "@/components/layout/Navbar";
import { formatarPreco, estaExpirada } from "@/lib/catalogo";
import { formatarDataHora } from "@/lib/data";
import type { Plano, Venda } from "@/types/database";

export const revalidate = 0;

function formatarDuracao(dias: number) {
  if (dias >= 365) {
    const anos = Math.round(dias / 365);
    return anos === 1 ? "Anual" : `${anos} anos`;
  }
  if (dias >= 28 && dias <= 31) return "Mensal";
  if (dias % 30 === 0) return `${dias / 30} meses`;
  return `${dias} dias`;
}

export default async function AssinaturasPage() {
  const [{ rows: planos }, sessao] = await Promise.all([
    pool.query<Plano>('SELECT * FROM "PLANOS"'),
    getSessaoUsuario(),
  ]);

  let assinaturaAtiva: Venda | undefined;
  let planoAtivo: Plano | undefined;

  if (sessao) {
    const ids = await obterIdsTelegramElegiveis(sessao.cd_usuario);
    const { rows: vendas } = await pool.query<Venda>(
      `SELECT * FROM "VENDAS" WHERE nr_id_telegram = ANY($1::bigint[]) AND tp_compra = 'ASSINATURA' AND tp_status = 'APROVADA' ORDER BY ts_criacao DESC`,
      [ids]
    );
    assinaturaAtiva = vendas.find((v) => v.ts_expiracao && !estaExpirada(v.ts_expiracao));
    if (assinaturaAtiva) {
      planoAtivo = planos.find((p) => p.cd_plano === assinaturaAtiva!.cd_plano);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar categorias={[]} />

      <section className="mx-auto w-full max-w-5xl px-4 pb-16 pt-6 text-center sm:px-8">
        <h1 className="text-3xl font-black text-foreground sm:text-4xl">
          {assinaturaAtiva ? "Sua assinatura" : "Escolha sua assinatura"}
        </h1>
        <p className="mt-3 text-secondary">
          {assinaturaAtiva
            ? "Você já tem acesso liberado — gerencie ou troque de plano abaixo."
            : (
              <>
                Acesso liberado ao catálogo enquanto sua assinatura estiver ativa. Primeiro mês
                por <span className="font-bold text-primary">R$ 20</span>.
              </>
            )}
        </p>

        {assinaturaAtiva && planoAtivo && (
          <div
            className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-lg p-5 text-left sm:p-6"
            style={{
              background: "linear-gradient(120deg, rgba(123,47,190,0.18), rgba(13,10,26,0.4))",
              border: "1px solid rgba(139,92,246,0.3)",
            }}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  Assinatura ativa
                </span>
              </div>
              <p className="mt-1.5 text-xl font-black text-foreground">{planoAtivo.nm_plano}</p>
              <p className="mt-0.5 text-sm text-secondary">
                Libera <span className="font-semibold text-[#A78BFA]">{planoAtivo.nm_categoria}</span>{" "}
                · vale até{" "}
                {formatarDataHora(assinaturaAtiva.ts_expiracao as string, {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </p>
            </div>
            <Link
              href="/conta/assinatura"
              className="shrink-0 rounded-md border border-primary/40 px-4 py-2 text-xs font-bold text-foreground transition-colors hover:border-primary"
            >
              Gerenciar
            </Link>
          </div>
        )}

        {planos.length === 0 ? (
          <p className="mt-16 text-secondary">
            Nenhum plano disponível no momento. Volte em breve.
          </p>
        ) : (
          <>
            {assinaturaAtiva && (
              <h2 className="mt-10 text-left text-lg font-bold text-foreground">
                Outros planos
              </h2>
            )}
            <div className="mt-6 grid gap-6 text-left sm:grid-cols-2 lg:grid-cols-3">
              {planos.map((plano) => (
                <div
                  key={plano.cd_plano}
                  className="flex flex-col rounded-lg border border-border bg-surface p-6 transition-colors duration-300 hover:border-foreground/30"
                >
                  <span className="w-fit text-xs font-semibold uppercase tracking-[0.08em] text-secondary">
                    {plano.nm_categoria}
                  </span>

                  <h2 className="mt-4 text-xl font-black text-foreground">
                    {plano.nm_plano}
                  </h2>
                  <p className="mt-1 text-sm text-secondary">
                    {formatarDuracao(plano.nr_dias_validade)} de acesso
                  </p>
                  <p className="mt-2 text-2xl font-black text-primary">
                    {formatarPreco(plano.vl_plano)}
                  </p>

                  <ul className="mt-5 flex flex-col gap-2 text-sm text-secondary">
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span> Sem anúncios
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span> Catálogo{" "}
                      {plano.nm_categoria.toLowerCase()} liberado
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span> Cancele quando quiser
                    </li>
                  </ul>

                  <Link
                    href={`/checkout/plano/${plano.cd_plano}`}
                    className="mt-6 rounded-md bg-primary px-6 py-3 text-center text-sm font-bold text-white transition-colors hover:bg-primary-dark"
                  >
                    {assinaturaAtiva?.cd_plano === plano.cd_plano ? "Renovar" : "Assinar agora"}
                  </Link>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
