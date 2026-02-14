export const APP_NAME = "IdeaVista";
export const APP_DESCRIPTION =
  "Capture ideas, discover connections, visualize everything.";

export const ENTRY_TYPES = [
  { value: "NOTE", label: "Note", icon: "FileText", color: "#6B7280" },
  { value: "IDEA", label: "Idea", icon: "Lightbulb", color: "#8B5CF6" },
  { value: "REMINDER", label: "Reminder", icon: "Bell", color: "#F59E0B" },
  { value: "TRIP", label: "Trip", icon: "Plane", color: "#10B981" },
  { value: "TASK", label: "Task", icon: "CheckSquare", color: "#3B82F6" },
  { value: "BOOKMARK", label: "Bookmark", icon: "Bookmark", color: "#EC4899" },
  { value: "JOURNAL", label: "Journal", icon: "BookOpen", color: "#F97316" },
] as const;

export const AI_PROVIDERS = [
  {
    value: "OPENAI",
    label: "OpenAI",
    models: ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo"],
    embedModels: ["text-embedding-3-small", "text-embedding-3-large"],
  },
  {
    value: "ANTHROPIC",
    label: "Anthropic",
    models: ["claude-sonnet-4-5-20250929", "claude-haiku-4-5-20251001"],
    embedModels: [],
  },
  {
    value: "GOOGLE",
    label: "Google",
    models: [
      "gemini-2.5-flash",
      "gemini-2.5-pro",
      "gemini-2.0-flash",
      "gemini-2.0-flash-lite",
      "gemini-1.5-pro",
      "gemini-1.5-flash",
    ],
    embedModels: ["gemini-embedding-001"],
  },
] as const;

export const COLLECTION_COLORS = [
  "#EF4444",
  "#F59E0B",
  "#10B981",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#F97316",
  "#06B6D4",
];

export const RELATIONSHIP_TYPES = [
  "related_to",
  "depends_on",
  "inspired_by",
  "part_of",
  "follow_up",
  "contradicts",
  "supports",
] as const;
