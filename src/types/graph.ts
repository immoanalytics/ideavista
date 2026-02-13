export interface GraphNode {
  id: string;
  title: string;
  type: string;
  category: string | null;
  categoryColor: string | null;
  tags: string[];
  summary: string | null;
  createdAt: Date;
  connections: number;
  x?: number;
  y?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  relationship: string;
  strength: number;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
