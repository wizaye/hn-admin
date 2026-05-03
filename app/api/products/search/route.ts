import { NextResponse } from 'next/server';
import { getCategories, queryD1 } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const q = searchParams.get('q');

        if (!q || q.length < 2) {
            return NextResponse.json({ success: true, data: [] });
        }

        const categories = await getCategories();
        const searchPattern = `%${q}%`;
        
        const results = [];
        
        for (const { category } of categories) {
            const tableName = category.toLowerCase().replace(/\s+/g, '_');
            try {
                // Fetch basic info for autocomplete
                const products = await queryD1(
                    `SELECT id, model, price, color FROM ${tableName} WHERE model LIKE ? LIMIT 10`,
                    [searchPattern]
                );
                
                for (const p of products) {
                    results.push({
                        id: p.id,
                        model: p.model || p.id,
                        color: p.color || '',
                        price: p.price || 0,
                        category: category
                    });
                }
                
                if (results.length > 20) break;
            } catch (err) {
                // Ignore if table doesn't exist
                console.error(`Error searching in ${tableName}:`, err);
            }
        }

        return NextResponse.json({
            success: true,
            data: results.slice(0, 20)
        });
    } catch (error) {
        console.error('Error searching products:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to search products' },
            { status: 500 }
        );
    }
}
