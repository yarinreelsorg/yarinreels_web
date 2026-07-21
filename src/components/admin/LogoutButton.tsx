"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { logoutAdmin } from "@/app/admin/login/actions";

export default function LogoutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function sair() {
    startTransition(async () => {
      await logoutAdmin();
      router.push("/admin/login");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={sair}
      disabled={pending}
      className="text-xs text-[#A78BFA] hover:underline hover:text-white disabled:opacity-60"
    >
      {pending ? "Saindo..." : "Sair"}
    </button>
  );
}
