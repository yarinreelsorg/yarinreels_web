"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Administrador, TpPapelAdmin } from "@/types/database";
import {
  alternarAtivoAdministrador,
  atualizarCarenciaAssinante,
  atualizarLogoSite,
  atualizarOrdemCategorias,
  atualizarPapelAdministrador,
  atualizarPercentualAfiliado,
  atualizarTaxaCartao,
  atualizarVideoSuporte,
  criarAdministrador,
  enviarLogoSite,
  renomearCategoriaAction,
} from "./actions";
import { buttonTap } from "@/lib/motion";
import { formatarDataHora } from "@/lib/data";
import { useFocoModal } from "@/components/admin/useFocoModal";
import { useToast } from "@/components/admin/ToastProvider";

export default function ConfiguracoesClient({
  administradores,
  cdAdministradorAtual,
  papelAtual,
  taxaCartaoInicial,
  categoriasOrdenadas,
  logoAtual,
  carenciaHorasInicial,
  videoSuporteInicial = "",
  percentualAfiliadoInicial,
}: {
  administradores: Administrador[];
  cdAdministradorAtual: string | null;
  papelAtual: TpPapelAdmin;
  taxaCartaoInicial: number;
  categoriasOrdenadas: { nm_categoria: string; visivel: boolean; exclusivaAssinantes: boolean }[];
  logoAtual: string;
  carenciaHorasInicial: number;
  videoSuporteInicial?: string;
  percentualAfiliadoInicial: number;
}) {
  const ehSuperAdmin = papelAtual === "SUPER_ADMIN";
  const toast = useToast();

  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [carregandoId, setCarregandoId] = useState<string | null>(null);
  const modalRef = useFocoModal<HTMLDivElement>(modalAberto, () => setModalAberto(false));

  const [taxaCartao, setTaxaCartao] = useState(String(taxaCartaoInicial));
  const [salvandoTaxa, setSalvandoTaxa] = useState(false);
  const [erroTaxa, setErroTaxa] = useState<string | null>(null);
  const [taxaSalva, setTaxaSalva] = useState(false);

  const [logoUrl, setLogoUrl] = useState(logoAtual);
  const [enviandoLogo, setEnviandoLogo] = useState(false);
  const [salvandoLogo, setSalvandoLogo] = useState(false);

  const [carenciaHoras, setCarenciaHoras] = useState(String(carenciaHorasInicial));
  const [salvandoCarencia, setSalvandoCarencia] = useState(false);
  const [carenciaSalva, setCarenciaSalva] = useState(false);

  const [videoSuporte, setVideoSuporte] = useState(videoSuporteInicial);
  const [salvandoVideoSuporte, setSalvandoVideoSuporte] = useState(false);

  const [percentualAfiliado, setPercentualAfiliado] = useState(String(percentualAfiliadoInicial));
  const [salvandoPercentualAfiliado, setSalvandoPercentualAfiliado] = useState(false);
  const [percentualAfiliadoSalvo, setPercentualAfiliadoSalvo] = useState(false);

  const aoSalvarPercentualAfiliado = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvandoPercentualAfiliado(true);
    setPercentualAfiliadoSalvo(false);
    try {
      await atualizarPercentualAfiliado(Number(percentualAfiliado));
      setPercentualAfiliadoSalvo(true);
      toast.sucesso("Percentual de comissão salvo.");
    } catch (err) {
      toast.erro(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSalvandoPercentualAfiliado(false);
    }
  };

  const aoSalvarVideoSuporte = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvandoVideoSuporte(true);
    try {
      await atualizarVideoSuporte(videoSuporte);
      toast.sucesso("Vídeo tutorial de suporte salvo com sucesso!");
    } catch (err) {
      toast.erro(err instanceof Error ? err.message : "Erro ao salvar vídeo de suporte.");
    } finally {
      setSalvandoVideoSuporte(false);
    }
  };

  const aoSalvarCarencia = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvandoCarencia(true);
    setCarenciaSalva(false);
    try {
      await atualizarCarenciaAssinante(Number(carenciaHoras));
      setCarenciaSalva(true);
      toast.sucesso("Janela de carência salva.");
    } catch (err) {
      toast.erro(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSalvandoCarencia(false);
    }
  };

  const aoEscolherLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    e.target.value = "";
    if (!arquivo) return;

    setEnviandoLogo(true);
    try {
      const formData = new FormData();
      formData.append("arquivo", arquivo);
      const url = await enviarLogoSite(formData);
      await atualizarLogoSite(url);
      setLogoUrl(url);
      toast.sucesso("Logo do site atualizada.");
    } catch (err) {
      toast.erro(err instanceof Error ? err.message : "Erro ao enviar a logo.");
    } finally {
      setEnviandoLogo(false);
    }
  };

  const aoSalvarLogoUrl = async () => {
    setSalvandoLogo(true);
    try {
      await atualizarLogoSite(logoUrl);
      toast.sucesso("Logo do site atualizada.");
    } catch (err) {
      toast.erro(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSalvandoLogo(false);
    }
  };

  const [categorias, setCategorias] = useState(categoriasOrdenadas);
  const [salvandoOrdem, setSalvandoOrdem] = useState(false);
  const [ordemSalva, setOrdemSalva] = useState(false);
  const [indiceArrastado, setIndiceArrastado] = useState<number | null>(null);
  const [indiceSobre, setIndiceSobre] = useState<number | null>(null);
  const [categoriaRenomeando, setCategoriaRenomeando] = useState<string | null>(null);
  const [novoNome, setNovoNome] = useState("");
  const [renomeando, setRenomeando] = useState(false);

  const moverCategoria = (indiceOrigem: number, indiceDestino: number) => {
    if (indiceDestino < 0 || indiceDestino >= categorias.length) return;
    if (indiceOrigem === indiceDestino) return;
    const proxima = [...categorias];
    const [removida] = proxima.splice(indiceOrigem, 1);
    proxima.splice(indiceDestino, 0, removida);
    setCategorias(proxima);
  };

  const aoSoltarArraste = (indiceDestino: number) => {
    if (indiceArrastado !== null) moverCategoria(indiceArrastado, indiceDestino);
    setIndiceArrastado(null);
    setIndiceSobre(null);
  };

  const alternarVisivel = (indice: number) => {
    setCategorias((atual) =>
      atual.map((c, i) => (i === indice ? { ...c, visivel: !c.visivel } : c))
    );
  };

  const alternarExclusivaAssinantes = (indice: number) => {
    setCategorias((atual) =>
      atual.map((c, i) =>
        i === indice ? { ...c, exclusivaAssinantes: !c.exclusivaAssinantes } : c
      )
    );
  };

  const iniciarRenomear = (nmCategoria: string) => {
    setCategoriaRenomeando(nmCategoria);
    setNovoNome(nmCategoria);
  };

  const confirmarRenomear = async () => {
    if (!categoriaRenomeando) return;
    const nomeLimpo = novoNome.trim();
    if (!nomeLimpo || nomeLimpo === categoriaRenomeando) {
      setCategoriaRenomeando(null);
      return;
    }
    setRenomeando(true);
    try {
      await renomearCategoriaAction(categoriaRenomeando, nomeLimpo);
      setCategorias((atual) =>
        atual.map((c) => (c.nm_categoria === categoriaRenomeando ? { ...c, nm_categoria: nomeLimpo } : c))
      );
      toast.sucesso("Categoria renomeada.");
      setCategoriaRenomeando(null);
    } catch (err) {
      toast.erro(err instanceof Error ? err.message : "Erro ao renomear.");
    } finally {
      setRenomeando(false);
    }
  };

  const aoSalvarOrdem = async () => {
    setSalvandoOrdem(true);
    setOrdemSalva(false);
    try {
      const ordem = categorias.filter((c) => c.visivel).map((c) => c.nm_categoria);
      const ocultas = categorias.filter((c) => !c.visivel).map((c) => c.nm_categoria);
      const exclusivas = categorias.filter((c) => c.exclusivaAssinantes).map((c) => c.nm_categoria);
      await atualizarOrdemCategorias(ordem, ocultas, exclusivas);
      toast.sucesso("Categorias salvas.");
      setOrdemSalva(true);
      setTimeout(() => setOrdemSalva(false), 2000);
    } catch (err) {
      toast.erro(err instanceof Error ? err.message : "Erro ao salvar a ordem.");
    } finally {
      setSalvandoOrdem(false);
    }
  };

  const aoSalvarTaxa = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSalvandoTaxa(true);
    setErroTaxa(null);
    setTaxaSalva(false);
    try {
      const formData = new FormData(e.currentTarget);
      await atualizarTaxaCartao(formData);
      toast.sucesso("Taxa de cartão atualizada.");
      setTaxaSalva(true);
      setTimeout(() => setTaxaSalva(false), 2000);
    } catch (err) {
      setErroTaxa(err instanceof Error ? err.message : "Erro ao salvar a taxa.");
    } finally {
      setSalvandoTaxa(false);
    }
  };

  const aoSubmeter = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      const formData = new FormData(e.currentTarget);
      await criarAdministrador(formData);
      toast.sucesso("Administrador criado.");
      setModalAberto(false);
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao criar administrador.");
    } finally {
      setSalvando(false);
    }
  };

  const aoAlternarAtivo = async (cd: string, ativo: boolean) => {
    setCarregandoId(cd);
    try {
      await alternarAtivoAdministrador(cd, ativo);
      toast.sucesso(ativo ? "Administrador ativado." : "Administrador desativado.");
    } catch (err) {
      toast.erro(err instanceof Error ? err.message : "Erro ao atualizar status.");
    } finally {
      setCarregandoId(null);
    }
  };

  const aoMudarPapel = async (cd: string, papel: TpPapelAdmin) => {
    setCarregandoId(cd);
    try {
      await atualizarPapelAdministrador(cd, papel);
      toast.sucesso("Papel atualizado.");
    } catch (err) {
      toast.erro(err instanceof Error ? err.message : "Erro ao atualizar papel.");
    } finally {
      setCarregandoId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Configurações</h1>
          <p className="text-sm text-[#A78BFA]">Gestão de administradores do painel.</p>
        </div>
        {ehSuperAdmin && (
          <motion.button
            type="button"
            onClick={() => setModalAberto(true)}
            {...buttonTap}
            className="rounded-md bg-[#7B2FBE] hover:bg-[#6D28D9] px-5 py-2.5 text-sm font-bold text-white transition-colors cursor-pointer flex items-center justify-center"
          >
            ＋ Novo Administrador
          </motion.button>
        )}
      </div>

      {!ehSuperAdmin && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-5 py-3 text-sm text-amber-400">
          Apenas super administradores podem criar, ativar/desativar ou alterar o papel de outros
          administradores.
        </div>
      )}

      <div className="rounded-lg border border-[rgba(139,92,246,0.15)] bg-[#0D0A1A] p-6 shadow-lg">
        <h2 className="text-lg font-bold text-white">Logo do Site</h2>
        <p className="mt-1 text-sm text-[#A78BFA]">
          Ícone mostrado ao lado do nome na navbar, em toda a plataforma.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#050208] border border-[rgba(139,92,246,0.15)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoUrl} alt="" className="h-full w-full object-cover" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">
              Link da imagem
            </label>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://..."
                className="w-64 bg-[#050208] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] p-2.5 text-white"
              />
              <motion.button
                type="button"
                onClick={aoSalvarLogoUrl}
                disabled={salvandoLogo}
                {...buttonTap}
                className="rounded-md bg-[#7B2FBE] hover:bg-[#6D28D9] disabled:opacity-50 px-4 text-sm font-bold text-white transition-colors cursor-pointer"
              >
                Salvar
              </motion.button>
              <label className="flex cursor-pointer items-center justify-center rounded-[6px] border border-[rgba(139,92,246,0.3)] bg-[#050208] px-3 text-xs font-bold text-[#A78BFA] hover:text-white hover:border-[#9D4EDD]">
                {enviandoLogo ? "..." : "Upload"}
                <input
                  type="file"
                  accept="image/*"
                  disabled={enviandoLogo}
                  onChange={aoEscolherLogo}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-[rgba(139,92,246,0.15)] bg-[#0D0A1A] p-6 shadow-lg">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          🎥 Vídeo Tutorial do Suporte / Vinculação
        </h2>
        <p className="mt-1 text-sm text-[#A78BFA]">
          Cole a URL de um vídeo (MP4, Bunny CDN, YouTube, Vimeo etc). Quando preenchido, o botão &quot;Pedir ajuda para o suporte&quot; abrirá um modal exibindo este vídeo explicativo e o botão para falar no Telegram. Se deixado em branco, o botão abrirá diretamente o Telegram @YarinTV.
        </p>
        <form onSubmit={aoSalvarVideoSuporte} className="mt-4 flex flex-col sm:flex-row items-start sm:items-end gap-3">
          <div className="flex-1 w-full">
            <label htmlFor="ds_url_video_suporte" className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">
              URL do Vídeo Explicativo
            </label>
            <input
              type="url"
              id="ds_url_video_suporte"
              placeholder="https://exemplo.com/tutorial-suporte.mp4"
              value={videoSuporte}
              onChange={(e) => setVideoSuporte(e.target.value)}
              disabled={!ehSuperAdmin}
              className="w-full bg-[#050208] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] p-2.5 text-white disabled:opacity-50 text-xs font-mono"
            />
          </div>
          {ehSuperAdmin && (
            <motion.button
              type="submit"
              disabled={salvandoVideoSuporte}
              {...buttonTap}
              className="rounded-md bg-[#7B2FBE] hover:bg-[#6D28D9] disabled:opacity-50 px-5 py-2.5 text-sm font-bold text-white transition-colors cursor-pointer shrink-0"
            >
              {salvandoVideoSuporte ? "Salvando..." : "Salvar Vídeo"}
            </motion.button>
          )}
        </form>
      </div>

      <div className="rounded-lg border border-[rgba(139,92,246,0.15)] bg-[#0D0A1A] p-6 shadow-lg">
        <h2 className="text-lg font-bold text-white">Pagamento com Cartão</h2>
        <p className="mt-1 text-sm text-[#A78BFA]">
          Taxa fixa adicional cobrada sobre o valor de qualquer compra paga com cartão.
        </p>
        <form onSubmit={aoSalvarTaxa} className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="vl_taxa_cartao" className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">
              Taxa (R$)
            </label>
            <input
              type="number"
              id="vl_taxa_cartao"
              name="vl_taxa_cartao"
              step="0.01"
              min="0"
              value={taxaCartao}
              onChange={(e) => setTaxaCartao(e.target.value)}
              disabled={!ehSuperAdmin}
              className="w-40 bg-[#050208] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] p-2.5 text-white disabled:opacity-50"
            />
          </div>
          {ehSuperAdmin && (
            <motion.button
              type="submit"
              disabled={salvandoTaxa}
              {...buttonTap}
              className="rounded-md bg-[#7B2FBE] hover:bg-[#6D28D9] disabled:opacity-50 px-5 py-2.5 text-sm font-bold text-white transition-colors cursor-pointer"
            >
              {salvandoTaxa ? "Salvando..." : taxaSalva ? "Salvo!" : "Salvar"}
            </motion.button>
          )}
          {erroTaxa && <p className="w-full text-sm text-red-400">{erroTaxa}</p>}
        </form>
      </div>

      <div className="rounded-lg border border-[rgba(139,92,246,0.15)] bg-[#0D0A1A] p-6 shadow-lg">
        <h2 className="text-lg font-bold text-white">Carência de Lançamento pra Assinantes</h2>
        <p className="mt-1 text-sm text-[#A78BFA]">
          Por quantas horas, a partir do lançamento, um título fica bloqueado pra quem só tem
          assinatura (sem comprar avulso) — evita que assinante grave e pirateie no dia do
          lançamento, e dá tempo de vender aluguel/vitalício antes. Compra avulsa (aluguel ou
          vitalício) nunca é afetada. Use 0 pra desativar.
        </p>
        <form onSubmit={aoSalvarCarencia} className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="nr_horas_carencia" className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">
              Horas de carência
            </label>
            <input
              type="number"
              id="nr_horas_carencia"
              name="nr_horas_carencia"
              step="1"
              min="0"
              value={carenciaHoras}
              onChange={(e) => setCarenciaHoras(e.target.value)}
              disabled={!ehSuperAdmin}
              className="w-40 bg-[#050208] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] p-2.5 text-white disabled:opacity-50"
            />
          </div>
          {ehSuperAdmin && (
            <motion.button
              type="submit"
              disabled={salvandoCarencia}
              {...buttonTap}
              className="rounded-md bg-[#7B2FBE] hover:bg-[#6D28D9] disabled:opacity-50 px-5 py-2.5 text-sm font-bold text-white transition-colors cursor-pointer"
            >
              {salvandoCarencia ? "Salvando..." : carenciaSalva ? "Salvo!" : "Salvar"}
            </motion.button>
          )}
        </form>
      </div>

      <div className="rounded-lg border border-[rgba(139,92,246,0.15)] bg-[#0D0A1A] p-6 shadow-lg">
        <h2 className="text-lg font-bold text-white">Programa de Indicação</h2>
        <p className="mt-1 text-sm text-[#A78BFA]">
          Percentual de comissão pago a quem indica novos clientes (calculado sobre o valor pago
          em cada compra/assinatura aprovada de quem se cadastrou pelo link do indicador). O
          pagamento ainda é manual — veja em{" "}
          <a href="/admin/afiliados" className="font-semibold text-[#9D4EDD] hover:underline">
            Afiliados
          </a>{" "}
          quem tem comissão pendente.
        </p>
        <form onSubmit={aoSalvarPercentualAfiliado} className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="vl_percentual_afiliado" className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">
              Percentual (%)
            </label>
            <input
              type="number"
              id="vl_percentual_afiliado"
              name="vl_percentual_afiliado"
              step="0.1"
              min="0"
              max="100"
              value={percentualAfiliado}
              onChange={(e) => setPercentualAfiliado(e.target.value)}
              disabled={!ehSuperAdmin}
              className="w-40 bg-[#050208] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] p-2.5 text-white disabled:opacity-50"
            />
          </div>
          {ehSuperAdmin && (
            <motion.button
              type="submit"
              disabled={salvandoPercentualAfiliado}
              {...buttonTap}
              className="rounded-md bg-[#7B2FBE] hover:bg-[#6D28D9] disabled:opacity-50 px-5 py-2.5 text-sm font-bold text-white transition-colors cursor-pointer"
            >
              {salvandoPercentualAfiliado ? "Salvando..." : percentualAfiliadoSalvo ? "Salvo!" : "Salvar"}
            </motion.button>
          )}
        </form>
      </div>

      <div className="rounded-lg border border-[rgba(139,92,246,0.15)] bg-[#0D0A1A] p-6 shadow-lg">
        <h2 className="text-lg font-bold text-white">Ordem das Categorias</h2>
        <p className="mt-1 text-sm text-[#A78BFA]">
          Arraste pra reordenar (ou use as setas), clique no olho pra ocultar da home/catálogo, no
          cadeado pra deixar visível só pra quem assina, ou no lápis pra renomear (renomeia em
          todo o catálogo e nos planos). Sem configuração, usa a ordem padrão (Americanas,
          Brasileiras, +18, resto em ordem alfabética).
        </p>

        {categorias.length === 0 ? (
          <p className="mt-4 text-sm text-[#A78BFA]">Nenhuma categoria cadastrada ainda.</p>
        ) : (
          <div className="mt-4 flex flex-col gap-1.5">
            {categorias.map((categoria, indice) => (
              <div
                key={categoria.nm_categoria}
                draggable
                onDragStart={() => setIndiceArrastado(indice)}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (indiceSobre !== indice) setIndiceSobre(indice);
                }}
                onDragEnd={() => {
                  setIndiceArrastado(null);
                  setIndiceSobre(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  aoSoltarArraste(indice);
                }}
                className={`flex cursor-grab items-center justify-between gap-3 rounded-md border bg-[#050208] px-4 py-2.5 transition-colors active:cursor-grabbing ${
                  indiceSobre === indice
                    ? "border-[#9D4EDD]"
                    : "border-[rgba(139,92,246,0.15)]"
                } ${indiceArrastado === indice ? "opacity-40" : ""} ${
                  !categoria.visivel ? "opacity-50" : ""
                }`}
              >
                {categoriaRenomeando === categoria.nm_categoria ? (
                  <div className="flex flex-1 items-center gap-2">
                    <input
                      type="text"
                      value={novoNome}
                      onChange={(e) => setNovoNome(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && confirmarRenomear()}
                      autoFocus
                      className="flex-1 bg-[#0D0A1A] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] px-3 py-1.5 text-sm text-white"
                    />
                    <button
                      type="button"
                      disabled={renomeando}
                      onClick={confirmarRenomear}
                      className="text-xs font-bold text-emerald-400 hover:text-emerald-300 disabled:opacity-50"
                    >
                      Salvar
                    </button>
                    <button
                      type="button"
                      onClick={() => setCategoriaRenomeando(null)}
                      className="text-xs font-bold text-[#A78BFA] hover:text-white"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <span className="flex items-center gap-2 text-sm text-white">
                    <span className="text-[#A78BFA]/60 select-none">⠿</span>
                    <span className="text-[#A78BFA]">{indice + 1}.</span>
                    {categoria.nm_categoria}
                    {!categoria.visivel && (
                      <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase text-[#A78BFA]">
                        Oculta
                      </span>
                    )}
                    {categoria.exclusivaAssinantes && (
                      <span className="rounded bg-[#7B2FBE]/25 px-1.5 py-0.5 text-[10px] uppercase text-[#C9A6FF]">
                        Só assinantes
                      </span>
                    )}
                  </span>
                )}
                <div className="flex shrink-0 items-center gap-1">
                  {categoriaRenomeando !== categoria.nm_categoria && (
                    <button
                      type="button"
                      onClick={() => iniciarRenomear(categoria.nm_categoria)}
                      aria-label="Renomear"
                      className="flex h-7 w-7 items-center justify-center rounded-md text-[#A78BFA] hover:text-white hover:bg-white/5 cursor-pointer"
                    >
                      ✎
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => alternarExclusivaAssinantes(indice)}
                    aria-label={
                      categoria.exclusivaAssinantes
                        ? "Tornar visível pra todo mundo"
                        : "Tornar exclusiva pra assinantes"
                    }
                    title="Exclusiva pra assinantes"
                    className={`flex h-7 w-7 items-center justify-center rounded-md hover:bg-white/5 cursor-pointer ${
                      categoria.exclusivaAssinantes ? "text-[#C9A6FF]" : "text-[#A78BFA] hover:text-white"
                    }`}
                  >
                    🔒
                  </button>
                  <button
                    type="button"
                    onClick={() => alternarVisivel(indice)}
                    aria-label={categoria.visivel ? "Ocultar categoria" : "Mostrar categoria"}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-[#A78BFA] hover:text-white hover:bg-white/5 cursor-pointer"
                  >
                    {categoria.visivel ? "👁" : "🚫"}
                  </button>
                  <button
                    type="button"
                    onClick={() => moverCategoria(indice, indice - 1)}
                    disabled={indice === 0}
                    aria-label="Mover pra cima"
                    className="flex h-7 w-7 items-center justify-center rounded-md text-[#A78BFA] hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moverCategoria(indice, indice + 1)}
                    disabled={indice === categorias.length - 1}
                    aria-label="Mover pra baixo"
                    className="flex h-7 w-7 items-center justify-center rounded-md text-[#A78BFA] hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                  >
                    ↓
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <motion.button
          type="button"
          onClick={aoSalvarOrdem}
          disabled={salvandoOrdem || categorias.length === 0}
          {...buttonTap}
          className="mt-4 rounded-md bg-[#7B2FBE] hover:bg-[#6D28D9] disabled:opacity-50 px-5 py-2.5 text-sm font-bold text-white transition-colors cursor-pointer"
        >
          {salvandoOrdem ? "Salvando..." : ordemSalva ? "Salvo!" : "Salvar ordem"}
        </motion.button>
      </div>

      <div className="rounded-lg border border-[rgba(139,92,246,0.15)] bg-[#0D0A1A] overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[rgba(139,92,246,0.15)] bg-[#050208]/50 text-xs font-semibold text-[#A78BFA] uppercase tracking-wider">
                <th className="px-6 py-3">Nome</th>
                <th className="px-6 py-3">E-mail</th>
                <th className="px-6 py-3">Papel</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Último Login</th>
                {ehSuperAdmin && <th className="px-6 py-3 text-right">Ações</th>}
              </tr>
            </thead>
            <motion.tbody
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.05 } } }}
              className="divide-y divide-[rgba(139,92,246,0.15)] text-sm text-white"
            >
              {administradores.map((admin) => {
                const ehVoce = admin.cd_administrador === cdAdministradorAtual;
                const ocupado = carregandoId === admin.cd_administrador;

                return (
                  <motion.tr
                    key={admin.cd_administrador}
                    variants={{
                      hidden: { opacity: 0, y: 12 },
                      show: { opacity: 1, y: 0 },
                    }}
                    className="hover:bg-[rgba(139,92,246,0.05)] transition-colors"
                  >
                    <td className="px-6 py-4 font-semibold">
                      {admin.nm_nome}
                      {ehVoce && (
                        <span className="ml-2 rounded-full bg-[#7B2FBE]/20 px-2 py-0.5 text-[10px] font-bold text-[#A78BFA]">
                          Você
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-[#A78BFA]">{admin.nm_email}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-semibold ${
                          admin.tp_papel === "SUPER_ADMIN"
                            ? "bg-[#7B2FBE]/20 text-[#A78BFA] border border-[#7B2FBE]/30"
                            : "bg-[#050208] text-[#A78BFA]/80 border border-[rgba(139,92,246,0.2)]"
                        }`}
                      >
                        {admin.tp_papel === "SUPER_ADMIN" ? "Super Admin" : "Admin"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {admin.sn_ativo ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/20">
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-400 border border-red-500/20">
                          Inativo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-[#A78BFA]/80">
                      {admin.ts_ultimo_login
                        ? formatarDataHora(admin.ts_ultimo_login, {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Nunca"}
                    </td>
                    {ehSuperAdmin && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <select
                            value={admin.tp_papel}
                            disabled={ocupado}
                            onChange={(e) =>
                              aoMudarPapel(admin.cd_administrador, e.target.value as TpPapelAdmin)
                            }
                            className="rounded border border-[rgba(139,92,246,0.3)] bg-[#050208] px-2 py-1 text-xs text-white disabled:opacity-50"
                          >
                            <option value="ADMIN">Admin</option>
                            <option value="SUPER_ADMIN">Super Admin</option>
                          </select>
                          <button
                            type="button"
                            disabled={ehVoce || ocupado}
                            onClick={() => aoAlternarAtivo(admin.cd_administrador, !admin.sn_ativo)}
                            className={`rounded px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                              admin.sn_ativo
                                ? "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
                                : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                            }`}
                          >
                            {admin.sn_ativo ? "Desativar" : "Ativar"}
                          </button>
                        </div>
                      </td>
                    )}
                  </motion.tr>
                );
              })}
            </motion.tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {modalAberto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-[8px] p-4"
          >
            <motion.div
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="novo-admin-titulo"
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="relative w-full max-w-md rounded-lg border border-[rgba(139,92,246,0.2)] bg-[#0D0A1A] p-6 shadow-2xl"
            >
              <div className="mb-6 flex items-center justify-between border-b border-[rgba(139,92,246,0.15)] pb-4">
                <h2 id="novo-admin-titulo" className="text-xl font-bold text-white">Novo Administrador</h2>
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="text-[#A78BFA] hover:text-white text-2xl transition-colors cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={aoSubmeter} className="flex flex-col gap-4">
                <div>
                  <label htmlFor="nm_nome" className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">
                    Nome
                  </label>
                  <input
                    type="text"
                    id="nm_nome"
                    name="nm_nome"
                    required
                    className="w-full bg-[#050208] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] p-2.5 text-white"
                  />
                </div>

                <div>
                  <label htmlFor="nm_email" className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    id="nm_email"
                    name="nm_email"
                    required
                    className="w-full bg-[#050208] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] p-2.5 text-white"
                  />
                </div>

                <div>
                  <label htmlFor="senha" className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">
                    Senha
                  </label>
                  <input
                    type="password"
                    id="senha"
                    name="senha"
                    required
                    minLength={8}
                    placeholder="mínimo 8 caracteres"
                    className="w-full bg-[#050208] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] p-2.5 text-white"
                  />
                </div>

                <div>
                  <label htmlFor="tp_papel" className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">
                    Papel
                  </label>
                  <select
                    id="tp_papel"
                    name="tp_papel"
                    defaultValue="ADMIN"
                    className="w-full bg-[#050208] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] p-2.5 text-white"
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>

                {erro && <p className="text-sm text-red-400">{erro}</p>}

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[rgba(139,92,246,0.15)] mt-2">
                  <button
                    type="button"
                    onClick={() => setModalAberto(false)}
                    className="rounded-md border border-[rgba(255,255,255,0.2)] hover:bg-white/5 px-6 py-2.5 text-sm font-bold text-white transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={salvando}
                    className="rounded-md bg-[#7B2FBE] hover:bg-[#6D28D9] disabled:opacity-50 px-6 py-2.5 text-sm font-bold text-white transition-colors cursor-pointer"
                  >
                    {salvando ? "Criando..." : "Criar"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
