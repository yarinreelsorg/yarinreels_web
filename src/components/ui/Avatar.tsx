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
      <img
        src={valor}
        alt="Avatar"
        className={`object-cover rounded-full ${className ?? ""}`}
      />
    );
  }
  return (
    <span className={`flex items-center justify-center font-bold text-[#A78BFA] ${className ?? ""}`}>
      {valor || "👤"}
    </span>
  );
}
