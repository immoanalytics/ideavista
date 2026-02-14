"use client";

import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Compass, Sparkles } from "lucide-react";
import { cn, formatRelativeTime, getEntryTypeColor } from "@/lib/utils";

interface DiscoverPanelProps {
  onOpenEntry: (id: string) => void;
}

// Gradient backgrounds for entries without OG images
const GRADIENT_PALETTES: Record<string, string> = {
  "#8B5CF6": "from-violet-600/80 to-indigo-900/90",
  "#F59E0B": "from-amber-500/80 to-orange-800/90",
  "#10B981": "from-emerald-500/80 to-teal-900/90",
  "#3B82F6": "from-blue-500/80 to-sky-900/90",
  "#EC4899": "from-pink-500/80 to-rose-900/90",
  "#F97316": "from-orange-500/80 to-red-900/90",
  "#6B7280": "from-gray-500/80 to-slate-800/90",
  "#06B6D4": "from-cyan-500/80 to-blue-900/90",
  "#EF4444": "from-red-500/80 to-rose-900/90",
};

function getGradient(color: string | null): string {
  if (color && GRADIENT_PALETTES[color]) return GRADIENT_PALETTES[color];
  const keys = Object.keys(GRADIENT_PALETTES);
  const idx = color
    ? Math.abs(color.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) %
      keys.length
    : 0;
  return GRADIENT_PALETTES[keys[idx]];
}

/* ── Category Chip Bar ─────────────────────────────── */

function CategoryChips({
  categories,
  selected,
  onSelect,
}: {
  categories: Array<{
    id: string;
    name: string;
    color: string | null;
    entryCount: number;
  }>;
  selected: string | null;
  onSelect: (id: string | null) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto pb-1 px-4 no-scrollbar"
      style={{ touchAction: "pan-x", WebkitOverflowScrolling: "touch" }}
    >
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all",
          !selected
            ? "bg-primary text-primary-foreground shadow-sm"
            : "bg-muted text-muted-foreground hover:bg-muted/80"
        )}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id === selected ? null : cat.id)}
          className={cn(
            "shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap",
            selected === cat.id
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}

/* ── Featured Card (first entry, hero size) ────────── */

function getImageUrl(entry: any): string | null {
  if (entry.image) return entry.image;
  if (entry.imageKeyword) {
    return `https://images.unsplash.com/photo-1?w=600&q=80&auto=format&fit=crop&fm=jpg&crop=entropy&cs=tinysrgb&s=${encodeURIComponent(entry.imageKeyword)}`;
  }
  return null;
}

function FeaturedCard({
  entry,
  onClick,
}: {
  entry: any;
  onClick: () => void;
}) {
  const imageUrl = getImageUrl(entry);
  const hasImage = !!imageUrl;
  const gradient = getGradient(entry.categoryColor);

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl overflow-hidden shadow-sm transition-all duration-200 active:scale-[0.98] hover:shadow-md"
    >
      {/* Hero area */}
      <div
        className={cn(
          "relative w-full aspect-[16/10] overflow-hidden",
          !hasImage && `bg-gradient-to-br ${gradient}`
        )}
      >
        {hasImage && (
          <img
            src={imageUrl}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        )}
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Title over image */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {entry.categoryName && (
            <span
              className="inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wide mb-2"
              style={{
                backgroundColor: entry.categoryColor ?? "#6B7280",
                color: "#fff",
              }}
            >
              {entry.categoryName}
            </span>
          )}
          <h3 className="text-white font-bold text-lg leading-tight line-clamp-2">
            {entry.title}
          </h3>
        </div>
      </div>

      {/* Body */}
      <div className="bg-card p-4 border border-t-0 border-border/50 rounded-b-2xl">
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
          {entry.summary ?? entry.content}
        </p>
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {entry.type && (
            <Badge
              variant="secondary"
              className="text-xs h-5"
              style={{ color: getEntryTypeColor(entry.type) }}
            >
              {entry.type.charAt(0) + entry.type.slice(1).toLowerCase()}
            </Badge>
          )}
          {entry.tags?.slice(0, 3).map((tag: string) => (
            <Badge key={tag} variant="outline" className="text-xs h-5">
              {tag}
            </Badge>
          ))}
          <span className="text-xs text-muted-foreground ml-auto">
            {formatRelativeTime(entry.createdAt)}
          </span>
        </div>
      </div>
    </button>
  );
}

/* ── Compact Card (remaining entries) ──────────────── */

function CompactCard({
  entry,
  onClick,
}: {
  entry: any;
  onClick: () => void;
}) {
  const imageUrl = getImageUrl(entry);
  const hasImage = !!imageUrl;
  const gradient = getGradient(entry.categoryColor);

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl overflow-hidden shadow-sm border border-border/50 bg-card transition-all duration-200 active:scale-[0.98] hover:shadow-md flex h-28"
    >
      {/* Thumbnail */}
      <div
        className={cn(
          "w-28 shrink-0 relative overflow-hidden",
          !hasImage && `bg-gradient-to-br ${gradient}`
        )}
      >
        {hasImage ? (
          <img
            src={imageUrl}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Sparkles className="h-5 w-5 text-white/60" />
          </div>
        )}
      </div>

      {/* Text */}
      <div className="flex-1 p-3 min-w-0 flex flex-col">
        {entry.categoryName && (
          <span
            className="inline-block self-start px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide mb-1"
            style={{
              backgroundColor: entry.categoryColor ?? "#6B7280",
              color: "#fff",
            }}
          >
            {entry.categoryName}
          </span>
        )}
        <h4 className="font-semibold text-sm leading-tight line-clamp-2">
          {entry.title}
        </h4>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed flex-1">
          {entry.summary ?? entry.content}
        </p>
        <div className="flex items-center gap-1.5 mt-auto">
          {entry.tags?.slice(0, 2).map((tag: string) => (
            <Badge key={tag} variant="outline" className="text-[10px] h-4">
              {tag}
            </Badge>
          ))}
          <span className="text-[10px] text-muted-foreground ml-auto">
            {formatRelativeTime(entry.createdAt)}
          </span>
        </div>
      </div>
    </button>
  );
}

/* ── Main Panel ────────────────────────────────────── */

export function DiscoverPanel({ onOpenEntry }: DiscoverPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    null
  );

  const feed = trpc.discover.feed.useQuery(
    { categoryId: selectedCategory ?? undefined },
    { retry: 2 }
  );

  /* Loading skeleton */
  if (feed.isLoading) {
    return (
      <div className="h-full overflow-y-auto pt-10 pb-4 space-y-4">
        <div className="flex items-center gap-2 px-4">
          <Compass className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">Discover</h1>
        </div>
        <div className="flex gap-2 px-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-full shrink-0" />
          ))}
        </div>
        <div className="px-4 space-y-4">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  /* Error state */
  if (feed.isError) {
    return (
      <div className="h-full overflow-y-auto pt-10 pb-4 space-y-4">
        <div className="flex items-center gap-2 px-4">
          <Compass className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">Discover</h1>
        </div>
        <div className="text-center py-16 text-muted-foreground">
          <Compass className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="text-sm">Could not load discoveries</p>
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
  const entries = data?.entries ?? [];
  const categories = data?.categories ?? [];
  const featured = entries[0];
  const rest = entries.slice(1);

  return (
    <div className="h-full overflow-y-auto pt-10 pb-4">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 mb-3">
        <Compass className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold">Discover</h1>
      </div>

      {/* Scrollable category chips */}
      {categories.length > 0 && (
        <div className="mb-4">
          <CategoryChips
            categories={categories}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
        </div>
      )}

      {/* Cards */}
      {entries.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground px-4">
          <Compass className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">No discoveries yet</p>
          <p className="text-sm mt-1">Swipe left to catch your first idea</p>
        </div>
      ) : (
        <div className="px-4 space-y-4 pb-8">
          {/* Hero card */}
          {featured && (
            <FeaturedCard
              entry={featured}
              onClick={() => onOpenEntry(featured.id)}
            />
          )}

          {/* Compact list */}
          {rest.map((entry) => (
            <CompactCard
              key={entry.id}
              entry={entry}
              onClick={() => onOpenEntry(entry.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
