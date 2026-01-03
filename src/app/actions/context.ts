'use server';

const pdf = require('pdf-parse');
import mammoth from 'mammoth';

export async function extractText(formData: FormData): Promise<{ text: string; error?: string }> {
    try {
        const file = formData.get('file') as File;

        if (!file) {
            return { text: '', error: 'No file provided' };
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        let text = '';

        if (file.type === 'application/pdf') {
            const data = await pdf(buffer);
            text = data.text;
        } else if (
            file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ) {
            const result = await mammoth.extractRawText({ buffer });
            text = result.value;
        } else if (file.type === 'text/plain' || file.type === 'text/markdown' || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
            text = buffer.toString('utf-8');
        } else {
            return { text: '', error: 'Unsupported file type. Please upload PDF, DOCX, TXT, or MD.' };
        }

        return { text: text.trim() };
    } catch (error) {
        console.error('Error extracting text:', error);
        return { text: '', error: 'Failed to extract text from file' };
    }
}
