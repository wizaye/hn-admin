import { LOGO_BASE64, TEXT_BASE64 } from '@/lib/logo';

interface QuotationEmailData {
  name: string;
  companyName: string;
  quotedAmount: number;
  adminNotes?: string;
  items: Array<{
    productName: string;
    variantName: string;
    quantity: number;
    price: number;
  }>;
}

export function getQuotationEmail(data: QuotationEmailData, enquiryId: number) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumSignificantDigits: 3 }).format(amount);
  };

  return {
    subject: `Your Quotation for Enquiry #${enquiryId} | Hyderabad Network`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Quotation</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #ffffff;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 650px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="padding: 40px 30px 30px; border-bottom: 3px solid #000000; text-align: center;">
        ${LOGO_BASE64 ? `<img src="${LOGO_BASE64}" alt="Logo" style="width: 80px; height: auto; margin-bottom: 10px;" /><br/>` : ''}
        ${TEXT_BASE64 ? `<img src="${TEXT_BASE64}" alt="Hyderabad Network" style="max-width: 250px; height: auto;" />` : `<h1 style="margin: 0; color: #000000; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">Hyderabad Network</h1>`}
        <p style="margin: 8px 0 0; color: #666666; font-size: 15px; font-weight: 400;">
          (Distributor of ajanta orpat group)
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="margin: 0 0 24px; color: #000000; font-size: 24px; font-weight: 600;">
          Your Quotation is Ready
        </h2>
        <p style="margin: 0 0 16px; color: #333333; font-size: 15px; line-height: 1.6;">
          Dear <strong>${data.name}</strong>,
        </p>
        <p style="margin: 0 0 24px; color: #333333; font-size: 15px; line-height: 1.6;">
          Thank you for your enquiry for <strong>${data.companyName}</strong>. Following our review, we are pleased to provide you with the quotation.
        </p>
        
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border: 1px solid #e0e0e0; margin: 24px 0;">
          <tr>
            <td style="padding: 20px; background-color: #f9f9f9;">
              <h3 style="margin: 0 0 8px; color: #000000; font-size: 16px;">Total Quoted Amount</h3>
              <p style="margin: 0; font-size: 24px; font-weight: 700; color: #000000;">₹${data.quotedAmount.toLocaleString("en-IN")}</p>
            </td>
          </tr>
        </table>

        ${data.adminNotes ? `
          <div style="margin: 24px 0; padding: 16px; background-color: #f9f9f9; border-left: 3px solid #000000;">
            <h4 style="margin: 0 0 8px; color: #000000; font-size: 14px; font-weight: 600;">Notes from our team</h4>
            <p style="margin: 0; color: #333333; font-size: 14px; line-height: 1.5; white-space: pre-wrap;">${data.adminNotes}</p>
          </div>
        ` : ''}

        <p style="margin: 24px 0 8px; color: #333333; font-size: 14px; line-height: 1.6;">
          If you have any questions or wish to proceed with the order, please let us know by replying to this email or calling us directly.
        </p>
        
        <p style="margin: 8px 0 0; color: #333333; font-size: 14px; line-height: 1.6;">
          Best regards,<br>
          <strong>Hyderabad Network</strong><br>
          (Distributor of ajanta orpat group)
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 30px; background-color: #000000; border-top: 1px solid #e0e0e0;">
        <p style="margin: 0 0 12px; color: #ffffff; font-size: 14px; font-weight: 700; text-align: center; letter-spacing: 1px;">
          HYDERABAD NETWORK
        </p>
        <p style="margin: 0 0 8px; color: #cccccc; font-size: 12px; text-align: center;">
          (Distributor of ajanta orpat group)
        </p>
        <p style="margin: 0 0 8px; color: #cccccc; font-size: 12px; text-align: center;">
          Email: info@hyderabadnetwork.com | Phone: +91 7893002716
        </p>
        <p style="margin: 0; color: #999999; font-size: 11px; text-align: center;">
          © ${new Date().getFullYear()} Hyderabad Network. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    text: `
Dear ${data.name},

Your quotation for ${data.companyName} is ready!

TOTAL QUOTED AMOUNT: ₹${data.quotedAmount.toLocaleString("en-IN")}

${data.adminNotes ? `
NOTES FROM OUR TEAM:
${data.adminNotes}
` : ''}

If you have any questions or wish to proceed with the order, please let us know by replying to this email or calling us directly.

Best regards,
Hyderabad Network
(Distributor of ajanta orpat group)

Email: info@hyderabadnetwork.com
Phone: +91 7893002716
    `
  };
}

export interface StatusUpdateEmailData {
  name: string;
  companyName: string;
  status: string;
  adminNotes?: string;
}

export function getStatusUpdateEmail(data: StatusUpdateEmailData, enquiryId: number) {
  const displayStatus = data.status.charAt(0).toUpperCase() + data.status.slice(1);
  return {
    subject: `Enquiry Status Update: ${displayStatus} | Hyderabad Network`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Enquiry Status Update</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #ffffff;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 650px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="padding: 40px 30px 30px; border-bottom: 3px solid #000000; text-align: center;">
        ${LOGO_BASE64 ? `<img src="${LOGO_BASE64}" alt="Logo" style="width: 80px; height: auto; margin-bottom: 10px;" /><br/>` : ''}
        ${TEXT_BASE64 ? `<img src="${TEXT_BASE64}" alt="Hyderabad Network" style="max-width: 250px; height: auto;" />` : `<h1 style="margin: 0; color: #000000; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">Hyderabad Network</h1>`}
        <p style="margin: 8px 0 0; color: #666666; font-size: 15px; font-weight: 400;">
          (Distributor of ajanta orpat group)
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="margin: 0 0 24px; color: #000000; font-size: 24px; font-weight: 600;">
          Enquiry Status Update
        </h2>
        <p style="margin: 0 0 16px; color: #333333; font-size: 15px; line-height: 1.6;">
          Dear <strong>${data.name}</strong>,
        </p>
        <p style="margin: 0 0 24px; color: #333333; font-size: 15px; line-height: 1.6;">
          Your enquiry for <strong>${data.companyName}</strong> (Enquiry #${enquiryId}) has been updated. The current status is now: <strong>${displayStatus}</strong>.
        </p>

        ${data.adminNotes ? `
          <div style="margin: 24px 0; padding: 16px; background-color: #f9f9f9; border-left: 3px solid #000000;">
            <h4 style="margin: 0 0 8px; color: #000000; font-size: 14px; font-weight: 600;">Message from our team</h4>
            <p style="margin: 0; color: #333333; font-size: 14px; line-height: 1.5; white-space: pre-wrap;">${data.adminNotes}</p>
          </div>
        ` : ''}

        <p style="margin: 24px 0 8px; color: #333333; font-size: 14px; line-height: 1.6;">
          If you have any questions, please reply to this email or call us directly.
        </p>
        
        <p style="margin: 8px 0 0; color: #333333; font-size: 14px; line-height: 1.6;">
          Best regards,<br>
          <strong>Hyderabad Network</strong><br>
          (Distributor of ajanta orpat group)
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 30px; background-color: #000000; border-top: 1px solid #e0e0e0;">
        <p style="margin: 0 0 12px; color: #ffffff; font-size: 14px; font-weight: 700; text-align: center; letter-spacing: 1px;">
          HYDERABAD NETWORK
        </p>
        <p style="margin: 0 0 8px; color: #cccccc; font-size: 12px; text-align: center;">
          (Distributor of ajanta orpat group)
        </p>
        <p style="margin: 0 0 8px; color: #cccccc; font-size: 12px; text-align: center;">
          Email: info@hyderabadnetwork.com | Phone: +91 7893002716
        </p>
        <p style="margin: 0; color: #999999; font-size: 11px; text-align: center;">
          © ${new Date().getFullYear()} Hyderabad Network. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    text: `
Dear ${data.name},

Your enquiry for ${data.companyName} (Enquiry #${enquiryId}) has been updated.
Current status: ${displayStatus}

${data.adminNotes ? `\nMESSAGE FROM OUR TEAM:\n${data.adminNotes}\n` : ''}

If you have any questions, please reply to this email or call us directly.

Best regards,
Hyderabad Network
(Distributor of ajanta orpat group)

Email: info@hyderabadnetwork.com
Phone: +91 7893002716
    `
  };
}
