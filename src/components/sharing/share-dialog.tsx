"use client";

import { useState } from "react";
import { Share2, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface ShareDialogProps {
  collectionId: string;
  collectionName: string;
  existingShares: Array<{
    id?: string;
    sharedWith: { id: string; name: string | null; email: string; image: string | null };
    permission: string;
  }>;
}

export function ShareDialog({ collectionId, collectionName, existingShares }: ShareDialogProps) {
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<string>("VIEW");
  const utils = trpc.useUtils();

  const shareCreate = trpc.share.create.useMutation({
    onSuccess: () => {
      utils.collection.getById.invalidate({ id: collectionId });
      setEmail("");
      toast.success("Collection shared!");
    },
    onError: (err) => toast.error(err.message),
  });

  const shareRevoke = trpc.share.revoke.useMutation({
    onSuccess: () => {
      utils.collection.getById.invalidate({ id: collectionId });
      toast.success("Share revoked");
    },
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share &quot;{collectionName}&quot;</DialogTitle>
          <DialogDescription>
            Share this collection with other IdeaVista users by email.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label className="sr-only">Email</Label>
              <Input
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Select value={permission} onValueChange={setPermission}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VIEW">View</SelectItem>
                <SelectItem value="EDIT">Edit</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => shareCreate.mutate({
                collectionId,
                email,
                permission: permission as "VIEW" | "EDIT" | "ADMIN",
              })}
              disabled={!email || shareCreate.isPending}
            >
              {shareCreate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Share"}
            </Button>
          </div>

          {existingShares.length > 0 && (
            <div className="space-y-2">
              <Label>Shared with</Label>
              {existingShares.map((share) => (
                <div key={share.sharedWith.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                  <div>
                    <p className="text-sm font-medium">{share.sharedWith.name ?? share.sharedWith.email}</p>
                    <p className="text-xs text-muted-foreground">{share.sharedWith.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{share.permission}</Badge>
                    {share.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => shareRevoke.mutate({ shareId: share.id! })}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
