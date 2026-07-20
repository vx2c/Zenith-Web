import { useState, useRef, useEffect } from "react";
import { useRoute } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { 
  useGetChatSession, 
  useListMessages, 
  useSendMessage,
  getGetChatSessionQueryKey,
  getListMessagesQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, Terminal, Code2, Bot, User } from "lucide-react";

export default function Chat() {
  const [match, params] = useRoute("/chat/:sessionId");
  const sessionId = params?.sessionId || "";

  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: session, isLoading: isLoadingSession } = useGetChatSession(sessionId, {
    query: {
      enabled: !!sessionId,
      queryKey: getGetChatSessionQueryKey(sessionId)
    }
  });

  const { data: messages = [], isLoading: isLoadingMessages } = useListMessages(sessionId, {
    query: {
      enabled: !!sessionId,
      queryKey: getListMessagesQueryKey(sessionId)
    }
  });

  const sendMessageMutation = useSendMessage();

  const [inputContent, setInputContent] = useState("");
  // Local state to show immediately when sent
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, pendingMessage]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputContent.trim() || !sessionId || sendMessageMutation.isPending) return;

    const contentToSend = inputContent.trim();
    setInputContent("");
    setPendingMessage(contentToSend);

    sendMessageMutation.mutate({
      sessionId,
      data: { content: contentToSend }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMessagesQueryKey(sessionId) });
        setPendingMessage(null);
      },
      onError: () => {
        setPendingMessage(null);
        // Could show a toast here
      }
    });
  };

  if (isLoadingSession) {
    return (
      <AppLayout>
        <div className="flex-1 flex items-center justify-center">
          <Skeleton className="w-10 h-10 rounded-full" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col h-full bg-background relative">
        {/* Chat Header */}
        <header className="h-14 border-b flex items-center px-6 shrink-0 bg-card/50 backdrop-blur-sm z-10 relative">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded bg-primary/10 text-primary">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-semibold text-sm leading-none">{session?.title || "Chat Session"}</h2>
              {session?.projectName && (
                <p className="text-xs text-muted-foreground mt-1">Project: {session.projectName}</p>
              )}
            </div>
          </div>
        </header>

        {/* Messages Area */}
        <ScrollArea className="flex-1 px-4 lg:px-8 py-6" ref={scrollRef}>
          <div className="max-w-4xl mx-auto space-y-6 pb-20">
            {messages.length === 0 && !pendingMessage && (
              <div className="text-center py-20">
                <div className="bg-muted inline-flex p-4 rounded-full mb-4">
                  <Bot className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">How can I help with your game?</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mt-2">
                  Paste a script that's throwing an error, or ask about Roblox data stores, constraints, or UI frameworks.
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <ChatMessageItem key={msg.id} message={msg} />
            ))}

            {/* Optimistic pending user message */}
            {pendingMessage && (
              <ChatMessageItem 
                message={{
                  id: 'pending',
                  sessionId,
                  role: 'user',
                  content: pendingMessage,
                  createdAt: new Date().toISOString(),
                  codeLanguage: null,
                  codeSnippet: null
                }} 
                isPending={true}
              />
            )}
            
            {/* AI Loading state */}
            {sendMessageMutation.isPending && (
              <div className="flex gap-4">
                <div className="w-8 h-8 shrink-0 rounded-md bg-primary/10 flex items-center justify-center border border-primary/20">
                  <Bot className="w-5 h-5 text-primary animate-pulse" />
                </div>
                <div className="space-y-2 flex-1 pt-1">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 bg-background border-t shrink-0">
          <div className="max-w-4xl mx-auto">
            <form 
              onSubmit={handleSend}
              className="relative flex items-end gap-2 bg-card rounded-lg border focus-within:ring-1 focus-within:ring-ring focus-within:border-primary transition-all p-2 shadow-sm"
            >
              <textarea
                className="w-full min-h-[44px] max-h-[200px] resize-none bg-transparent border-0 focus:ring-0 px-3 py-3 text-sm flex-1 outline-none"
                placeholder="Ask something about Roblox Luau..."
                rows={1}
                value={inputContent}
                onChange={(e) => {
                  setInputContent(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={!inputContent.trim() || sendMessageMutation.isPending}
                className="shrink-0 h-11 w-11 rounded-md"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
            <div className="text-center mt-2">
              <span className="text-xs text-muted-foreground">
                Studio AI can make mistakes. Verify game-breaking changes before publishing.
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function ChatMessageItem({ message, isPending = false }: { message: any, isPending?: boolean }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-4 group ${isPending ? 'opacity-70' : ''}`}>
      <div className={`w-8 h-8 shrink-0 rounded-md flex items-center justify-center border ${
        isUser 
          ? "bg-secondary text-secondary-foreground border-border" 
          : "bg-primary/10 text-primary border-primary/20"
      }`}>
        {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
      </div>
      
      <div className="flex-1 space-y-2 pt-1 min-w-0">
        <div className="font-semibold text-sm flex items-center gap-2">
          {isUser ? "You" : "Studio AI"}
        </div>
        
        <div className="prose prose-invert max-w-none text-sm leading-relaxed">
          {/* Very basic markdown formatting for content. Real app might use react-markdown */}
          {message.content.split('\n').map((line: string, i: number) => (
            <p key={i} className="mb-2 last:mb-0">{line}</p>
          ))}
        </div>

        {message.codeSnippet && (
          <div className="mt-4 rounded-md overflow-hidden border border-border bg-[#0d1117] shadow-sm">
            <div className="flex items-center justify-between px-4 py-2 bg-muted/40 border-b border-border">
              <span className="text-xs font-mono text-muted-foreground flex items-center gap-2">
                <Code2 className="w-3 h-3" />
                {message.codeLanguage || "luau"}
              </span>
              <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => navigator.clipboard.writeText(message.codeSnippet)}>
                Copy
              </Button>
            </div>
            <div className="p-4 overflow-x-auto">
              <pre className="text-sm font-mono text-[#e5e7eb]">
                <code>{message.codeSnippet}</code>
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
