export interface DecodedToken {
  id: string;
  orgId: string;
}

export enum IncomingMessagetEvents {
  NEW_CHAT_MESSAGE = "NEW_CHAT_MESSAGE",
  SUBSCRIBE_TO_CHANNELS = "SUBSCRIBE_TO_CHANNELS",
  ADD_REACTION = "ADD_REACTION",
  NEW_REPLY_IN_THREAD = "NEW_REPLY_IN_THREAD",
  REMOVE_REACTION = "REMOVE_REACTION",
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
    user: any;
    content: string;
  };
}

export interface NewReplyInThreadData {
  event: IncomingMessagetEvents.NEW_REPLY_IN_THREAD;
  payload: {
    channelId: string;
    user: any;
    content: string;
    threadId: string;
    messageId: string;
  };
}

export interface Reaction {
  emojiId: string;
  skin: number;
  native: string;
  unified: string;
  name: string;
  shortcodes: string;
}

type MessageOrReplyId =
  | { messageId: string; replyId?: never }
  | { messageId?: never; replyId: string };

export interface ReactionData {
  event: IncomingMessagetEvents.ADD_REACTION;
  payload: {
    reaction: Reaction;
    channelId: string;
    user: any;
  } & MessageOrReplyId;
}

export interface RemoveReactionData {
  event: IncomingMessagetEvents.REMOVE_REACTION;
  payload: {
    reactionId: string;
    channelId: string;
    user: any;
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
