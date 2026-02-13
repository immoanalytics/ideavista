import { createRouter } from "./init";
import { entryRouter } from "./routers/entry";
import { collectionRouter } from "./routers/collection";
import { shareRouter } from "./routers/share";
import { tagRouter } from "./routers/tag";
import { graphRouter } from "./routers/graph";
import { settingsRouter } from "./routers/settings";
import { aiRouter } from "./routers/ai";

export const appRouter = createRouter({
  entry: entryRouter,
  collection: collectionRouter,
  share: shareRouter,
  tag: tagRouter,
  graph: graphRouter,
  settings: settingsRouter,
  ai: aiRouter,
});

export type AppRouter = typeof appRouter;
