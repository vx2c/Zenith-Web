import { useEffect } from "react";
import { useLocation } from "wouter";
import { SiRoblox } from "react-icons/si";
import { Terminal, Zap, Code2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetMe } from "@workspace/api-client-react";

export default function Landing() {
  const { data: auth, isLoading } = useGetMe();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (auth?.authenticated) {
      setLocation("/dashboard");
    }
  }, [auth, setLocation]);

  if (isLoading || auth?.authenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden bg-grid-pattern selection:bg-primary/30">
      {/* Decorative blurred glowing orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <header className="container mx-auto px-6 h-20 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <div className="bg-primary text-primary-foreground p-1.5 rounded-md">
            <Terminal className="w-5 h-5" />
          </div>
          <span className="font-mono font-bold text-xl tracking-tight">Studio AI</span>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="hidden sm:flex text-muted-foreground hover:text-foreground">
            Documentation
          </Button>
          <Button asChild className="bg-[#00B2FF] hover:bg-[#00B2FF]/90 text-white shadow-[0_0_20px_rgba(0,178,255,0.4)]">
            <a href="/api/auth/roblox">
              <SiRoblox className="mr-2 w-4 h-4" />
              Connect Roblox
            </a>
          </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 relative z-10 mt-[-5vh]">
        <div className="max-w-4xl mx-auto space-y-8 flex flex-col items-center">
          <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary backdrop-blur-sm">
            <Zap className="mr-1 h-3.5 w-3.5" />
            <span>Roblox Copilot v1.0 is live</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/50">
            Your AI co-pilot for <br className="hidden md:block" />
            <span className="text-[#00B2FF]">Roblox Studio</span>
          </h1>
          
          <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
            Write Luau faster. Refactor existing scripts. Get instantaneous feedback on game mechanics. 
            Connect your Roblox account and supercharge your game development workflow.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button size="lg" asChild className="h-14 px-8 text-lg bg-[#00B2FF] hover:bg-[#00B2FF]/90 text-white shadow-[0_0_30px_rgba(0,178,255,0.3)] transition-all hover:shadow-[0_0_40px_rgba(0,178,255,0.5)]">
              <a href="/api/auth/roblox">
                <SiRoblox className="mr-2 w-5 h-5" />
                Connect with Roblox
              </a>
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-border bg-background/50 backdrop-blur-sm hover:bg-muted">
              View Examples
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-32 text-left">
          <div className="p-6 rounded-xl border border-card-border bg-card/50 backdrop-blur-sm">
            <Terminal className="w-8 h-8 text-primary mb-4" />
            <h3 className="font-semibold text-lg mb-2">Luau Optimized</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Trained specifically on Roblox API references, DevForum best practices, and modern Luau idioms.
            </p>
          </div>
          <div className="p-6 rounded-xl border border-card-border bg-card/50 backdrop-blur-sm">
            <Code2 className="w-8 h-8 text-primary mb-4" />
            <h3 className="font-semibold text-lg mb-2">Context Aware</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Maintains session memory. Paste entire scripts and ask for performance optimizations or bug fixes.
            </p>
          </div>
          <div className="p-6 rounded-xl border border-card-border bg-card/50 backdrop-blur-sm">
            <Shield className="w-8 h-8 text-primary mb-4" />
            <h3 className="font-semibold text-lg mb-2">Secure Connection</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              OAuth 2.0 integration with Roblox. We never see your password, just your connected identity.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
