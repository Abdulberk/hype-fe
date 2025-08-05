import { NextRequest, NextResponse } from 'next/server';

// Vercel Blob URLs mapping
const BLOB_URLS = {
  my_place: process.env.NEXT_PUBLIC_BLOB_MY_PLACE_URL,
  competitors: process.env.NEXT_PUBLIC_BLOB_COMPETITORS_URL,
  trade_areas: process.env.NEXT_PUBLIC_BLOB_TRADE_AREAS_URL,
  home_zipcodes: process.env.NEXT_PUBLIC_BLOB_HOME_ZIPCODES_URL,
  zipcodes: process.env.NEXT_PUBLIC_BLOB_ZIPCODES_URL,
} as const;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    // Validate slug
    if (!slug || !(slug in BLOB_URLS)) {
      return NextResponse.json(
        { error: 'Invalid data slug' }, 
        { status: 400 }
      );
    }
    
    const blobUrl = BLOB_URLS[slug as keyof typeof BLOB_URLS];
    
    if (!blobUrl) {
      return NextResponse.json(
        { error: 'Blob URL not configured' }, 
        { status: 500 }
      );
    }
    
    // Fetch from Vercel Blob
    const response = await fetch(blobUrl, {
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${slug}: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Return with caching headers
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        'Content-Type': 'application/json',
      },
    });
    
  } catch (error) {
    const { slug } = await params;
    console.error(`Error fetching data for ${slug}:`, error);
    
    return NextResponse.json(
      {
        error: 'Failed to fetch data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}