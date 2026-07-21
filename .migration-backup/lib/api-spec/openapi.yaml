openapi: 3.1.0
info:
  # Do not change the title, if the title changes, the import paths will be broken
  title: Api
  version: 0.1.0
  description: Roblox Studio AI - Chatbot API for Roblox game modification
servers:
  - url: /api
    description: Base API path
tags:
  - name: health
    description: Health operations
  - name: auth
    description: Roblox OAuth authentication
  - name: chat
    description: Chat and AI interactions
  - name: sessions
    description: Chat session management

paths:
  /healthz:
    get:
      operationId: healthCheck
      tags: [health]
      summary: Health check
      description: Returns server health status
      responses:
        "200":
          description: Healthy
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/HealthStatus"

  /auth/me:
    get:
      operationId: getMe
      tags: [auth]
      summary: Get current authenticated user
      description: Returns the currently logged-in Roblox user, or null if not authenticated
      responses:
        "200":
          description: Current user info or null
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/AuthStatus"

  /auth/logout:
    post:
      operationId: logout
      tags: [auth]
      summary: Log out current user
      description: Clears the session and logs the user out
      responses:
        "200":
          description: Successfully logged out
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/LogoutResult"

  /chat/sessions:
    get:
      operationId: listChatSessions
      tags: [sessions]
      summary: List chat sessions
      description: Returns all chat sessions for the current user
      responses:
        "200":
          description: List of chat sessions
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/ChatSession"
    post:
      operationId: createChatSession
      tags: [sessions]
      summary: Create a new chat session
      description: Creates a new chat session for a Roblox project
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/ChatSessionInput"
      responses:
        "201":
          description: Chat session created
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/ChatSession"

  /chat/sessions/{sessionId}:
    get:
      operationId: getChatSession
      tags: [sessions]
      summary: Get a specific chat session
      parameters:
        - name: sessionId
          in: path
          required: true
          schema:
            type: string
      responses:
        "200":
          description: Chat session details
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/ChatSession"
        "404":
          description: Session not found
    delete:
      operationId: deleteChatSession
      tags: [sessions]
      summary: Delete a chat session
      parameters:
        - name: sessionId
          in: path
          required: true
          schema:
            type: string
      responses:
        "200":
          description: Session deleted
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/DeleteResult"

  /chat/sessions/{sessionId}/messages:
    get:
      operationId: listMessages
      tags: [chat]
      summary: List messages in a session
      parameters:
        - name: sessionId
          in: path
          required: true
          schema:
            type: string
      responses:
        "200":
          description: List of messages
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/ChatMessage"
    post:
      operationId: sendMessage
      tags: [chat]
      summary: Send a message and get AI response
      description: Sends a user message and returns the AI assistant response with optional Roblox script modifications
      parameters:
        - name: sessionId
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/MessageInput"
      responses:
        "200":
          description: AI response with optional code changes
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/ChatMessage"

  /chat/stats:
    get:
      operationId: getChatStats
      tags: [chat]
      summary: Get chat statistics summary
      description: Returns summary stats - total sessions, messages, recent activity
      responses:
        "200":
          description: Chat usage statistics
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/ChatStats"

components:
  schemas:
    HealthStatus:
      type: object
      properties:
        status:
          type: string
      required:
        - status

    AuthStatus:
      type: object
      properties:
        authenticated:
          type: boolean
        user:
          $ref: "#/components/schemas/RobloxUser"
      required:
        - authenticated

    RobloxUser:
      type: object
      properties:
        id:
          type: string
        robloxId:
          type: string
        username:
          type: string
        displayName:
          type: string
        avatarUrl:
          type: ["string", "null"]
        createdAt:
          type: string
      required:
        - id
        - robloxId
        - username
        - displayName
        - createdAt

    LogoutResult:
      type: object
      properties:
        success:
          type: boolean
      required:
        - success

    DeleteResult:
      type: object
      properties:
        success:
          type: boolean
      required:
        - success

    ChatSession:
      type: object
      properties:
        id:
          type: string
        title:
          type: string
        projectName:
          type: ["string", "null"]
        messageCount:
          type: integer
        lastMessageAt:
          type: ["string", "null"]
        createdAt:
          type: string
      required:
        - id
        - title
        - messageCount
        - createdAt

    ChatSessionInput:
      type: object
      properties:
        title:
          type: string
        projectName:
          type: string
      required:
        - title

    ChatMessage:
      type: object
      properties:
        id:
          type: string
        sessionId:
          type: string
        role:
          type: string
          enum: [user, assistant]
        content:
          type: string
        codeSnippet:
          type: ["string", "null"]
        codeLanguage:
          type: ["string", "null"]
        createdAt:
          type: string
      required:
        - id
        - sessionId
        - role
        - content
        - createdAt

    MessageInput:
      type: object
      properties:
        content:
          type: string
      required:
        - content

    ChatStats:
      type: object
      properties:
        totalSessions:
          type: integer
        totalMessages:
          type: integer
        sessionsThisWeek:
          type: integer
        messagesThisWeek:
          type: integer
      required:
        - totalSessions
        - totalMessages
        - sessionsThisWeek
        - messagesThisWeek
