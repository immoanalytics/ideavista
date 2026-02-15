export const CATEGORIZE_PROMPT = `Analyze the following entry and classify it. Return a JSON object with these fields:
- type: One of NOTE, IDEA, REMINDER, TRIP, TASK, BOOKMARK, JOURNAL
- categoryName: MUST be exactly one of these four categories:
  * "Trips" — for anything related to hotels, flights, tickets, destinations, travel plans
  * "Entertainment" — for movies to watch, shows, activities, things to do, events, games
  * "To Read" — for articles, links to read later, things to try, tutorials, recommendations
  * "Other" — for everything that doesn't clearly fit the above three
- tags: An array of 1-5 relevant tags (short, lowercase words)
- summary: A rephrased, clear version of the original note. Clean up grammar, structure, and wording while preserving all the original meaning and details. Do NOT simply repeat the input — rephrase it in a polished, readable way. For short notes, expand slightly with helpful context. For long notes, condense into the key points. Aim for 1-3 sentences.
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
