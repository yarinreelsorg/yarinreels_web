"use client";

import { useState } from "react";
import { ehUrlAvatar } from "@/lib/avatares";

export default function Avatar({
  valor,
  className,
}: {
  valor: string | null;
  className?: string;
}) {
  const [erroCarregamento, setErroCarregamento] = useState(false);

  if (valor && ehUrlAvatar(valor) && !erroCarregamento) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={valor}
        alt="Avatar"
        onError={() => setErroCarregamento(true)}
        className={`object-cover rounded-full ${className ?? ""}`}
      />
    );
  }
  return (
    <span className={`flex items-center justify-center font-bold text-[#A78BFA] ${className ?? ""}`}>
      {valor && !ehUrlAvatar(valor) ? valor : "👤"}
    </span>
  );
}
