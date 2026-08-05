import BottomNav from "@/components/layout/BottomNav";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="pb-[75px] lg:pb-0">
      {children}
      <BottomNav />
    </div>
  );
}
