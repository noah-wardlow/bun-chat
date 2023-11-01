import { ServerWebSocket } from "bun";
import {
  NewReplyInThreadData,
  OutgoingMessageEvents,
  WebsocketData,
} from "../types";
import Redis from "ioredis";
import sql from "../db";

export default async function handleNewReply(
  parsed: NewReplyInThreadData,
  ws: ServerWebSocket<WebsocketData>,
  pub: Redis
) {
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
    ws.send(JSON.stringify({ event: OutgoingMessageEvents.MESSAGE_SEND_FAIL }));
  }
}
