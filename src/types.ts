export interface DecodedToken {
  channels: string[];
  userId: string;
  orgId: string;
}

export enum IncomingMessagetEvents {
  NEW_CHAT_MESSAGE = "NEW_CHAT_MESSAGE",
  OTHER_EVENT = "OTHER_EVENT",
  // Add other event types here
}

interface NewChatMessageData {
  event: IncomingMessagetEvents.NEW_CHAT_MESSAGE;
  data: {
    channelId: string;
    userId: string;
    message: string;
    createdAt: string;
    media: any[]; // Replace with actual type if available
  };
}

interface OtherEventData {
  event: IncomingMessagetEvents.OTHER_EVENT; // Replace with actual event name
  data: {
    // Define other properties here
  };
}

export type IncomingMessageData = NewChatMessageData | OtherEventData;

export interface WebsocketData {
  channels: string[];
  userId: string;
  orgId: string;
}
