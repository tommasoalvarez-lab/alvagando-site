import BottomNav from "@/components/BottomNav";
import LogoutButton from "@/components/LogoutButton";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-screen max-w-lg pb-24">
      <header className="flex items-center justify-between px-4 pb-2 pt-6">
        <h1 className="text-lg font-semibold text-gray-900">Il tuo assistente</h1>
        <LogoutButton />
      </header>
      <main className="px-4 pt-2">{children}</main>
      <BottomNav />
    </div>
  );
}
