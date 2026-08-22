import type { Boyfriend, Message } from "@/lib/types";

export interface ChatState {
  boyfriends: Boyfriend[];
  messagesByBoyfriend: Record<string, Message[]>;
  streamingText: string | null;
  streamingBoyfriendId: string | null;
  isStreaming: boolean;
  loading: boolean;
}

export type ChatAction =
  | { type: "INIT"; boyfriends: Boyfriend[] }
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "ADD_BOYFRIEND"; boyfriend: Boyfriend }
  | { type: "UPDATE_BOYFRIEND"; boyfriend: Boyfriend }
  | { type: "DELETE_BOYFRIEND"; boyfriendId: string }
  | { type: "SET_MESSAGES"; boyfriendId: string; messages: Message[] }
  | { type: "ADD_MESSAGE"; boyfriendId: string; message: Message }
  | { type: "START_STREAMING"; boyfriendId: string }
  | { type: "APPEND_STREAMING"; text: string }
  | { type: "END_STREAMING" };

export const initialChatState: ChatState = {
  boyfriends: [],
  messagesByBoyfriend: {},
  streamingText: null,
  streamingBoyfriendId: null,
  isStreaming: false,
  loading: false,
};

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "INIT":
      return { ...state, boyfriends: action.boyfriends, loading: false };
    case "SET_LOADING":
      return { ...state, loading: action.loading };
    case "ADD_BOYFRIEND":
      return {
        ...state,
        boyfriends: [action.boyfriend, ...state.boyfriends],
        messagesByBoyfriend: {
          ...state.messagesByBoyfriend,
          [action.boyfriend.id]: [],
        },
      };
    case "UPDATE_BOYFRIEND":
      return {
        ...state,
        boyfriends: state.boyfriends.map((b) =>
          b.id === action.boyfriend.id ? action.boyfriend : b
        ),
      };
    case "DELETE_BOYFRIEND": {
      const { [action.boyfriendId]: _, ...rest } = state.messagesByBoyfriend;
      return {
        ...state,
        boyfriends: state.boyfriends.filter((b) => b.id !== action.boyfriendId),
        messagesByBoyfriend: rest,
      };
    }
    case "SET_MESSAGES":
      return {
        ...state,
        messagesByBoyfriend: {
          ...state.messagesByBoyfriend,
          [action.boyfriendId]: action.messages,
        },
      };
    case "ADD_MESSAGE":
      return {
        ...state,
        messagesByBoyfriend: {
          ...state.messagesByBoyfriend,
          [action.boyfriendId]: [
            ...(state.messagesByBoyfriend[action.boyfriendId] ?? []),
            action.message,
          ],
        },
      };
    case "START_STREAMING":
      return {
        ...state,
        isStreaming: true,
        streamingText: "",
        streamingBoyfriendId: action.boyfriendId,
      };
    case "APPEND_STREAMING":
      return {
        ...state,
        streamingText: (state.streamingText ?? "") + action.text,
      };
    case "END_STREAMING":
      return {
        ...state,
        isStreaming: false,
        streamingText: null,
        streamingBoyfriendId: null,
      };
    default:
      return state;
  }
}
