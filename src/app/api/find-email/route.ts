import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Use a lightweight API approach similar to duckduckgo HTML search
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query + ' email contact')}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });

    const text = await response.text();
    const emails = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];

    // Filter out common false positives
    const validEmails = [...new Set(emails)].filter(e =>
      !e.includes('duckduckgo') &&
      !e.includes('example.com') &&
      !e.includes('sentry') &&
      !e.endsWith('.png') &&
      !e.endsWith('.jpg')
    );

    return NextResponse.json({ emails: validEmails.slice(0, 5) });
  } catch (error) {
    console.error('Email search error:', error);
    return NextResponse.json({ error: 'Failed to find emails' }, { status: 500 });
  }
}
