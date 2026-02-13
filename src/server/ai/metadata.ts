export interface UrlMetadata {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  type?: string;
}

function getMetaContent(html: string, property: string): string | undefined {
  const match =
    html.match(
      new RegExp(
        `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`,
        "i"
      )
    ) ||
    html.match(
      new RegExp(
        `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`,
        "i"
      )
    );
  return match?.[1];
}

export async function extractUrlMetadata(
  content: string
): Promise<UrlMetadata[]> {
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;
  const urls = [...new Set(content.match(urlRegex) || [])].slice(0, 5);

  const results: UrlMetadata[] = [];
  for (const url of urls) {
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": "IdeaVistaBot/1.0" },
        signal: AbortSignal.timeout(5000),
      });
      const html = await response.text();

      results.push({
        url,
        title:
          getMetaContent(html, "og:title") ||
          html.match(/<title>([^<]+)<\/title>/i)?.[1],
        description:
          getMetaContent(html, "og:description") ||
          getMetaContent(html, "description"),
        image: getMetaContent(html, "og:image"),
        siteName: getMetaContent(html, "og:site_name"),
        type: getMetaContent(html, "og:type"),
      });
    } catch {
      results.push({ url });
    }
  }
  return results;
}
