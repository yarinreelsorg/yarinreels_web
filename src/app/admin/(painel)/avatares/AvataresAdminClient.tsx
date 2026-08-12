"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useToast } from "@/components/admin/ToastProvider";
import { StaggerGroup, StaggerItem } from "@/components/motion/Stagger";
import Reveal from "@/components/motion/Reveal";
import Avatar from "@/components/ui/Avatar";
import {
  alternarStatusAvatarAdmin,
  excluirAvatarAdmin,
  salvarAvatarAdmin,
  type AvatarAdmin,
} from "./actions";

const CATEGORIAS_PADRAO = [
  "🎬 Séries & Atores",
  "🐉 Animes & Animações",
  "💖 Doramas & K-Dramas",
  "🦸‍♂️ Heróis & Vilões",
  "✨ Personalizados",
];

export default function AvataresAdminClient({
  avataresIniciais,
}: {
  avataresIniciais: AvatarAdmin[];
}) {
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  const [avatares, setAvatares] = useState<AvatarAdmin[]>(avataresIniciais);
  const [busca, setBusca] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("TODAS");

  const [modalAberto, setModalAberto] = useState(false);
  const [avatarEditando, setAvatarEditando] = useState<AvatarAdmin | null>(null);

  // Form State
  const [nomeForm, setNomeForm] = useState("");
  const [categoriaForm, setCategoriaForm] = useState(CATEGORIAS_PADRAO[0]);
  const [urlFotoForm, setUrlFotoForm] = useState("");
  const [ordemForm, setOrdemForm] = useState("0");
  const [ativoForm, setAtivoForm] = useState(true);
  const [tipoFonte, setTipoFonte] = useState<"file" | "url">("file");
  const [arquivoForm, setArquivoForm] = useState<File | null>(null);
  const [previewLocal, setPreviewLocal] = useState<string | null>(null);

  const abrirModalNovo = () => {
    setAvatarEditando(null);
    setNomeForm("");
    setCategoriaForm(CATEGORIAS_PADRAO[0]);
    setUrlFotoForm("");
    setOrdemForm("0");
    setAtivoForm(true);
    setTipoFonte("file");
    setArquivoForm(null);
    setPreviewLocal(null);
    setModalAberto(true);
  };

  const abrirModalEditar = (av: AvatarAdmin) => {
    setAvatarEditando(av);
    setNomeForm(av.nm_avatar);
    setCategoriaForm(av.nm_categoria);
    setUrlFotoForm(av.ds_url_foto);
    setOrdemForm(String(av.nr_ordem));
    setAtivoForm(av.fl_ativo);
    setTipoFonte("url");
    setArquivoForm(null);
    setPreviewLocal(av.ds_url_foto);
    setModalAberto(true);
  };

  const aoSelecionarArquivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setArquivoForm(file);
      setPreviewLocal(URL.createObjectURL(file));
    }
  };

  const aoSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeForm.trim()) {
      toast.erro("Informe o nome do avatar.");
      return;
    }

    const formData = new FormData();
    if (avatarEditando) formData.append("cd_avatar", avatarEditando.cd_avatar);
    formData.append("nm_avatar", nomeForm);
    formData.append("nm_categoria", categoriaForm);
    formData.append("ds_url_foto", urlFotoForm);
    formData.append("nr_ordem", ordemForm);
    formData.append("fl_ativo", String(ativoForm));
    if (arquivoForm) formData.append("arquivo", arquivoForm);

    startTransition(async () => {
      try {
        const salvo = await salvarAvatarAdmin(formData);
        if (avatarEditando) {
          setAvatares(avatares.map((a) => (a.cd_avatar === salvo.cd_avatar ? salvo : a)));
          toast.sucesso("Avatar atualizado com sucesso!");
        } else {
          setAvatares([salvo, ...avatares]);
          toast.sucesso("Novo avatar criado com sucesso!");
        }
        setModalAberto(false);
      } catch (err) {
        toast.erro(err instanceof Error ? err.message : "Erro ao salvar avatar.");
      }
    });
  };

  const aoAlternarStatus = (av: AvatarAdmin) => {
    const novoStatus = !av.fl_ativo;
    startTransition(async () => {
      try {
        await alternarStatusAvatarAdmin(av.cd_avatar, novoStatus);
        setAvatares(avatares.map((a) => (a.cd_avatar === av.cd_avatar ? { ...a, fl_ativo: novoStatus } : a)));
        toast.sucesso(novoStatus ? "Avatar ativado." : "Avatar desativado.");
      } catch {
        toast.erro("Erro ao alterar status do avatar.");
      }
    });
  };

  const aoExcluir = (av: AvatarAdmin) => {
    if (!window.confirm(`Tem certeza que deseja excluir o avatar "${av.nm_avatar}"?`)) return;

    startTransition(async () => {
      try {
        await excluirAvatarAdmin(av.cd_avatar);
        setAvatares(avatares.filter((a) => a.cd_avatar !== av.cd_avatar));
        toast.sucesso("Avatar excluído.");
      } catch {
        toast.erro("Erro ao excluir avatar.");
      }
    });
  };

  const avataresFiltrados = avatares.filter((a) => {
    if (categoriaFiltro !== "TODAS" && a.nm_categoria !== categoriaFiltro) return false;
    if (busca && !a.nm_avatar.toLowerCase().includes(busca.toLowerCase())) return false;
    return true;
  });

  const categoriasUnicas = Array.from(new Set([...CATEGORIAS_PADRAO, ...avatares.map((a) => a.nm_categoria)]));

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            🖼️ Gerenciador de Avatares
          </h1>
          <p className="text-sm text-[#A78BFA] mt-1">
            Cadastre novos avatares, modifique nomes, categorias e faça upload de fotos customizadas.
          </p>
        </div>

        <button
          type="button"
          onClick={abrirModalNovo}
          className="rounded-md bg-[#7B2FBE] hover:bg-[#6D28D9] px-5 py-2.5 text-sm font-bold text-white transition-colors cursor-pointer flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          ➕ Criar Novo Avatar
        </button>
      </div>

      {/* Bar de Filtros */}
      <div className="rounded-lg border border-[rgba(139,92,246,0.15)] bg-[#0D0A1A] p-4 shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setCategoriaFiltro("TODAS")}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              categoriaFiltro === "TODAS"
                ? "bg-[#9D4EDD] text-white"
                : "bg-[#050208] text-[#A78BFA] border border-[rgba(139,92,246,0.2)] hover:bg-white/5"
            }`}
          >
            🌟 Todas as Categorias ({avatares.length})
          </button>
          {categoriasUnicas.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoriaFiltro(cat)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                categoriaFiltro === cat
                  ? "bg-[#9D4EDD] text-white"
                  : "bg-[#050208] text-[#A78BFA] border border-[rgba(139,92,246,0.2)] hover:bg-white/5"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="Buscar por nome do avatar..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full bg-[#050208] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] py-1.5 px-3 text-white text-xs"
          />
        </div>
      </div>

      {/* Grid de Avatares */}
      <Reveal>
        {avataresFiltrados.length === 0 ? (
          <div className="rounded-lg border border-[rgba(139,92,246,0.15)] bg-[#0D0A1A] p-12 text-center">
            <span className="text-4xl">🖼️</span>
            <h3 className="mt-3 text-lg font-bold text-white">Nenhum avatar cadastrado nesta categoria</h3>
            <p className="mt-1 text-xs text-[#A78BFA]">
              Clique no botão &quot;Criar Novo Avatar&quot; acima para adicionar novas opções com fotos customizadas.
            </p>
          </div>
        ) : (
          <StaggerGroup className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6" staggerChildren={0.04}>
            {avataresFiltrados.map((av) => (
              <StaggerItem
                key={av.cd_avatar}
                className={`relative flex flex-col items-center justify-between rounded-xl border p-4 shadow-lg transition-all ${
                  av.fl_ativo
                    ? "border-[rgba(139,92,246,0.2)] bg-[#0D0A1A] hover:border-[#9D4EDD]"
                    : "border-red-500/20 bg-[#0D0A1A]/40 opacity-60"
                }`}
              >
                {/* Badge Ativo / Inativo */}
                <button
                  type="button"
                  onClick={() => aoAlternarStatus(av)}
                  className={`absolute top-2 right-2 rounded-full px-2 py-0.5 text-[9px] font-bold cursor-pointer ${
                    av.fl_ativo
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-red-500/20 text-red-400 border border-red-500/30"
                  }`}
                >
                  {av.fl_ativo ? "Ativo" : "Inativo"}
                </button>

                {/* Foto do Avatar */}
                <div className="mt-3 h-20 w-20 overflow-hidden rounded-full border-2 border-[rgba(139,92,246,0.4)] shadow-md">
                  <Avatar valor={av.ds_url_foto} className="h-full w-full object-cover" />
                </div>

                <div className="mt-3 text-center w-full">
                  <h4 className="font-bold text-white text-sm truncate">{av.nm_avatar}</h4>
                  <p className="text-[10px] text-[#A78BFA] truncate mt-0.5">{av.nm_categoria}</p>
                </div>

                {/* Botões de Ação */}
                <div className="mt-4 flex w-full gap-2 border-t border-[rgba(139,92,246,0.15)] pt-3">
                  <button
                    type="button"
                    onClick={() => abrirModalEditar(av)}
                    className="flex-1 rounded border border-purple-500/30 bg-purple-500/10 py-1 text-xs font-bold text-purple-300 hover:bg-purple-500/20 transition-colors cursor-pointer"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => aoExcluir(av)}
                    className="rounded border border-red-500/30 bg-red-500/10 px-2 py-1 text-xs font-bold text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
                  >
                    🗑️
                  </button>
                </div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        )}
      </Reveal>

      {/* Modal Criar / Editar Avatar */}
      <AnimatePresence>
        {modalAberto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-[8px] p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              className="w-full max-w-md rounded-xl border border-[rgba(139,92,246,0.2)] bg-[#0D0A1A] p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[rgba(139,92,246,0.15)] pb-3">
                <h3 className="text-lg font-bold text-white">
                  {avatarEditando ? "Editar Avatar" : "Cadastrar Novo Avatar"}
                </h3>
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="text-[#A78BFA] hover:text-white text-xl cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={aoSalvar} className="space-y-4">
                {/* Preview de Foto */}
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-[#9D4EDD] bg-[#050208] shadow-lg">
                    <Avatar valor={previewLocal || urlFotoForm || "/icon.png"} className="h-full w-full object-cover" />
                  </div>
                  <span className="text-[10px] text-[#A78BFA]">Preview da Foto</span>
                </div>

                {/* Seleção de Tipo de Fonte (Arquivo ou URL) */}
                <div className="flex border-b border-[rgba(139,92,246,0.15)]">
                  <button
                    type="button"
                    onClick={() => setTipoFonte("file")}
                    className={`flex-1 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                      tipoFonte === "file"
                        ? "border-[#9D4EDD] text-white"
                        : "border-transparent text-[#A78BFA] hover:text-white"
                    }`}
                  >
                    📁 Enviar Foto do Computador
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoFonte("url")}
                    className={`flex-1 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                      tipoFonte === "url"
                        ? "border-[#9D4EDD] text-white"
                        : "border-transparent text-[#A78BFA] hover:text-white"
                    }`}
                  >
                    🔗 Link / URL Externa
                  </button>
                </div>

                {tipoFonte === "file" ? (
                  <div>
                    <label className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">
                      Selecione a Imagem (PNG, JPG, WEBP)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={aoSelecionarArquivo}
                      className="w-full text-xs text-[#A78BFA] file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-[#7B2FBE] file:text-white hover:file:bg-[#6D28D9] cursor-pointer"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">
                      URL da Imagem
                    </label>
                    <input
                      type="url"
                      placeholder="https://exemplo.com/foto.jpg"
                      value={urlFotoForm}
                      onChange={(e) => {
                        setUrlFotoForm(e.target.value);
                        setPreviewLocal(e.target.value);
                      }}
                      className="w-full bg-[#050208] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] rounded-[6px] p-2.5 text-xs text-white"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">
                    Nome do Personagem / Ator
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Wandinha Addams, Goku, Tommy Shelby..."
                    value={nomeForm}
                    onChange={(e) => setNomeForm(e.target.value)}
                    className="w-full bg-[#050208] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] rounded-[6px] p-2.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">
                    Categoria
                  </label>
                  <select
                    value={categoriaForm}
                    onChange={(e) => setCategoriaForm(e.target.value)}
                    className="w-full bg-[#050208] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] rounded-[6px] p-2.5 text-xs text-white"
                  >
                    {CATEGORIAS_PADRAO.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[rgba(139,92,246,0.15)]">
                  <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ativoForm}
                      onChange={(e) => setAtivoForm(e.target.checked)}
                    />
                    Ativo para os usuários no site
                  </label>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#A78BFA]">Ordem:</span>
                    <input
                      type="number"
                      value={ordemForm}
                      onChange={(e) => setOrdemForm(e.target.value)}
                      className="w-16 bg-[#050208] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] rounded-[6px] p-1.5 text-xs text-white text-center"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[rgba(139,92,246,0.15)]">
                  <button
                    type="button"
                    onClick={() => setModalAberto(false)}
                    className="rounded-md border border-[rgba(255,255,255,0.2)] px-4 py-2 text-xs font-bold text-white hover:bg-white/5 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="rounded-md bg-[#7B2FBE] hover:bg-[#6D28D9] px-5 py-2 text-xs font-bold text-white disabled:opacity-50 cursor-pointer"
                  >
                    {isPending ? "Salvando..." : "Salvar Avatar"}
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
