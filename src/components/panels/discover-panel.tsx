"use client";

import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Plane, Film, BookOpen, MoreHorizontal, FolderOpen, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface DiscoverPanelProps {
  onOpenEntry: (id: string) => void;
}

/* ── Category config ──────────────────────────────── */

const CATEGORY_META: Record<
  string,
  { icon: React.ElementType; gradient: string; accent: string }
> = {
  Trips: {
    icon: Plane,
    gradient: "from-emerald-500/20 to-teal-600/10",
    accent: "text-emerald-400",
  },
  Entertainment: {
    icon: Film,
    gradient: "from-violet-500/20 to-purple-600/10",
    accent: "text-violet-400",
  },
  "To Read": {
    icon: BookOpen,
    gradient: "from-blue-500/20 to-sky-600/10",
    accent: "text-blue-400",
  },
  Other: {
    icon: MoreHorizontal,
    gradient: "from-gray-500/20 to-slate-600/10",
    accent: "text-gray-400",
  },
};

function getCategoryMeta(name: string) {
  return (
    CATEGORY_META[name] ?? {
      icon: MoreHorizontal,
      gradient: "from-gray-500/20 to-slate-600/10",
      accent: "text-gray-400",
    }
  );
}

/** Format date as DD/MM */
function shortDate(d: Date | string): string {
  const date = new Date(d);
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/** Derive a short "item" label from the entry */
function itemLabel(entry: any): string {
  if (entry.title) return entry.title;
  const text = entry.summary ?? entry.content ?? "";
  return text.slice(0, 50).trim() + (text.length > 50 ? "…" : "") || "Untitled";
}

/* ── Category Section (full viewport height) ──────── */

function CategorySection({
  name,
  entries,
  onOpenEntry,
  isLast,
}: {
  name: string;
  entries: any[];
  onOpenEntry: (id: string) => void;
  isLast: boolean;
}) {
  const meta = getCategoryMeta(name);
  const Icon = meta.icon;

  return (
    <section
      className={cn(
        "min-h-[100dvh] snap-start flex flex-col px-4 pt-12 pb-6",
        `bg-gradient-to-b ${meta.gradient}`
      )}
    >
      {/* Section header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div
          className={cn(
            "flex items-center justify-center h-8 w-8 rounded-lg bg-card/60 backdrop-blur-sm border border-border/40",
            meta.accent
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <h2 className="text-lg font-bold tracking-tight">{name}</h2>
        <Badge variant="secondary" className="text-[10px] h-5 ml-1">
          {entries.length}
        </Badge>
      </div>

      {/* Table */}
      <div className="flex-1">
        {entries.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            No entries yet
          </div>
        ) : (
          <div className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[50px_1fr_1fr] gap-2 px-3 py-2 border-b border-border/40 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Date</span>
              <span>Item</span>
              <span>Context</span>
            </div>

            {/* Rows */}
            {entries.map((entry, i) => (
              <button
                key={entry.id}
                onClick={() => onOpenEntry(entry.id)}
                className={cn(
                  "w-full text-left grid grid-cols-[50px_1fr_1fr] gap-2 px-3 py-2.5 transition-colors hover:bg-muted/40 active:bg-muted/60",
                  i < entries.length - 1 && "border-b border-border/20"
                )}
              >
                <span className="text-[11px] text-muted-foreground tabular-nums pt-0.5">
                  {shortDate(entry.createdAt)}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-tight line-clamp-1">
                    {itemLabel(entry)}
                  </p>
                  {entry.tags?.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {entry.tags.slice(0, 2).map((tag: string) => (
                        <span
                          key={tag}
                          className="text-[9px] text-muted-foreground bg-muted/60 rounded px-1 py-0.5"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 pt-0.5">
                  {entry.summary ?? entry.content}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Scroll hint */}
      {!isLast && (
        <div className="flex justify-center pt-4 animate-bounce">
          <ChevronDown className="h-4 w-4 text-muted-foreground/40" />
        </div>
      )}
    </section>
  );
}

/* ── Main Panel ────────────────────────────────────── */

const CATEGORY_ORDER = ["Trips", "Entertainment", "To Read", "Other"];

export function DiscoverPanel({ onOpenEntry }: DiscoverPanelProps) {
  const feed = trpc.discover.feed.useQuery(undefined, { retry: 2 });

  /* Loading skeleton */
  if (feed.isLoading) {
    return (
      <div className="h-full overflow-y-auto pt-12 pb-4 space-y-4">
        <div className="flex items-center gap-2 px-4">
          <FolderOpen className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">Digital Dashboard</h1>
        </div>
        <div className="px-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  /* Error state */
  if (feed.isError) {
    return (
      <div className="h-full overflow-y-auto pt-12 pb-4 space-y-4">
        <div className="flex items-center gap-2 px-4">
          <FolderOpen className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">Digital Dashboard</h1>
        </div>
        <div className="text-center py-16 text-muted-foreground">
          <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="text-sm">Could not load dashboard</p>
          <button
            onClick={() => feed.refetch()}
            className="text-sm text-primary mt-2 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const data = feed.data;
  const allEntries = data?.entries ?? [];

  // Group entries by category name
  const grouped: Record<string, any[]> = {};
  for (const cat of CATEGORY_ORDER) {
    grouped[cat] = [];
  }
  for (const entry of allEntries) {
    const catName = entry.categoryName ?? "Other";
    if (!grouped[catName]) grouped[catName] = [];
    grouped[catName].push(entry);
  }

  const hasEntries = allEntries.length > 0;

  return (
    <div className="h-full overflow-y-auto snap-y snap-mandatory">
      {/* Title section — also snaps */}
      <section className="min-h-[100dvh] snap-start flex flex-col items-center justify-center px-6">
        <FolderOpen className="h-10 w-10 text-primary mb-3" />
        <h1 className="text-2xl font-bold tracking-tight mb-1">
          Your Digital Dashboard
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-8">
          {hasEntries
            ? `${allEntries.length} ideas organized across ${CATEGORY_ORDER.length} categories`
            : "Swipe right to catch your first idea"}
        </p>

        {/* Category quick-jump */}
        {hasEntries && (
          <div className="flex flex-col gap-2 w-full max-w-xs">
            {CATEGORY_ORDER.map((cat) => {
              const meta = getCategoryMeta(cat);
              const Icon = meta.icon;
              const count = grouped[cat]?.length ?? 0;
              return (
                <div
                  key={cat}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-card/60 border border-border/40"
                >
                  <Icon className={cn("h-4 w-4", meta.accent)} />
                  <span className="text-sm font-medium flex-1">{cat}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {hasEntries && (
          <div className="flex justify-center pt-8 animate-bounce">
            <ChevronDown className="h-5 w-5 text-muted-foreground/40" />
          </div>
        )}
      </section>

      {/* Category sections */}
      {hasEntries &&
        CATEGORY_ORDER.map((cat, i) => (
          <CategorySection
            key={cat}
            name={cat}
            entries={grouped[cat] ?? []}
            onOpenEntry={onOpenEntry}
            isLast={i === CATEGORY_ORDER.length - 1}
          />
        ))}
    </div>
  );
}
