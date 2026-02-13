import { z } from "zod";

export const entryTypeEnum = z.enum([
  "NOTE",
  "IDEA",
  "REMINDER",
  "TRIP",
  "TASK",
  "BOOKMARK",
  "JOURNAL",
]);

export const createEntrySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1, "Content is required").max(10000),
  type: entryTypeEnum.optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const updateEntrySchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(10000).optional(),
  type: entryTypeEnum.optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const createCollectionSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export const updateCollectionSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export const shareCollectionSchema = z.object({
  collectionId: z.string().cuid(),
  email: z.string().email("Valid email required"),
  permission: z.enum(["VIEW", "EDIT", "ADMIN"]).default("VIEW"),
});

export const aiProviderEnum = z.enum(["OPENAI", "ANTHROPIC", "GOOGLE"]);

export const aiConfigSchema = z.object({
  provider: aiProviderEnum,
  apiKey: z.string().min(1, "API key is required"),
  model: z.string().min(1),
  embedModel: z.string().min(1),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Valid email required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100),
});

export const loginSchema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(1, "Password is required"),
});
