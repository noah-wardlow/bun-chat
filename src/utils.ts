import {
  DecodedToken,
  NewChatMessageData,
  IncomingMessagetEvents,
  NewReplyInThreadData,
} from "./types";

export function isValidDecodedToken(obj: unknown): obj is DecodedToken {
  return (
    obj instanceof Object &&
    // "channels" in obj &&
    // Array.isArray(obj.channels) &&
    "id" in obj &&
    typeof obj.id === "string"
    //  &&
    // "orgId" in obj &&
    // typeof obj.orgId === "string"
  );
}
export function isNewChatMessageData(obj: unknown): obj is NewChatMessageData {
  return (
    obj instanceof Object &&
    "event" in obj &&
    obj.event === IncomingMessagetEvents.NEW_CHAT_MESSAGE &&
    "payload" in obj &&
    obj.payload instanceof Object &&
    "userId" in obj.payload &&
    "content" in obj.payload &&
    "channelId" in obj.payload
  );
}

export function isNewReplyInThreadData(
  obj: unknown
): obj is NewReplyInThreadData {
  return (
    obj instanceof Object &&
    "event" in obj &&
    obj.event === IncomingMessagetEvents.NEW_REPLY_IN_THREAD &&
    "payload" in obj &&
    obj.payload instanceof Object &&
    "threadId" in obj.payload &&
    "userId" in obj.payload &&
    "content" in obj.payload &&
    "channelId" in obj.payload &&
    "messageId" in obj.payload
  );
}

export function parseCookies(cookieString: string | null): {
  [key: string]: string;
} {
  const cookies: { [key: string]: string } = {};
  if (cookieString) {
    const items = cookieString.split(";");
    items.forEach((item) => {
      const parts = item.split("=");
      cookies[parts[0].trim()] = parts[1];
    });
  }
  return cookies;
}

// async function editListItem(redis, listKey, index, newItem) {
//   try {
//     // Set the new item at the specific index
//     await redis.lset(listKey, index, newItem);
//   } catch (err) {
//     console.error('Error setting item:', err);
//   }
// }

// export const incrementAndSave = `
// local nextId = redis.call('INCR', KEYS[1])
// redis.call('ZADD', KEYS[2], nextId, ARGV[1])
// return nextId`;

// const nextId = await pub.eval(
//     incrementAndSave,
//     2,
//     `chat:${data.channelId}:nextId`,
//     `chat:${data.channelId}:messages`,
//     JSON.stringify(data)
//   );
