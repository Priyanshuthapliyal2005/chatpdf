"use client";

import { Attachment, ChatRequestOptions, CreateMessage, Message } from "ai";
import { motion } from "framer-motion";
import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  Dispatch,
  SetStateAction,
  ChangeEvent,
} from "react";
import { toast } from "sonner";

import { ArrowUpIcon, PaperclipIcon, StopIcon } from "./icons";
import { PreviewAttachment } from "./preview-attachment";
import useWindowSize from "./use-window-size";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";

const suggestedActions = [
  {
    title: "Can you describe this image?",
    label: "for an image document",
    action: "Can you describe this image?",
  },
  {
    title: "Can you summarize this PDF?",
    label: "for a PDF document",
    action: "Can you summarize this PDF?",
  },
];

export function MultimodalInput({
  input,
  setInput,
  isLoading,
  stop,
  attachments,
  setAttachments,
  messages,
  append,
  handleSubmit,
}: {
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  stop: () => void;
  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  messages: Array<Message>;
  append: (
    message: Message | CreateMessage,
    chatRequestOptions?: ChatRequestOptions,
  ) => Promise<string | null | undefined>;
  handleSubmit: (
    event?: {
      preventDefault?: () => void;
    },
    chatRequestOptions?: ChatRequestOptions,
  ) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { width } = useWindowSize();

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
  }, []);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 0}px`;
    }
  };

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
    adjustHeight();
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadQueue, setUploadQueue] = useState<Array<string>>([]);

  const submitForm = useCallback(() => {
    handleSubmit(undefined, {
      experimental_attachments: attachments,
    });

    // Removed attachment state clearing so the right preview remains
    // setAttachments([]);

    if (width && width > 768) {
      textareaRef.current?.focus();
    }
  }, [attachments, handleSubmit, width]);

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`/api/files/upload`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const { url, pathname, contentType } = data;

        return {
          url,
          name: pathname,
          contentType: contentType,
        };
      } else {
        const { error } = await response.json();
        toast.error(error);
      }
    } catch (error) {
      toast.error("Failed to upload file, please try again!");
    }
  };

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);

      setUploadQueue(files.map((file) => file.name));

      try {
        const uploadPromises = files.map((file) => uploadFile(file));
        const uploadedAttachments = await Promise.all(uploadPromises);
        const successfullyUploadedAttachments = uploadedAttachments.filter(
          (attachment) => attachment !== undefined,
        );

        // Overwrite previous attachments with new ones
        setAttachments(successfullyUploadedAttachments);
      } catch (error) {
        console.error("Error uploading files!", error);
      } finally {
        setUploadQueue([]);
      }
    },
    [setAttachments],
  );

  return (
    <div className="relative w-full">
      <input
        type="file"
        className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none"
        ref={fileInputRef}
        multiple
        onChange={handleFileChange}
        tabIndex={-1}
      />

      <div className="flex flex-col space-y-2">
        {/* Attachments preview */}
        {attachments.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 px-1 md:px-0">
            {attachments.map((attachment) => (
              <div key={attachment.url || attachment.name} className="shrink-0">
                <PreviewAttachment
                  attachment={attachment}
                  fullPreview={false}
                />
              </div>
            ))}
          </div>
        )}

        {/* Input area */}
        <div className="flex flex-row items-end gap-2">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              placeholder="Ask your question about the attached document or image..."
              value={input}
              onChange={handleInput}
              className="min-h-[44px] md:min-h-[24px] py-3 md:py-2 pr-20 overflow-hidden resize-none rounded-xl text-base bg-muted border-none"
              rows={1}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();

                  if (isLoading) {
                    toast.error("Please wait for the document QA bot to finish its response!");
                  } else {
                    submitForm();
                  }
                }
              }}
            />
            
            <div className="absolute right-2 bottom-2 flex items-center gap-1">
              {isLoading ? (
                <Button
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  onClick={(event) => {
                    event.preventDefault();
                    stop();
                  }}
                >
                  <StopIcon size={16} />
                </Button>
              ) : (
                <Button
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  onClick={(event) => {
                    event.preventDefault();
                    submitForm();
                  }}
                  disabled={input.length === 0 || uploadQueue.length > 0}
                >
                  <ArrowUpIcon size={16} />
                </Button>
              )}

              <Button
                size="icon"
                className="h-8 w-8 rounded-lg dark:border-zinc-700"
                onClick={(event) => {
                  event.preventDefault();
                  fileInputRef.current?.click();
                }}
                variant="outline"
                disabled={isLoading}
              >
                <PaperclipIcon size={16} />
              </Button>
            </div>
          </div>
        </div>

        {/* Upload queue indicator */}
        {uploadQueue.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-muted-foreground"
          >
            Uploading {uploadQueue.length} file(s)...
          </motion.div>
        )}
      </div>
    </div>
  );
}