import { Link } from "wouter";
import { Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-foreground bg-grid-pattern selection:bg-primary/30">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-destructive/20 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="text-center space-y-6 relative z-10">
        <div className="flex justify-center">
          <div className="bg-destructive/10 text-destructive p-4 rounded-full border border-destructive/20">
            <Terminal className="w-12 h-12" />
          </div>
        </div>
        <h1 className="text-6xl font-bold font-mono tracking-tighter">404</h1>
        <h2 className="text-2xl font-semibold">Instance Not Found</h2>
        <p className="text-muted-foreground max-w-sm mx-auto">
          The requested resource or page does not exist in the current environment workspace.
        </p>
        <div className="pt-4">
          <Button asChild className="bg-primary hover:bg-primary/90">
            <Link href="/">Return to Base</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
