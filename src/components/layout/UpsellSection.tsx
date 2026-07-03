const BENEFICIOS = [
  "Sem anúncios",
  "Novidades toda semana",
  "Todos os conteúdos liberados",
  "Cancele quando quiser",
];

export default function UpsellSection() {
  return (
    <section className="relative mx-4 my-8 overflow-hidden rounded-2xl bg-gradient-to-br from-[#2a1152] via-[#3b1671] to-[#1a0836] px-6 py-12 text-center sm:mx-8 sm:py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.35),transparent_60%)]" />

      <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center">
        <span className="mb-4 text-5xl" aria-hidden>
          👑
        </span>

        <h2 className="text-2xl font-black text-foreground sm:text-4xl">
          Assine e assista tudo
        </h2>
        <p className="mt-2 text-base font-semibold text-primary sm:text-lg">
          Primeiro mês por <span className="text-foreground">R$ 20</span>
        </p>

        <ul className="mt-6 flex flex-col gap-2 text-sm text-secondary sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-6">
          {BENEFICIOS.map((beneficio) => (
            <li key={beneficio} className="flex items-center gap-2">
              <span className="text-primary">✓</span>
              {beneficio}
            </li>
          ))}
        </ul>

        <button
          type="button"
          className="mt-8 animate-pulse rounded-full bg-primary px-10 py-3.5 text-sm font-bold text-white shadow-[0_0_30px_rgba(139,92,246,0.6)] transition-colors hover:bg-primary-dark sm:text-base"
        >
          Assinar agora
        </button>
      </div>
    </section>
  );
}
