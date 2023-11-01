export interface DecodedToken {
  id: string;
  orgId: string;
}

export enum IncomingMessagetEvents {
  NEW_CHAT_MESSAGE = "NEW_CHAT_MESSAGE",
  SUBSCRIBE_TO_CHANNELS = "SUBSCRIBE_TO_CHANNELS",
  TOGGLE_REACTION = "TOGGLE_REACTION",
  NEW_REPLY_IN_THREAD = "NEW_REPLY_IN_THREAD",
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

export interface NewReplyInThreadData {
  event: IncomingMessagetEvents.NEW_REPLY_IN_THREAD;
  payload: {
    channelId: string;
    userId: string;
    content: string;
    threadId: string;
    messageId: string;
  };
}

export interface Reaction {
  activeSkinTone: string;
  emoji: string;
  unified: string;
  isCustom: boolean;
  imageUrl: string;
  names: string[];
}

type MessageOrReplyId =
  | { messageId: string; replyId?: never }
  | { messageId?: never; replyId: string };

export interface ReactionData {
  event: IncomingMessagetEvents.TOGGLE_REACTION;
  payload: {
    reaction: Reaction;
    channelId: string;
    userId: string;
  } & MessageOrReplyId;
}

export interface SubscribeToChannelsData {
  payload: { channelIds: string[] };
}

export type IncomingMessageData = NewChatMessageData | SubscribeToChannelsData;

export interface WebsocketData {
  channels: string[];
  userId: string;
  orgId: string;
}
