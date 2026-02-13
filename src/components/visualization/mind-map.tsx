"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { getEntryTypeColor } from "@/lib/utils";
import type { GraphNode, GraphEdge } from "@/types/graph";
import { useRouter } from "next/navigation";

interface Props {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function MindMapView({ nodes, edges }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const router = useRouter();
  const [rootId, setRootId] = useState<string | null>(null);

  // Pick root: most connected node
  useEffect(() => {
    if (nodes.length > 0 && !rootId) {
      const sorted = [...nodes].sort((a, b) => b.connections - a.connections);
      setRootId(sorted[0].id);
    }
  }, [nodes, rootId]);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0 || !rootId) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // Build adjacency from edges
    const adj = new Map<string, { id: string; relationship: string }[]>();
    for (const edge of edges) {
      if (!adj.has(edge.source)) adj.set(edge.source, []);
      if (!adj.has(edge.target)) adj.set(edge.target, []);
      adj.get(edge.source)!.push({ id: edge.target, relationship: edge.relationship });
      adj.get(edge.target)!.push({ id: edge.source, relationship: edge.relationship });
    }

    // BFS from root to build tree
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const visited = new Set<string>();

    function buildTree(id: string, depth: number): any {
      visited.add(id);
      const node = nodeMap.get(id);
      if (!node) return null;

      const children: any[] = [];
      if (depth < 3) {
        const neighbors = adj.get(id) ?? [];
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor.id)) {
            const child = buildTree(neighbor.id, depth + 1);
            if (child) children.push(child);
          }
        }
      }

      return {
        name: node.title,
        id: node.id,
        type: node.type,
        children: children.length > 0 ? children : undefined,
      };
    }

    const treeData = buildTree(rootId, 0);
    if (!treeData) return;

    // Also add disconnected nodes as children of root
    const disconnected = nodes.filter((n) => !visited.has(n.id));
    if (disconnected.length > 0) {
      if (!treeData.children) treeData.children = [];
      for (const n of disconnected) {
        treeData.children.push({ name: n.title, id: n.id, type: n.type });
      }
    }

    const root = d3.hierarchy(treeData);
    const treeLayout = d3.tree().size([height - 60, width - 200]);
    treeLayout(root as any);

    const g = svg.append("g").attr("transform", "translate(100,30)");

    // Links
    g.selectAll("path")
      .data(root.links())
      .enter()
      .append("path")
      .attr("d", (d: any) => {
        return `M${d.source.y},${d.source.x}
                C${(d.source.y + d.target.y) / 2},${d.source.x}
                 ${(d.source.y + d.target.y) / 2},${d.target.x}
                 ${d.target.y},${d.target.x}`;
      })
      .attr("fill", "none")
      .attr("stroke", "hsl(var(--border))")
      .attr("stroke-width", 1.5);

    // Nodes
    const nodeG = g.selectAll("g")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("transform", (d: any) => `translate(${d.y},${d.x})`)
      .style("cursor", "pointer")
      .on("click", (_event: any, d: any) => {
        if (d.data.id) {
          router.push(`/entries/${d.data.id}`);
        }
      });

    nodeG.append("circle")
      .attr("r", (d: any) => d.depth === 0 ? 8 : 5)
      .attr("fill", (d: any) => getEntryTypeColor(d.data.type || "NOTE"));

    nodeG.append("text")
      .attr("dx", (d: any) => d.children ? -12 : 12)
      .attr("dy", "0.3em")
      .attr("text-anchor", (d: any) => d.children ? "end" : "start")
      .attr("font-size", "11px")
      .attr("fill", "hsl(var(--foreground))")
      .text((d: any) => {
        const name = d.data.name;
        return name.length > 30 ? name.slice(0, 30) + "..." : name;
      });
  }, [nodes, edges, rootId, router]);

  return (
    <div className="w-full h-full relative">
      {nodes.length > 0 && (
        <div className="absolute top-2 right-2 z-10">
          <select
            className="text-xs bg-popover border rounded px-2 py-1"
            value={rootId ?? ""}
            onChange={(e) => setRootId(e.target.value)}
          >
            {nodes
              .sort((a, b) => b.connections - a.connections)
              .slice(0, 20)
              .map((n) => (
                <option key={n.id} value={n.id}>
                  {n.title.slice(0, 40)}
                </option>
              ))}
          </select>
        </div>
      )}
      <svg ref={svgRef} className="w-full h-full" style={{ minHeight: "400px" }} />
    </div>
  );
}
