export default function Estrelas({ rating }: { rating: number }) {
  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`${rating} de 5 estrelas`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          className={`h-3 w-3 ${
            i + 1 <= Math.round(rating) ? "fill-primary" : "fill-white/20"
          }`}
        >
          <path d="M10 1l2.6 5.9 6.4.6-4.8 4.3 1.4 6.2L10 15l-5.6 3 1.4-6.2L1 9l6.4-.6z" />
        </svg>
      ))}
    </div>
  );
}
