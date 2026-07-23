"use client";

import { useState } from "react";
import IniciarCheckoutConteudo from "./IniciarCheckoutConteudo";
import IniciarCheckoutPlano from "./IniciarCheckoutPlano";
import CheckoutCartao from "./CheckoutCartao";
import {
  iniciarCheckoutCartaoConteudo,
  iniciarCheckoutCartaoPlano,
} from "@/app/(public)/checkout/actions";

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
