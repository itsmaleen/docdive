import { Store } from "@tanstack/store";
import type { Message } from "./chat-api";

export const chatStore = new Store({
  messages: [] as Message[],
});

export const addMessage = (message: Message) => {
  chatStore.setState((state) => ({
    ...state,
    messages: [...state.messages, message],
  }));
};

export const clearMessages = () => {
  chatStore.setState((state) => ({
    ...state,
    messages: [],
  }));
};
