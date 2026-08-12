import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full border-t border-border bg-black/60 pt-12 pb-16 text-secondary backdrop-blur-md">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-8">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
          {/* Coluna 1: Sobre & Marca */}
          <div className="flex flex-col gap-3 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icon.png"
                alt="YarinReels"
                className="h-8 w-8 rounded-lg object-cover shadow-[0_0_12px_rgba(194,24,91,0.5)]"
              />
              <span className="text-xl font-black uppercase tracking-[0.2em] text-foreground">
                Yarin<span className="text-primary">Reels</span>
              </span>
            </Link>
            <p className="max-w-md text-xs leading-relaxed text-secondary/80">
              A melhor plataforma de streaming independente para doramas asiáticos, séries
              aclamadas e filmes exclusivos. Assista direto pelo navegador ou com download
              descomplicado no Telegram.
            </p>
            <div className="mt-2 flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Pix Liberado Instantaneamente
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
                ⚡ CDN Bunny.net 4K
              </span>
            </div>
          </div>

          {/* Coluna 2: Navegação */}
          <div className="flex flex-col gap-2.5">
            <h4 className="text-sm font-bold uppercase tracking-wider text-foreground">Navegação</h4>
            <ul className="flex flex-col gap-2 text-xs">
              <li>
                <Link href="/" className="transition-colors hover:text-foreground">
                  Início (Catálogo)
                </Link>
              </li>
              <li>
                <Link href="/landing" className="transition-colors hover:text-foreground">
                  Landing Page (Apresentação)
                </Link>
              </li>
              <li>
                <Link href="/catalogo" className="transition-colors hover:text-foreground">
                  Explorar Catálogo
                </Link>
              </li>
              <li>
                <Link href="/assinaturas" className="transition-colors hover:text-foreground">
                  Planos & Assinaturas
                </Link>
              </li>
              <li>
                <Link href="/minha-lista" className="transition-colors hover:text-foreground">
                  Minha Lista
                </Link>
              </li>
            </ul>
          </div>

          {/* Coluna 3: Ajuda & Legal */}
          <div className="flex flex-col gap-2.5">
            <h4 className="text-sm font-bold uppercase tracking-wider text-foreground">Ajuda & Legal</h4>
            <ul className="flex flex-col gap-2 text-xs">
              <li>
                <Link href="/suporte" className="transition-colors hover:text-foreground">
                  Suporte ao Cliente
                </Link>
              </li>
              <li>
                <Link href="/termos" className="transition-colors hover:text-foreground">
                  Termos de Uso & Privacidade
                </Link>
              </li>
              <li>
                <a
                  href="https://t.me/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-foreground"
                >
                  Canal Telegram Oficial
                </a>
              </li>
              <li>
                <Link href="/admin/login" className="transition-colors hover:text-primary font-medium">
                  Área do Administrador
                </Link>
              </li>
            </ul>
          </div>

          {/* Coluna 4: Compatibilidade */}
          <div className="flex flex-col gap-2.5">
            <h4 className="text-sm font-bold uppercase tracking-wider text-foreground">Dispositivos</h4>
            <ul className="flex flex-col gap-2 text-xs text-secondary/80">
              <li className="flex items-center gap-2">
                <span>📱</span> Smartphones Android & iOS
              </li>
              <li className="flex items-center gap-2">
                <span>💻</span> Desktop & Notebook (Web)
              </li>
              <li className="flex items-center gap-2">
                <span>📺</span> Smart TV & Chromecast
              </li>
              <li className="flex items-center gap-2">
                <span>✈️</span> Telegram App
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-6 text-center sm:flex-row sm:text-left text-xs text-secondary/60">
          <p>© {new Date().getFullYear()} YarinReels. Todos os direitos reservados.</p>
          <p className="flex items-center gap-2">
            <span>Desenvolvido para máxima velocidade & streaming de alto rendimento</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
