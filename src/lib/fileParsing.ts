const pdf = require('pdf-parse');
import mammoth from 'mammoth';

export async function parsePdf(buffer: Buffer): Promise<string> {
    try {
        const data = await pdf(buffer);
        return data.text;
    } catch (error) {
        console.error("Error parsing PDF:", error);
        throw new Error("Failed to parse PDF file");
    }
}

export async function parseDocx(buffer: Buffer): Promise<string> {
    try {
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
    } catch (error) {
        console.error("Error parsing DOCX:", error);
        throw new Error("Failed to parse DOCX file");
    }
}

export function parseText(buffer: Buffer): string {
    return buffer.toString('utf-8');
}
