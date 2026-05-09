import { NextResponse } from 'next/server';
import { queryD1 } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await queryD1('ALTER TABLE enquiries ADD COLUMN address TEXT');
        return NextResponse.json({ success: true, message: 'Column added' });
    } catch (e: any) {
        if (e.message && e.message.includes('duplicate column name')) {
            return NextResponse.json({ success: true, message: 'Column already exists' });
        }
        console.error(e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
