import { ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import { useGetMe } from "@workspace/api-client-react";
import { Sidebar } from "./Sidebar";
import { Terminal } from "lucide-react";

export function AppLayout({ children }: { children: ReactNode }) {
  const { data: auth, isLoading } = useGetMe();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Explicitly add dark class on mount since we are defaulting to dark mode
    document.documentElement.classList.add("dark");
  }, []);

  useEffect(() => {
    if (!isLoading && !auth?.authenticated) {
      setLocation("/");
    }
  }, [auth, isLoading, setLocation]);

  if (isLoading || !auth?.authenticated) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-primary">
        <Terminal className="w-10 h-10 animate-pulse mb-4" />
        <p className="text-sm font-mono text-muted-foreground animate-pulse">Initializing cockpit...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar user={auth.user!} />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-0">
        {children}
      </main>
    </div>
  );
}
