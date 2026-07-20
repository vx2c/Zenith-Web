import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, Plus, MessageSquare, Trash2 } from "lucide-react";
import { SiRoblox } from "react-icons/si";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

import { 
  useLogout, 
  useListChatSessions, 
  useCreateChatSession, 
  useDeleteChatSession,
  getListChatSessionsQueryKey,
  RobloxUser 
} from "@workspace/api-client-react";

interface SidebarProps {
  user: RobloxUser;
}

export function Sidebar({ user }: SidebarProps) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const { data: sessions = [], isLoading: isLoadingSessions } = useListChatSessions();
  const logout = useLogout();
  const createSession = useCreateChatSession();
  const deleteSession = useDeleteChatSession();

  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newProjectName, setNewProjectName] = useState("");

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        setLocation("/");
        queryClient.clear();
      }
    });
  };

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    
    createSession.mutate({ 
      data: { 
        title: newTitle, 
        projectName: newProjectName || undefined 
      } 
    }, {
      onSuccess: (session) => {
        setIsNewChatOpen(false);
        setNewTitle("");
        setNewProjectName("");
        queryClient.invalidateQueries({ queryKey: getListChatSessionsQueryKey() });
        setLocation(`/chat/${session.id}`);
      }
    });
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    deleteSession.mutate({ sessionId: id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListChatSessionsQueryKey() });
        // If we are currently on this session, redirect to dashboard
        if (window.location.pathname === `/chat/${id}`) {
          setLocation("/dashboard");
        }
      }
    });
  };

  return (
    <div className="w-[280px] h-full bg-card border-r flex flex-col flex-shrink-0 relative z-20 shadow-xl">
      <div className="p-4 border-b">
        <Button 
          onClick={() => setIsNewChatOpen(true)} 
          className="w-full justify-start gap-2 bg-[#00B2FF]/10 text-[#00B2FF] hover:bg-[#00B2FF]/20 border border-[#00B2FF]/30"
          data-testid="button-new-chat"
        >
          <Plus className="w-4 h-4" />
          New Session
        </Button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Recent Sessions
        </div>
        <ScrollArea className="flex-1 px-3">
          <div className="space-y-1 pb-4">
            {isLoadingSessions ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 rounded-md bg-muted animate-pulse mb-1" />
              ))
            ) : sessions.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-4 px-2">
                No active sessions. Start a new chat!
              </div>
            ) : (
              sessions.map((session) => (
                <Link 
                  key={session.id} 
                  href={`/chat/${session.id}`}
                  className="group flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground text-muted-foreground transition-colors"
                >
                  <div className="flex items-center gap-2 truncate">
                    <MessageSquare className="w-4 h-4 shrink-0" />
                    <span className="truncate">{session.title}</span>
                  </div>
                  <button 
                    onClick={(e) => handleDeleteSession(session.id, e)}
                    className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </Link>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="p-4 border-t bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <Avatar className="h-9 w-9 border border-border">
              <AvatarImage src={user.avatarUrl || undefined} />
              <AvatarFallback className="bg-primary/20 text-primary">
                {user.username.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col truncate">
              <span className="text-sm font-semibold truncate leading-none mb-1">
                {user.displayName}
              </span>
              <span className="text-xs text-muted-foreground truncate leading-none flex items-center gap-1">
                <SiRoblox className="w-3 h-3 text-[#00B2FF]" />
                {user.username}
              </span>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="shrink-0 text-muted-foreground hover:text-destructive">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* New Session Dialog */}
      <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Chat Session</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSession} className="space-y-4 pt-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">Session Title</label>
              <Input 
                id="title" 
                placeholder="e.g. Fixing datastore save loop" 
                value={newTitle} 
                onChange={e => setNewTitle(e.target.value)} 
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="project" className="text-sm font-medium">Project Name (Optional)</label>
              <Input 
                id="project" 
                placeholder="e.g. Adopt Me Clone" 
                value={newProjectName} 
                onChange={e => setNewProjectName(e.target.value)} 
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsNewChatOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={!newTitle.trim() || createSession.isPending}>
                Create Session
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
