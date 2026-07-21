import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import VincularTelegram from "@/components/conta/VincularTelegram";

export default async function ContaPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const nome =
    typeof user.user_metadata?.nome === "string" ? user.user_metadata.nome : null;
  const nrIdTelegram =
    typeof user.user_metadata?.nr_id_telegram === "number"
      ? (user.user_metadata.nr_id_telegram as number)
      : null;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar categorias={[]} />

      <section className="mx-auto w-full max-w-2xl px-4 pb-16 pt-28 sm:px-8">
        <h1 className="text-2xl font-black text-foreground sm:text-3xl">Minha Conta</h1>

        <div className="mt-6 rounded-lg border border-border bg-surface p-6">
          {nome && <p className="text-lg font-bold text-foreground">{nome}</p>}
          <p className="text-sm text-secondary">{user.email}</p>
        </div>

        <h2 className="mt-8 text-sm font-bold uppercase tracking-wide text-secondary">
          Conta do Telegram
        </h2>
        <div className="mt-3">
          <VincularTelegram nrIdTelegramInicial={nrIdTelegram} />
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
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
        </div>
      </section>
    </div>
  );
}
