import BottomNav from "@/components/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full bg-background">
      <main className="pb-[60px]">{children}</main>
      <BottomNav />
    </div>
  );
}
