"use client";

import { Attachment, Message } from "ai";
import { useChat } from "ai/react";
import { useState } from "react";

import { Message as PreviewMessage } from "@/components/custom/message";
import { useScrollToBottom } from "@/components/custom/use-scroll-to-bottom";
import { MultimodalInput } from "./multimodal-input";
import { Overview } from "./overview";
import { PreviewAttachment } from "./preview-attachment";

export function Chat({
  id,
  initialMessages,
}: {
  id: string;
  initialMessages: Array<Message>;
}) {
  const { messages, handleSubmit, input, setInput, append, isLoading, stop } =
    useChat({
      id,
      body: { id },
      initialMessages,
      maxSteps: 10,
      onFinish: () => {
        window.history.replaceState({}, "", `/chat/${id}`);
      },
    });

  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();
  const [attachments, setAttachments] = useState<Array<Attachment>>([]);

  return (
    <div className="flex h-dvh bg-background items-stretch">
      {/* Left panel: chat messages and input */}
      <div className="flex flex-col w-1/2">
        <div
          ref={messagesContainerRef}
          className="grow overflow-y-scroll p-4"
        >
          {messages.length === 0 && <Overview />}
          {messages.map((message) => (
            <PreviewMessage
              key={message.id}
              chatId={id}
              role={message.role}
              content={message.content}
              attachments={message.experimental_attachments}
              toolInvocations={message.toolInvocations}
            />
          ))}
          <div ref={messagesEndRef} className="shrink-0 min-w-[24px] min-h-[24px]" />
        </div>

        <form className="px-4 py-2">
          <MultimodalInput
            input={input}
            setInput={setInput}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            stop={stop}
            attachments={attachments}
            setAttachments={setAttachments}
            messages={messages}
            append={append}
          />
        </form>
      </div>

      {/* Right panel: full preview of attachments */}
      <div className="w-1/2 border-l p-4 h-100% flex flex-col items-center justify-center">
        {attachments.length > 0 ? (
          attachments.map((attachment) => (
            <PreviewAttachment
              key={attachment.url || attachment.name}
              attachment={attachment}
              fullPreview
            />
          ))
        ) : (
          <p className="text-center text-muted-foreground">No attachment selected</p>
        )}
      </div>
    </div>
  );
}
