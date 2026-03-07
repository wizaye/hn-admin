import { NextResponse } from 'next/server';
import { queryD1 } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/enquiries
 * Retrieves all enquiries with optional status filter
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        let sql = 'SELECT * FROM enquiries';
        const params: any[] = [];

        if (status) {
            sql += ' WHERE status = ?';
            params.push(status);
        }

        sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const enquiries = await queryD1(sql, params);

        const parsedEnquiries = enquiries.map((enquiry: any) => ({
            ...enquiry,
            items: enquiry.items ? JSON.parse(enquiry.items) : [],
        }));

        const countSql = status
            ? 'SELECT COUNT(*) as count FROM enquiries WHERE status = ?'
            : 'SELECT COUNT(*) as count FROM enquiries';
        const countParams = status ? [status] : [];
        const countResult = await queryD1<{ count: number }>(countSql, countParams);
        const totalCount = countResult[0]?.count || 0;

        return NextResponse.json({
            success: true,
            data: parsedEnquiries,
            pagination: {
                total: totalCount,
                limit,
                offset,
                hasMore: offset + limit < totalCount,
            },
        });
    } catch (error) {
        console.error('Error fetching enquiries:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch enquiries' },
            { status: 500 }
        );
    }
}
