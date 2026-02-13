# IdeaVista Implementation Plan

## Overview
A full-stack idea visualization and organization app. Users input ideas, reminders, trips, etc. AI auto-categorizes, detects relationships, and creates interactive network visualizations. Account-based with sharing. Each user configures their own LLM provider.

## Tech Stack
- **Framework**: Next.js 15 (App Router, TypeScript)
- **Styling**: TailwindCSS 4 + shadcn/ui
- **Database**: PostgreSQL 16 + pgvector (Docker Compose)
- **ORM**: Prisma 6
- **Auth**: Auth.js v5 (email/password + Google OAuth)
- **AI**: Vercel AI SDK (multi-provider: OpenAI, Anthropic, Google) - no default, users configure their own
- **Visualization**: react-force-graph-2d + D3.js
- **API**: tRPC v11
- **State**: Zustand
- **PWA**: Native manifest + service worker

## Implementation Steps

### Phase 1: Scaffolding & Infrastructure
1. Initialize Next.js 15 project with TypeScript and TailwindCSS
2. Set up Docker Compose (PostgreSQL + pgvector)
3. Configure Prisma with full schema (Users, Entries, Collections, Shares, Tags, Categories, EntryEdges, AiProviderConfig)
4. Add pgvector extension via migration
5. Install and configure shadcn/ui components
6. Set up tRPC v11 with Next.js App Router

### Phase 2: Authentication
7. Configure Auth.js v5 with Prisma adapter (email/password + Google OAuth)
8. Build login and registration pages
9. Add session provider and auth middleware

### Phase 3: Core CRUD
10. Entry CRUD (tRPC routers + pages: list, create, detail/edit)
11. Collection CRUD (tRPC routers + pages)
12. Tag management
13. Dashboard layout (sidebar, topbar, mobile nav, stats cards, recent entries)

### Phase 4: AI Integration
14. AI provider config settings page (select provider, enter API key, choose model)
15. API key encryption service (AES-256-GCM)
16. LLM provider abstraction layer (dynamic factory using Vercel AI SDK)
17. Auto-categorization on entry create/update
18. Embedding generation + storage via pgvector
19. Relationship detection (cosine similarity + LLM-labeled edges)

### Phase 5: Visualizations
20. Graph data API (tRPC router returning nodes + edges)
21. Force-directed graph component (react-force-graph-2d)
22. Cluster view (D3.js pack layout)
23. Mind map view (D3.js tree layout)
24. Full visualization page with view toggles and filters
25. Mini graph on dashboard

### Phase 6: Sharing & Collaboration
26. Share dialog (share collection by email, permission levels: VIEW/EDIT/ADMIN)
27. Shared collections view page
28. Authorization middleware for shared content

### Phase 7: PWA & Polish
29. PWA manifest and service worker
30. Dark mode toggle
31. Loading skeletons, error boundaries, toast notifications
32. Keyboard shortcuts (Cmd+K search, Cmd+N new entry)

## Key Architectural Decisions
- LLM abstraction: Per-user dynamic provider factory via Vercel AI SDK. Users MUST configure their own provider before AI features work.
- Embeddings: Stored in PostgreSQL via pgvector with HNSW index for fast cosine similarity
- Relationships: EntryEdge model with strength (cosine similarity) and AI-labeled relationship types
- API keys: Encrypted at rest with AES-256-GCM using server-side ENCRYPTION_KEY
- Visualization: Primary force-directed graph, secondary cluster and mind map views
