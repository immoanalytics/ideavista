"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Trash2,
  ExternalLink,
  FileText,
  Download,
  Image as ImageIcon,
  Paperclip,
  Sparkles,
  Eye,
  EyeOff,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { formatDate, getEntryTypeColor, cn } from "@/lib/utils";
import { toast } from "sonner";

interface EntryDetailSheetProps {
  entryId: string | null;
  open: boolean;
  onClose: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function EntryDetailSheet({ entryId, open, onClose }: EntryDetailSheetProps) {
  const [showOriginal, setShowOriginal] = useState(false);
  const utils = trpc.useUtils();
  const entry = trpc.entry.getById.useQuery(
    { id: entryId! },
    { enabled: !!entryId }
  );

  const deleteEntry = trpc.entry.delete.useMutation({
    onSuccess: () => {
      utils.entry.list.invalidate();
      utils.discover.feed.invalidate();
      toast.success("Entry deleted");
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const data = entry.data;
  const urls = (data?.metadata as any)?.urls as any[] | undefined;
  const attachments = data?.attachments ?? [];
  const hasSummary = !!data?.summary;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setShowOriginal(false);
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        {entry.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : data ? (
          <>
            <DialogHeader>
              <DialogTitle className="pr-8 flex items-center gap-2">
                {hasSummary && <Sparkles className="h-4 w-4 text-primary/60 shrink-0" />}
                {data.title}
              </DialogTitle>
              <DialogDescription className="flex items-center gap-2 pt-1 flex-wrap">
                {data.type && (
                  <Badge
                    variant="secondary"
                    style={{ color: getEntryTypeColor(data.type) }}
                  >
                    {data.type.charAt(0) + data.type.slice(1).toLowerCase()}
                  </Badge>
                )}
                {data.aiCategory && (
                  <Badge
                    variant="outline"
                    style={{ borderColor: data.aiCategory.color ?? undefined }}
                  >
                    {data.aiCategory.name}
                  </Badge>
                )}
                <span className="text-xs">{formatDate(data.createdAt)}</span>
              </DialogDescription>
            </DialogHeader>

            {/* AI Summary — primary view */}
            {hasSummary && (
              <div className="bg-primary/5 rounded-lg p-3 text-sm leading-relaxed">
                {data.summary}
              </div>
            )}

            {/* Toggle: show original note */}
            {hasSummary && (
              <button
                onClick={() => setShowOriginal((v) => !v)}
                className={cn(
                  "flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg transition-colors w-fit",
                  showOriginal
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                {showOriginal ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
                {showOriginal ? "Hide original note" : "Show original note"}
              </button>
            )}

            {/* Original note (toggled) or main content (if no AI summary) */}
            {showOriginal ? (
              <div className="rounded-lg border border-border/40 bg-muted/30 p-3">
                <p className="text-[11px] text-muted-foreground font-medium mb-1.5">Original note</p>
                <div className="text-sm whitespace-pre-wrap text-foreground/80 leading-relaxed">
                  {data.content}
                </div>
              </div>
            ) : !hasSummary ? (
              <div className="text-sm whitespace-pre-wrap leading-relaxed">{data.content}</div>
            ) : null}

            {/* Attachments */}
            {attachments.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Paperclip className="h-3 w-3" />
                  Attachments ({attachments.length})
                </p>
                <div className="space-y-2">
                  {attachments.map((att) => {
                    const isImage = att.mimeType.startsWith("image/");
                    const fileUrl = `/api/files/${att.id}`;
                    return (
                      <div key={att.id}>
                        {/* Inline image preview */}
                        {isImage && (
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block mb-1.5"
                          >
                            <img
                              src={fileUrl}
                              alt={att.filename}
                              className="rounded-lg border border-border/40 max-h-48 w-auto object-contain"
                            />
                          </a>
                        )}
                        {/* File info row */}
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 rounded-lg border border-border/40 p-2.5 hover:bg-muted/50 transition-colors"
                        >
                          {isImage ? (
                            <ImageIcon className="h-4 w-4 text-blue-400 shrink-0" />
                          ) : (
                            <FileText className="h-4 w-4 text-orange-400 shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {att.filename}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {formatFileSize(att.size)}
                            </p>
                          </div>
                          <Download className="h-4 w-4 text-muted-foreground shrink-0" />
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* URL previews */}
            {urls && urls.length > 0 && (
              <div className="space-y-2">
                {urls.map((url: any, i: number) => (
                  <a
                    key={i}
                    href={url.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                  >
                    {url.image && (
                      <img
                        src={url.image}
                        alt=""
                        className="w-16 h-16 rounded object-cover shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium line-clamp-1">
                        {url.title ?? url.url}
                      </p>
                      {url.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {url.description}
                        </p>
                      )}
                      {url.siteName && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <ExternalLink className="h-3 w-3" />
                          {url.siteName}
                        </p>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            )}

            {/* Tags */}
            {data.tags && data.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {data.tags.map((t) => (
                  <Badge key={t.tag.id} variant="outline" className="text-xs">
                    {t.tag.name}
                  </Badge>
                ))}
              </div>
            )}

            {/* Related entries */}
            {(data.edgesFrom?.length > 0 || data.edgesTo?.length > 0) && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Related
                </p>
                <div className="space-y-1">
                  {data.edgesFrom?.map((edge) => (
                    <div
                      key={edge.target.id}
                      className="text-sm text-muted-foreground truncate"
                    >
                      {edge.relationship.replace(/_/g, " ")} &rarr;{" "}
                      {edge.target.title}
                    </div>
                  ))}
                  {data.edgesTo?.map((edge) => (
                    <div
                      key={edge.source.id}
                      className="text-sm text-muted-foreground truncate"
                    >
                      {edge.source.title} &rarr;{" "}
                      {edge.relationship.replace(/_/g, " ")}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Delete */}
            <div className="pt-2 border-t">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (entryId) deleteEntry.mutate({ id: entryId });
                }}
                disabled={deleteEntry.isPending}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Delete Entry
              </Button>
            </div>
          </>
        ) : (
          <p className="text-muted-foreground">Entry not found</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
