import { NextRequest, NextResponse } from 'next/server';

const FREEIMAGE_API_KEY = '6d207e02198a847aa98d0a2a901485a5';

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();
    
    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const formData = new FormData();
    formData.append('key', FREEIMAGE_API_KEY);
    formData.append('action', 'upload');
    formData.append('source', image);
    formData.append('format', 'json');

    const response = await fetch('https://freeimage.host/api/1/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (data.status_code === 200 && data.image?.url) {
      console.log('=== IMAGE UPLOADED ===');
      console.log('Image URL:', data.image.url);
      
      return NextResponse.json({ 
        success: true, 
        url: data.image.url,
        thumb: data.image.thumb?.url,
        medium: data.image.medium?.url,
      });
    } else {
      return NextResponse.json({ 
        error: data.error?.message || 'Failed to upload image' 
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json({ 
      error: 'Failed to upload image' 
    }, { status: 500 });
  }
}
