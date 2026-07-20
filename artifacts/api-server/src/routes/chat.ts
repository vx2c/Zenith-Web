import { Router } from "express";
import type { IRouter } from "express";
import { db, chatSessionsTable, chatMessagesTable, usersTable } from "@workspace/db";
import { eq, desc, count, and, gte, sql } from "drizzle-orm";
import {
  CreateChatSessionBody,
  GetChatSessionParams,
  DeleteChatSessionParams,
  ListMessagesParams,
  SendMessageParams,
  SendMessageBody,
} from "@workspace/api-zod";
import { generateAIResponse } from "../lib/ai";

const chatRouter: IRouter = Router();

// Auth middleware - returns 401 if not logged in
function requireAuth(req: any, res: any, next: any): void {
  if (!req.session?.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
}

// GET /api/chat/stats
chatRouter.get("/chat/stats", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.session.userId as string;

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [totalSessionsResult] = await db
    .select({ count: count() })
    .from(chatSessionsTable)
    .where(eq(chatSessionsTable.userId, userId));

  const [weeklySessionsResult] = await db
    .select({ count: count() })
    .from(chatSessionsTable)
    .where(
      and(
        eq(chatSessionsTable.userId, userId),
        gte(chatSessionsTable.createdAt, oneWeekAgo),
      ),
    );

  const [totalMessagesResult] = await db
    .select({ count: count() })
    .from(chatMessagesTable)
    .innerJoin(chatSessionsTable, eq(chatMessagesTable.sessionId, chatSessionsTable.id))
    .where(eq(chatSessionsTable.userId, userId));

  const [weeklyMessagesResult] = await db
    .select({ count: count() })
    .from(chatMessagesTable)
    .innerJoin(chatSessionsTable, eq(chatMessagesTable.sessionId, chatSessionsTable.id))
    .where(
      and(
        eq(chatSessionsTable.userId, userId),
        gte(chatMessagesTable.createdAt, oneWeekAgo),
      ),
    );

  res.json({
    totalSessions: totalSessionsResult.count,
    totalMessages: totalMessagesResult.count,
    sessionsThisWeek: weeklySessionsResult.count,
    messagesThisWeek: weeklyMessagesResult.count,
  });
});

// GET /api/chat/sessions
chatRouter.get("/chat/sessions", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.session.userId as string;

  const sessions = await db
    .select({
      id: chatSessionsTable.id,
      title: chatSessionsTable.title,
      projectName: chatSessionsTable.projectName,
      createdAt: chatSessionsTable.createdAt,
      messageCount: count(chatMessagesTable.id),
      lastMessageAt: sql<string | null>`MAX(${chatMessagesTable.createdAt})`,
    })
    .from(chatSessionsTable)
    .leftJoin(chatMessagesTable, eq(chatMessagesTable.sessionId, chatSessionsTable.id))
    .where(eq(chatSessionsTable.userId, userId))
    .groupBy(chatSessionsTable.id)
    .orderBy(desc(chatSessionsTable.updatedAt));

  res.json(
    sessions.map((s) => ({
      id: s.id,
      title: s.title,
      projectName: s.projectName ?? null,
      messageCount: Number(s.messageCount),
      lastMessageAt: s.lastMessageAt ?? null,
      createdAt: s.createdAt.toISOString(),
    })),
  );
});

// POST /api/chat/sessions
chatRouter.post("/chat/sessions", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.session.userId as string;

  const parsed = CreateChatSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [session] = await db
    .insert(chatSessionsTable)
    .values({
      userId,
      title: parsed.data.title,
      projectName: parsed.data.projectName ?? null,
    })
    .returning();

  res.status(201).json({
    id: session.id,
    title: session.title,
    projectName: session.projectName ?? null,
    messageCount: 0,
    lastMessageAt: null,
    createdAt: session.createdAt.toISOString(),
  });
});

// GET /api/chat/sessions/:sessionId
chatRouter.get("/chat/sessions/:sessionId", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.session.userId as string;

  const paramsResult = GetChatSessionParams.safeParse(req.params);
  if (!paramsResult.success) {
    res.status(400).json({ error: "Invalid session ID" });
    return;
  }
  const { sessionId } = paramsResult.data;

  const [session] = await db
    .select()
    .from(chatSessionsTable)
    .where(
      and(
        eq(chatSessionsTable.id, sessionId),
        eq(chatSessionsTable.userId, userId),
      ),
    )
    .limit(1);

  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  const [msgCountResult] = await db
    .select({ count: count() })
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.sessionId, session.id));

  res.json({
    id: session.id,
    title: session.title,
    projectName: session.projectName ?? null,
    messageCount: Number(msgCountResult.count),
    lastMessageAt: null,
    createdAt: session.createdAt.toISOString(),
  });
});

// DELETE /api/chat/sessions/:sessionId
chatRouter.delete("/chat/sessions/:sessionId", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.session.userId as string;

  const paramsResult = DeleteChatSessionParams.safeParse(req.params);
  if (!paramsResult.success) {
    res.status(400).json({ error: "Invalid session ID" });
    return;
  }
  const { sessionId } = paramsResult.data;

  const [deleted] = await db
    .delete(chatSessionsTable)
    .where(
      and(
        eq(chatSessionsTable.id, sessionId),
        eq(chatSessionsTable.userId, userId),
      ),
    )
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  res.json({ success: true });
});

// GET /api/chat/sessions/:sessionId/messages
chatRouter.get("/chat/sessions/:sessionId/messages", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.session.userId as string;

  const paramsResult = ListMessagesParams.safeParse(req.params);
  if (!paramsResult.success) {
    res.status(400).json({ error: "Invalid session ID" });
    return;
  }
  const { sessionId } = paramsResult.data;

  // Verify ownership
  const [session] = await db
    .select()
    .from(chatSessionsTable)
    .where(
      and(
        eq(chatSessionsTable.id, sessionId),
        eq(chatSessionsTable.userId, userId),
      ),
    )
    .limit(1);

  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  const messages = await db
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.sessionId, sessionId))
    .orderBy(chatMessagesTable.createdAt);

  res.json(
    messages.map((m) => ({
      id: m.id,
      sessionId: m.sessionId,
      role: m.role,
      content: m.content,
      codeSnippet: m.codeSnippet ?? null,
      codeLanguage: m.codeLanguage ?? null,
      createdAt: m.createdAt.toISOString(),
    })),
  );
});

// POST /api/chat/sessions/:sessionId/messages
chatRouter.post("/chat/sessions/:sessionId/messages", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.session.userId as string;

  const paramsResult = SendMessageParams.safeParse(req.params);
  if (!paramsResult.success) {
    res.status(400).json({ error: "Invalid session ID" });
    return;
  }
  const { sessionId } = paramsResult.data;

  const bodyResult = SendMessageBody.safeParse(req.body);
  if (!bodyResult.success) {
    res.status(400).json({ error: bodyResult.error.message });
    return;
  }

  // Verify session ownership
  const [session] = await db
    .select()
    .from(chatSessionsTable)
    .where(
      and(
        eq(chatSessionsTable.id, sessionId),
        eq(chatSessionsTable.userId, userId),
      ),
    )
    .limit(1);

  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  // Save user message
  await db.insert(chatMessagesTable).values({
    sessionId,
    role: "user",
    content: bodyResult.data.content,
    codeSnippet: null,
    codeLanguage: null,
  });

  // Fetch conversation history for context
  const history = await db
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.sessionId, sessionId))
    .orderBy(chatMessagesTable.createdAt);

  const aiMessages = history.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  // Generate AI response (personality is optional, sent from frontend settings)
  const personality = typeof req.body.personality === "string" ? req.body.personality : undefined;
  const aiResponse = await generateAIResponse(aiMessages, personality);

  // Save AI response
  const [assistantMessage] = await db
    .insert(chatMessagesTable)
    .values({
      sessionId,
      role: "assistant",
      content: aiResponse.content,
      codeSnippet: aiResponse.codeSnippet,
      codeLanguage: aiResponse.codeLanguage,
    })
    .returning();

  // Update session timestamp
  await db
    .update(chatSessionsTable)
    .set({ updatedAt: new Date() })
    .where(eq(chatSessionsTable.id, sessionId));

  res.json({
    id: assistantMessage.id,
    sessionId: assistantMessage.sessionId,
    role: assistantMessage.role,
    content: assistantMessage.content,
    codeSnippet: assistantMessage.codeSnippet ?? null,
    codeLanguage: assistantMessage.codeLanguage ?? null,
    createdAt: assistantMessage.createdAt.toISOString(),
  });
});

export default chatRouter;
