"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import Navbar from "@/components/layout/Navbar";
import { formatarPreco, formatarViews } from "@/lib/catalogo";
import type { Conteudo, Plano } from "@/types/database";
import PosterImg from "@/components/catalog/PosterImg";

interface LandingContentProps {
  destaques: Conteudo[];
  maisVistos: Conteudo[];
  doramas: Conteudo[];
  planos: Plano[];
  estatisticas: {
    totalConteudos: number;
    totalViews: number;
    totalCategorias: number;
  };
}

function formatarDuracaoPlano(dias: number) {
  if (dias >= 365) {
    const anos = Math.round(dias / 365);
    return anos === 1 ? "Anual" : `${anos} Anos`;
  }
  if (dias >= 28 && dias <= 31) return "Mensal";
  if (dias % 30 === 0) return `${dias / 30} Meses`;
  return `${dias} Dias`;
}

const FAQS = [
  {
    pergunta: "Como recebo o meu acesso após o pagamento via Pix?",
    resposta:
      "A liberação é automática e instantânea! Assim que o Pix é pago, o sistema confirma o pagamento em menos de 10 segundos e libera seu acesso ao site e ao Bot no Telegram imediatamente.",
  },
  {
    pergunta: "Posso assistir direto pelo aplicativo do Telegram?",
    resposta:
      "Sim! O YarinReels possui integração total com o Telegram. Você pode assistir aos conteúdos inline no chat ou fazer o download para assistir offline onde quiser, sem consumir o armazenamento do seu celular.",
  },
  {
    pergunta: "Existe alguma fidelidade ou taxa de cancelamento?",
    resposta:
      "Nenhuma! Nossos planos não possuem renovação automática compulsória nem fidelidade. Você escolhe quando assinar e só renova se quiser.",
  },
  {
    pergunta: "Funciona em Smart TV e dispositivos móveis?",
    resposta:
      "Com certeza! O site é 100% responsivo e otimizado para Smart TVs, notebooks, tablets e smartphones (Android e iOS). Você também pode usar a função de espelhamento (Chromecast/AirPlay).",
  },
  {
    pergunta: "Quais são as formas de pagamento aceitas?",
    resposta:
      "Aceitamos Pix com aprovação instantânea e cartões de crédito (com liberação imediata após análise da operadora).",
  },
  {
    pergunta: "Como funciona o suporte ao assinante?",
    resposta:
      "Temos suporte dedicado direto no Telegram para responder a qualquer dúvida sobre pagamentos, catálogo ou acesso rapidamente.",
  },
];

export default function LandingContent({
  destaques,
  maisVistos,
  doramas,
  planos,
  estatisticas,
}: LandingContentProps) {
  const [categoriaTab, setCategoriaTab] = useState<"maisVistos" | "doramas" | "destaques">(
    "maisVistos"
  );
  const [modalConteudo, setModalConteudo] = useState<Conteudo | null>(null);
  const [faqAberto, setFaqAberto] = useState<number | null>(0);

  const conteudosVitrines =
    categoriaTab === "maisVistos"
      ? maisVistos
      : categoriaTab === "doramas"
      ? doramas
      : destaques;

  const heroBackground = destaques[0]?.ds_url_poster || maisVistos[0]?.ds_url_poster || "";

  return (
    <div className="relative min-h-screen bg-[#050505] text-foreground overflow-hidden">
      {/* Glows de ambiente */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/20 blur-[140px]" />
      <div className="pointer-events-none absolute top-96 -left-32 h-[450px] w-[450px] rounded-full bg-accent/15 blur-[130px]" />
      <div className="pointer-events-none absolute top-[1600px] -right-32 h-[500px] w-[500px] rounded-full bg-primary/15 blur-[140px]" />

      <Navbar />

      {/* 1. HERO SECTION */}
      <section className="relative mx-auto max-w-[1600px] px-4 pt-8 pb-16 sm:px-8 md:pt-14 md:pb-24">
        {/* Banner de fundo com gradiente escuro */}
        {heroBackground && (
          <div className="absolute inset-0 -z-10 overflow-hidden opacity-25">
            <PosterImg
              src={heroBackground}
              largura={100}
              alt=""
              loading="eager"
              className="h-full w-full object-cover blur-md scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-[#050505]/40" />
          </div>
        )}

        <div className="mx-auto max-w-4xl text-center">
          {/* Badge superior */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-accent shadow-[0_0_20px_rgba(194,24,91,0.3)] backdrop-blur-md"
          >
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            🔥 STREAMING #1 DE DORAMAS, SÉRIES & FILMES
          </motion.div>

          {/* Título Principal */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-6 text-4xl font-black tracking-tight sm:text-6xl lg:text-7xl"
          >
            Assista aos seus <span className="bg-gradient-to-r from-primary via-accent to-pink-400 bg-clip-text text-transparent">Doramas & Séries</span> favoritos sem limites.
          </motion.h1>

          {/* Subtítulo */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-base text-secondary sm:text-xl max-w-2xl mx-auto leading-relaxed"
          >
            Streaming independente em altíssima definição. Assista no navegador ou com download
            descomplicado direto no Telegram. <strong className="text-foreground">Sem anúncios e com liberação instantânea no Pix.</strong>
          </motion.p>

          {/* Botões CTA */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <a
              href="#planos"
              className="w-full sm:w-auto rounded-full bg-gradient-to-r from-primary to-primary-dark px-8 py-4 text-center text-base font-bold text-white shadow-[0_0_30px_rgba(194,24,91,0.5)] transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(194,24,91,0.8)] active:scale-95"
            >
              🚀 Ver Planos de Assinatura
            </a>
            <Link
              href="/catalogo"
              className="w-full sm:w-auto rounded-full border border-white/15 bg-white/5 px-8 py-4 text-center text-base font-bold text-foreground backdrop-blur-md transition-all hover:bg-white/10 hover:border-white/30"
            >
              🎬 Explorar Catálogo
            </Link>
          </motion.div>

          {/* Métricas e Selos rápidos */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-14 grid grid-cols-2 gap-4 rounded-2xl border border-white/10 bg-surface/50 p-6 backdrop-blur-md sm:grid-cols-4"
          >
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black text-primary sm:text-3xl">
                +{estatisticas.totalConteudos || 500}
              </span>
              <span className="text-xs text-secondary mt-1">Títulos Disponíveis</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black text-emerald-400 sm:text-3xl">100%</span>
              <span className="text-xs text-secondary mt-1">Pix Instantâneo</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black text-accent sm:text-3xl">0</span>
              <span className="text-xs text-secondary mt-1">Anúncios & Sem Buffering</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black text-foreground sm:text-3xl">24/7</span>
              <span className="text-xs text-secondary mt-1">Bot Telegram Ativo</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. VITRINE DO CATÁLOGO AO VIVO */}
      <section className="mx-auto max-w-[1600px] px-4 py-12 sm:px-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div>
            <h2 className="text-2xl font-black text-foreground sm:text-3xl">
              O que você vai assistir <span className="text-primary">hoje</span>
            </h2>
            <p className="mt-1 text-sm text-secondary">
              Confira uma amostragem do nosso catálogo em constante atualização.
            </p>
          </div>

          {/* Tabs de Filtro */}
          <div className="flex items-center gap-2 rounded-full border border-border bg-surface p-1">
            <button
              onClick={() => setCategoriaTab("maisVistos")}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                categoriaTab === "maisVistos"
                  ? "bg-primary text-white shadow-md"
                  : "text-secondary hover:text-foreground"
              }`}
            >
              🔥 Mais Vistos
            </button>
            <button
              onClick={() => setCategoriaTab("doramas")}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                categoriaTab === "doramas"
                  ? "bg-primary text-white shadow-md"
                  : "text-secondary hover:text-foreground"
              }`}
            >
              🌸 Doramas
            </button>
            <button
              onClick={() => setCategoriaTab("destaques")}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                categoriaTab === "destaques"
                  ? "bg-primary text-white shadow-md"
                  : "text-secondary hover:text-foreground"
              }`}
            >
              ⭐ Destaques
            </button>
          </div>
        </div>

        {/* Grid de Cards de Filmes/Séries */}
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {conteudosVitrines.slice(0, 12).map((item) => (
            <motion.div
              key={item.cd_conteudo}
              whileHover={{ y: -6, scale: 1.02 }}
              onClick={() => setModalConteudo(item)}
              className="group relative cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-surface shadow-lg transition-all hover:border-primary/50 hover:shadow-[0_0_20px_rgba(194,24,91,0.3)]"
            >
              {/* Poster */}
              <div className="aspect-[2/3] w-full overflow-hidden bg-black/40">
                {item.ds_url_poster ? (
                  <PosterImg
                    src={item.ds_url_poster}
                    largura={460}
                    alt={item.nm_titulo}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center p-4 text-center text-xs text-secondary">
                    {item.nm_titulo}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

                {/* Badge Formato */}
                <span className="absolute top-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
                  {item.tp_formato || "Vídeo"}
                </span>

                {/* Botão Play Hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform group-hover:scale-110">
                    ▶
                  </span>
                </div>
              </div>

              {/* Informações Rápidas */}
              <div className="p-3">
                <h3 className="line-clamp-1 text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                  {item.nm_titulo}
                </h3>
                <div className="mt-1 flex items-center justify-between text-[11px] text-secondary">
                  <span>{item.nm_categoria}</span>
                  <span className="font-semibold text-emerald-400">
                    {formatarViews(item.nr_views)}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/catalogo"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-6 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-white/10 hover:border-primary/50"
          >
            Ver todos os +{estatisticas.totalConteudos} títulos no catálogo →
          </Link>
        </div>
      </section>

      {/* 3. ECOSSISTEMA & ONDE ASSISTIR */}
      <section className="relative border-y border-white/10 bg-black/40 py-16 backdrop-blur-md">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-black text-foreground sm:text-4xl">
              Assista onde e quando <span className="text-primary">quiser</span>
            </h2>
            <p className="mt-2 text-sm text-secondary max-w-xl mx-auto">
              Sua conta YarinReels é integrada a múltiplos dispositivos para garantir liberdade total.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Card 1: Web */}
            <div className="rounded-2xl border border-white/10 bg-surface/80 p-6 backdrop-blur-md transition-all hover:border-primary/40">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-2xl text-accent">
                💻
              </div>
              <h3 className="mt-4 text-lg font-bold text-foreground">Navegador Web</h3>
              <p className="mt-2 text-xs leading-relaxed text-secondary">
                Player HLS adaptativo sem necessidade de instalar aplicativos. Funciona no Chrome, Safari, Firefox e Edge em 4K.
              </p>
            </div>

            {/* Card 2: Telegram */}
            <div className="rounded-2xl border border-primary/30 bg-primary/10 p-6 backdrop-blur-md transition-all hover:border-primary">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-2xl text-white shadow-[0_0_15px_rgba(194,24,91,0.6)]">
                ✈️
              </div>
              <h3 className="mt-4 text-lg font-bold text-foreground">Bot Telegram Exclusivo</h3>
              <p className="mt-2 text-xs leading-relaxed text-secondary">
                Assista aos episódios direto pelo chat ou faça download imediato para assistir mesmo estando sem internet.
              </p>
            </div>

            {/* Card 3: Smart TV */}
            <div className="rounded-2xl border border-white/10 bg-surface/80 p-6 backdrop-blur-md transition-all hover:border-primary/40">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-2xl text-accent">
                📺
              </div>
              <h3 className="mt-4 text-lg font-bold text-foreground">Smart TV & TV Box</h3>
              <p className="mt-2 text-xs leading-relaxed text-secondary">
                Compatível com navegadores de TV, Chromecast e AirPlay. Espelhe a tela do celular com um único toque.
              </p>
            </div>

            {/* Card 4: Mobile App */}
            <div className="rounded-2xl border border-white/10 bg-surface/80 p-6 backdrop-blur-md transition-all hover:border-primary/40">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-2xl text-accent">
                📱
              </div>
              <h3 className="mt-4 text-lg font-bold text-foreground">Mobile & PWA</h3>
              <p className="mt-2 text-xs leading-relaxed text-secondary">
                Instale nosso aplicativo Web (PWA) direto na tela inicial do seu Android ou iPhone sem passar pela loja.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. DIFERENCIAIS EXCLUSIVOS */}
      <section className="mx-auto max-w-[1600px] px-4 py-16 sm:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-black text-foreground sm:text-4xl">
            Por que assinar o <span className="text-primary">YarinReels</span>?
          </h2>
          <p className="mt-2 text-sm text-secondary max-w-xl mx-auto">
            Criado para apaixonados por doramas e entretenimento sem burocracia.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex gap-4 rounded-xl border border-white/10 bg-surface/40 p-5 transition-all hover:bg-surface/70">
            <span className="text-3xl">⚡</span>
            <div>
              <h3 className="font-bold text-foreground">CDN Ultra Rápida</h3>
              <p className="mt-1 text-xs text-secondary">
                Servidores dedicados via Bunny.net garantem reprodução sem travamentos ou carregamentos lentos.
              </p>
            </div>
          </div>

          <div className="flex gap-4 rounded-xl border border-white/10 bg-surface/40 p-5 transition-all hover:bg-surface/70">
            <span className="text-3xl">🔒</span>
            <div>
              <h3 className="font-bold text-foreground">Pagamento Seguros via Pix</h3>
              <p className="mt-1 text-xs text-secondary">
                Aprovação automática em menos de 10 segundos via QR Code Pix diretamente pelo Efí Bank.
              </p>
            </div>
          </div>

          <div className="flex gap-4 rounded-xl border border-white/10 bg-surface/40 p-5 transition-all hover:bg-surface/70">
            <span className="text-3xl">🆕</span>
            <div>
              <h3 className="font-bold text-foreground">Atualizações Diárias</h3>
              <p className="mt-1 text-xs text-secondary">
                Novos episódios de doramas em exibição e lançamentos de filmes adicionados todos os dias.
              </p>
            </div>
          </div>

          <div className="flex gap-4 rounded-xl border border-white/10 bg-surface/40 p-5 transition-all hover:bg-surface/70">
            <span className="text-3xl">🚫</span>
            <div>
              <h3 className="font-bold text-foreground">Zero Anúncios</h3>
              <p className="mt-1 text-xs text-secondary">
                Esqueça pop-ups irritantes ou propagandas no meio do vídeo. Maratonar com conforto total.
              </p>
            </div>
          </div>

          <div className="flex gap-4 rounded-xl border border-white/10 bg-surface/40 p-5 transition-all hover:bg-surface/70">
            <span className="text-3xl">💬</span>
            <div>
              <h3 className="font-bold text-foreground">Grupo de Pedidos VIP</h3>
              <p className="mt-1 text-xs text-secondary">
                Membros assinantes têm canal direto no Telegram para pedir a inclusão de seus doramas favoritos.
              </p>
            </div>
          </div>

          <div className="flex gap-4 rounded-xl border border-white/10 bg-surface/40 p-5 transition-all hover:bg-surface/70">
            <span className="text-3xl">♾️</span>
            <div>
              <h3 className="font-bold text-foreground">Sem Fidelidade</h3>
              <p className="mt-1 text-xs text-secondary">
                Você compra o período que desejar. Sem multas, sem renovação forçada ou surpresas na fatura.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PLANOS E PREÇOS */}
      <section id="planos" className="mx-auto max-w-[1600px] px-4 py-16 sm:px-8">
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">
            Planos Flexíveis
          </span>
          <h2 className="mt-2 text-3xl font-black text-foreground sm:text-5xl">
            Escolha o plano ideal para você
          </h2>
          <p className="mt-3 text-sm text-secondary max-w-lg mx-auto">
            Acesso total e ilimitado a todo o catálogo enquanto sua assinatura estiver ativa.
          </p>
        </div>

        {planos.length === 0 ? (
          <div className="mt-12 text-center text-secondary">
            Nenhum plano disponível no momento. Consulte nossa equipe via suporte.
          </div>
        ) : (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {planos.map((plano, index) => {
              const ehDestaque = index === 1 || plano.nm_plano.toLowerCase().includes("vip");
              return (
                <div
                  key={plano.cd_plano}
                  className={`relative flex flex-col justify-between rounded-2xl border p-6 backdrop-blur-md transition-all duration-300 ${
                    ehDestaque
                      ? "border-primary bg-gradient-to-b from-primary/20 via-surface to-surface shadow-[0_0_30px_rgba(194,24,91,0.3)] lg:-translate-y-2"
                      : "border-white/10 bg-surface/80 hover:border-white/20"
                  }`}
                >
                  {ehDestaque && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-[11px] font-black uppercase tracking-wider text-white shadow-md">
                      ★ Mais Popular
                    </span>
                  )}

                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                      {plano.nm_categoria}
                    </span>
                    <h3 className="mt-2 text-xl font-black text-foreground">{plano.nm_plano}</h3>
                    <p className="mt-1 text-xs text-secondary">
                      Validade: {formatarDuracaoPlano(plano.nr_dias_validade)}
                    </p>

                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-3xl font-black text-primary">
                        {formatarPreco(plano.vl_plano)}
                      </span>
                      <span className="text-xs text-secondary">/período</span>
                    </div>

                    <ul className="mt-6 flex flex-col gap-2.5 text-xs text-secondary">
                      <li className="flex items-center gap-2">
                        <span className="font-bold text-emerald-400">✓</span> Acesso completo em 4K e HD
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="font-bold text-emerald-400">✓</span> Streaming Web + Bot Telegram
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="font-bold text-emerald-400">✓</span> Sem anúncios ou interrupções
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="font-bold text-emerald-400">✓</span> Downloads liberados no Telegram
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="font-bold text-emerald-400">✓</span> Suporte prioritário 24/7
                      </li>
                    </ul>
                  </div>

                  <Link
                    href={`/checkout/plano/${plano.cd_plano}`}
                    className={`mt-8 w-full rounded-xl py-3.5 text-center text-sm font-bold transition-all ${
                      ehDestaque
                        ? "bg-primary text-white hover:bg-primary-dark shadow-[0_0_20px_rgba(194,24,91,0.5)]"
                        : "bg-white/10 text-foreground hover:bg-white/20"
                    }`}
                  >
                    Assinar Agora via Pix
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 6. PERGUNTAS FREQUENTES (FAQ) */}
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-black text-foreground sm:text-4xl">
            Perguntas <span className="text-primary">Frequentes</span>
          </h2>
          <p className="mt-2 text-sm text-secondary">
            Tire suas dúvidas antes de assinar.
          </p>
        </div>

        <div className="mt-10 flex flex-col gap-3">
          {FAQS.map((faq, idx) => {
            const aberto = faqAberto === idx;
            return (
              <div
                key={faq.pergunta}
                className="overflow-hidden rounded-xl border border-white/10 bg-surface/60 backdrop-blur-md transition-colors hover:border-white/20"
              >
                <button
                  type="button"
                  onClick={() => setFaqAberto(aberto ? null : idx)}
                  className="flex w-full items-center justify-between p-4 text-left text-sm font-bold text-foreground sm:p-5"
                >
                  <span>{faq.pergunta}</span>
                  <span className="ml-4 shrink-0 text-lg text-primary">
                    {aberto ? "−" : "+"}
                  </span>
                </button>

                <AnimatePresence>
                  {aberto && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="border-t border-white/5 px-4 pb-4 pt-2 text-xs leading-relaxed text-secondary sm:px-5"
                    >
                      {faq.resposta}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. BANNER FINAL CTA */}
      <section className="mx-auto max-w-[1600px] px-4 py-12 sm:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-primary/50 bg-gradient-to-r from-primary/30 via-surface to-primary/20 p-8 text-center backdrop-blur-md sm:p-14">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/40 blur-3xl" />
          <h2 className="text-3xl font-black text-foreground sm:text-5xl">
            Pronto para maratonar seus <span className="text-accent">doramas favoritos</span>?
          </h2>
          <p className="mt-4 text-sm text-secondary max-w-xl mx-auto">
            Crie sua conta agora, faça o pagamento via Pix e comece a assistir em menos de 1 minuto.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="#planos"
              className="w-full sm:w-auto rounded-full bg-primary px-8 py-4 text-sm font-bold text-white shadow-[0_0_25px_rgba(194,24,91,0.6)] transition-all hover:scale-105 hover:bg-primary-dark"
            >
              🚀 Assinar com Desconto no Pix
            </a>
            <Link
              href="/suporte"
              className="w-full sm:w-auto rounded-full border border-white/20 bg-white/5 px-8 py-4 text-sm font-bold text-foreground transition-all hover:bg-white/10"
            >
              💬 Falar com Atendimento
            </Link>
          </div>
        </div>
      </section>

      {/* MODAL DE PREVIA DE CONTEUDO */}
      <AnimatePresence>
        {modalConteudo && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/20 bg-[#121212] shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setModalConteudo(null)}
                className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-lg font-bold text-white backdrop-blur-md hover:bg-black"
              >
                ✕
              </button>

              <div className="flex flex-col md:flex-row">
                {/* Poster Lateral */}
                <div className="w-full md:w-5/12 aspect-[2/3] bg-black">
                  {modalConteudo.ds_url_poster && (
                    <PosterImg
                      src={modalConteudo.ds_url_poster}
                      largura={520}
                      alt=""
                      loading="eager"
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>

                {/* Detalhes */}
                <div className="flex-1 p-6 flex flex-col justify-between">
                  <div>
                    <span className="rounded bg-primary/20 px-2 py-0.5 text-[11px] font-bold text-accent">
                      {modalConteudo.nm_categoria}
                    </span>
                    <h3 className="mt-2 text-2xl font-black text-foreground">
                      {modalConteudo.nm_titulo}
                    </h3>

                    {modalConteudo.ds_generos && (
                      <p className="mt-1 text-xs text-secondary font-medium">
                        Gêneros: {modalConteudo.ds_generos}
                      </p>
                    )}

                    <p className="mt-4 text-xs text-secondary leading-relaxed line-clamp-4">
                      {modalConteudo.ds_descricao ||
                        "Assista a esta incrível produção em alta qualidade no YarinReels."}
                    </p>
                  </div>

                  <div className="mt-6 border-t border-white/10 pt-4 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-secondary">Visualizações</span>
                      <p className="text-sm font-bold text-emerald-400">
                        {formatarViews(modalConteudo.nr_views)}
                      </p>
                    </div>

                    <Link
                      href={`/filme/${modalConteudo.cd_conteudo}`}
                      className="rounded-full bg-primary px-6 py-2.5 text-xs font-bold text-white shadow-[0_0_15px_rgba(194,24,91,0.5)] hover:bg-primary-dark"
                    >
                      Assistir Agora ▶
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
