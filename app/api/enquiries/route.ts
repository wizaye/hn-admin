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

/**
 * POST /api/enquiries
 * Creates a new enquiry (e.g. from local shop bill)
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        
        const companyName = body.company_name || '';
        const customerName = body.customer_name || '';
        const email = body.email || '';
        const phone = body.phone || '';
        const status = body.status || 'pending';
        const quotedAmount = body.total_amount ? parseFloat(body.total_amount) : null;
        
        const sql = `
            INSERT INTO enquiries (
                customer_name, company_name, email, phone, 
                status, quoted_amount, items, total_items, delivery_timeline, customization_notes, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING id
        `;
        
        const params = [
            customerName, companyName, email, phone, status, quotedAmount, JSON.stringify(body.items || []), body.items?.length || 0, 'Immediate', ''
        ];
        
        const result = await queryD1(sql, params);
        
        return NextResponse.json({ success: true, data: result });
    } catch (error) {
        console.error('Error creating enquiry:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create enquiry' },
            { status: 500 }
        );
    }
}
