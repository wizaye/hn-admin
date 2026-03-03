import { NextResponse } from 'next/server';
import { queryD1 } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface RouteParams {
    params: Promise<{ category: string }>;
}

/**
 * GET /api/products/[category]
 * Supports pagination with limit/offset and search
 */
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const { category } = await params;
        if (!category) {
            return NextResponse.json({ success: false, error: 'Category parameter is required' }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '10');
        const offset = parseInt(searchParams.get('offset') || '0');
        const search = searchParams.get('search') || '';

        const tableName = category.toLowerCase().replace(/\s+/g, '_');

        let sql = `SELECT * FROM ${tableName}`;
        const sqlParams: any[] = [];

        if (search) {
            sql += ' WHERE model LIKE ?';
            sqlParams.push(`%${search}%`);
        }

        const countSql = search
            ? `SELECT COUNT(*) as count FROM ${tableName} WHERE model LIKE ?`
            : `SELECT COUNT(*) as count FROM ${tableName}`;
        const countParams = search ? [`%${search}%`] : [];
        const countResult = await queryD1<{ count: number }>(countSql, countParams);
        const totalCount = countResult[0]?.count || 0;

        sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
        sqlParams.push(limit, offset);

        const products = await queryD1(sql, sqlParams);

        return NextResponse.json({
            success: true,
            data: products,
            category,
            count: products.length,
            pagination: {
                total: totalCount,
                limit,
                offset,
                hasMore: offset + limit < totalCount,
            },
        });
    } catch (error) {
        console.error('Error fetching products by category:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch products for category', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
