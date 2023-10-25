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
      const { data, event } = parsed;

      const { userId, content, channelId } = data;

      // save message to db
      const [{ createdAt, id }] = await sql`
      INSERT INTO "Message" ("channelId", "userId", "content")
      VALUES (${channelId}, ${userId}, ${content})
      RETURNING "id", "createdAt"
    `;

      console.log(
        JSON.stringify({
          event,
          data: {
            ...data,
            id,
            event,
            createdAt,
          },
        })
      );

      pub.publish(
        channelId,
        JSON.stringify({
          event,
          data: {
            // ...data,
            channelId,
            id,
            event,
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
