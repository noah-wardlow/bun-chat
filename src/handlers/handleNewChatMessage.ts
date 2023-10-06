import { PrismaClient } from "@newbrains/prisma/client";
import { isNewChatMessageData } from "../utils";
import Redis from "ioredis";
import { OutgoingMessageEvents, WebsocketData } from "../types";
import { ServerWebSocket } from "bun";

export default async function handleNewChatMessage(
  parsed: unknown,
  ws: ServerWebSocket<WebsocketData>,
  prisma: PrismaClient,
  pub: Redis
) {
  if (isNewChatMessageData(parsed)) {
    try {
      const { data, event } = parsed;

      const { channelId, userId, content } = data;

      // save message to db
      const { id, createdAt } = await prisma.message.create({
        data: {
          channelId,
          userId,
          content,
        },
      });

      pub.publish(
        channelId,
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
