import { Attachment } from "ai";

import { LoaderIcon } from "./icons";

interface PreviewAttachmentProps {
  attachment: Attachment;
  isUploading?: boolean;
  fullPreview?: boolean;
}

export const PreviewAttachment = ({
  attachment,
  isUploading = false,
  fullPreview = false,
}: PreviewAttachmentProps) => {
  const { name, url, contentType } = attachment;

  const containerClass = fullPreview
    ? "w-full h-full bg-muted rounded-md relative flex items-center justify-center"
    : "flex flex-col gap-2 max-w-16";

  // If the attachment is a PDF, render an embed element
  if (contentType && contentType.includes("pdf") && fullPreview) {
    return (
      <div className={`${containerClass} min-h-[500px]`}>
        <embed 
          src={url} 
          type="application/pdf" 
          className="w-full h-full rounded-md"
          style={{ minHeight: "500px" }}
        />
        {isUploading && (
          <div className="animate-spin absolute text-zinc-500">
            <LoaderIcon />
          </div>
        )}
      </div>
    );
  }

  const imageClass = fullPreview
    ? "object-contain w-full h-full rounded-md"
    : "rounded-md w-full h-auto object-cover";

  return (
    <div className={containerClass}>
      {fullPreview ? (
        // Full preview mode
        contentType && contentType.startsWith("image") ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={url}
            src={url}
            alt={name ?? "An image attachment"}
            className={imageClass}
          />
        ) : (
          <div className="p-4">Preview not available</div>
        )
      ) : (
        // Small preview mode - only show file name
        <div className="text-xs text-zinc-500 max-w-16 truncate">{name}</div>
      )}

      {isUploading && (
        <div className="animate-spin absolute text-zinc-500">
          <LoaderIcon />
        </div>
      )}
    </div>
  );
};
