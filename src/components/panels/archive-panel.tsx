"use client";

import { useState, useCallback, useRef } from "react";
import { Search, BookOpen, X, Trash2, CheckCircle2, Circle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { cn, formatRelativeTime, getEntryTypeColor } from "@/lib/utils";
import { toast } from "sonner";

interface ArchivePanelProps {
  onOpenEntry: (id: string) => void;
}

export function ArchivePanel({ onOpenEntry }: ArchivePanelProps) {
  const [search, setSearch] = useState("");
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggered = useRef(false);

  const utils = trpc.useUtils();

  const entries = trpc.entry.list.useQuery({
    limit: 100,
    search: search || undefined,
  });

  const stats = trpc.entry.stats.useQuery();

  const deleteMany = trpc.entry.deleteMany.useMutation({
    onSuccess: ({ deleted }) => {
      toast.success(`Deleted ${deleted} idea${deleted === 1 ? "" : "s"}`);
      setSelecting(false);
      setSelected(new Set());
      utils.entry.list.invalidate();
      utils.entry.stats.invalidate();
      utils.discover.feed.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const exitSelection = useCallback(() => {
    setSelecting(false);
    setSelected(new Set());
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (!entries.data) return;
    setSelected(new Set(entries.data.entries.map((e) => e.id)));
  }, [entries.data]);

  const handlePointerDown = useCallback(
    (id: string) => {
      longPressTriggered.current = false;
      longPressTimer.current = setTimeout(() => {
        longPressTriggered.current = true;
        setSelecting(true);
        setSelected(new Set([id]));
      }, 500);
    },
    []
  );

  const handlePointerUp = useCallback(
    (id: string) => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
      if (longPressTriggered.current) {
        longPressTriggered.current = false;
        return; // long-press already handled
      }
      if (selecting) {
        toggleSelect(id);
      } else {
        onOpenEntry(id);
      }
    },
    [selecting, toggleSelect, onOpenEntry]
  );

  const handlePointerLeave = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  return (
    <div className="flex flex-col h-dvh bg-background">
      {/* Header */}
      <div className="px-4 pt-10 pb-3 shrink-0">
        {selecting ? (
          /* Selection mode header */
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={exitSelection}
              className="p-1 -ml-1 rounded-lg hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>
            <span className="text-sm font-semibold flex-1">
              {selected.size} selected
            </span>
            <button
              onClick={selectAll}
              className="text-xs text-primary font-medium px-2 py-1 rounded-lg hover:bg-primary/10"
            >
              Select all
            </button>
            <button
              onClick={() => {
                if (selected.size === 0) return;
                deleteMany.mutate({ ids: Array.from(selected) });
              }}
              disabled={selected.size === 0 || deleteMany.isPending}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                selected.size > 0
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete{deleteMany.isPending ? "…" : ""}
            </button>
          </div>
        ) : (
          /* Normal header */
          <>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-semibold">Idea Book</h1>
              {stats.data && (
                <span className="text-xs text-muted-foreground ml-auto">
                  {stats.data.total} ideas
                </span>
              )}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search ideas..."
                className="w-full rounded-xl border border-border/60 bg-card pl-9 pr-8 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 placeholder:text-muted-foreground/60"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
            </div>

            <p className="text-[11px] text-muted-foreground/50 mt-2 px-0.5">
              Hold an idea to select multiple
            </p>
          </>
        )}
      </div>

      {/* Entry list */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
        {entries.isLoading ? (
          <div className="space-y-3 mt-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl bg-muted h-20" />
            ))}
          </div>
        ) : entries.data?.entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground/20 mb-3" />
            <p className="text-sm text-muted-foreground">
              {search ? "No ideas match your search" : "No ideas yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-2 mt-1">
            {entries.data?.entries.map((entry) => {
              const isSelected = selected.has(entry.id);
              return (
                <div
                  key={entry.id}
                  onPointerDown={() => handlePointerDown(entry.id)}
                  onPointerUp={() => handlePointerUp(entry.id)}
                  onPointerLeave={handlePointerLeave}
                  onContextMenu={(e) => e.preventDefault()}
                  className={cn(
                    "w-full text-left rounded-xl border p-3.5 transition-all select-none cursor-pointer",
                    selecting && isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                      : "border-border/50 bg-card hover:bg-accent/50 active:scale-[0.98]"
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Selection indicator */}
                    {selecting && (
                      <div className="shrink-0 pt-0.5">
                        {isSelected ? (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground/40" />
                        )}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm line-clamp-1">
                          {entry.title}
                        </p>
                        <span className="text-[11px] text-muted-foreground shrink-0">
                          {formatRelativeTime(entry.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                        {entry.summary ?? entry.content.slice(0, 120)}
                      </p>
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {entry.type && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] h-4 px-1.5"
                            style={{ color: getEntryTypeColor(entry.type) }}
                          >
                            {entry.type.charAt(0) + entry.type.slice(1).toLowerCase()}
                          </Badge>
                        )}
                        {entry.tags?.slice(0, 3).map((t) => (
                          <Badge
                            key={t.tag.id}
                            variant="outline"
                            className="text-[10px] h-4 px-1.5"
                          >
                            {t.tag.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
