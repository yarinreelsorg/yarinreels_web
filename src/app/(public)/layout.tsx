import BottomNav from "@/components/layout/BottomNav";
import InstallPwaButton from "@/components/layout/InstallPwaButton";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="pb-[75px] lg:pb-0">
      {children}
      <BottomNav />
      <InstallPwaButton />
    </div>
  );
}
