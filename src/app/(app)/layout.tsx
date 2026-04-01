import BottomNav from "@/components/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full bg-white">
      <main className="pb-[52px]">{children}</main>
      <BottomNav />
    </div>
  );
}
