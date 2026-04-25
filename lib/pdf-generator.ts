import { jsPDF } from 'jspdf';
import { applyPlugin } from 'jspdf-autotable';
import { LOGO_BASE64 } from '@/lib/logo';

export async function generateQuotationPDF(id: string, eq: any, items: any[], finalQuotedAmount: number) {
    const autoTableModule = await import('jspdf-autotable');
    const autoTable = autoTableModule.default || autoTableModule.applyPlugin || applyPlugin;

    const doc = new jsPDF();
    
    // Header Box "QUOTATION"
    doc.setFillColor(0, 0, 0);
    doc.rect(80, 10, 50, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("QUOTATION", 105, 16, { align: "center" });

    let startY = 30;
    try {
        if (LOGO_BASE64) {
            doc.addImage(LOGO_BASE64, 'PNG', 95, 20, 20, 20);
            startY = 46;
        }
    } catch (e) {
        console.error('Failed to load logo', e);
    }

    // Company Info
    doc.setTextColor(0, 0, 128); // Blue text for HYDERABAD
    doc.setFontSize(18);
    doc.text("HYDERABAD ", 105, startY, { align: "right" });
    doc.setTextColor(255, 0, 0); // Red text for NETWORK
    doc.text("NETWORK", 105, startY, { align: "left" });

    startY += 6;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.text("DISTRIBUTOR FOR AJANTA ORPAT GROUP", 105, startY, { align: "center" });

    startY += 5;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("#4-1-834/A, Backside Old BigBazar, Car Parking Lane, Abids, Hyderabad-500001", 105, startY, { align: "center" });

    startY += 5;
    doc.text("Ph. 9704863333, 7893002716.   EMAIL: hyderabadnetwork@gmail.com", 105, startY, { align: "center" });

    startY += 5;
    doc.text("GSTIN: 36AAEFH4602H1ZO", 105, startY, { align: "center" });

    startY += 6;
    // Separator line
    doc.setLineWidth(0.5);
    doc.line(14, startY, 196, startY);

    startY += 10;
    // Customer Box (Left)
    doc.setLineWidth(0.5);
    doc.rect(14, startY, 100, 28); // x,y,w,h
    // Add customer text inside
    doc.setFont("helvetica", "bold");
    if (eq.customer_name) doc.text(`Customer: ${eq.customer_name}`, 16, startY + 6);
    doc.setFont("helvetica", "normal");
    if (eq.company_name) doc.text(`Company: ${eq.company_name}`, 16, startY + 12);
    if (eq.email) doc.text(`Email: ${eq.email}`, 16, startY + 18);
    if (eq.phone) doc.text(`Phone: ${eq.phone}`, 16, startY + 24);

    // Quotation No & Date (Right)
    doc.setFont("helvetica", "bold");
    doc.text(`Quotation No. : ${id}`, 140, startY + 10);
    doc.text(`Date : ${new Date().toLocaleDateString('en-IN')}`, 140, startY + 16);

    startY += 35; // past the box

    const tableColumn = ["Product", "Model No", "MRP", "Gross Price", "Quantity", "Total (Incl. GST)"];
    const tableRows: any[] = [];

    items.forEach((item: any) => {
        const itemData = [
            item.productName || "Unknown",
            item.variantName || "-",
            `Rs. ${(item.price || 0).toLocaleString("en-IN")}`,
            `Rs. ${(item.price || 0).toLocaleString("en-IN")}`,
            item.quantity || 0,
            `Rs. ${((item.price || 0) * (item.quantity || 0)).toLocaleString("en-IN")}`
        ];
        tableRows.push(itemData);
    });

    const tableConfig: any = {
        startY: startY,
        head: [tableColumn],
        body: tableRows,
        foot: [["", "", "", "", "Total Amount", `Rs. ${finalQuotedAmount.toLocaleString("en-IN")}`]],
        theme: 'grid',
        headStyles: {
            fillColor: [180, 198, 231],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            lineColor: [0, 0, 0],
            lineWidth: 0.5
        },
        bodyStyles: {
            fillColor: [162, 185, 219],
            textColor: [0, 0, 0],
            lineColor: [0, 0, 0],
            lineWidth: 0.5
        },
        footStyles: {
            fillColor: [162, 185, 219],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            lineColor: [0, 0, 0],
            lineWidth: 0.5
        }
    };

    // @ts-ignore
    if (typeof autoTable === 'function') {
        autoTable(doc, tableConfig);
    } else {
        // @ts-ignore
        doc.autoTable(tableConfig);
    }
    
    // @ts-ignore
    let finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : startY + 20;

    finalY += 15;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Terms & condition :", 14, finalY);

    finalY += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("* HSN CODE for Product 91052100.", 14, finalY);
    finalY += 6;
    doc.text("* Includes battery.", 14, finalY);
    finalY += 6;
    doc.text("* Including GST @18%.", 14, finalY);
    finalY += 6;
    doc.text("* One year warranty from the date of purchase.", 14, finalY);
    finalY += 6;
    doc.text("* Company service center available all over India.", 14, finalY);
    finalY += 6;
    doc.text("  ( please refer company warranty card )", 14, finalY);
    finalY += 6;
    doc.text("* Payment 50% Advance on Order Confirmation", 14, finalY);
    finalY += 6;
    doc.text("* Balance On or before Delivery of Goods.", 14, finalY);

    const pdfArrayBuffer = doc.output('arraybuffer');
    return Buffer.from(pdfArrayBuffer);
}
