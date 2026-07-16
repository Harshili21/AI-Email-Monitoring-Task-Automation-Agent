import { Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { Topbar } from "./topbar";
import { useAuth } from "@/contexts/auth";

export function AppLayout({ children }: { children?: ReactNode }) {
  const pathname = useRouterState({ select: s => s.location.pathname });
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAuthRoute = pathname === "/login";

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isAuthRoute && !user) {
      const stored = localStorage.getItem("user") || sessionStorage.getItem("user");
      if (!stored) navigate({ to: "/login" });
    }
  }, [isAuthRoute, user, navigate]);

  if (isAuthRoute) return <>{children ?? <Outlet />}</>;

  return (
    <SidebarProvider>
      <div className="relative z-10 flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-1 flex-col">
          <Topbar />
          <main className="flex-1 p-4 md:p-6">{children ?? <Outlet />}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
