"use client";

import { useState } from "react";
import Link from "next/link";
import IniciarCheckoutConteudo from "./IniciarCheckoutConteudo";
import IniciarCheckoutPlano from "./IniciarCheckoutPlano";
import CheckoutCartao from "./CheckoutCartao";
import {
  iniciarCheckoutCartaoConteudo,
  iniciarCheckoutCartaoPlano,
  registrarConsentimentoTermos,
} from "@/app/(public)/checkout/actions";
import { formatarPreco } from "@/lib/catalogo";

type Metodo = "pix" | "cartao";

function SeletorMetodo({ metodo, onChange }: { metodo: Metodo; onChange: (m: Metodo) => void }) {
  return (
    <div className="mb-6 flex rounded-md border border-border bg-background p-1 text-sm font-medium">
      <button
        type="button"
        onClick={() => onChange("pix")}
        className={`flex-1 rounded-md py-2 transition-colors ${
          metodo === "pix" ? "bg-primary text-white" : "text-secondary hover:text-foreground"
        }`}
      >
        Pix
      </button>
      <button
        type="button"
        onClick={() => onChange("cartao")}
        className={`flex-1 rounded-md py-2 transition-colors ${
          metodo === "cartao" ? "bg-primary text-white" : "text-secondary hover:text-foreground"
        }`}
      >
        Cartão
      </button>
    </div>
  );
}

function AceiteTermos({
  titulo,
  valorFormatado,
  contexto,
  aoAceitar,
}: {
  titulo: string;
  valorFormatado: string;
  contexto: string;
  aoAceitar: () => void;
}) {
  const [marcado, setMarcado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function confirmar() {
    setEnviando(true);
    setErro(null);
    try {
      await registrarConsentimentoTermos(contexto);
      aoAceitar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao registrar aceite. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-6 sm:p-8">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-secondary">Antes de pagar</p>
        <h2 className="mt-1 text-lg font-bold text-foreground">{titulo}</h2>
        <p className="mt-1 text-2xl font-black text-primary">{valorFormatado}</p>
      </div>

      <label className="flex items-start gap-2.5 text-sm text-secondary">
        <input
          type="checkbox"
          checked={marcado}
          onChange={(e) => setMarcado(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
        />
        <span>
          Li e aceito os{" "}
          <Link href="/termos" target="_blank" className="font-semibold text-primary hover:underline">
            Termos de Uso e a Política de Reembolso
          </Link>
          . Estou ciente de que, por se tratar de conteúdo digital de acesso imediato, não há
          reembolso após o consumo do produto.
        </span>
      </label>

      {erro && <p className="text-sm text-red-400">{erro}</p>}

      <button
        type="button"
        disabled={!marcado || enviando}
        onClick={confirmar}
        className="rounded-md bg-primary py-3 text-sm font-bold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
      >
        {enviando ? "Confirmando..." : "Continuar"}
      </button>
    </div>
  );
}

export function MetodoPagamentoConteudo({
  cdConteudo,
  tipo,
  titulo,
  valor,
  taxaCartao,
}: {
  cdConteudo: string;
  tipo: "ALUGUEL" | "VITALICIO";
  titulo: string;
  valor: number;
  taxaCartao: number;
}) {
  const [metodo, setMetodo] = useState<Metodo>("pix");
  const [termosAceitos, setTermosAceitos] = useState(false);

  if (!termosAceitos) {
    return (
      <AceiteTermos
        titulo={titulo}
        valorFormatado={formatarPreco(valor) ?? ""}
        contexto={`conteudo:${cdConteudo}:${tipo}`}
        aoAceitar={() => setTermosAceitos(true)}
      />
    );
  }

  return (
    <div>
      <SeletorMetodo metodo={metodo} onChange={setMetodo} />
      {metodo === "pix" ? (
        <IniciarCheckoutConteudo cdConteudo={cdConteudo} tipo={tipo} titulo={titulo} valor={valor} />
      ) : (
        <CheckoutCartao
          titulo={titulo}
          valorBase={valor}
          taxaCartao={taxaCartao}
          hrefSucesso={`/assistir/${cdConteudo}`}
          aoConfirmar={(paymentToken, cliente, installments) =>
            iniciarCheckoutCartaoConteudo(cdConteudo, tipo, paymentToken, cliente, installments)
          }
        />
      )}
    </div>
  );
}

export function MetodoPagamentoPlano({
  cdPlano,
  titulo,
  valor,
  taxaCartao,
}: {
  cdPlano: string;
  titulo: string;
  valor: number;
  taxaCartao: number;
}) {
  const [metodo, setMetodo] = useState<Metodo>("pix");
  const [termosAceitos, setTermosAceitos] = useState(false);

  if (!termosAceitos) {
    return (
      <AceiteTermos
        titulo={titulo}
        valorFormatado={formatarPreco(valor) ?? ""}
        contexto={`plano:${cdPlano}`}
        aoAceitar={() => setTermosAceitos(true)}
      />
    );
  }

  return (
    <div>
      <SeletorMetodo metodo={metodo} onChange={setMetodo} />
      {metodo === "pix" ? (
        <IniciarCheckoutPlano cdPlano={cdPlano} titulo={titulo} valor={valor} />
      ) : (
        <CheckoutCartao
          titulo={titulo}
          valorBase={valor}
          taxaCartao={taxaCartao}
          hrefSucesso="/minha-lista"
          aoConfirmar={(paymentToken, cliente, installments) =>
            iniciarCheckoutCartaoPlano(cdPlano, paymentToken, cliente, installments)
          }
        />
      )}
    </div>
  );
}
