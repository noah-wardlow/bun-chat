import { ServerWebSocket } from "bun";
import {
  OutgoingMessageEvents,
  ReactionData,
  RemoveReactionData,
  WebsocketData,
} from "../types";
import Redis from "ioredis";
import sql from "../db";

export async function handleAddReaction(
  parsed: ReactionData,
  ws: ServerWebSocket<WebsocketData>,
  pub: Redis
) {
  try {
    const { payload, event } = parsed;
    const { user, messageId, channelId, reaction, replyId } = payload;
    const { unified, native, skin, name, shortcodes, emojiId } = reaction;
    if (replyId) {
      const [{ id, createdAt }] = await sql`
      INSERT INTO "Reaction" ("emojiId", "native", "unified", "name", "skin", "shortcodes", "userId", "replyId" )
      VALUES (${emojiId}, ${native}, ${unified}, ${name}, ${skin}, ${shortcodes}, ${user.id}, ${replyId})
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
            user,
            id,
            createdAt,
            channelId,
          },
        })
      );
    } else if (messageId) {
      const [{ id, createdAt }] = await sql`
      INSERT INTO "Reaction" ("emojiId", "native", "unified", "name", "skin", "shortcodes", "userId", "messageId" )
      VALUES (${emojiId}, ${native}, ${unified}, ${name}, ${skin}, ${shortcodes}, ${user.id}, ${messageId})
      RETURNING "id", "createdAt"
    `;

      pub.publish(
        channelId,
        JSON.stringify({
          event,
          payload: {
            ...payload.reaction,
            messageId,
            user,
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

export async function handleRemoveReaction(
  parsed: RemoveReactionData,
  ws: ServerWebSocket<WebsocketData>,
  pub: Redis
) {
  try {
    const { payload, event } = parsed;
    const { reactionId, channelId } = payload;
    await sql`
      DELETE FROM "Reaction"
      WHERE "id" = ${reactionId}
    `;

    pub.publish(
      channelId,
      JSON.stringify({
        event,
        payload,
      })
    );
  } catch (err) {
    console.error(err);
    ws.send(JSON.stringify({ event: OutgoingMessageEvents.MESSAGE_SEND_FAIL }));
  }
}
