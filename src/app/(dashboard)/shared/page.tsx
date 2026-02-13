"use client";

import Link from "next/link";
import { Users, FolderOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";

export default function SharedPage() {
  const shared = trpc.share.listSharedWithMe.useQuery();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Shared with Me</h1>
        <p className="text-muted-foreground">Collections others have shared with you</p>
      </div>

      {shared.isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : shared.data?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No collections have been shared with you yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shared.data?.map((share) => (
            <Card key={share.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <Link href={`/collections/${share.collection.id}`}>
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-primary" />
                    <CardTitle className="text-base">{share.collection.name}</CardTitle>
                  </div>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Shared by {share.owner.name ?? share.owner.email}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{share.permission}</Badge>
                    <span className="text-xs text-muted-foreground">{share.collection._count.entries} entries</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
