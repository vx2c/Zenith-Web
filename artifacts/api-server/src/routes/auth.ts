import { Router } from "express";
import type { IRouter } from "express";
import { randomBytes } from "crypto";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const authRouter: IRouter = Router();

const ROBLOX_CLIENT_ID = process.env.ROBLOX_CLIENT_ID ?? "";
const ROBLOX_CLIENT_SECRET = process.env.ROBLOX_CLIENT_SECRET ?? "";
const ROBLOX_REDIRECT_URI = process.env.ROBLOX_REDIRECT_URI ?? "";

const ROBLOX_AUTH_URL = "https://apis.roblox.com/oauth/v1/authorize";
const ROBLOX_TOKEN_URL = "https://apis.roblox.com/oauth/v1/token";
const ROBLOX_USERINFO_URL = "https://apis.roblox.com/oauth/v1/userinfo";

// GET /api/auth/me - returns current user or unauthenticated
authRouter.get("/auth/me", async (req, res): Promise<void> => {
  const session = (req as any).session;
  if (!session?.userId) {
    res.json({ authenticated: false });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, session.userId))
    .limit(1);

  if (!user) {
    session.destroy(() => {});
    res.json({ authenticated: false });
    return;
  }

  res.json({
    authenticated: true,
    user: {
      id: user.id,
      robloxId: user.robloxId,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt.toISOString(),
    },
  });
});

// POST /api/auth/logout
authRouter.post("/auth/logout", (req, res): void => {
  const session = (req as any).session;
  session.destroy(() => {
    res.json({ success: true });
  });
});

// GET /api/auth/roblox - initiate Roblox OAuth
authRouter.get("/auth/roblox", (req, res): void => {
  if (!ROBLOX_CLIENT_ID || !ROBLOX_REDIRECT_URI) {
    res.status(503).json({
      error: "Roblox OAuth not configured. Please set ROBLOX_CLIENT_ID and ROBLOX_REDIRECT_URI.",
    });
    return;
  }

  // Generate and store a random state token to prevent login CSRF
  const state = randomBytes(24).toString("hex");
  (req as any).session.oauthState = state;

  const params = new URLSearchParams({
    client_id: ROBLOX_CLIENT_ID,
    redirect_uri: ROBLOX_REDIRECT_URI,
    response_type: "code",
    scope: "openid profile",
    state,
  });

  res.redirect(`${ROBLOX_AUTH_URL}?${params.toString()}`);
});

// GET /api/auth/roblox/callback - handle Roblox OAuth callback
authRouter.get("/auth/roblox/callback", async (req, res): Promise<void> => {
  const { code, error, state } = req.query as { code?: string; error?: string; state?: string };

  if (error || !code) {
    req.log.warn({ error }, "Roblox OAuth callback error");
    res.redirect("/?error=oauth_failed");
    return;
  }

  // Validate state to prevent login CSRF / session fixation
  const session = (req as any).session;
  const expectedState = session.oauthState as string | undefined;
  delete session.oauthState;

  if (!state || !expectedState || state !== expectedState) {
    req.log.warn({ state, expectedState }, "OAuth state mismatch — possible CSRF attempt");
    res.redirect("/?error=invalid_state");
    return;
  }

  if (!ROBLOX_CLIENT_ID || !ROBLOX_CLIENT_SECRET || !ROBLOX_REDIRECT_URI) {
    res.redirect("/?error=not_configured");
    return;
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch(ROBLOX_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          Buffer.from(`${ROBLOX_CLIENT_ID}:${ROBLOX_CLIENT_SECRET}`).toString(
            "base64",
          ),
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: ROBLOX_REDIRECT_URI,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      req.log.error({ status: tokenResponse.status, body: errText }, "Token exchange failed");
      res.redirect("/?error=token_exchange_failed");
      return;
    }

    const tokens = (await tokenResponse.json()) as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };

    // Fetch user info from Roblox
    const userInfoResponse = await fetch(ROBLOX_USERINFO_URL, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      req.log.error({ status: userInfoResponse.status }, "Userinfo fetch failed");
      res.redirect("/?error=userinfo_failed");
      return;
    }

    const userInfo = (await userInfoResponse.json()) as {
      sub: string;
      name?: string;
      preferred_username?: string;
      picture?: string;
    };

    const robloxId = userInfo.sub;
    const username = userInfo.preferred_username ?? "Unknown";
    const displayName = userInfo.name ?? username;
    const avatarUrl = userInfo.picture ?? null;
    const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    // Upsert user in DB
    const [user] = await db
      .insert(usersTable)
      .values({
        robloxId,
        username,
        displayName,
        avatarUrl,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiresAt,
      })
      .onConflictDoUpdate({
        target: usersTable.robloxId,
        set: {
          username,
          displayName,
          avatarUrl,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiresAt,
          updatedAt: new Date(),
        },
      })
      .returning();

    // Set session
    (req as any).session.userId = user.id;
    req.log.info({ userId: user.id, robloxId }, "User authenticated via Roblox OAuth");

    res.redirect("/");
  } catch (err) {
    req.log.error({ err }, "Roblox OAuth callback error");
    res.redirect("/?error=internal_error");
  }
});

export default authRouter;
