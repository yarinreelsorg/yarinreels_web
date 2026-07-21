"use client";

import { useActionState } from "react";
import { motion } from "motion/react";
import { loginAdmin } from "./actions";

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(loginAdmin, {});

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050208] px-4">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 26 }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 text-center text-xl font-black tracking-wider text-white">
          Yarin<span className="text-[#9D4EDD]">Reels</span>{" "}
          <span className="ml-1 rounded bg-[#7B2FBE] px-1.5 py-0.5 text-xs font-bold uppercase text-white">
            Admin
          </span>
        </div>

        <motion.form
          action={formAction}
          animate={state.erro ? { x: [0, -8, 8, -6, 6, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="flex flex-col gap-4 rounded-lg border border-[rgba(139,92,246,0.15)] bg-[#0D0A1A] p-8 shadow-lg"
        >
          <h1 className="text-lg font-bold text-white">Entrar</h1>

          <label className="flex flex-col gap-1.5 text-sm text-[#A78BFA]">
            E-mail
            <input
              type="email"
              name="email"
              required
              placeholder="admin@yarinreels.com"
              className="rounded-md border border-[rgba(139,92,246,0.25)] bg-[#050208] px-4 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-white/20 focus:border-[#9D4EDD]"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm text-[#A78BFA]">
            Senha
            <input
              type="password"
              name="senha"
              required
              placeholder="••••••••"
              className="rounded-md border border-[rgba(139,92,246,0.25)] bg-[#050208] px-4 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-white/20 focus:border-[#9D4EDD]"
            />
          </label>

          {state.erro && <p className="text-sm text-red-400">{state.erro}</p>}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 rounded-md bg-[#7B2FBE] py-3 text-sm font-bold text-white transition-colors hover:bg-[#9D4EDD] disabled:opacity-60"
          >
            {pending ? "Entrando..." : "Entrar"}
          </button>
        </motion.form>
      </motion.div>
    </div>
  );
}
