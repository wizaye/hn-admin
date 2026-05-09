import { NextResponse } from 'next/server';
import { queryD1 } from '@/lib/db';
import { getQuotationEmail, getStatusUpdateEmail } from '@/lib/email-templates';
import { generateQuotationPDF } from '@/lib/pdf-generator';

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
        const address = body.address || '';
        const status = body.status || 'pending';
        const quotedAmount = body.total_amount ? parseFloat(body.total_amount) : null;
        
        const sql = `
            INSERT INTO enquiries (
                customer_name, company_name, email, phone, address,
                status, quoted_amount, items, total_items, delivery_timeline, customization_notes, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING id
        `;
        
        const params = [
            customerName, companyName, email, phone, address, status, quotedAmount, JSON.stringify(body.items || []), body.items?.length || 0, 'Immediate', ''
        ];
        
        const result = await queryD1(sql, params);
        const newId = result[0]?.id;
        
        if (newId && email && status) {
            try {
                const RESEND_TOKEN = process.env.RESEND_TOKEN;
                const FROM_EMAIL = process.env.FROM_EMAIL || 'info@hyderabadnetwork.com';
                
                if (RESEND_TOKEN) {
                    const eq = {
                        id: newId,
                        customer_name: customerName,
                        company_name: companyName,
                        email: email,
                        phone: phone,
                        address: address,
                        status: status,
                        quoted_amount: quotedAmount,
                        delivery_timeline: 'Immediate',
                        customization_notes: ''
                    };
                    const items = body.items || [];
                    
                    let emailSubject = '';
                    let emailHtml = '';
                    let emailText = '';
                    let attachments: any[] = [];
                    
                    if (status === 'quoted' && quotedAmount != null) {
                        const emailData = {
                            name: customerName,
                            companyName: companyName,
                            quotedAmount: quotedAmount,
                            adminNotes: '',
                            items: items,
                        };
                        const emailContent = getQuotationEmail(emailData, parseInt(newId, 10));
                        emailSubject = emailContent.subject;
                        emailHtml = emailContent.html;
                        emailText = emailContent.text;
                        
                        const pdfBuffer = await generateQuotationPDF(newId, eq, items, quotedAmount);
                        attachments = [{
                            filename: `Quotation-${newId}.pdf`,
                            content: pdfBuffer.toString('base64')
                        }];
                    } else {
                        const emailData = {
                            name: customerName,
                            companyName: companyName,
                            status: status,
                            adminNotes: '',
                        };
                        const emailContent = getStatusUpdateEmail(emailData, parseInt(newId, 10));
                        emailSubject = emailContent.subject;
                        emailHtml = emailContent.html;
                        emailText = emailContent.text;
                    }
                    
                    if (emailSubject) {
                        const resendRes = await fetch('https://api.resend.com/emails', {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${RESEND_TOKEN}`,
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                from: FROM_EMAIL,
                                to: email,
                                subject: emailSubject,
                                html: emailHtml,
                                text: emailText,
                                attachments: attachments.length > 0 ? attachments : undefined
                            }),
                        });
                        if (resendRes.ok) {
                            console.log(`Sent email to ${email} for status ${status}`);
                        } else {
                            console.error('Failed to send email:', await resendRes.text());
                        }
                    }
                }
            } catch (e) {
                console.error('Error sending email on creation:', e);
            }
        }
        
        return NextResponse.json({ success: true, data: result });
    } catch (error) {
        console.error('Error creating enquiry:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create enquiry' },
            { status: 500 }
        );
    }
}
