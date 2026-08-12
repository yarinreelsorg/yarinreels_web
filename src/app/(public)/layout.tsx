import { redirect } from "next/navigation";
import BottomNav from "@/components/layout/BottomNav";
import InstallPwaButton from "@/components/layout/InstallPwaButton";
import { getSessaoUsuario } from "@/lib/user-auth";
import { obterBanimentoUsuario, obterIdsTelegramElegiveis } from "@/lib/acesso";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Banimento TOTAL: usuário nem deve ver o catálogo/home, não só ficar
  // impedido de comprar/assistir. /bloqueado fica fora deste grupo de
  // rotas de propósito, senão o redirect entraria em loop nela mesma.
  const sessao = await getSessaoUsuario();
  if (sessao) {
    const ids = await obterIdsTelegramElegiveis(sessao.cd_usuario);
    const banInfo = await obterBanimentoUsuario(ids);
    if (banInfo.banido && banInfo.tp_banimento === "TOTAL") {
      redirect("/bloqueado");
    }
  }

  return (
    <div className="pb-[75px] lg:pb-0">
      {children}
      <BottomNav />
      <InstallPwaButton />
    </div>
  );
}
