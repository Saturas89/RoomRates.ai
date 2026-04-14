import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(request: Request) {
  try {
    const { url, html: clientHtml } = await request.json();

    if (!url && !clientHtml) {
      return NextResponse.json({ error: 'Valid HTML or URL is required' }, { status: 400 });
    }

    let html = clientHtml;

    if (!html && url) {
        // Try to fetch the URL
        const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
        }
        });
        html = await response.text();
    }

    // Check if WAF blocked us
    if (html.includes('challenge-container') || html.includes('enable JavaScript')) {
        console.warn('WAF Blocked the request.');
        return NextResponse.json({
            error: 'Failed to extract data. The website blocked our automated request. Please try adding hotels manually.'
        }, { status: 403 });
    }

    const $ = cheerio.load(html);
    const hotels: { id: string, name: string, price: string, review: string }[] = [];

    // Selectors for Booking.com (these change frequently)
    $('[data-testid="property-card"]').each((i, el) => {
      const name = $(el).find('[data-testid="title"]').text().trim();
      const price = $(el).find('[data-testid="price-and-discounted-price"]').text().trim();
      const review = $(el).find('[data-testid="review-score"] > div:first-child').text().trim();

      if (name) {
          hotels.push({
              id: i.toString(),
              name,
              price: price || 'N/A',
              review: review || 'N/A'
          });
      }
    });

    // If parsing fails but it's not a clear WAF page
    if (hotels.length === 0) {
        return NextResponse.json({
            error: 'No hotels found. The webpage structure might have changed or no results were returned.'
        }, { status: 404 });
    }

    return NextResponse.json({ hotels, usingFallback: false });

  } catch (error) {
    console.error('Fetch booking error:', error);
    return NextResponse.json({ error: 'Failed to fetch booking data' }, { status: 500 });
  }
}
