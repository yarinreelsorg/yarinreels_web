import { ehUrlAvatar } from "@/lib/avatares";

export default function Avatar({
  valor,
  className,
}: {
  valor: string | null;
  className?: string;
}) {
  if (valor && ehUrlAvatar(valor)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={valor} alt="" className={`object-cover ${className ?? ""}`} />
    );
  }
  return <span className={className}>{valor ?? "🙂"}</span>;
}
