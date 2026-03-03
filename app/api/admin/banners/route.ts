import { NextResponse } from 'next/server';
import { queryD1 } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function ensureBannersTable() {
    const sql = `
    CREATE TABLE IF NOT EXISTS banners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      discount_text VARCHAR(255),
      link VARCHAR(500),
      active INTEGER DEFAULT 1,
      start_date TIMESTAMP,
      end_date TIMESTAMP,
      bg_color VARCHAR(50) DEFAULT '#000000',
      text_color VARCHAR(50) DEFAULT '#ffffff',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
    await queryD1(sql);
}

/**
 * GET /api/admin/banners
 */
export async function GET(request: Request) {
    try {
        await ensureBannersTable();

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '10');
        const offset = parseInt(searchParams.get('offset') || '0');
        const search = searchParams.get('search') || '';

        let sql = 'SELECT * FROM banners';
        const params: any[] = [];

        if (search) {
            sql += ' WHERE title LIKE ? OR description LIKE ?';
            params.push(`%${search}%`, `%${search}%`);
        }

        const countSql = search
            ? 'SELECT COUNT(*) as count FROM banners WHERE title LIKE ? OR description LIKE ?'
            : 'SELECT COUNT(*) as count FROM banners';
        const countParams = search ? [`%${search}%`, `%${search}%`] : [];
        const countResult = await queryD1<{ count: number }>(countSql, countParams);
        const totalCount = countResult[0]?.count || 0;

        sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const banners = await queryD1(sql, params);
        return NextResponse.json({
            success: true,
            data: banners,
            pagination: {
                total: totalCount,
                limit,
                offset,
                hasMore: offset + limit < totalCount,
            },
        });
    } catch (error) {
        console.error('Error fetching banners:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch banners', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/banners
 */
export async function POST(request: Request) {
    try {
        await ensureBannersTable();
        const body = await request.json();
        const { title, description, discount_text, link, active, start_date, end_date, bg_color, text_color } = body;

        if (!title) {
            return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
        }

        const sql = `INSERT INTO banners (title, description, discount_text, link, active, start_date, end_date, bg_color, text_color) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const params = [title, description || null, discount_text || null, link || null, active !== undefined ? (active ? 1 : 0) : 1, start_date || null, end_date || null, bg_color || '#000000', text_color || '#ffffff'];
        await queryD1(sql, params);

        return NextResponse.json({ success: true, message: 'Banner created successfully' });
    } catch (error) {
        console.error('Error creating banner:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create banner', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/admin/banners
 */
export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, title, description, discount_text, link, active, start_date, end_date, bg_color, text_color } = body;

        if (!id) {
            return NextResponse.json({ success: false, error: 'Banner ID is required' }, { status: 400 });
        }

        const updates: string[] = [];
        const params: any[] = [];

        if (title !== undefined) { updates.push('title = ?'); params.push(title); }
        if (description !== undefined) { updates.push('description = ?'); params.push(description); }
        if (discount_text !== undefined) { updates.push('discount_text = ?'); params.push(discount_text); }
        if (link !== undefined) { updates.push('link = ?'); params.push(link); }
        if (active !== undefined) { updates.push('active = ?'); params.push(active ? 1 : 0); }
        if (start_date !== undefined) { updates.push('start_date = ?'); params.push(start_date); }
        if (end_date !== undefined) { updates.push('end_date = ?'); params.push(end_date); }
        if (bg_color !== undefined) { updates.push('bg_color = ?'); params.push(bg_color); }
        if (text_color !== undefined) { updates.push('text_color = ?'); params.push(text_color); }

        updates.push('updated_at = CURRENT_TIMESTAMP');

        const sql = `UPDATE banners SET ${updates.join(', ')} WHERE id = ?`;
        params.push(id);
        await queryD1(sql, params);

        return NextResponse.json({ success: true, message: 'Banner updated successfully' });
    } catch (error) {
        console.error('Error updating banner:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update banner', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/admin/banners
 */
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, error: 'Banner ID is required' }, { status: 400 });
        }

        await queryD1('DELETE FROM banners WHERE id = ?', [id]);
        return NextResponse.json({ success: true, message: 'Banner deleted successfully' });
    } catch (error) {
        console.error('Error deleting banner:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete banner', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
