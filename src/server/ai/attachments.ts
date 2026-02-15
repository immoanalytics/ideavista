import { generateObject } from "ai";
import { z } from "zod";
import type { AiProviderConfig } from "@prisma/client";
import { getUserTextModel } from "./provider";

const attachmentAnalysisSchema = z.object({
  description: z
    .string()
    .describe("A detailed text description of the attachment content"),
  detectedType: z
    .enum(["flight_ticket", "boarding_pass", "hotel_booking", "receipt", "invoice", "photo", "screenshot", "document", "other"])
    .describe("What kind of document/image this is"),
  extractedInfo: z
    .string()
    .describe("Key info extracted: dates, locations, names, amounts, airlines, etc."),
});

export interface AttachmentForAnalysis {
  filename: string;
  mimeType: string;
  data: Buffer;
}

/**
 * Analyze attachments using AI vision/text capabilities.
 * Returns a combined text description that can be appended to entry content
 * for better categorization.
 */
export async function analyzeAttachments(
  config: AiProviderConfig,
  attachments: AttachmentForAnalysis[]
): Promise<string> {
  if (attachments.length === 0) return "";

  const model = getUserTextModel(config);
  const descriptions: string[] = [];

  for (const att of attachments) {
    try {
      if (att.mimeType.startsWith("image/")) {
        // Use AI vision to describe images
        const { object } = await generateObject({
          model,
          schema: attachmentAnalysisSchema,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Analyze this attached file "${att.filename}". Describe what it shows, extract all key information (dates, names, locations, flight numbers, booking references, amounts, etc.), and classify what type of document it is.`,
                },
                {
                  type: "image",
                  image: att.data,
                  mimeType: att.mimeType as any,
                },
              ],
            },
          ],
        });
        descriptions.push(
          `[Attachment: ${att.filename}] Type: ${object.detectedType}. ${object.description}. Key info: ${object.extractedInfo}`
        );
      } else if (att.mimeType === "text/plain") {
        // For text files, include the content directly
        const text = att.data.toString("utf-8").slice(0, 3000);
        descriptions.push(
          `[Attachment: ${att.filename}] Content: ${text}`
        );
      } else {
        // For PDFs and other files, use the filename + any text we can extract
        // The filename itself is often very informative (e.g., "ryanair-boarding-pass.pdf")
        const { object } = await generateObject({
          model,
          schema: attachmentAnalysisSchema,
          messages: [
            {
              role: "user",
              content: `A file named "${att.filename}" (type: ${att.mimeType}, size: ${att.data.length} bytes) was attached to a note. Based on the filename and file type, what is this likely to be? Infer as much as you can from the filename about what this document contains — airlines, destinations, dates, booking platforms, etc.`,
            },
          ],
        });
        descriptions.push(
          `[Attachment: ${att.filename}] Type: ${object.detectedType}. ${object.description}. Key info: ${object.extractedInfo}`
        );
      }
    } catch (e) {
      // If AI analysis fails for one file, still include the filename
      descriptions.push(`[Attachment: ${att.filename}] (${att.mimeType})`);
    }
  }

  return descriptions.join("\n");
}
