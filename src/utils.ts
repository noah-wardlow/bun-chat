import {
  DecodedToken,
  NewChatMessageData,
  IncomingMessagetEvents,
} from "./types";

export function isValidDecodedToken(obj: unknown): obj is DecodedToken {
  return (
    obj instanceof Object &&
    "channels" in obj &&
    Array.isArray(obj.channels) &&
    "userId" in obj &&
    typeof obj.userId === "string" &&
    "orgId" in obj &&
    typeof obj.orgId === "string"
  );
}
export function isNewChatMessageData(obj: unknown): obj is NewChatMessageData {
  return (
    obj instanceof Object &&
    "event" in obj &&
    obj.event === IncomingMessagetEvents.NEW_CHAT_MESSAGE
  );
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
