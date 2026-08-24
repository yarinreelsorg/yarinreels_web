"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import type { ClienteResumo, TpCompra, Venda, Conteudo, Plano } from "@/types/database";
import { formatarPreco } from "@/lib/catalogo";
import Pagination from "@/components/admin/Pagination";
import { StaggerGroup, StaggerItem } from "@/components/motion/Stagger";
import { buttonTap } from "@/lib/motion";
import { useFocoModal } from "@/components/admin/useFocoModal";
import { useToast } from "@/components/admin/ToastProvider";
import { baixarCsv } from "@/lib/csv";
import { formatarDataHora } from "@/lib/data";
import Avatar from "@/components/ui/Avatar";
import {
  buscarUltimaVisita,
  buscarVendasCliente,
  concederAcesso,
  desbanirCliente,
  exportarClientesCsv,
  obterDetalhesBanimento,
  salvarBanimentoCliente,
  revogarAcesso,
  removerVendaPendente,
} from "./actions";

interface Filtros {
  busca: string;
  ordenarPor: "nr_id_telegram" | "total_compras" | "ultima_compra";
  direcao: "asc" | "desc";
  pagina: number;
}

export default function ClientesAdminClient({
  clientes,
  totalRegistros,
  itensPorPagina,
  filtrosAtuais,
  conteudos,
  planos,
  avatares,
}: {
  clientes: ClienteResumo[];
  totalRegistros: number;
  itensPorPagina: number;
  filtrosAtuais: Filtros;
  conteudos: Conteudo[];
  planos: Plano[];
  avatares: Record<number, string>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const searchParams = useSearchParams();
  const emailDaQuery = searchParams.get("concederEmail");

  const [buscaLocal, setBuscaLocal] = useState(filtrosAtuais.busca);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [selectedTelegramId, setSelectedTelegramId] = useState<number | null>(null);
  const [vendasCliente, setVendasCliente] = useState<Venda[]>([]);
  const [carregandoVendas, setCarregandoVendas] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [banido, setBanido] = useState(false);
  const [detalhesBan, setDetalhesBan] = useState<{
    banido: boolean;
    tp_banimento: "TOTAL" | "COMPRAS" | "PERSONALIZADO";
    ds_acoes_bloqueadas: string[];
    ds_motivo: string | null;
    ds_mensagem_bloqueio: string | null;
  } | null>(null);
  const [modalBanAberto, setModalBanAberto] = useState(false);
  const [tpBanForm, setTpBanForm] = useState<"TOTAL" | "COMPRAS" | "PERSONALIZADO">("TOTAL");
  const [acoesForm, setAcoesForm] = useState<string[]>([]);
  const [motivoForm, setMotivoForm] = useState("");
  const [mensagemForm, setMensagemForm] = useState("");

  const [alterandoBan, setAlterandoBan] = useState(false);
  const [revogandoId, setRevogandoId] = useState<string | null>(null);
  const [removendoId, setRemovendoId] = useState<string | null>(null);
  const [ultimaVisita, setUltimaVisita] = useState<{
    ds_dispositivo: string | null;
    ds_ip: string | null;
    ts_criacao: string;
  } | null>(null);

  // Conceder acesso (modal) — pode chegar já aberto vindo de
  // /admin/usuarios?concederEmail=...
  const [concederAberto, setConcederAberto] = useState(!!emailDaQuery);
  const [telegramIdConceder, setTelegramIdConceder] = useState("");
  const [emailConceder, setEmailConceder] = useState(emailDaQuery ?? "");
  const [tipoConceder, setTipoConceder] = useState<TpCompra>("ALUGUEL");
  const [buscaConteudo, setBuscaConteudo] = useState("");
  const [salvandoAcesso, setSalvandoAcesso] = useState(false);
  const [erroAcesso, setErroAcesso] = useState<string | null>(null);
  const [duplicidadeDetectada, setDuplicidadeDetectada] = useState(false);
  const ultimoFormDataRef = useRef<FormData | null>(null);

  const drawerRef = useFocoModal<HTMLDivElement>(selectedTelegramId !== null, () =>
    setSelectedTelegramId(null)
  );
  const modalRef = useFocoModal<HTMLDivElement>(concederAberto, () => setConcederAberto(false));

  const conteudosMap = new Map<string, Conteudo>();
  for (const c of conteudos) conteudosMap.set(c.cd_conteudo, c);

  const planosMap = new Map<string, Plano>();
  for (const p of planos) planosMap.set(p.cd_plano, p);

  const getValorAproximado = (v: Venda) => {
    if (v.vl_pago != null) return v.vl_pago;
    if (v.tp_compra === "ASSINATURA") return 20;
    if (v.tp_compra === "ALUGUEL") {
      return (v.cd_conteudo ? conteudosMap.get(v.cd_conteudo)?.vl_aluguel : null) ?? 10;
    }
    if (v.tp_compra === "VITALICIO") {
      return (v.cd_conteudo ? conteudosMap.get(v.cd_conteudo)?.vl_vitalicio : null) ?? 30;
    }
    return 0;
  };

  const totalPaginas = Math.max(1, Math.ceil(totalRegistros / itensPorPagina));

  function atualizarUrl(mudancas: Partial<Filtros>) {
    const proximo: Filtros = { ...filtrosAtuais, ...mudancas };
    const params = new URLSearchParams();
    if (proximo.busca) params.set("busca", proximo.busca);
    if (proximo.ordenarPor !== "ultima_compra") params.set("sort", proximo.ordenarPor);
    if (proximo.direcao !== "desc") params.set("dir", proximo.direcao);
    if (proximo.pagina > 1) params.set("page", String(proximo.pagina));
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  const aoBuscar = (valor: string) => {
    setBuscaLocal(valor);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => atualizarUrl({ busca: valor, pagina: 1 }), 400);
  };

  const aoOrdenar = (campo: Filtros["ordenarPor"]) => {
    if (filtrosAtuais.ordenarPor === campo) {
      atualizarUrl({ direcao: filtrosAtuais.direcao === "asc" ? "desc" : "asc" });
    } else {
      atualizarUrl({ ordenarPor: campo, direcao: "desc" });
    }
  };

  const indicadorOrdenacao = (campo: Filtros["ordenarPor"]) =>
    filtrosAtuais.ordenarPor === campo ? (filtrosAtuais.direcao === "asc" ? " ↑" : " ↓") : "";

  const conteudosFiltradosModal = conteudos
    .filter((c) => c.nm_titulo.toLowerCase().includes(buscaConteudo.toLowerCase()))
    .slice(0, 50);

  const abrirConceder = (nrIdTelegram?: number, email?: string) => {
    setTelegramIdConceder(nrIdTelegram ? String(nrIdTelegram) : "");
    setEmailConceder(email ?? "");
    setTipoConceder("ALUGUEL");
    setBuscaConteudo("");
    setErroAcesso(null);
    setDuplicidadeDetectada(false);
    setConcederAberto(true);
  };

  // Vem da tela de Usuários do Site (?concederEmail=...): o modal já abre
  // com o e-mail preenchido (ver estado inicial acima); aqui só limpa a URL.
  useEffect(() => {
    if (emailDaQuery) {
      router.replace(pathname, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const abrirDetalhes = async (nrIdTelegram: number) => {
    setSelectedTelegramId(nrIdTelegram);
    setCarregandoVendas(true);
    try {
      const [vendas, infoBan, visita] = await Promise.all([
        buscarVendasCliente(nrIdTelegram),
        obterDetalhesBanimento(nrIdTelegram),
        buscarUltimaVisita(nrIdTelegram),
      ]);
      setVendasCliente(vendas);
      setDetalhesBan(infoBan);
      setBanido(!!infoBan?.banido);
      setUltimaVisita(visita);
    } catch {
      toast.erro("Erro ao carregar histórico do cliente.");
    } finally {
      setCarregandoVendas(false);
    }
  };

  const abrirModalBan = () => {
    if (detalhesBan) {
      setTpBanForm(detalhesBan.tp_banimento);
      setAcoesForm(detalhesBan.ds_acoes_bloqueadas);
      setMotivoForm(detalhesBan.ds_motivo ?? "");
      setMensagemForm(detalhesBan.ds_mensagem_bloqueio ?? "");
    } else {
      setTpBanForm("TOTAL");
      setAcoesForm([]);
      setMotivoForm("");
      setMensagemForm("");
    }
    setModalBanAberto(true);
  };

  const aoSalvarBan = async () => {
    if (selectedTelegramId === null) return;
    setAlterandoBan(true);
    try {
      await salvarBanimentoCliente({
        nrIdTelegram: selectedTelegramId,
        tpBanimento: tpBanForm,
        dsAcoesBloqueadas: acoesForm,
        dsMotivo: motivoForm,
        dsMensagemBloqueio: mensagemForm,
      });
      const novoInfo = {
        banido: true,
        tp_banimento: tpBanForm,
        ds_acoes_bloqueadas: acoesForm,
        ds_motivo: motivoForm,
        ds_mensagem_bloqueio: mensagemForm,
      };
      setBanido(true);
      setDetalhesBan(novoInfo);
      setModalBanAberto(false);
      toast.sucesso("Nível de banimento aplicado com sucesso.");
    } catch (err) {
      toast.erro(err instanceof Error ? err.message : "Erro ao salvar banimento.");
    } finally {
      setAlterandoBan(false);
    }
  };

  const aoDesbanir = async () => {
    if (selectedTelegramId === null) return;
    if (!window.confirm("Desbanir este cliente e remover todas as restrições?")) return;
    setAlterandoBan(true);
    try {
      await desbanirCliente(selectedTelegramId);
      setBanido(false);
      setDetalhesBan(null);
      toast.sucesso("Cliente desbanido com sucesso.");
    } catch (err) {
      toast.erro(err instanceof Error ? err.message : "Erro ao desbanir cliente.");
    } finally {
      setAlterandoBan(false);
    }
  };

  const aoRevogar = async (cdVenda: string) => {
    setRevogandoId(cdVenda);
    try {
      await revogarAcesso(cdVenda);
      toast.sucesso("Acesso revogado.");
      if (selectedTelegramId !== null) abrirDetalhes(selectedTelegramId);
    } catch (err) {
      toast.erro(err instanceof Error ? err.message : "Erro ao revogar acesso.");
    } finally {
      setRevogandoId(null);
    }
  };

  const aoRemoverPendente = async (cdVenda: string) => {
    if (!window.confirm("Remover esta transação pendente? Isso não pode ser desfeito.")) return;
    setRemovendoId(cdVenda);
    try {
      await removerVendaPendente(cdVenda);
      toast.sucesso("Transação removida.");
      if (selectedTelegramId !== null) abrirDetalhes(selectedTelegramId);
    } catch (err) {
      toast.erro(err instanceof Error ? err.message : "Erro ao remover transação.");
    } finally {
      setRemovendoId(null);
    }
  };

  const enviarConcessao = async (formData: FormData, forcar: boolean) => {
    setSalvandoAcesso(true);
    setErroAcesso(null);
    try {
      await concederAcesso(formData, forcar);
      toast.sucesso("Acesso concedido.");
      setConcederAberto(false);
      if (selectedTelegramId !== null) abrirDetalhes(selectedTelegramId);
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : "Erro ao conceder acesso.";
      if (mensagem.startsWith("DUPLICADO:")) {
        setDuplicidadeDetectada(true);
        setErroAcesso(mensagem.replace("DUPLICADO:", "").trim());
      } else {
        setErroAcesso(mensagem);
      }
    } finally {
      setSalvandoAcesso(false);
    }
  };

  const aoSubmeterAcesso = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    ultimoFormDataRef.current = formData;
    enviarConcessao(formData, false);
  };

  const aoForcarConcessao = () => {
    if (ultimoFormDataRef.current) enviarConcessao(ultimoFormDataRef.current, true);
  };

  const aoExportar = async () => {
    setExportando(true);
    try {
      const csv = await exportarClientesCsv(filtrosAtuais.busca || undefined);
      baixarCsv(csv, "clientes.csv");
    } catch {
      toast.erro("Erro ao exportar CSV.");
    } finally {
      setExportando(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Clientes</h1>
          <p className="text-sm text-[#A78BFA]">Controle de acessos e histórico de compradores.</p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            type="button"
            onClick={aoExportar}
            disabled={exportando}
            {...buttonTap}
            className="rounded-md border border-[rgba(139,92,246,0.3)] px-4 py-2.5 text-sm font-bold text-[#A78BFA] transition-colors hover:bg-white/5 disabled:opacity-50 cursor-pointer"
          >
            {exportando ? "Exportando..." : "⇩ CSV"}
          </motion.button>
          <motion.button
            type="button"
            onClick={() => abrirConceder()}
            {...buttonTap}
            className="rounded-md bg-[#7B2FBE] hover:bg-[#6D28D9] px-5 py-2.5 text-sm font-bold text-white transition-colors cursor-pointer flex items-center justify-center"
          >
            ＋ Conceder Acesso
          </motion.button>
        </div>
      </div>

      {/* Search Input */}
      <div className="max-w-md">
        <input
          type="text"
          placeholder="Buscar por ID Telegram..."
          value={buscaLocal}
          onChange={(e) => aoBuscar(e.target.value)}
          className="w-full bg-[#0D0A1A] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] py-2 px-4 text-white text-sm"
        />
      </div>

      {/* Clientes Table */}
      <div className="rounded-lg border border-[rgba(139,92,246,0.15)] bg-[#0D0A1A] overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[rgba(139,92,246,0.15)] bg-[#050208]/50 text-xs font-semibold text-[#A78BFA] uppercase tracking-wider">
                <th className="px-6 py-3">
                  <button type="button" onClick={() => aoOrdenar("nr_id_telegram")} className="cursor-pointer hover:text-white">
                    ID Telegram{indicadorOrdenacao("nr_id_telegram")}
                  </button>
                </th>
                <th className="px-6 py-3">
                  <button type="button" onClick={() => aoOrdenar("total_compras")} className="cursor-pointer hover:text-white">
                    Total de Compras{indicadorOrdenacao("total_compras")}
                  </button>
                </th>
                <th className="px-6 py-3">
                  <button type="button" onClick={() => aoOrdenar("ultima_compra")} className="cursor-pointer hover:text-white">
                    Última Compra{indicadorOrdenacao("ultima_compra")}
                  </button>
                </th>
                <th className="px-6 py-3">Tipos de Acesso</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <motion.tbody
              key={filtrosAtuais.pagina}
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.03 } } }}
              className="divide-y divide-[rgba(139,92,246,0.15)] text-sm text-white"
            >
              {clientes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-[#A78BFA]/70">
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              ) : (
                clientes.map((cliente) => {
                  const dataUltima = formatarDataHora(cliente.ultima_compra, {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <motion.tr
                      key={cliente.nr_id_telegram}
                      variants={{
                        hidden: { opacity: 0, y: 12 },
                        show: { opacity: 1, y: 0 },
                      }}
                      className="hover:bg-[rgba(139,92,246,0.05)] transition-colors"
                    >
                      <td className="px-6 py-4 font-mono text-xs font-semibold">
                        {avatares[cliente.nr_id_telegram] && (
                          <span className="mr-2 inline-flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-[#050208] text-sm align-middle">
                            <Avatar valor={avatares[cliente.nr_id_telegram]} className="h-full w-full" />
                          </span>
                        )}
                        {cliente.nr_id_telegram}
                      </td>
                      <td className="px-6 py-4 font-semibold">{cliente.total_compras}</td>
                      <td className="px-6 py-4 text-xs text-[#A78BFA]/80">{dataUltima}</td>
                      <td className="px-6 py-4 flex flex-wrap gap-1.5">
                        {cliente.tipos_acesso.map((tipo) => (
                          <span
                            key={tipo}
                            className="bg-[#050208] border border-[rgba(139,92,246,0.2)] px-2 py-0.5 rounded text-xs text-[#A78BFA] font-medium"
                          >
                            {tipo}
                          </span>
                        ))}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => abrirDetalhes(cliente.nr_id_telegram)}
                          className="rounded bg-[#7B2FBE]/20 border border-[#7B2FBE]/30 text-white font-bold text-xs px-3.5 py-1.5 hover:bg-[#7B2FBE]/40 transition-colors cursor-pointer"
                        >
                          👁️ Ver Detalhes
                        </button>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </motion.tbody>
          </table>
        </div>
        <Pagination
          paginaAtual={filtrosAtuais.pagina}
          totalPaginas={totalPaginas}
          onChange={(p) => atualizarUrl({ pagina: p })}
        />
      </div>

      {/* Side Panel (Drawer) for details */}
      <AnimatePresence>
      {selectedTelegramId !== null && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedTelegramId(null)}
          />

          {/* Drawer Container */}
          <motion.div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="drawer-cliente-titulo"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[460px] bg-[#0D0A1A] border-l border-[rgba(139,92,246,0.2)] p-6 shadow-2xl overflow-y-auto flex flex-col justify-between"
          >
            <div>
              {/* Drawer Header */}
              <div className="mb-6 flex items-center justify-between border-b border-[rgba(139,92,246,0.15)] pb-4">
                <div>
                  <h2 id="drawer-cliente-titulo" className="text-xl font-bold text-white">
                    Histórico do Cliente
                  </h2>
                  <p className="text-xs font-mono text-[#A78BFA] mt-0.5">
                    Telegram ID: {selectedTelegramId}
                  </p>
                  {banido && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {detalhesBan?.tp_banimento === "TOTAL" && (
                        <span className="inline-flex items-center rounded-full bg-red-500/10 px-2.5 py-0.5 text-[10px] font-bold text-red-400 border border-red-500/20">
                          🚫 Banimento Máximo (Permanente)
                        </span>
                      )}
                      {detalhesBan?.tp_banimento === "COMPRAS" && (
                        <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20">
                          🛒 Banimento de Compras (Parcial)
                        </span>
                      )}
                      {detalhesBan?.tp_banimento === "PERSONALIZADO" && (
                        <span className="inline-flex items-center rounded-full bg-purple-500/10 px-2.5 py-0.5 text-[10px] font-bold text-purple-400 border border-purple-500/20">
                          ⚙️ Banimento Personalizado
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTelegramId(null)}
                  className="text-[#A78BFA] hover:text-white text-2xl transition-colors cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <div className="mb-6 flex gap-2">
                <button
                  type="button"
                  onClick={abrirModalBan}
                  className="flex-1 rounded-md border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-xs font-bold text-purple-300 hover:bg-purple-500/20 transition-colors cursor-pointer"
                >
                  ⚙️ {banido ? "Editar Punição" : "Configurar Banimento"}
                </button>

                {banido && (
                  <button
                    type="button"
                    disabled={alterandoBan}
                    onClick={aoDesbanir}
                    className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    ✓ Desbanir
                  </button>
                )}
              </div>

              {ultimaVisita && (
                <div className="mb-6 rounded-lg border border-[rgba(139,92,246,0.1)] bg-[#050208]/60 p-3 text-xs">
                  <p className="mb-1 font-semibold uppercase tracking-wider text-[#A78BFA]">
                    Último acesso ao site
                  </p>
                  <p className="text-white">
                    {ultimaVisita.ds_dispositivo ?? "Dispositivo desconhecido"} · IP{" "}
                    {ultimaVisita.ds_ip ?? "—"}
                  </p>
                  <p className="text-[#A78BFA]/60">
                    {formatarDataHora(ultimaVisita.ts_criacao, {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              )}

              {/* Purchase History */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#A78BFA] mb-2">
                  Transações {carregandoVendas ? "" : `(${vendasCliente.length})`}
                </h3>

                {carregandoVendas ? (
                  <div className="space-y-3">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="h-20 animate-pulse rounded-lg bg-[#050208]/60" />
                    ))}
                  </div>
                ) : (
                  <StaggerGroup className="space-y-3" staggerChildren={0.05} once={false}>
                    {vendasCliente.map((v) => {
                      const valor = getValorAproximado(v);
                      let itemNome = "-";
                      if (v.tp_compra === "ASSINATURA") {
                        itemNome =
                          (v.cd_plano && planosMap.get(v.cd_plano)?.nm_plano) ??
                          `Plano #${v.cd_plano}`;
                      } else {
                        itemNome =
                          (v.cd_conteudo && conteudosMap.get(v.cd_conteudo)?.nm_titulo) ??
                          `Conteúdo #${v.cd_conteudo}`;
                      }

                      const dataVenda = formatarDataHora(v.ts_criacao, {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                      const dataExpiracao = v.ts_expiracao
                        ? formatarDataHora(v.ts_expiracao, {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })
                        : null;

                      return (
                        <StaggerItem
                          key={v.cd_venda}
                          className="rounded-lg border border-[rgba(139,92,246,0.1)] bg-[#050208]/60 p-4 space-y-2 hover:border-[rgba(139,92,246,0.2)] transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="bg-[#0D0A1A] border border-[rgba(139,92,246,0.2)] px-2 py-0.5 rounded text-xs font-semibold text-[#A78BFA]">
                              {v.tp_compra}
                            </span>
                            <span className="font-mono text-xs text-[#A78BFA]/60">{dataVenda}</span>
                          </div>

                          <div className="text-sm font-semibold text-white truncate">
                            {itemNome}
                          </div>

                          <div className="flex items-center justify-between text-xs pt-1">
                            <div>
                              <span className="text-[#A78BFA]/70">Preço:</span>{" "}
                              <span className="font-bold text-[#A78BFA]">
                                {formatarPreco(valor)}
                              </span>
                            </div>
                            {dataExpiracao && (
                              <div>
                                <span className="text-[#A78BFA]/70">Expira:</span>{" "}
                                <span className="text-white font-medium">{dataExpiracao}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            {v.tp_status === "APROVADA" ? (
                              <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                                APROVADA
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20">
                                PENDENTE
                              </span>
                            )}
                            {v.tp_status === "APROVADA" &&
                              v.ts_expiracao &&
                              v.ts_expiracao > new Date().toISOString() && (
                                <button
                                  type="button"
                                  disabled={revogandoId === v.cd_venda}
                                  onClick={() => aoRevogar(v.cd_venda)}
                                  className="text-[10px] font-bold text-red-400 hover:text-red-300 cursor-pointer disabled:opacity-50"
                                >
                                  {revogandoId === v.cd_venda ? "Revogando..." : "Revogar acesso"}
                                </button>
                              )}
                            {v.tp_status === "PENDENTE" && (
                              <button
                                type="button"
                                disabled={removendoId === v.cd_venda}
                                onClick={() => aoRemoverPendente(v.cd_venda)}
                                className="text-[10px] font-bold text-red-400 hover:text-red-300 cursor-pointer disabled:opacity-50"
                              >
                                {removendoId === v.cd_venda ? "Removendo..." : "Retirar"}
                              </button>
                            )}
                          </div>
                        </StaggerItem>
                      );
                    })}
                  </StaggerGroup>
                )}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="mt-8 flex items-center justify-end gap-3 border-t border-[rgba(139,92,246,0.15)] pt-4">
              <button
                type="button"
                onClick={() => setSelectedTelegramId(null)}
                className="rounded-md border border-[rgba(255,255,255,0.2)] hover:bg-white/5 px-5 py-2 text-sm font-bold text-white transition-colors cursor-pointer"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => abrirConceder(selectedTelegramId)}
                className="rounded-md bg-[#7B2FBE] hover:bg-[#6D28D9] px-5 py-2 text-sm font-bold text-white transition-colors cursor-pointer"
              >
                ＋ Conceder Acesso
              </button>
            </div>
          </motion.div>
        </>
      )}
      </AnimatePresence>

      {/* Modal Conceder Acesso */}
      <AnimatePresence>
        {concederAberto && (
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
              aria-labelledby="conceder-acesso-titulo"
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="relative w-full max-w-lg rounded-lg border border-[rgba(139,92,246,0.2)] bg-[#0D0A1A] p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="mb-6 flex items-center justify-between border-b border-[rgba(139,92,246,0.15)] pb-4">
                <h2 id="conceder-acesso-titulo" className="text-xl font-bold text-white">
                  Conceder Acesso
                </h2>
                <button
                  type="button"
                  onClick={() => setConcederAberto(false)}
                  className="text-[#A78BFA] hover:text-white text-2xl transition-colors cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={aoSubmeterAcesso} className="flex flex-col gap-4">
                <div>
                  <label htmlFor="nr_id_telegram" className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">
                    ID do Telegram
                  </label>
                  <input
                    type="number"
                    id="nr_id_telegram"
                    name="nr_id_telegram"
                    required={!emailConceder}
                    disabled={!!emailConceder}
                    value={telegramIdConceder}
                    onChange={(e) => {
                      setTelegramIdConceder(e.target.value);
                      setDuplicidadeDetectada(false);
                      setErroAcesso(null);
                    }}
                    placeholder="Ex: 123456789"
                    className="w-full bg-[#050208] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] p-2.5 text-white disabled:opacity-40"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-[rgba(139,92,246,0.2)]" />
                  <span className="text-[10px] font-semibold uppercase text-[#A78BFA]">ou</span>
                  <div className="h-px flex-1 bg-[rgba(139,92,246,0.2)]" />
                </div>

                <div>
                  <label htmlFor="nm_email_usuario" className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">
                    E-mail de usuário do site
                  </label>
                  <input
                    type="email"
                    id="nm_email_usuario"
                    name="nm_email_usuario"
                    value={emailConceder}
                    onChange={(e) => {
                      setEmailConceder(e.target.value);
                      setDuplicidadeDetectada(false);
                      setErroAcesso(null);
                    }}
                    placeholder="cliente@email.com"
                    className="w-full bg-[#050208] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] p-2.5 text-white"
                  />
                  <p className="mt-1 text-[11px] text-[#A78BFA]/70">
                    Preencha isso pra liberar acesso a quem se cadastrou pelo site (não pelo bot), em vez do ID do Telegram.
                  </p>
                </div>

                <div>
                  <label htmlFor="tp_compra" className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">
                    Tipo de Acesso
                  </label>
                  <select
                    id="tp_compra"
                    name="tp_compra"
                    value={tipoConceder}
                    onChange={(e) => {
                      setTipoConceder(e.target.value as TpCompra);
                      setDuplicidadeDetectada(false);
                      setErroAcesso(null);
                    }}
                    className="w-full bg-[#050208] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] p-2.5 text-white"
                  >
                    <option value="ALUGUEL">Aluguel de conteúdo (7 dias)</option>
                    <option value="VITALICIO">Acesso vitalício a conteúdo</option>
                    <option value="ASSINATURA">Plano de assinatura</option>
                  </select>
                </div>

                {tipoConceder === "ASSINATURA" ? (
                  <div>
                    <label htmlFor="cd_plano" className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">
                      Plano
                    </label>
                    <select
                      id="cd_plano"
                      name="cd_plano"
                      required
                      className="w-full bg-[#050208] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] p-2.5 text-white"
                    >
                      {planos.map((p) => (
                        <option key={p.cd_plano} value={p.cd_plano}>
                          {p.nm_plano} · {p.nr_dias_validade} dias
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label htmlFor="busca_conteudo" className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">
                      Conteúdo
                    </label>
                    <input
                      type="text"
                      id="busca_conteudo"
                      placeholder="Buscar título..."
                      value={buscaConteudo}
                      onChange={(e) => setBuscaConteudo(e.target.value)}
                      className="w-full bg-[#050208] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] p-2.5 text-white mb-2"
                    />
                    <select
                      name="cd_conteudo"
                      required
                      size={6}
                      onChange={() => {
                        setDuplicidadeDetectada(false);
                        setErroAcesso(null);
                      }}
                      className="w-full bg-[#050208] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] p-2.5 text-white"
                    >
                      {conteudosFiltradosModal.map((c) => (
                        <option key={c.cd_conteudo} value={c.cd_conteudo}>
                          {c.nm_titulo} ({c.nm_categoria})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {erroAcesso && (
                  <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3">
                    <p className="text-sm text-amber-400">{erroAcesso}</p>
                    {duplicidadeDetectada && (
                      <button
                        type="button"
                        disabled={salvandoAcesso}
                        onClick={aoForcarConcessao}
                        className="mt-2 rounded-md border border-amber-500/40 px-4 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/10 cursor-pointer disabled:opacity-50"
                      >
                        Conceder mesmo assim
                      </button>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[rgba(139,92,246,0.15)] mt-2">
                  <button
                    type="button"
                    onClick={() => setConcederAberto(false)}
                    className="rounded-md border border-[rgba(255,255,255,0.2)] hover:bg-white/5 px-6 py-2.5 text-sm font-bold text-white transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={salvandoAcesso}
                    className="rounded-md bg-[#7B2FBE] hover:bg-[#6D28D9] disabled:opacity-50 px-6 py-2.5 text-sm font-bold text-white transition-colors cursor-pointer"
                  >
                    {salvandoAcesso ? "Concedendo..." : "Conceder Acesso"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Níveis de Banimento */}
      <AnimatePresence>
        {modalBanAberto && (
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
              className="w-full max-w-lg rounded-lg border border-[rgba(139,92,246,0.2)] bg-[#0D0A1A] p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[rgba(139,92,246,0.15)] pb-3">
                <h3 className="text-lg font-bold text-white">Configurar Nível de Banimento</h3>
                <button
                  type="button"
                  onClick={() => setModalBanAberto(false)}
                  className="text-[#A78BFA] hover:text-white text-xl cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">
                  Tipo / Nível de Punição
                </label>
                <select
                  value={tpBanForm}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onChange={(e) => setTpBanForm(e.target.value as any)}
                  className="w-full bg-[#050208] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] p-2.5 text-white text-sm"
                >
                  <option value="TOTAL">🚫 Banimento Máximo (Permanente) - Bloqueia acesso ao app</option>
                  <option value="COMPRAS">🛒 Banimento de Compras (Parcial) - Permite assistir compras anteriores</option>
                  <option value="PERSONALIZADO">⚙️ Banimento Personalizado - Bloqueia ações especificadas</option>
                </select>
              </div>

              {tpBanForm === "PERSONALIZADO" && (
                <div className="space-y-2 rounded-md border border-[rgba(139,92,246,0.2)] bg-[#050208]/60 p-3">
                  <p className="text-xs font-semibold text-[#A78BFA] uppercase">Ações Bloqueadas:</p>
                  <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acoesForm.includes("NOVAS_COMPRAS")}
                      onChange={(e) => {
                        if (e.target.checked) setAcoesForm([...acoesForm, "NOVAS_COMPRAS"]);
                        else setAcoesForm(acoesForm.filter((a) => a !== "NOVAS_COMPRAS"));
                      }}
                    />
                    Impedir qualquer nova compra
                  </label>
                  <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acoesForm.includes("PLANOS")}
                      onChange={(e) => {
                        if (e.target.checked) setAcoesForm([...acoesForm, "PLANOS"]);
                        else setAcoesForm(acoesForm.filter((a) => a !== "PLANOS"));
                      }}
                    />
                    Impedir assinatura de novos planos
                  </label>
                  <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acoesForm.includes("PROMOCOES")}
                      onChange={(e) => {
                        if (e.target.checked) setAcoesForm([...acoesForm, "PROMOCOES"]);
                        else setAcoesForm(acoesForm.filter((a) => a !== "PROMOCOES"));
                      }}
                    />
                    Impedir cupons / combos / promoções
                  </label>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">
                  Motivo do Banimento (Nota interna do Admin)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Tentativa de estorno no Pix"
                  value={motivoForm}
                  onChange={(e) => setMotivoForm(e.target.value)}
                  className="w-full bg-[#050208] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] p-2.5 text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">
                  Mensagem de Bloqueio exibida para o Cliente
                </label>
                <textarea
                  rows={3}
                  placeholder="Ex: Sua conta foi suspensa por descumprimento dos termos..."
                  value={mensagemForm}
                  onChange={(e) => setMensagemForm(e.target.value)}
                  className="w-full bg-[#050208] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] p-2.5 text-white text-sm resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[rgba(139,92,246,0.15)]">
                <button
                  type="button"
                  onClick={() => setModalBanAberto(false)}
                  className="rounded-md border border-[rgba(255,255,255,0.2)] px-4 py-2 text-sm font-bold text-white hover:bg-white/5 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={alterandoBan}
                  onClick={aoSalvarBan}
                  className="rounded-md bg-red-600 hover:bg-red-700 px-5 py-2 text-sm font-bold text-white disabled:opacity-50 cursor-pointer"
                >
                  {alterandoBan ? "Salvando..." : "Salvar Punição"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
