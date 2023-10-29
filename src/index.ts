import Redis from "ioredis";
import {
  IncomingMessagetEvents,
  OutgoingMessageEvents,
  WebsocketData,
} from "./types";
import { ServerWebSocket } from "bun";
import handleNewChatMessage from "./handlers/handleNewChatMessage";
import { handleFetch } from "./handlers/handleFetch";

// Load environment variables
const PORT = parseInt(process.env.PORT || "3001", 10);
const HOST = process.env.HOST || "0.0.0.0";
const REDIS_REST_URL = process.env.REDIS_REST_URL;
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;
const DATABASE_URL = process.env.DATABASE_URL;

if (!REDIS_REST_URL) {
  console.error("REDIS_REST_URL is required");
  process.exit(1);
}
if (!NEXTAUTH_SECRET) {
  console.error("NEXTAUTH_SECRET is required");
  process.exit(1);
}

if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

// prisma.$connect();

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
      await onOpen(ws);
    },
    message: async (ws, message) => {
      await onMsg(message.toString(), ws);
    },
    close: async (ws) => {
      await onClose(ws);
    },
  },
});

// Redis subscriber listens and will publish to all
// instances subscribed to the same channel via server

sub.on("message", (channel, message) => {
  server.publish(channel, message);
});

console.log(`Listening on ${server.hostname}:${server.port}`);

// Websocket open, message, close handlers

async function onOpen(ws: ServerWebSocket<WebsocketData>) {
  const { channels, orgId, userId } = ws.data;

  // Subscribe to all of the user's channels
  subscribeToChannels(channels, ws);
  // Subscribe to online users channel for a users org
  const onlineUsersKey = `${orgId}:onlineUsers`;
  sub.subscribe(onlineUsersKey);
  ws.subscribe(onlineUsersKey);

  // const userNotifKey = `${userId}:notifications`;
  // sub.subscribe(userNotifKey);
  // ws.subscribe(userNotifKey);

  // Increment user count for org and publish to online users channel

  userCountPerOrg.set(orgId, (userCountPerOrg.get(orgId) || 0) + 1);

  const pipeline = pub.pipeline();
  pipeline.sadd(onlineUsersKey, userId);
  pipeline.publish(
    onlineUsersKey,
    JSON.stringify({
      event: OutgoingMessageEvents.USER_ONLINE,
      data: {
        userId: userId,
      },
    })
  );
  await pipeline.exec();
}

// Incoming websocket message handler
async function onMsg(message: string, ws: ServerWebSocket<WebsocketData>) {
  const parsed = JSON.parse(message);
  switch (parsed.event) {
    case IncomingMessagetEvents.NEW_CHAT_MESSAGE:
      await handleNewChatMessage(parsed, ws, pub);
      break;
    case IncomingMessagetEvents.SUBSCRIBE_TO_CHANNELS:
      console.log(message);
      subscribeToChannels(parsed.payload.channelIds, ws);
    default:
      ws.send(JSON.stringify({ event: OutgoingMessageEvents.INVALID_MESSAGE }));
      break;
  }
}

async function onClose(ws: ServerWebSocket<WebsocketData>) {
  const { channels, orgId, userId } = ws.data;

  // Unsubscribe from all of the user's channels when their websocket closes
  unsubscribeFromChannels(channels);
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
  sub.unsubscribe(`${userId}:notifications`);
}

function subscribeToChannels(
  channelIds: string[],
  ws: ServerWebSocket<WebsocketData>
) {
  for (const channel of channelIds) {
    ws.subscribe(channel);
    sub.subscribe(channel);
    userCountPerChannel.set(
      channel,
      (userCountPerChannel.get(channel) || 0) + 1
    );
  }
}

function unsubscribeFromChannels(channelIds: string[]) {
  for (const channel of channelIds) {
    const currentCount = userCountPerChannel.get(channel) || 0;
    const newCount = Math.max(0, currentCount - 1);
    userCountPerChannel.set(channel, newCount);
    if (newCount === 0) {
      // Unsubscribe from channel if no users are subscribed
      sub.unsubscribe(channel);
    }
  }
}
