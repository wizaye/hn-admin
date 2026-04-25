import { NextResponse } from 'next/server';
import { queryD1 } from '@/lib/db';
import { generateQuotationPDF } from '@/lib/pdf-generator';

export const dynamic = 'force-dynamic';

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        const url = new URL(request.url);
        let quotedAmountQuery = url.searchParams.get('quotedAmount');
        let itemsQuery = url.searchParams.get('items');
        
        const enquiries = await queryD1('SELECT * FROM enquiries WHERE id = ? LIMIT 1', [id]);

        if (enquiries.length === 0) {
            return new Response('Enquiry not found', { status: 404 });
        }

        const eq = enquiries[0];
        
        // Use supplied items/quotedAmount for preview if they exist, otherwise use DB
        let items = itemsQuery ? JSON.parse(itemsQuery) : (eq.items ? JSON.parse(eq.items) : []);
        let finalQuotedAmount = quotedAmountQuery ? parseFloat(quotedAmountQuery) : (eq.quoted_amount || 0);

        const pdfBuffer = await generateQuotationPDF(id, eq, items, finalQuotedAmount);

        return new Response(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="Quotation-${id}.pdf"`,
            },
        });
    } catch (error) {
        console.error('Error generating PDF:', error);
        return new Response('Failed to generate PDF', { status: 500 });
    }
}
