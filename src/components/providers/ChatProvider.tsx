"use client";

import {
  createContext,
  useContext,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";

import {
  chatReducer,
  initialChatState,
  type ChatAction,
  type ChatState,
} from "@/store/chatStore";

const ChatContext = createContext<ChatState | null>(null);
const ChatDispatchContext = createContext<Dispatch<ChatAction> | null>(null);

export function ChatProvider({
  children,
}: {
  children: ReactNode;
}): React.ReactElement {
  const [state, dispatch] = useReducer(chatReducer, initialChatState);

  return (
    <ChatContext.Provider value={state}>
      <ChatDispatchContext.Provider value={dispatch}>
        {children}
      </ChatDispatchContext.Provider>
    </ChatContext.Provider>
  );
}

export function useChatState(): ChatState {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatState must be used within ChatProvider");
  }
  return context;
}

export function useChatDispatch(): Dispatch<ChatAction> {
  const context = useContext(ChatDispatchContext);
  if (!context) {
    throw new Error("useChatDispatch must be used within ChatProvider");
  }
  return context;
}
