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
        if (body.items !== undefined) {
            updates.push('items = ?');
            updateParams.push(JSON.stringify(body.items));
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

        if (body.status) {
            const enquiries = await queryD1('SELECT * FROM enquiries WHERE id = ? LIMIT 1', [id]);
            if (enquiries.length > 0) {
                const eq = enquiries[0];
                const items = body.items !== undefined ? body.items : (eq.items ? JSON.parse(eq.items) : []);
                const finalQuotedAmount = body.quoted_amount !== undefined ? body.quoted_amount : eq.quoted_amount;
                const finalAdminNotes = body.admin_notes !== undefined ? body.admin_notes : eq.admin_notes;
                
                const RESEND_API_KEY = process.env.RESEND_API_KEY;
                const FROM_EMAIL = process.env.FROM_EMAIL || 'info@hyderabadnetwork.com';

                if (RESEND_API_KEY && eq.email) {
                    let emailSubject = '';
                    let emailHtml = '';
                    let emailText = '';
                    let attachments: any[] = [];

                    try {
                        if (body.status === 'quoted' && finalQuotedAmount != null) {
                            const { getQuotationEmail } = await import('@/lib/email-templates');
                            const emailData = {
                                name: eq.customer_name,
                                companyName: eq.company_name,
                                quotedAmount: finalQuotedAmount,
                                adminNotes: finalAdminNotes,
                                items: items,
                            };
                            const emailContent = getQuotationEmail(emailData, parseInt(id, 10));
                            emailSubject = emailContent.subject;
                            emailHtml = emailContent.html;
                            emailText = emailContent.text;

                            const { generateQuotationPDF } = await import('@/lib/pdf-generator');
                            const pdfBuffer = await generateQuotationPDF(id, eq, items, finalQuotedAmount);
                            attachments = [{
                                filename: `Quotation-${id}.pdf`,
                                content: pdfBuffer.toString('base64')
                            }];
                        } else {
                            const { getStatusUpdateEmail } = await import('@/lib/email-templates');
                            const emailData = {
                                name: eq.customer_name,
                                companyName: eq.company_name,
                                status: body.status,
                                adminNotes: finalAdminNotes,
                            };
                            const emailContent = getStatusUpdateEmail(emailData, parseInt(id, 10));
                            emailSubject = emailContent.subject;
                            emailHtml = emailContent.html;
                            emailText = emailContent.text;
                        }
                        
                        if (emailSubject) {
                            const resendRes = await fetch('https://api.resend.com/emails', {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${RESEND_API_KEY}`,
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    from: FROM_EMAIL,
                                    to: eq.email,
                                    subject: emailSubject,
                                    html: emailHtml,
                                    text: emailText,
                                    attachments: attachments.length > 0 ? attachments : undefined
                                }),
                            });
                            if (resendRes.ok) {
                                console.log(`Sent email to ${eq.email} for status ${body.status}`);
                            } else {
                                console.error('Failed to send email:', await resendRes.text());
                            }
                        }
                    } catch (e) {
                        console.error('Error constructing or sending email:', e);
                    }
                }
            }
        }

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
