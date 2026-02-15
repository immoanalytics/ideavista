"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Settings, Loader2, Check, Sparkles, Paperclip, X, FileText, Image as ImageIcon } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface InputPanelProps {
  onOpenSettings: () => void;
  onOpenEntry: (id: string) => void;
}

interface PendingFile {
  file: File;
  preview?: string; // data URL for images
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return ImageIcon;
  return FileText;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "image/heif",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export function InputPanel({ onOpenSettings }: InputPanelProps) {
  const [content, setContent] = useState("");
  const [saved, setSaved] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();
  const reprocess = trpc.entry.reprocess.useMutation();

  const createEntry = trpc.entry.create.useMutation({
    onSuccess: async (entry) => {
      // Upload pending files, then trigger AI reprocessing
      if (pendingFiles.length > 0) {
        setUploading(true);
        let uploadOk = true;
        try {
          await Promise.all(
            pendingFiles.map(async ({ file }) => {
              const formData = new FormData();
              formData.append("entryId", entry.id);
              formData.append("file", file);
              const res = await fetch("/api/files", { method: "POST", body: formData });
              if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error ?? "Upload failed");
              }
            })
          );
        } catch (err: any) {
          uploadOk = false;
          toast.error(`File upload failed: ${err.message}`);
        } finally {
          setUploading(false);
          setPendingFiles([]);
        }

        // Re-run AI categorization with attachment context
        if (uploadOk) {
          reprocess.mutate({ id: entry.id });
        }
      }

      setSaved(true);
      utils.entry.list.invalidate();
      utils.entry.stats.invalidate();
      utils.discover.feed.invalidate();
      setTimeout(() => {
        setSaved(false);
        textareaRef.current?.focus();
      }, 1500);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;
    const newFiles: PendingFile[] = [];
    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} is too large (max 10 MB)`);
        continue;
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`${file.name}: file type not supported`);
        continue;
      }
      const pf: PendingFile = { file };
      if (file.type.startsWith("image/")) {
        pf.preview = URL.createObjectURL(file);
      }
      newFiles.push(pf);
    }
    setPendingFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const removeFile = useCallback((index: number) => {
    setPendingFiles((prev) => {
      const removed = prev[index];
      if (removed?.preview) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  function handleSubmit() {
    const trimmed = content.trim();
    if ((!trimmed && pendingFiles.length === 0) || createEntry.isPending || uploading) return;
    setContent("");
    createEntry.mutate({ content: trimmed || `[${pendingFiles.length} file${pendingFiles.length === 1 ? "" : "s"} attached]` });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 120) + "px";
    }
  }, [content]);

  // Cleanup previews on unmount
  useEffect(() => {
    return () => {
      pendingFiles.forEach((pf) => {
        if (pf.preview) URL.revokeObjectURL(pf.preview);
      });
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const isPending = createEntry.isPending || uploading;

  return (
    <div className="flex flex-col h-dvh bg-background">
      {/* Settings gear */}
      <div className="flex justify-end px-4 pt-10 shrink-0">
        <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={onOpenSettings}>
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-start px-6 pt-[18vh]">
        {/* Brand */}
        <div
          className="flex flex-col items-center cursor-text"
          onClick={() => textareaRef.current?.focus()}
        >
          <div className="flex items-center gap-2.5 mb-2">
            <Sparkles className="h-7 w-7 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">IdeaVista</h1>
          </div>
          <p className="text-sm text-muted-foreground text-center mb-8">
            Capture anything. Discover everything.
          </p>
        </div>

        {/* Input bar */}
        <div className="w-full max-w-md">
          {/* Pending file chips */}
          {pendingFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {pendingFiles.map((pf, i) => {
                const Icon = getFileIcon(pf.file.type);
                return (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-muted/60 border border-border/40 text-xs"
                  >
                    {pf.preview ? (
                      <img
                        src={pf.preview}
                        alt=""
                        className="h-6 w-6 rounded object-cover"
                      />
                    ) : (
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="max-w-[120px] truncate">{pf.file.name}</span>
                    <span className="text-muted-foreground">
                      {formatFileSize(pf.file.size)}
                    </span>
                    <button
                      onClick={() => removeFile(i)}
                      className="p-0.5 rounded hover:bg-muted"
                    >
                      <X className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="relative flex items-end rounded-2xl border border-border/60 bg-card shadow-sm focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary/40">
            {/* Attach button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 pl-3 text-muted-foreground hover:text-foreground transition-colors shrink-0"
              title="Attach file"
            >
              <Paperclip className="h-4.5 w-4.5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ALLOWED_TYPES.join(",")}
              className="hidden"
              onChange={(e) => {
                handleFileSelect(e.target.files);
                e.target.value = "";
              }}
            />

            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What's on your mind?"
              autoFocus
              rows={1}
              className="flex-1 resize-none bg-transparent px-2 py-3 pr-2 text-sm focus:outline-none placeholder:text-muted-foreground/60"
              style={{ maxHeight: 120 }}
            />
            <Button
              size="icon"
              className="rounded-full h-8 w-8 m-1.5 shrink-0 transition-all duration-200 active:scale-90"
              onClick={handleSubmit}
              disabled={(!content.trim() && pendingFiles.length === 0) || isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Saved confirmation */}
          {saved && (
            <div className="flex items-center justify-center gap-1.5 mt-4 text-sm text-primary animate-fade-in">
              <Check className="h-4 w-4" />
              <span>Idea saved</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
