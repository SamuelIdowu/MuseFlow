import * as cheerio from 'cheerio';

/**
 * Checks if a string is a valid URL.
 */
export function isValidUrl(text: string): boolean {
    try {
        new URL(text);
        return true;
    } catch {
        return false;
    }
}

/**
 * Extracts all URLs from a given text.
 */
export function extractUrls(text: string): string[] {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
}

/**
 * Fetches the content of a URL and extracts the main text using cheerio.
 * Returns a simplified text representation of the page.
 */
export async function fetchUrlContent(url: string): Promise<string | null> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            console.warn(`Failed to fetch URL ${url}: ${response.status} ${response.statusText}`);
            return null;
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Remove scripts, styles, and other non-content elements
        $('script, style, noscript, iframe, svg, header, footer, nav').remove();

        // Extract text from body
        // We can focus on article, main, or just body
        const content = $('body').text();

        // Clean up whitespace
        const cleanText = content
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 10000); // Limit to 10k chars to avoid token limits

        return cleanText;
    } catch (error) {
        console.error(`Error fetching URL ${url}:`, error);
        return null;
    }
}
