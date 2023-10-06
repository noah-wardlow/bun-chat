import Redis from "ioredis";
import jwt from "jsonwebtoken";
import {
  IncomingMessagetEvents,
  OutgoingMessageEvents,
  WebsocketData,
} from "./types";
import { isValidDecodedToken } from "./utils";
import { Server, ServerWebSocket } from "bun";
import { prisma } from "@newbrains/prisma";
import handleNewChatMessage from "./handlers/handleNewChatMessage";

// Load environment variables
const PORT = parseInt(process.env.PORT || "3001", 10);
const HOST = process.env.HOST || "0.0.0.0";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";
const REDIS_REST_URL = process.env.REDIS_REST_URL;
const API_KEY = process.env.API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

if (!REDIS_REST_URL) {
  console.error("REDIS_REST_URL is required");
  process.exit(1);
}
if (!API_KEY) {
  console.error("API_KEY is required");
  process.exit(1);
}

if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

prisma.$connect();

// initialize redis publisher and subscriber
const pub = new Redis(REDIS_REST_URL);
const sub = new Redis(REDIS_REST_URL);

// Track number of users per instance to know when to unsubscribe redis from channels
const userCountPerChannel = new Map<string, number>();
const userCountPerOrg = new Map<string, number>();

const server = Bun.serve<WebsocketData>({
  port: PORT,
  hostname: HOST,
  fetch: async (req, server) => {
    return await handleFetch(req, server);
  },
  websocket: {
    open: async (ws) => {
      await handleOpen(ws);
    },
    message: async (ws, message) => {
      await handleIncomingMsg(message.toString(), ws);
    },
    close: async (ws) => {
      await handleClose(ws);
    },
  },
});

// Redis subscriber listens and will publish to all
// instances subscribed to the same channel via server

sub.on("message", (channel, message) => {
  server.publish(channel, message);
});

console.log(`Listening on ${server.hostname}:${server.port}`);

// Websocket handlers

async function handleOpen(ws: ServerWebSocket<WebsocketData>) {
  // Subscribe to all of the user's channels

  const { channels, orgId, userId } = ws.data;

  channels.forEach((channel) => {
    ws.subscribe(channel);
    sub.subscribe(channel);
    userCountPerChannel.set(
      channel,
      (userCountPerChannel.get(channel) || 0) + 1
    );
  });
  // Subscribe to online users channel for a users org
  const onlineUsersKey = `${orgId}:onlineUsers`;
  sub.subscribe(onlineUsersKey);
  ws.subscribe(onlineUsersKey);

  // Increment user count for org and publish to online users channel

  userCountPerOrg.set(orgId, (userCountPerOrg.get(orgId) || 0) + 1);

  const pipeline = pub.pipeline();
  pipeline.sadd(onlineUsersKey, userId);
  pipeline.publish(
    onlineUsersKey,
    JSON.stringify({
      event: OutgoingMessageEvents.USER_OFFLINE,
      data: {
        userId: userId,
      },
    })
  );
  await pipeline.exec();
}

// Incoming websocket message handler
async function handleIncomingMsg(
  message: string,
  ws: ServerWebSocket<WebsocketData>
) {
  const parsed = JSON.parse(message);
  switch (parsed.event) {
    case IncomingMessagetEvents.NEW_CHAT_MESSAGE:
      await handleNewChatMessage(parsed, ws, prisma, pub);
      break;
    default:
      ws.send(JSON.stringify({ event: OutgoingMessageEvents.INVALID_MESSAGE }));
      break;
  }
}

async function handleClose(ws: ServerWebSocket<WebsocketData>) {
  // Unsubscribe from all of the user's channels when their websocket closes

  const { channels, orgId, userId } = ws.data;

  channels.forEach((channel) => {
    ws.unsubscribe(channel);
    const currentCount = userCountPerChannel.get(channel) || 0;
    const newCount = Math.max(0, currentCount - 1);
    userCountPerChannel.set(channel, newCount);
    if (newCount === 0) {
      // Unsubscribe from channel if no users are subscribed
      sub.unsubscribe(channel);
    }
  });
  // Remove user from online users set and publish to online users channel
  const onlineUsersKey = `${orgId}:onlineUsers`;
  const pipeline = pub.pipeline();
  pipeline.srem(onlineUsersKey, userId);
  pipeline.publish(
    onlineUsersKey,
    JSON.stringify({
      event: OutgoingMessageEvents.USER_OFFLINE,
      userId: userId,
    })
  );
  await pipeline.exec();
  const currentCount = userCountPerOrg.get(orgId) || 0;
  const newCount = Math.max(0, currentCount - 1);
  userCountPerOrg.set(orgId, newCount);
  if (newCount === 0) {
    // Unsubscribe from channel if no users are subscribed
    sub.unsubscribe(onlineUsersKey);
  }
}

// Fetch handler

async function handleFetch(req: Request, server: Server) {
  // Validate origin
  const origin = req.headers.get("origin");
  if (origin !== CORS_ORIGIN) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Pull jwt token from query params
  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? null;

  if (!token) {
    return new Response("Missing required token", { status: 400 });
  }

  // Validate token and extract data to set up websocket
  try {
    // Verify token, throws error if invalid
    const decoded = jwt.verify(token, API_KEY || "", {
      algorithms: ["HS256"],
    });

    // Type check decoded token
    if (!isValidDecodedToken(decoded)) {
      return new Response("Invalid token", { status: 401 });
    }

    const { channels, userId, orgId } = decoded;
    // Upgrade to websocket
    const success = server.upgrade(req, {
      data: { channels, userId, orgId },
      headers: {
        "Set-Cookie": `SessionId=${Date.now()}`,
      },
    });

    if (!success) {
      throw new Response("WebSocket upgrade error", { status: 400 });
    }
    // Return undefined if handshake is successful
    return undefined;
  } catch (err) {
    return new Response("Unauthorized", { status: 401 });
  }
}
