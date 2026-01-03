import { fetchUrlContent, extractUrls, isValidUrl } from '../src/lib/urlUtils';

async function test() {
    console.log('--- Testing URL Utils ---');

    const testText = "Check out this link: https://example.com and this one https://google.com";
    console.log(`Input text: "${testText}"`);

    const urls = extractUrls(testText);
    console.log('Extracted URLs:', urls);

    if (urls.length > 0) {
        const url = urls[0];
        console.log(`Fetching content for: ${url}`);
        const content = await fetchUrlContent(url);
        console.log('Content preview:', content?.substring(0, 200));
    }
}

test().catch(console.error);
