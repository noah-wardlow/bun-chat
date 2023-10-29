export interface DecodedToken {
  id: string;
  orgId: string;
}

export enum IncomingMessagetEvents {
  NEW_CHAT_MESSAGE = "NEW_CHAT_MESSAGE",
  SUBSCRIBE_TO_CHANNELS = "SUBSCRIBE_TO_CHANNELS",
  OTHER_EVENT = "OTHER_EVENT",
  // Add other event types here
}

export enum OutgoingMessageEvents {
  MESSAGE_SEND_FAIL = "MESSAGE_SEND_FAIL",
  INVALID_MESSAGE = "INVALID_MESSAGE",
  USER_ONLINE = "USER_ONLINE",
  USER_OFFLINE = "USER_OFFLINE",
}

export interface NewChatMessageData {
  event: IncomingMessagetEvents.NEW_CHAT_MESSAGE;
  payload: {
    channelId: string;
    userId: string;
    content: string;
  };
}

export interface SubscribeToChannelsData {
  payload: { channelIds: string[] };
}

interface OtherEventData {
  event: IncomingMessagetEvents.OTHER_EVENT; // Replace with actual event name
  data: {
    // Define other properties here
  };
}

export type IncomingMessageData = NewChatMessageData | SubscribeToChannelsData;

export interface WebsocketData {
  channels: string[];
  userId: string;
  orgId: string;
}
