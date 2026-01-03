'use server';

import { fetchUrlContent } from './urlUtils';
import { parsePdf, parseDocx, parseText } from './fileParsing';

export async function extractTextFromUrlAction(url: string): Promise<string> {
    if (!url) return "";
    try {
        const content = await fetchUrlContent(url);
        return content || "";
    } catch (error) {
        console.error("Error extracting from URL:", error);
        throw new Error("Failed to fetch content from URL");
    }
}

export async function extractTextFromFileAction(formData: FormData): Promise<string> {
    const file = formData.get('file') as File;
    if (!file) {
        throw new Error("No file uploaded");
    }

    try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const type = file.type;
        const name = file.name.toLowerCase();

        if (type === 'application/pdf' || name.endsWith('.pdf')) {
            return await parsePdf(buffer);
        } else if (
            type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            name.endsWith('.docx')
        ) {
            return await parseDocx(buffer);
        } else if (type === 'text/plain' || name.endsWith('.txt') || name.endsWith('.md')) {
            return parseText(buffer);
        } else {
            // Try as text for other types or throw
            return parseText(buffer);
        }
    } catch (error: any) {
        console.error("Error processing file:", error);
        throw new Error(`Failed to process file: ${error.message}`);
    }
}
