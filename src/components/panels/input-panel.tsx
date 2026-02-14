"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Settings, Loader2, Lightbulb, Check } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface InputPanelProps {
  onOpenSettings: () => void;
  onOpenEntry: (id: string) => void;
}

export function InputPanel({ onOpenSettings }: InputPanelProps) {
  const [content, setContent] = useState("");
  const [saved, setSaved] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const utils = trpc.useUtils();

  const createEntry = trpc.entry.create.useMutation({
    onSuccess: () => {
      setSaved(true);
      utils.entry.list.invalidate();
      utils.entry.stats.invalidate();
      utils.discover.feed.invalidate();
      setTimeout(() => setSaved(false), 2000);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  function handleSubmit() {
    const trimmed = content.trim();
    if (!trimmed || createEntry.isPending) return;
    setContent("");
    createEntry.mutate({ content: trimmed });
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

  return (
    <div className="flex flex-col h-dvh bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-10 pb-2 shrink-0">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">Idea Catcher</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={onOpenSettings}>
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      {/* Centered input */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <Lightbulb className="h-12 w-12 mb-4 text-primary/20" />
        <p className="text-xl font-semibold text-center">
          What&apos;s on your mind?
        </p>
        <p className="text-sm text-muted-foreground mt-1 text-center mb-6">
          Paste a link, jot a thought, plan a trip...
        </p>
        <div className="w-full max-w-md">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Paste anything..."
              rows={1}
              className="w-full resize-none rounded-xl border bg-muted/50 px-4 py-2.5 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              style={{ maxHeight: 120 }}
            />
            <Button
              size="icon"
              className="rounded-full h-8 w-8 absolute right-2 bottom-1.5 transition-all duration-200 active:scale-90"
              onClick={handleSubmit}
              disabled={!content.trim() || createEntry.isPending}
            >
              {createEntry.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Saved confirmation */}
          {saved && (
            <div className="flex items-center justify-center gap-1.5 mt-3 text-sm text-primary animate-fade-in">
              <Check className="h-4 w-4" />
              <span>Idea saved</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
