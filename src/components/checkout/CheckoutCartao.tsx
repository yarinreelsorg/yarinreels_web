"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { tokenizarCartao } from "@/lib/efi/tokenizacao";
import { buttonTap } from "@/lib/motion";
import { formatarPreco } from "@/lib/catalogo";
import type { DadosClienteCartao } from "@/app/(public)/checkout/actions";

export default function CheckoutCartao({
  titulo,
  valorBase,
  taxaCartao,
  hrefSucesso,
  aoConfirmar,
}: {
  titulo: string;
  valorBase: number;
  taxaCartao: number;
  hrefSucesso: string;
  aoConfirmar: (
    paymentToken: string,
    cliente: DadosClienteCartao,
    installments: number
  ) => Promise<{ status: "APROVADO" | "RECUSADO" | "PROCESSANDO"; motivoRecusa?: string }>;
}) {
  const [numero, setNumero] = useState("");
  const [nome, setNome] = useState("");
  const [validade, setValidade] = useState("");
  const [cvv, setCvv] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [parcelas, setParcelas] = useState(1);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<"APROVADO" | "PROCESSANDO" | null>(null);

  const total = valorBase + taxaCartao;

  const aoSubmeter = async (e: FormEvent) => {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    try {
      const [mes, anoDigitado] = validade.split("/").map((v) => v.trim());
      const ano = anoDigitado?.length === 2 ? `20${anoDigitado}` : anoDigitado;
      const paymentToken = await tokenizarCartao({
        numero: numero.replace(/\s/g, ""),
        nome,
        cpf,
        validadeMes: mes ?? "",
        validadeAno: ano ?? "",
        cvv,
      });

      const resposta = await aoConfirmar(paymentToken, { email, nome, cpf, telefone }, parcelas);

      if (resposta.status === "RECUSADO") {
        setErro(resposta.motivoRecusa ?? "Pagamento recusado. Tente outro cartão.");
        return;
      }

      setResultado(resposta.status);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao processar o pagamento.");
    } finally {
      setCarregando(false);
    }
  };

  if (resultado === "APROVADO") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-8 text-center"
      >
        <span className="text-5xl">✅</span>
        <h2 className="text-xl font-black text-foreground">Pagamento aprovado!</h2>
        <p className="text-sm text-secondary">Seu acesso a &quot;{titulo}&quot; já está liberado.</p>
        <Link
          href={hrefSucesso}
          className="mt-2 rounded-md bg-primary px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
        >
          Continuar
        </Link>
      </motion.div>
    );
  }

  if (resultado === "PROCESSANDO") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-8 text-center"
      >
        <span className="text-5xl">⏳</span>
        <h2 className="text-xl font-black text-foreground">Pagamento em processamento</h2>
        <p className="text-sm text-secondary">
          A operadora do cartão ainda está confirmando. Assim que for aprovado, o acesso a
          &quot;{titulo}&quot; é liberado automaticamente — confira em Minha Lista.
        </p>
        <Link
          href="/minha-lista"
          className="mt-2 rounded-md bg-primary px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
        >
          Ver Minha Lista
        </Link>
      </motion.div>
    );
  }

  return (
    <form
      onSubmit={aoSubmeter}
      className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-6 sm:p-8"
    >
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-secondary">Cartão</p>
        <h2 className="mt-1 text-lg font-bold text-foreground">{titulo}</h2>
        <p className="mt-1 text-2xl font-black text-primary">{formatarPreco(total)}</p>
        {taxaCartao > 0 && (
          <p className="text-xs text-secondary">
            {formatarPreco(valorBase)} + taxa de {formatarPreco(taxaCartao)}
          </p>
        )}
      </div>

      <label className="flex flex-col gap-1.5 text-sm text-secondary">
        Número do cartão
        <input
          type="text"
          inputMode="numeric"
          required
          value={numero}
          onChange={(e) => setNumero(e.target.value)}
          placeholder="0000 0000 0000 0000"
          className="rounded-md border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-accent/50"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm text-secondary">
        Nome impresso no cartão
        <input
          type="text"
          required
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="rounded-md border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-accent/50"
        />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5 text-sm text-secondary">
          Validade (MM/AA)
          <input
            type="text"
            required
            value={validade}
            onChange={(e) => setValidade(e.target.value)}
            placeholder="12/28"
            className="rounded-md border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-accent/50"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm text-secondary">
          CVV
          <input
            type="text"
            inputMode="numeric"
            required
            value={cvv}
            onChange={(e) => setCvv(e.target.value)}
            placeholder="123"
            className="rounded-md border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-accent/50"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5 text-sm text-secondary">
          E-mail
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-md border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-accent/50"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm text-secondary">
          CPF
          <input
            type="text"
            inputMode="numeric"
            required
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
            placeholder="000.000.000-00"
            className="rounded-md border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-accent/50"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5 text-sm text-secondary">
        Telefone
        <input
          type="tel"
          inputMode="tel"
          required
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          placeholder="(11) 91234-5678"
          className="rounded-md border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-accent/50"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm text-secondary">
        Parcelas
        <select
          value={parcelas}
          onChange={(e) => setParcelas(Number(e.target.value))}
          className="rounded-md border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-accent/50"
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n} className="bg-background">
              {n}x de {formatarPreco(total / n)}
            </option>
          ))}
        </select>
      </label>

      {erro && <p className="text-sm text-red-400">{erro}</p>}

      <motion.button
        type="submit"
        disabled={carregando}
        {...buttonTap}
        className="mt-1 rounded-md bg-primary py-3 text-sm font-bold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
      >
        {carregando ? "Processando..." : `Pagar ${formatarPreco(total)}`}
      </motion.button>
    </form>
  );
}
