import { ServerWebSocket } from "bun";
import { OutgoingMessageEvents, WebsocketData } from "../types";
import Redis from "ioredis";
import sql from "../db";
import { isNewReplyInThreadData } from "../utils";

export default async function handleNewReply(
  parsed: unknown,
  ws: ServerWebSocket<WebsocketData>,
  pub: Redis
) {
  if (isNewReplyInThreadData(parsed)) {
    try {
      const { payload, event } = parsed;
      const { threadId, userId, content, channelId } = payload;

      const [{ createdAt, id }] = await sql`
    INSERT INTO "Reply" ("threadId", "userId", "content")
    VALUES (${threadId}, ${userId}, ${content})
    RETURNING "id", "createdAt"
  `;

      pub.publish(
        channelId,
        JSON.stringify({
          event,
          payload: {
            ...payload,
            id,
            createdAt,
          },
        })
      );
    } catch (err) {
      console.error(err);
      ws.send(
        JSON.stringify({ event: OutgoingMessageEvents.MESSAGE_SEND_FAIL })
      );
    }
  }
}
