import Redis from "ioredis";
import {
  NewChatMessageData,
  OutgoingMessageEvents,
  WebsocketData,
} from "../types";
import { ServerWebSocket } from "bun";
import sql from "../db";

export default async function handleNewChatMessage(
  parsed: NewChatMessageData,
  ws: ServerWebSocket<WebsocketData>,
  pub: Redis
) {
  try {
    const { payload, event } = parsed;

    const { userId, content, channelId } = payload;

    // save message to db
    const [{ createdAt, id }] = await sql`
      INSERT INTO "Message" ("channelId", "userId", "content")
      VALUES (${channelId}, ${userId}, ${content})
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
