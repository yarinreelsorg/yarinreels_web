function escaparCampoCsv(valor: unknown): string {
  const texto = valor === null || valor === undefined ? "" : String(valor);
  if (/[";\n]/.test(texto)) {
    return `"${texto.replace(/"/g, '""')}"`;
  }
  return texto;
}

export function paraCsv<T extends Record<string, unknown>>(
  linhas: T[],
  colunas: { chave: keyof T; rotulo: string }[]
): string {
  const cabecalho = colunas.map((c) => escaparCampoCsv(c.rotulo)).join(";");
  const corpo = linhas.map((linha) =>
    colunas.map((c) => escaparCampoCsv(linha[c.chave])).join(";")
  );
  return [cabecalho, ...corpo].join("\n");
}

export function baixarCsv(conteudo: string, nomeArquivo: string) {
  const blob = new Blob(["﻿" + conteudo], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
