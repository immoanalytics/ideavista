"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Settings, Loader2, Lightbulb } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime, getEntryTypeColor } from "@/lib/utils";
import { toast } from "sonner";

interface InputPanelProps {
  onOpenSettings: () => void;
  onOpenEntry: (id: string) => void;
}

function InputBox({
  content,
  setContent,
  onSubmit,
  isPending,
  textareaRef,
}: {
  content: string;
  setContent: (v: string) => void;
  onSubmit: () => void;
  isPending: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  }

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 120) + "px";
    }
  }, [content, textareaRef]);

  return (
    <div className="flex items-end gap-2">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Paste anything..."
        rows={1}
        className="flex-1 resize-none rounded-xl border bg-muted/50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        style={{ maxHeight: 120 }}
      />
      <Button
        size="icon"
        className="rounded-full h-10 w-10 shrink-0 transition-all duration-200 active:scale-90"
        onClick={onSubmit}
        disabled={!content.trim() || isPending}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}

export function InputPanel({ onOpenSettings, onOpenEntry }: InputPanelProps) {
  const [content, setContent] = useState("");
  const [pendingContent, setPendingContent] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const utils = trpc.useUtils();

  const entries = trpc.entry.list.useQuery({ limit: 50 });

  const createEntry = trpc.entry.create.useMutation({
    onSuccess: () => {
      setPendingContent(null);
      utils.entry.list.invalidate();
      utils.entry.stats.invalidate();
      utils.discover.feed.invalidate();
    },
    onError: (err) => {
      setPendingContent(null);
      toast.error(err.message);
    },
  });

  function handleSubmit() {
    const trimmed = content.trim();
    if (!trimmed || createEntry.isPending) return;
    setPendingContent(trimmed);
    setContent("");
    createEntry.mutate({ content: trimmed });
  }

  const isEmpty =
    !entries.isLoading &&
    entries.data?.entries.length === 0 &&
    !pendingContent;

  // Empty state: centered layout
  if (isEmpty) {
    return (
      <div className="flex flex-col h-full bg-background">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-10 pb-2">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">IdeaVista</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={onOpenSettings}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        {/* Centered content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <Lightbulb className="h-12 w-12 mb-4 text-primary/20 animate-fade-in-up" />
          <p className="text-xl font-semibold text-center animate-fade-in-up stagger-1">
            What&apos;s on your mind?
          </p>
          <p className="text-sm text-muted-foreground mt-1 text-center mb-6 animate-fade-in-up stagger-2">
            Paste a link, jot a thought, plan a trip...
          </p>
          <div className="w-full max-w-md animate-fade-in-up stagger-3">
            <InputBox
              content={content}
              setContent={setContent}
              onSubmit={handleSubmit}
              isPending={createEntry.isPending}
              textareaRef={textareaRef}
            />
          </div>
        </div>
      </div>
    );
  }

  // Has entries: bottom-anchored layout
  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-10 pb-2">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">IdeaVista</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={onOpenSettings}>
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      {/* Entry feed (chat bubbles) — newest at bottom */}
      <div className="flex-1 overflow-y-auto px-4 pb-2 flex flex-col-reverse gap-2">
        {/* Pending optimistic bubble */}
        {pendingContent && (
          <div className="flex justify-end animate-fade-in-up">
            <div className="bg-primary/10 rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[85%]">
              <p className="text-sm whitespace-pre-wrap">{pendingContent}</p>
              <div className="flex items-center gap-1 mt-1">
                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Processing...
                </span>
              </div>
            </div>
          </div>
        )}

        {entries.data?.entries.map((entry, index) => {
          const urls = (entry.metadata as any)?.urls;
          const firstImage = urls?.[0]?.image;

          return (
            <button
              key={entry.id}
              onClick={() => onOpenEntry(entry.id)}
              className="flex justify-end text-left animate-fade-in-up"
              style={{ animationDelay: `${Math.min(index * 50, 400)}ms` }}
            >
              <div className="bg-muted rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[85%] transition-all duration-200 hover:bg-muted/80 active:scale-[0.98]">
                {firstImage && (
                  <div className="rounded-lg overflow-hidden mb-2 -mx-1 -mt-0.5">
                    <img
                      src={firstImage}
                      alt=""
                      className="w-full h-32 object-cover transition-transform duration-300 hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                )}
                <p className="font-medium text-sm">{entry.title}</p>
                <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                  {entry.summary ?? entry.content.slice(0, 120)}
                </p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {entry.type && (
                    <Badge
                      variant="secondary"
                      className="text-xs h-5"
                      style={{ color: getEntryTypeColor(entry.type) }}
                    >
                      {entry.type.charAt(0) + entry.type.slice(1).toLowerCase()}
                    </Badge>
                  )}
                  {entry.tags?.slice(0, 2).map((t) => (
                    <Badge
                      key={t.tag.id}
                      variant="outline"
                      className="text-xs h-5"
                    >
                      {t.tag.name}
                    </Badge>
                  ))}
                  <span className="text-xs text-muted-foreground ml-auto">
                    {formatRelativeTime(entry.createdAt)}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Input area — bottom */}
      <div
        className="border-t bg-background px-4 py-3 animate-fade-in"
        style={{
          paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
        }}
      >
        <InputBox
          content={content}
          setContent={setContent}
          onSubmit={handleSubmit}
          isPending={createEntry.isPending}
          textareaRef={textareaRef}
        />
      </div>
    </div>
  );
}
