"use client";

import { Attachment, CreateMessage, Message, ToolInvocation } from "ai";
import { useChat } from "ai/react";
import { useState, useEffect, useRef, useCallback, Dispatch, SetStateAction, RefObject, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Split from 'react-split';

import { Message as PreviewMessage } from "@/components/custom/message";
import { useScrollToBottom } from "@/components/custom/use-scroll-to-bottom";
import { MultimodalInput } from "./multimodal-input";
import { Overview } from "./overview";
import { PreviewAttachment } from "./preview-attachment";
import { Button } from "../ui/button";
import { PanelRightOpen, PanelRightClose } from "lucide-react";

const systemPrompt = `You are an advanced AI assistant with expertise in document analysis and natural language understanding. 
Your responses should be:
- Clear and well-structured
- Focused on the user's specific questions
- Backed by relevant information from the documents
- Professional yet conversational in tone

When analyzing documents:
1. First understand the document type and context
2. Focus on the most relevant sections
3. Provide specific references when quoting
4. Highlight key insights and patterns

For complex queries:
- Break down the response into clear sections
- Use bullet points for better readability
- Provide examples when helpful
- Suggest follow-up questions if relevant`;

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
      body: { id, systemPrompt },
      initialMessages,
      maxSteps: 10,
      onFinish: () => {
        window.history.replaceState({}, "", `/chat/${id}`);
      },
    });

  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();
  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const splitRef = useRef<any>(null);

  // Auto-open panel when attachments are added
  useEffect(() => {
    if (attachments.length > 0) {
      setIsPanelOpen(true);
    }
  }, [attachments]);

  // Reset split sizes when panel opens/closes
  useEffect(() => {
    if (splitRef.current) {
      if (isPanelOpen) {
        splitRef.current.split.setSizes([50, 50]);
      } else {
        splitRef.current.split.setSizes([100, 0]);
      }
    }
  }, [isPanelOpen]);

  const togglePanel = () => {
    setIsPanelOpen(!isPanelOpen);
  };

  return (
    <div className="relative flex flex-col h-[calc(100dvh-49px)] bg-background">
      {/* Desktop View */}
      <div className="hidden md:block h-full">
        {attachments.length > 0 ? (
          <Split
            ref={splitRef}
            className="split flex h-full"
            sizes={isPanelOpen ? [50, 50] : [100, 0]}
            minSize={[400, 0]}
            maxSize={[Infinity, 800]}
            gutterSize={4}
            snapOffset={0}
            dragInterval={1}
            direction="horizontal"
            cursor="col-resize"
            onDragEnd={(sizes) => {
              // If the second panel is less than 10% wide, close it
              if (sizes[1] < 10) {
                setIsPanelOpen(false);
              }
            }}
          >
            {/* Main chat panel */}
            <div className="flex flex-col h-full overflow-hidden">
              <ChatContent
                messagesContainerRef={messagesContainerRef}
                messagesEndRef={messagesEndRef}
                messages={messages}
                Overview={Overview}
                PreviewMessage={PreviewMessage}
                chatId={id}
              />
              <InputArea
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
            </div>

            {/* Desktop attachments panel */}
            <div className="h-full bg-muted/10 border-l border-border">
              <div className="flex flex-col h-full">
                <div className="flex items-center px-6 h-14 border-b border-border bg-background/50">
                  <h3 className="text-sm font-medium">Attachments Preview</h3>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <div className="px-6 py-4">
                    <div className="space-y-4">
                      {attachments.map((attachment) => (
                        <PreviewAttachment
                          key={attachment.url || attachment.name}
                          attachment={attachment}
                          fullPreview
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Split>
        ) : (
          // Full width chat when no attachments
          <div className="flex flex-col h-full">
            <ChatContent
              messagesContainerRef={messagesContainerRef}
              messagesEndRef={messagesEndRef}
              messages={messages}
              Overview={Overview}
              PreviewMessage={PreviewMessage}
              chatId={id}
            />
            <InputArea
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
          </div>
        )}
      </div>

      {/* Mobile View */}
      <div className="md:hidden flex flex-col h-full">
        <div className="flex-1 flex flex-col">
          <ChatContent
            messagesContainerRef={messagesContainerRef}
            messagesEndRef={messagesEndRef}
            messages={messages}
            Overview={Overview}
            PreviewMessage={PreviewMessage}
            chatId={id}
          />
          <InputArea
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
        </div>

        {/* Mobile elements */}
        <AnimatePresence>
          {attachments.length > 0 && (
            <>
              {/* Mobile toggle button */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="fixed right-4 bottom-20 z-50"
              >
                <Button
                  variant="secondary"
                  size="icon"
                  className="rounded-full shadow-lg bg-background border hover:bg-muted/50"
                  onClick={togglePanel}
                >
                  {isPanelOpen ? (
                    <PanelRightClose className="size-4" />
                  ) : (
                    <PanelRightOpen className="size-4" />
                  )}
                </Button>
              </motion.div>

              {/* Mobile panel */}
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: isPanelOpen ? 0 : "100%" }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="fixed inset-y-0 right-0 w-[90%] bg-background border-l shadow-lg z-40"
                style={{ top: "49px" }}
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-center h-14 px-4 border-b border-border">
                    <h3 className="text-sm font-medium">Attachments Preview</h3>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <div className="p-4 space-y-4">
                      {attachments.map((attachment) => (
                        <PreviewAttachment
                          key={attachment.url || attachment.name}
                          attachment={attachment}
                          fullPreview
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Mobile backdrop */}
              {isPanelOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.4 }}
                  exit={{ opacity: 0 }}
                  onClick={togglePanel}
                  className="fixed inset-0 bg-black z-30"
                  style={{ top: "49px" }}
                />
              )}
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Extracted components for better organization
interface ChatContentProps {
  messagesContainerRef: RefObject<HTMLDivElement>;
  messagesEndRef: RefObject<HTMLDivElement>;
  messages: Array<Message>;
  Overview: React.ComponentType;
  PreviewMessage: React.ComponentType<{
    chatId: string;
    role: string;
    content: string | ReactNode;
    toolInvocations?: Array<ToolInvocation>;
  }>;
  chatId: string;
}

function ChatContent({
  messagesContainerRef,
  messagesEndRef,
  messages,
  Overview,
  PreviewMessage,
  chatId,
}: ChatContentProps) {
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Handle scroll events to show/hide scroll button
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const distanceFromBottom = 
      container.scrollHeight - container.scrollTop - container.clientHeight;
    setShowScrollButton(distanceFromBottom > 150);
  }, []);

  // Scroll to bottom handler
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messagesEndRef]);

  // Auto scroll on new messages
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length, scrollToBottom]);

  return (
    <div
      ref={messagesContainerRef}
      className="flex-1 overflow-y-auto scroll-smooth relative"
      onScroll={handleScroll}
    >
      <div className="flex flex-col min-h-full">
        <div className="flex-1 w-full max-w-3xl mx-auto px-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="w-full max-w-lg">
                <Overview />
              </div>
            </div>
          ) : (
            <div className="py-8 space-y-6">
              {messages.map((message) => (
                <div key={message.id}>
                  <PreviewMessage
                    chatId={chatId}
                    role={message.role}
                    content={message.content}
                    toolInvocations={message.toolInvocations}
                  />
                </div>
              ))}
              <div ref={messagesEndRef} className="h-1" />
            </div>
          )}
        </div>
      </div>

      {/* Scroll to bottom button */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-24 right-4 p-2 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-colors z-50"
            onClick={scrollToBottom}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 19V5M5 12l7 7 7-7" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

interface InputAreaProps {
  input: string;
  setInput: (value: string) => void;
  handleSubmit: (event?: { preventDefault?: () => void }) => void;
  isLoading: boolean;
  stop: () => void;
  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  messages: Array<Message>;
  append: (message: Message | CreateMessage) => Promise<string | null | undefined>;
}

function InputArea({
  input,
  setInput,
  handleSubmit,
  isLoading,
  stop,
  attachments,
  setAttachments,
  messages,
  append,
}: InputAreaProps) {
  return (
    <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="w-full max-w-2xl mx-auto">
        <form className="p-4" onSubmit={handleSubmit}>
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
    </div>
  );
}
