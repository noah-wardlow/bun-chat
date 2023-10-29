import { isNewChatMessageData } from "../utils";
import Redis from "ioredis";
import { OutgoingMessageEvents, WebsocketData } from "../types";
import { ServerWebSocket } from "bun";
import sql from "../db";

interface ChatMessage {
  id: string;
  createdAt: string;
}

export default async function handleNewChatMessage(
  parsed: unknown,
  ws: ServerWebSocket<WebsocketData>,
  pub: Redis
) {
  if (isNewChatMessageData(parsed)) {
    try {
      const { payload, event } = parsed;

      const { userId, content, channelId } = payload;

      // save message to db
      const [{ createdAt, id }] = await sql`
      INSERT INTO "Message" ("channelId", "userId", "content")
      VALUES (${channelId}, ${userId}, ${content})
      RETURNING "id", "createdAt"
    `;

      console.log(
        JSON.stringify({
          event,
          payload: {
            ...payload,
            id,
            createdAt,
          },
        })
      );

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
  } else {
    ws.send(JSON.stringify({ event: OutgoingMessageEvents.INVALID_MESSAGE }));
  }
}
