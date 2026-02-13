import { z } from "zod";
import { createRouter, protectedProcedure } from "../init";

export const graphRouter = createRouter({
  getFullGraph: protectedProcedure
    .input(
      z.object({
        type: z.string().optional(),
        search: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      try {
      const where: any = { userId: ctx.userId };
      if (input?.type && input.type !== "all") where.type = input.type;
      if (input?.search) {
        where.OR = [
          { title: { contains: input.search, mode: "insensitive" } },
          { content: { contains: input.search, mode: "insensitive" } },
        ];
      }

      const entries = await ctx.db.entry.findMany({
        where,
        include: { aiCategory: true, tags: { include: { tag: true } } },
      });

      const entryIds = entries.map((e) => e.id);

      const edges = await ctx.db.entryEdge.findMany({
        where: {
          OR: [
            { sourceId: { in: entryIds } },
            { targetId: { in: entryIds } },
          ],
        },
      });

      const nodes = entries.map((entry) => ({
        id: entry.id,
        title: entry.title,
        type: entry.type,
        category: entry.aiCategory?.name ?? null,
        categoryColor: entry.aiCategory?.color ?? null,
        tags: entry.tags.map((t) => t.tag.name),
        summary: entry.summary,
        createdAt: entry.createdAt,
        connections: edges.filter(
          (e) => e.sourceId === entry.id || e.targetId === entry.id
        ).length,
      }));

      const graphEdges = edges
        .filter(
          (e) => entryIds.includes(e.sourceId) && entryIds.includes(e.targetId)
        )
        .map((e) => ({
          source: e.sourceId,
          target: e.targetId,
          relationship: e.relationship,
          strength: e.strength,
        }));

      return { nodes, edges: graphEdges };
      } catch {
        return { nodes: [], edges: [] };
      }
    }),
});
