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
 * Checks if a string is a valid and safe public HTTP(S) URL.
 * Protects against SSRF by blocking localhost, private subnets, and cloud metadata endpoints.
 */
export function isSafePublicUrl(text: string): boolean {
    try {
        const parsed = new URL(text);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            return false;
        }

        const hostname = parsed.hostname.toLowerCase();

        // Block localhost and internal domain suffixes
        if (
            hostname === 'localhost' ||
            hostname.endsWith('.localhost') ||
            hostname.endsWith('.local') ||
            hostname.endsWith('.internal') ||
            hostname === 'metadata.google.internal'
        ) {
            return false;
        }

        // Check IPv4 private, loopback, and link-local ranges
        const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
        if (ipv4Match) {
            const [, oct1, oct2] = ipv4Match.map(Number);
            if (oct1 === 0) return false;
            if (oct1 === 127) return false; // Loopback
            if (oct1 === 10) return false; // 10.0.0.0/8
            if (oct1 === 172 && oct2 >= 16 && oct2 <= 31) return false; // 172.16.0.0/12
            if (oct1 === 192 && oct2 === 168) return false; // 192.168.0.0/16
            if (oct1 === 169 && oct2 === 254) return false; // 169.254.0.0/16 Link-local / AWS metadata
        }

        // Check IPv6 loopback and private ranges
        if (hostname === '[::1]' || hostname === '::1' || hostname.startsWith('fe80:') || hostname.startsWith('fc00:')) {
            return false;
        }

        return true;
    } catch {
        return false;
    }
}

/**
 * Fetches the content of a URL and extracts the main text using cheerio.
 * Returns a simplified text representation of the page.
 */
export async function fetchUrlContent(url: string): Promise<string | null> {
    if (!isSafePublicUrl(url)) {
        console.warn(`[SSRF Guard] Blocked potentially unsafe or non-public URL: ${url}`);
        return null;
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const response = await fetch(url, {
            signal: controller.signal,
            redirect: 'error', // Prevent SSRF via redirects to internal/metadata services
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
