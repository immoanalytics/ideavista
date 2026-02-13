"use client";

import { useCallback, useRef, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { getEntryTypeColor } from "@/lib/utils";
import type { GraphNode, GraphEdge } from "@/types/graph";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-muted-foreground">
      Loading graph...
    </div>
  ),
});

interface Props {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function ForceGraph({ nodes, edges }: Props) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);

  useEffect(() => {
    function updateSize() {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    }
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const graphData = {
    nodes: nodes.map((n) => ({
      ...n,
      val: Math.max(2, n.connections * 2 + 3),
      color: getEntryTypeColor(n.type),
    })),
    links: edges.map((e) => ({
      source: e.source,
      target: e.target,
      relationship: e.relationship,
      strength: e.strength,
    })),
  };

  const nodeCanvasObject = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const label = node.title;
      const fontSize = 12 / globalScale;
      const nodeSize = node.val || 4;
      const isHovered = hoveredNode?.id === node.id;

      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI);
      ctx.fillStyle = node.color;
      ctx.globalAlpha = isHovered ? 1 : 0.85;
      ctx.fill();

      if (isHovered) {
        ctx.strokeStyle = node.color;
        ctx.lineWidth = 2 / globalScale;
        ctx.stroke();
      }

      // Label
      ctx.globalAlpha = 1;
      ctx.font = `${isHovered ? "bold " : ""}${fontSize}px Sans-Serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = isHovered ? node.color : "#888";
      ctx.fillText(
        label.length > 20 ? label.substring(0, 20) + "..." : label,
        node.x,
        node.y + nodeSize + 2
      );
    },
    [hoveredNode]
  );

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <ForceGraph2D
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        nodeCanvasObject={nodeCanvasObject}
        linkColor={() => "rgba(150,150,150,0.3)"}
        linkWidth={(link: any) => Math.max(0.5, (link.strength ?? 0.5) * 3)}
        linkDirectionalParticles={1}
        linkDirectionalParticleWidth={2}
        onNodeClick={(node: any) => router.push(`/entries/${node.id}`)}
        onNodeHover={(node: any) => setHoveredNode(node)}
        cooldownTicks={100}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
        enableZoomInteraction={true}
        enablePanInteraction={true}
      />

      {hoveredNode && (
        <div className="absolute top-4 right-4 bg-popover border rounded-lg shadow-lg p-3 max-w-xs pointer-events-none">
          <p className="font-medium text-sm">{hoveredNode.title}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {hoveredNode.type} {hoveredNode.category ? `- ${hoveredNode.category}` : ""}
          </p>
          {hoveredNode.summary && (
            <p className="text-xs mt-2 line-clamp-2">{hoveredNode.summary}</p>
          )}
          {hoveredNode.tags.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {hoveredNode.tags.map((tag) => (
                <span key={tag} className="text-xs bg-muted px-1.5 py-0.5 rounded">
                  {tag}
                </span>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            {hoveredNode.connections} connections
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-popover/90 border rounded-lg p-3 text-xs">
        <p className="font-medium mb-2">Entry Types</p>
        <div className="grid grid-cols-2 gap-1">
          {["IDEA", "REMINDER", "TRIP", "TASK", "NOTE", "BOOKMARK", "JOURNAL"].map((type) => (
            <div key={type} className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: getEntryTypeColor(type) }}
              />
              <span className="text-muted-foreground">
                {type.charAt(0) + type.slice(1).toLowerCase()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
