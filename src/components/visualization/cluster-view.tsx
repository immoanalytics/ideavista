"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { getEntryTypeColor } from "@/lib/utils";
import type { GraphNode } from "@/types/graph";
import { useRouter } from "next/navigation";

interface Props {
  nodes: GraphNode[];
}

export function ClusterView({ nodes }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // Group nodes by type
    const grouped = d3.group(nodes, (d) => d.type);
    const hierarchyData = {
      name: "root",
      children: Array.from(grouped, ([type, items]) => ({
        name: type,
        children: items.map((item) => ({
          name: item.title,
          value: Math.max(1, item.connections + 1),
          id: item.id,
          type: item.type,
        })),
      })),
    };

    const root = d3.hierarchy(hierarchyData)
      .sum((d: any) => d.value || 0)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    const pack = d3.pack<typeof hierarchyData>()
      .size([width - 20, height - 20])
      .padding(8);

    pack(root as any);

    const g = svg.append("g").attr("transform", "translate(10,10)");

    // Draw circles
    const node = g.selectAll("g")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("transform", (d: any) => `translate(${d.x},${d.y})`);

    node.append("circle")
      .attr("r", (d: any) => d.r)
      .attr("fill", (d: any) => {
        if (d.depth === 0) return "transparent";
        if (d.depth === 1) return getEntryTypeColor(d.data.name) + "20";
        return getEntryTypeColor(d.data.type);
      })
      .attr("stroke", (d: any) => {
        if (d.depth === 0) return "none";
        if (d.depth === 1) return getEntryTypeColor(d.data.name) + "60";
        return "none";
      })
      .attr("stroke-width", (d: any) => d.depth === 1 ? 2 : 0)
      .attr("opacity", (d: any) => d.depth === 2 ? 0.8 : 1)
      .style("cursor", (d: any) => d.depth === 2 ? "pointer" : "default")
      .on("click", (_event: any, d: any) => {
        if (d.depth === 2 && d.data.id) {
          router.push(`/entries/${d.data.id}`);
        }
      });

    // Labels for groups
    node.filter((d: any) => d.depth === 1)
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", (d: any) => -d.r + 16)
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .attr("fill", (d: any) => getEntryTypeColor(d.data.name))
      .text((d: any) => {
        const label = d.data.name.charAt(0) + d.data.name.slice(1).toLowerCase() + "s";
        return label;
      });

    // Labels for leaf nodes
    node.filter((d: any) => d.depth === 2 && d.r > 20)
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.3em")
      .attr("font-size", (d: any) => Math.min(d.r / 3, 11) + "px")
      .attr("fill", "white")
      .text((d: any) => {
        const maxLen = Math.floor(d.r / 4);
        return d.data.name.length > maxLen
          ? d.data.name.slice(0, maxLen) + "..."
          : d.data.name;
      });
  }, [nodes, router]);

  return (
    <svg
      ref={svgRef}
      className="w-full h-full"
      style={{ minHeight: "400px" }}
    />
  );
}
