import { useGetChatStats } from "@workspace/api-client-react";
import { MessageSquare, Zap, Activity, Clock } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: stats, isLoading } = useGetChatStats();

  return (
    <AppLayout>
      <div className="flex-1 overflow-auto bg-background p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome back to Studio</h1>
            <p className="text-muted-foreground">Select a session from the sidebar or create a new one to start hacking.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Sessions</CardTitle>
                <MessageSquare className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <div className="text-3xl font-bold">{stats?.totalSessions}</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Messages</CardTitle>
                <Zap className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <div className="text-3xl font-bold">{stats?.totalMessages}</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Sessions This Week</CardTitle>
                <Activity className="w-4 h-4 text-[#00B2FF]" />
              </CardHeader>
              <CardContent>
                {isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <div className="text-3xl font-bold">{stats?.sessionsThisWeek}</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Messages This Week</CardTitle>
                <Clock className="w-4 h-4 text-[#00B2FF]" />
              </CardHeader>
              <CardContent>
                {isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <div className="text-3xl font-bold">{stats?.messagesThisWeek}</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* We could put recent sessions here as cards too, but the sidebar handles it well */}
          <div className="rounded-xl border border-border bg-card/30 p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
            <div className="bg-primary/10 p-4 rounded-full mb-4">
              <Zap className="w-8 h-8 text-[#00B2FF]" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Ready to optimize some scripts?</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Create a new session from the sidebar to get instant help with Luau coding, game mechanics, and Roblox Studio quirks.
            </p>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
