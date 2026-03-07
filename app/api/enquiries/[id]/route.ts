import { NextResponse } from 'next/server';
import { queryD1 } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/enquiries/[id]
 */
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        const enquiries = await queryD1('SELECT * FROM enquiries WHERE id = ? LIMIT 1', [id]);

        if (enquiries.length === 0) {
            return NextResponse.json({ success: false, error: 'Enquiry not found' }, { status: 404 });
        }

        const enquiry = {
            ...enquiries[0],
            items: enquiries[0].items ? JSON.parse(enquiries[0].items) : [],
        };

        return NextResponse.json({ success: true, data: enquiry });
    } catch (error) {
        console.error('Error fetching enquiry:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch enquiry' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/enquiries/[id]
 * Update enquiry status, admin_notes, quoted_amount
 */
export async function PUT(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body = await request.json();

        const updates: string[] = [];
        const updateParams: any[] = [];

        if (body.status) {
            updates.push('status = ?');
            updateParams.push(body.status);
        }
        if (body.admin_notes !== undefined) {
            updates.push('admin_notes = ?');
            updateParams.push(body.admin_notes);
        }
        if (body.quoted_amount !== undefined) {
            updates.push('quoted_amount = ?');
            updateParams.push(body.quoted_amount);
        }
        if (body.status === 'converted') {
            updates.push('converted_at = CURRENT_TIMESTAMP');
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');

        if (updates.length === 1) {
            return NextResponse.json({ success: false, error: 'No fields to update' }, { status: 400 });
        }

        const sql = `UPDATE enquiries SET ${updates.join(', ')} WHERE id = ?`;
        updateParams.push(id);

        await queryD1(sql, updateParams);

        return NextResponse.json({ success: true, message: 'Enquiry updated successfully' });
    } catch (error) {
        console.error('Error updating enquiry:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update enquiry' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/enquiries/[id]
 * Delete an enquiry
 */
export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;

        // Check if enquiry exists
        const existing = await queryD1('SELECT id FROM enquiries WHERE id = ? LIMIT 1', [id]);
        if (existing.length === 0) {
            return NextResponse.json({ success: false, error: 'Enquiry not found' }, { status: 404 });
        }

        await queryD1('DELETE FROM enquiries WHERE id = ?', [id]);
        return NextResponse.json({ success: true, message: 'Enquiry deleted successfully' });
    } catch (error) {
        console.error('Error deleting enquiry:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete enquiry' },
            { status: 500 }
        );
    }
}
