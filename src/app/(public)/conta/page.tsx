import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessaoUsuario } from "@/lib/user-auth";
import { pool } from "@/lib/db";
import Navbar from "@/components/layout/Navbar";
import VincularTelegram from "@/components/conta/VincularTelegram";
import SeletorAvatar from "@/components/conta/SeletorAvatar";
import BotaoInstalarApp from "@/components/conta/BotaoInstalarApp";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ContaPage() {
  const sessao = await getSessaoUsuario();
  if (!sessao) redirect("/login");

  const { rows } = await pool.query<{ ds_avatar: string | null }>(
    'SELECT ds_avatar FROM "USUARIOS" WHERE cd_usuario = $1 LIMIT 1',
    [sessao.cd_usuario]
  );
  const avatarAtual = rows[0]?.ds_avatar ?? null;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar categorias={[]} />

      <section className="mx-auto w-full max-w-2xl px-4 pb-16 pt-6 sm:px-8">
        <h1 className="text-2xl font-black text-foreground sm:text-3xl">Minha Conta</h1>

        <div className="mt-6 flex items-center gap-4 rounded-lg border border-border bg-surface p-6">
          <SeletorAvatar avatarAtual={avatarAtual} />
          <div>
            {sessao.nm_nome && <p className="text-lg font-bold text-foreground">{sessao.nm_nome}</p>}
            <p className="text-sm text-secondary">{sessao.nm_email}</p>
          </div>
        </div>

        <h2 className="mt-8 text-sm font-bold uppercase tracking-wide text-secondary">
          Conta do Telegram
        </h2>
        <div className="mt-3">
          <VincularTelegram nrIdTelegramInicial={sessao.nr_id_telegram} />
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/conta/assinatura"
            className="rounded-md border border-border px-5 py-2.5 text-sm font-bold text-foreground transition-colors hover:border-foreground/40"
          >
            Minha assinatura
          </Link>
          <Link
            href="/minha-lista"
            className="rounded-md border border-border px-5 py-2.5 text-sm font-bold text-foreground transition-colors hover:border-foreground/40"
          >
            Minha lista
          </Link>

          <BotaoInstalarApp />
        </div>
      </section>
    </div>
  );
}
