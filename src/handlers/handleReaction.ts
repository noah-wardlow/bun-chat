import { ServerWebSocket } from "bun";
import { OutgoingMessageEvents, ReactionData, WebsocketData } from "../types";
import Redis from "ioredis";
import sql from "../db";

export default async function handleNewReply(
  parsed: ReactionData,
  ws: ServerWebSocket<WebsocketData>,
  pub: Redis
) {
  try {
    const { payload, event } = parsed;
    const { userId, messageId, channelId, reaction, replyId } = payload;
    const { unified, emoji, activeSkinTone, isCustom, imageUrl, names } =
      reaction;
    if (replyId) {
      const [{ id, createdAt }] = await sql`
  INSERT INTO "Reaction" ("emoji", "unified", "isCustom", "imageUrl", "names", "activeSkinTone", "userId", "replyId" )
  VALUES (${emoji}, ${unified}, ${isCustom}, ${imageUrl}, ${names}, ${activeSkinTone}, ${userId}, ${replyId})
  RETURNING "id", "createdAt"
`;

      pub.publish(
        channelId,
        JSON.stringify({
          event,
          payload: {
            ...payload.reaction,
            replyId,
            messageId,
            userId,
            id,
            createdAt,
            channelId,
          },
        })
      );
    } else if (messageId) {
      const [{ id, createdAt }] = await sql`
  INSERT INTO "Reaction" ("emoji", "unified", "isCustom", "imageUrl", "names", "activeSkinTone", "userId", "messageId" )
  VALUES (${emoji}, ${unified}, ${isCustom}, ${imageUrl}, ${names}, ${activeSkinTone}, ${userId}, ${messageId})
  RETURNING "id", "createdAt"
`;

      pub.publish(
        channelId,
        JSON.stringify({
          event,
          payload: {
            ...payload.reaction,
            messageId,
            userId,
            id,
            createdAt,
            channelId,
          },
        })
      );
    }
  } catch (err) {
    console.error(err);
    ws.send(JSON.stringify({ event: OutgoingMessageEvents.MESSAGE_SEND_FAIL }));
  }
}
