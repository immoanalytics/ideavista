"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Share2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { formatRelativeTime, getEntryTypeColor } from "@/lib/utils";
import { ShareDialog } from "@/components/sharing/share-dialog";

export default function CollectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const collection = trpc.collection.getById.useQuery({ id });

  if (collection.isLoading) {
    return <div className="max-w-3xl mx-auto space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;
  }

  if (!collection.data) {
    return <div className="text-center py-12 text-muted-foreground">Collection not found</div>;
  }

  const col = collection.data;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/collections"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex items-center gap-2 flex-1">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: col.color ?? "#6B7280" }} />
          <h1 className="text-2xl font-bold">{col.name}</h1>
        </div>
        <ShareDialog collectionId={id} collectionName={col.name} existingShares={col.shares} />
      </div>

      {col.description && <p className="text-muted-foreground">{col.description}</p>}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{col.entries.length} Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {col.entries.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No entries in this collection yet.</p>
          ) : (
            <div className="space-y-2">
              {col.entries.map((ce) => (
                <Link
                  key={ce.entry.id}
                  href={`/entries/${ce.entry.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <FileText className="h-4 w-4" style={{ color: getEntryTypeColor(ce.entry.type) }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{ce.entry.title}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {ce.entry.type.charAt(0) + ce.entry.type.slice(1).toLowerCase()}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{formatRelativeTime(ce.addedAt)}</span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Shared With */}
      {col.shares.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Share2 className="h-4 w-4" /> Shared With
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {col.shares.map((share) => (
                <div key={share.sharedWith.id} className="flex items-center justify-between p-2">
                  <div>
                    <p className="text-sm font-medium">{share.sharedWith.name}</p>
                    <p className="text-xs text-muted-foreground">{share.sharedWith.email}</p>
                  </div>
                  <Badge variant="outline">{share.permission}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
