import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://www.nbc.gov.kh/english/economic_research/exchange_rate.php', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      // Ensure we don't cache this request at the Next.js fetch level for too long
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch from NBC: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();

    // The NBC website HTML contains a string like: Official Exchange Rate : <font color="#FF3300">4037</font> KHR / USD
    const match = html.match(/Official Exchange Rate.*?<font[^>]*>([\d,]+)<\/font>\s*KHR \/ USD/i);
    
    if (match && match[1]) {
      const rateStr = match[1].replace(/,/g, '');
      const rate = parseInt(rateStr, 10);
      
      if (!isNaN(rate)) {
        return NextResponse.json({ rate });
      }
    }

    // Fallback if parsing fails but request succeeded
    console.error("Could not parse NBC exchange rate from HTML");
    return NextResponse.json({ error: "Could not parse NBC exchange rate", htmlPreview: html.substring(0, 500) }, { status: 500 });
    
  } catch (error) {
    console.error("NBC Exchange Rate API Error:", error);
    return NextResponse.json({ error: "Failed to fetch exchange rate" }, { status: 500 });
  }
}
