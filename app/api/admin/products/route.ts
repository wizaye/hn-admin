import { NextResponse } from 'next/server';
import { queryD1 } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * POST /api/admin/products – Add a new product
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { category, model, color, price, image_url } = body;

        if (!category || !model) {
            return NextResponse.json({ success: false, error: 'Category and model are required' }, { status: 400 });
        }

        const tableName = category.toLowerCase().replace(/\s+/g, '_');
        const sql = `INSERT INTO ${tableName} (model, color, price, image_url) VALUES (?, ?, ?, ?)`;
        await queryD1(sql, [model, color || null, price || 0, image_url || null]);

        return NextResponse.json({ success: true, message: 'Product added successfully' });
    } catch (error) {
        console.error('Error adding product:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to add product', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/admin/products – Update an existing product
 */
export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { category, id, model, color, price, image_url } = body;

        if (!category || !id) {
            return NextResponse.json({ success: false, error: 'Category and product ID are required' }, { status: 400 });
        }

        const tableName = category.toLowerCase().replace(/\s+/g, '_');
        const updates: string[] = [];
        const params: any[] = [];

        if (model !== undefined) { updates.push('model = ?'); params.push(model); }
        if (color !== undefined) { updates.push('color = ?'); params.push(color); }
        if (price !== undefined) { updates.push('price = ?'); params.push(price); }
        if (image_url !== undefined) { updates.push('image_url = ?'); params.push(image_url); }

        if (updates.length === 0) {
            return NextResponse.json({ success: false, error: 'No fields to update' }, { status: 400 });
        }

        const sql = `UPDATE ${tableName} SET ${updates.join(', ')} WHERE id = ?`;
        params.push(id);
        await queryD1(sql, params);

        return NextResponse.json({ success: true, message: 'Product updated successfully' });
    } catch (error) {
        console.error('Error updating product:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update product', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/admin/products – Delete a product
 */
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const id = searchParams.get('id');

        if (!category || !id) {
            return NextResponse.json({ success: false, error: 'Category and product ID are required' }, { status: 400 });
        }

        const tableName = category.toLowerCase().replace(/\s+/g, '_');
        await queryD1(`DELETE FROM ${tableName} WHERE id = ?`, [id]);

        return NextResponse.json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete product', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
