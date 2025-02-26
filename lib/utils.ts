import {
  CoreMessage,
  CoreToolMessage,
  generateId,
  Message,
  ToolInvocation,
} from "ai";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import { Chat } from "@/db/schema";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ApplicationError extends Error {
  info: string;
  status: number;
}

export const fetcher = async (url: string) => {
  const res = await fetch(url);

  if (!res.ok) {
    const error = new Error(
      "An error occurred while fetching the data.",
    ) as ApplicationError;

    error.info = await res.json();
    error.status = res.status;

    throw error;
  }

  return res.json();
};

export function getLocalStorage(key: string) {
  if (typeof window !== "undefined") {
    return JSON.parse(localStorage.getItem(key) || "[]");
  }
  return [];
}

export function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function addToolMessageToChat({
  toolMessage,
  messages,
}: {
  toolMessage: CoreToolMessage;
  messages: Array<Message>;
}): Array<Message> {
  return messages.map((message) => {
    if (message.toolInvocations) {
      return {
        ...message,
        toolInvocations: message.toolInvocations.map((toolInvocation) => {
          const toolResult = toolMessage.content.find(
            (tool) => tool.toolCallId === toolInvocation.toolCallId,
          );

          if (toolResult) {
            return {
              ...toolInvocation,
              state: "result",
              result: toolResult.result,
            };
          }

          return toolInvocation;
        }),
      };
    }

    return message;
  });
}

export function convertToUIMessages(
  messages: Array<CoreMessage>,
): Array<Message> {
  return messages.reduce((chatMessages: Array<Message>, message) => {
    if (message.role === "tool") {
      return addToolMessageToChat({
        toolMessage: message as CoreToolMessage,
        messages: chatMessages,
      });
    }

    let textContent = "";
    let toolInvocations: Array<ToolInvocation> = [];

    if (typeof message.content === "string") {
      textContent = message.content;
    } else if (Array.isArray(message.content)) {
      for (const content of message.content) {
        if (content.type === "text") {
          textContent += content.text;
        } else if (content.type === "tool-call") {
          toolInvocations.push({
            state: "call",
            toolCallId: content.toolCallId,
            toolName: content.toolName,
            args: content.args,
          });
        }
      }
    }

    chatMessages.push({
      id: generateId(),
      role: message.role,
      content: textContent,
      toolInvocations,
    });

    return chatMessages;
  }, []);
}

export function getTitleFromChat(chat: Chat) {
  try {
    // Ensure we have messages
    if (!chat.messages || !Array.isArray(chat.messages)) {
      return "Untitled Chat";
    }

    const messages = chat.messages as Array<CoreMessage>;
    
    // Convert messages to UI format to handle different message types properly
    const uiMessages = convertToUIMessages(messages);
    
    // Get all user messages
    const userMessages = uiMessages.filter(msg => msg.role === 'user' && msg.content?.trim().length > 0);
    
    if (!userMessages.length) {
      return "Untitled Chat";
    }

    // Try to find a meaningful title from user messages
    for (const msg of userMessages) {
      const content = msg.content.trim();
      
      // Skip very short messages or common queries
      if (content.length < 3 || /^(hi|hello|hey|test)$/i.test(content)) {
        continue;
      }

      // If it's a question, use it as title
      if (content.includes('?')) {
        const question = content.split('?')[0] + '?';
        if (question.length <= 50) {
          return question;
        }
        return question.slice(0, 47) + '...';
      }

      // For other messages, use smart truncation
      if (content.length <= 50) {
        return content;
      }

      // Create a smart truncation
      const words = content.split(/\s+/).slice(0, 8);
      let title = words.join(' ');
      
      if (title.length > 47) {
        title = title.slice(0, 47);
      }
      
      return title + '...';
    }

    // If no good title found from messages, use timestamp-based title
    return "Chat from " + new Date(chat.createdAt).toLocaleDateString();
  } catch (error) {
    console.error('Error generating chat title:', error);
    return "Untitled Chat";
  }
}
