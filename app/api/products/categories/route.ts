import { NextResponse } from 'next/server';
import { getCategories } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/products/categories
 */
export async function GET() {
    try {
        const categories = await getCategories();
        return NextResponse.json({ success: true, data: categories });
    } catch (error) {
        console.error('Error fetching categories:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch categories', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
