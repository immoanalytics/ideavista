"use client";

import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Compass, Sparkles } from "lucide-react";
import { formatRelativeTime, getEntryTypeColor } from "@/lib/utils";

interface DiscoverPanelProps {
  onOpenEntry: (id: string) => void;
}

export function DiscoverPanel({ onOpenEntry }: DiscoverPanelProps) {
  const feed = trpc.discover.feed.useQuery(undefined, {
    retry: 2,
  });

  if (feed.isLoading) {
    return (
      <div className="h-full overflow-y-auto px-4 pt-10 pb-4 space-y-4">
        <div className="flex items-center gap-2">
          <Compass className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">Discover</h1>
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-xl skeleton-smooth" style={{ animationDelay: `${i * 150}ms` }} />
        ))}
      </div>
    );
  }

  if (feed.isError) {
    return (
      <div className="h-full overflow-y-auto px-4 pt-10 pb-4 space-y-4">
        <div className="flex items-center gap-2">
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
  const hasContent =
    (data?.categories?.length ?? 0) > 0 ||
    (data?.richEntries?.length ?? 0) > 0 ||
    (data?.uncategorized?.length ?? 0) > 0 ||
    (data?.recentEntries?.length ?? 0) > 0;

  return (
    <div className="h-full overflow-y-auto px-4 pt-10 pb-4 space-y-4">
      <div className="flex items-center gap-2 animate-fade-in">
        <Compass className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold">Discover</h1>
      </div>

      {/* Category Groups */}
      {data?.categories.map((category, i) => (
        <Card key={category.id} className="overflow-hidden animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
          <CardHeader
            className="pb-2"
            style={{ borderLeft: `4px solid ${category.color ?? "#6B7280"}` }}
          >
            <CardTitle className="text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                {category.name}
              </div>
              <Badge variant="secondary" className="text-xs">
                {category.entryCount}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory" style={{ touchAction: "pan-x" }}>
              {category.entries.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => onOpenEntry(entry.id)}
                  className="snap-start shrink-0 w-48 text-left rounded-lg bg-muted/50 p-3 hover:bg-muted transition-all duration-200 active:scale-[0.97]"
                >
                  <p className="font-medium text-sm line-clamp-2">{entry.title}</p>
                  {entry.summary && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {entry.summary}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    {entry.type && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] h-4"
                        style={{ color: getEntryTypeColor(entry.type) }}
                      >
                        {entry.type.charAt(0) + entry.type.slice(1).toLowerCase()}
                      </Badge>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      {formatRelativeTime(entry.createdAt)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Rich Media Cards (entries with URL metadata) */}
      {data?.richEntries?.map((entry: any, i: number) => {
        const urls = (entry.metadata as any)?.urls ?? [];
        const firstUrl = urls[0];
        if (!firstUrl) return null;
        return (
          <button
            key={entry.id}
            onClick={() => onOpenEntry(entry.id)}
            className="w-full text-left animate-fade-in-up"
            style={{ animationDelay: `${(data?.categories?.length ?? 0) * 80 + i * 80}ms` }}
          >
            <Card className="overflow-hidden hover:bg-muted/30 transition-all duration-200 active:scale-[0.98]">
              {firstUrl.image && (
                <div className="aspect-video bg-muted overflow-hidden">
                  <img
                    src={firstUrl.image}
                    alt=""
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    loading="lazy"
                  />
                </div>
              )}
              <CardContent className="p-3">
                <p className="font-medium text-sm">{entry.title}</p>
                {firstUrl.siteName && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {firstUrl.siteName}
                  </p>
                )}
                {entry.summary && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {entry.summary}
                  </p>
                )}
              </CardContent>
            </Card>
          </button>
        );
      })}

      {/* Uncategorized entries */}
      {data?.uncategorized && data.uncategorized.length > 0 && (
        <Card className="animate-fade-in-up" style={{ animationDelay: "300ms" }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Recent</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 pb-3">
            {data.uncategorized.map((entry) => (
              <button
                key={entry.id}
                onClick={() => onOpenEntry(entry.id)}
                className="w-full text-left p-2 rounded-lg hover:bg-muted/50 transition-all duration-200 active:scale-[0.98]"
              >
                <p className="text-sm font-medium truncate">{entry.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {entry.content}
                </p>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Tag Cloud */}
      {data?.topTags && data.topTags.length > 0 && (
        <Card className="animate-fade-in-up" style={{ animationDelay: "400ms" }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Themes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.topTags.map((tag) => (
                <Badge key={tag.id} variant="outline" className="text-xs">
                  {tag.name} ({tag.entryCount})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All recent entries (guaranteed fallback) */}
      {data?.recentEntries && data.recentEntries.length > 0 && (
        <Card className="animate-fade-in-up" style={{ animationDelay: "200ms" }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">All entries</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 pb-3">
            {data.recentEntries.map((entry: any) => (
              <button
                key={entry.id}
                onClick={() => onOpenEntry(entry.id)}
                className="w-full text-left p-2 rounded-lg hover:bg-muted/50 transition-all duration-200 active:scale-[0.98]"
              >
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate flex-1">{entry.title}</p>
                  {entry.type && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] h-4 shrink-0"
                      style={{ color: getEntryTypeColor(entry.type) }}
                    >
                      {entry.type.charAt(0) + entry.type.slice(1).toLowerCase()}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {entry.summary ?? entry.content}
                </p>
                <span className="text-[10px] text-muted-foreground">
                  {formatRelativeTime(entry.createdAt)}
                </span>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!hasContent && (
        <div className="text-center py-16 text-muted-foreground">
          <Compass className="h-12 w-12 mx-auto mb-4 opacity-20 animate-fade-in-up" />
          <p className="text-lg font-medium animate-fade-in-up stagger-1">No discoveries yet</p>
          <p className="text-sm mt-1 animate-fade-in-up stagger-2">Swipe left to add your first thought</p>
        </div>
      )}
    </div>
  );
}
