"use client";

import { useState } from "react";
import { Network, Grid3X3, GitBranch, Filter, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { ENTRY_TYPES } from "@/lib/constants";
import { ForceGraph } from "@/components/visualization/force-graph";
import { ClusterView } from "@/components/visualization/cluster-view";
import { MindMapView } from "@/components/visualization/mind-map";

export default function VisualizePage() {
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [fullscreen, setFullscreen] = useState(false);

  const graphData = trpc.graph.getFullGraph.useQuery(
    { type: typeFilter || undefined, search: search || undefined },
  );

  return (
    <div className={`space-y-4 ${fullscreen ? "fixed inset-0 z-50 bg-background p-4" : ""}`}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Visualize</h1>
        <div className="flex items-center gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {ENTRY_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => setFullscreen(!fullscreen)}>
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {graphData.isLoading ? (
        <Skeleton className="h-[600px] w-full rounded-lg" />
      ) : !graphData.data || graphData.data.nodes.length === 0 ? (
        <Card>
          <CardContent className="py-24 text-center text-muted-foreground">
            <Network className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg">No entries to visualize yet</p>
            <p className="text-sm mt-2">Create some entries and let AI analyze them to see connections.</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="graph">
          <TabsList>
            <TabsTrigger value="graph" className="gap-2"><Network className="h-4 w-4" />Graph</TabsTrigger>
            <TabsTrigger value="cluster" className="gap-2"><Grid3X3 className="h-4 w-4" />Clusters</TabsTrigger>
            <TabsTrigger value="mindmap" className="gap-2"><GitBranch className="h-4 w-4" />Mind Map</TabsTrigger>
          </TabsList>
          <TabsContent value="graph" className="mt-4">
            <Card>
              <CardContent className="p-0 overflow-hidden rounded-lg" style={{ height: fullscreen ? "calc(100vh - 160px)" : "600px" }}>
                <ForceGraph nodes={graphData.data.nodes} edges={graphData.data.edges} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="cluster" className="mt-4">
            <Card>
              <CardContent className="p-4" style={{ height: fullscreen ? "calc(100vh - 160px)" : "600px" }}>
                <ClusterView nodes={graphData.data.nodes} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="mindmap" className="mt-4">
            <Card>
              <CardContent className="p-4" style={{ height: fullscreen ? "calc(100vh - 160px)" : "600px" }}>
                <MindMapView nodes={graphData.data.nodes} edges={graphData.data.edges} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>{graphData.data?.nodes.length ?? 0} nodes</span>
        <span>{graphData.data?.edges.length ?? 0} connections</span>
      </div>
    </div>
  );
}
