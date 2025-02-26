"use client";

import { Attachment, ToolInvocation } from "ai";
import { motion } from "framer-motion";
import { ReactNode } from "react";

import { BotIcon, UserIcon } from "./icons";
import { Markdown } from "./markdown";
import { PreviewAttachment } from "./preview-attachment";
import { Weather } from "./weather";

export const Message = ({
  chatId,
  role,
  content,
  toolInvocations,
}: {
  chatId: string;
  role: string;
  content: string | ReactNode;
  toolInvocations: Array<ToolInvocation> | undefined;
}) => {
  const isUser = role === "user";

  return (
    <motion.div
      className={`flex gap-4 px-4 w-full md:max-w-3xl mx-auto ${
        isUser 
          ? "flex-row-reverse" 
          : "flex-row"
      }`}
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      <div className={`size-[28px] border rounded-full p-1.5 flex flex-col justify-center items-center shrink-0 ${
        isUser 
          ? "bg-blue-500 border-blue-600 text-white" 
          : "bg-gray-100 border-gray-200 dark:bg-gray-800 dark:border-gray-700 text-gray-500"
      }`}>
        {isUser ? <UserIcon /> : <BotIcon />}
      </div>

      <div className={`flex flex-col gap-2 w-full max-w-[85%] ${isUser ? "items-end" : "items-start"}`}>
        {content && typeof content === "string" && (
          <div className={`text-sm md:text-base px-4 py-2.5 rounded-2xl ${
            isUser
              ? "bg-blue-500 text-white"
              : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
          }`}>
            <Markdown>{content}</Markdown>
          </div>
        )}

        {toolInvocations && (
          <div className="flex flex-col gap-4">
            {toolInvocations.map((toolInvocation) => {
              const { toolName, toolCallId, state } = toolInvocation;

              if (state === "result") {
                const { result } = toolInvocation;

                return (
                  <div key={toolCallId}>
                    {toolName === "getWeather" ? (
                      <Weather weatherAtLocation={result} />
                    ) : (
                      <div>{JSON.stringify(result, null, 2)}</div>
                    )}
                  </div>
                );
              } else {
                return (
                  <div key={toolCallId} className="skeleton">
                    {toolName === "getWeather" ? (
                      <Weather />
                    ) : null}
                  </div>
                );
              }
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
};
