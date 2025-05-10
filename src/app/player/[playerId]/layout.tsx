import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import UserMenu from "@/components/UserMenu";
export default function PlayerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarTrigger />
      <main className="flex-1">
        <UserMenu />
        {children}
      </main>
    </SidebarProvider>
  );
}
