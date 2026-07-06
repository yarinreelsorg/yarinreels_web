const BENEFICIOS = [
  "Sem anúncios",
  "Novidades toda semana",
  "Todos os conteúdos liberados",
  "Cancele quando quiser",
];

export default function UpsellSection() {
  return (
    <section className="my-10 border-y border-primary/30 bg-surface px-6 py-14 sm:px-8 sm:py-20">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-12 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex max-w-lg flex-col items-start text-left">
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Assista tudo, sem limites
          </h2>
          <p className="mt-3 text-base font-semibold text-accent sm:text-lg">
            Primeiro mês por <span className="text-foreground">R$ 20</span>
          </p>

          <ul className="mt-6 flex flex-col gap-3 text-sm text-secondary sm:text-base">
            {BENEFICIOS.map((beneficio) => (
              <li key={beneficio} className="flex items-center gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs text-accent">
                  ✓
                </span>
                {beneficio}
              </li>
            ))}
          </ul>

          <button
            type="button"
            className="animate-pulse-soft mt-9 rounded-md bg-primary px-10 py-3.5 text-sm font-bold text-white transition-colors hover:bg-primary-dark sm:text-base"
          >
            Começar agora
          </button>
        </div>

        <div className="relative hidden h-64 w-72 shrink-0 lg:block">
          <div className="absolute left-0 top-6 h-56 w-40 rotate-[-10deg] rounded-lg bg-gradient-to-br from-[#1a1230] to-[#0d0a1a] shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-white/[0.08]" />
          <div className="absolute left-1/2 top-0 h-56 w-40 -translate-x-1/2 rounded-lg bg-gradient-to-br from-[#241638] to-[#0d0a1a] shadow-[0_25px_60px_rgba(0,0,0,0.6)] ring-1 ring-white/[0.08]" />
          <div className="absolute right-0 top-6 h-56 w-40 rotate-[10deg] rounded-lg bg-gradient-to-br from-[#1a1230] to-[#0d0a1a] shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-white/[0.08]" />
        </div>
      </div>
    </section>
  );
}
