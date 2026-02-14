export const CATEGORIZE_PROMPT = `Analyze the following entry and classify it. Return a JSON object with these fields:
- type: One of NOTE, IDEA, REMINDER, TRIP, TASK, BOOKMARK, JOURNAL
- categoryName: A short category name (e.g., "Technology", "Travel", "Health", "Finance", "Creative", "Work", "Personal")
- categoryColor: A hex color for the category (e.g., "#8B5CF6")
- tags: An array of 1-5 relevant tags (short, lowercase words)
- summary: A punchy 1-sentence summary (max 120 characters) that captures the key insight. Write it like a headline subtitle — engaging and concise, suitable for a card in a discovery feed.
- imageKeyword: A single English keyword (noun) that best represents the visual theme of this entry, suitable for searching stock photography (e.g., "mountain", "laptop", "cooking", "airplane", "notebook")

Entry title: {title}
Entry content: {content}`;

export const RELATIONSHIP_PROMPT = `Given these two entries, describe their relationship in one word or short phrase.
Choose from: related_to, depends_on, inspired_by, part_of, follow_up, contradicts, supports

Entry A:
Title: {titleA}
Content: {contentA}

Entry B:
Title: {titleB}
Content: {contentB}

Respond with just the relationship type.`;
