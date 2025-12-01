/* eslint-disable @typescript-eslint/no-explicit-any */
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => Promise.resolve(cookieStore) });
  
  try {
    // Get the user (more secure than session)
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (!user || userError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content_blocks, format = 'text' } = await request.json();

    // Validate input
    if (!content_blocks) {
      return NextResponse.json({ error: 'Content blocks are required' }, { status: 400 });
    }

    // Generate content based on format
    let fileContent = '';
    let fileName = '';
    let contentType = '';

    switch (format) {
      case 'markdown':
        fileContent = generateMarkdown(content_blocks);
        fileName = 'content-export.md';
        contentType = 'text/markdown';
        break;
      case 'csv':
        fileContent = generateCSV(content_blocks);
        fileName = 'content-export.csv';
        contentType = 'text/csv';
        break;
      case 'text':
      default:
        fileContent = generateText(content_blocks);
        fileName = 'content-export.txt';
        contentType = 'text/plain';
        break;
    }

    // Create response with file content
    const response = new NextResponse(fileContent);
    response.headers.set('Content-Type', contentType);
    response.headers.set('Content-Disposition', `attachment; filename="${fileName}"`);

    return response;
  } catch (error) {
    console.error('Error generating export:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper functions to generate different formats
function generateText(blocks: any[]): string {
  return blocks.map(block => block.content).join('\n\n');
}

function generateMarkdown(blocks: any[]): string {
  let md = '';
  blocks.forEach(block => {
    md += `## ${block.type.charAt(0).toUpperCase() + block.type.slice(1)}\n\n`;
    md += `${block.content}\n\n`;
  });
  return md;
}

function generateCSV(blocks: any[]): string {
  // Create CSV content with type and content columns
  let csv = 'Type,Content\n';
  blocks.forEach(block => {
    // Escape content for CSV
    const escapedContent = block.content.replace(/"/g, '""');
    csv += `"${block.type}","${escapedContent}"\n`;
  });
  return csv;
}