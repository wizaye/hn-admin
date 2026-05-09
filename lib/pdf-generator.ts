import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getLogoBuffer, getTextBuffer } from '@/lib/logo';

export async function generateQuotationPDF(id: string, eq: any, items: any[], finalQuotedAmount: number) {
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
        const logoBuffer = getLogoBuffer();
        if (logoBuffer) {
            const logoData = new Uint8Array(logoBuffer);
            doc.addImage(logoData, 'JPEG', 95, 20, 20, 20);
            startY = 46;
        }
    } catch (e) {
        console.error('Failed to load logo', e);
    }

    try {
        const textBuffer = getTextBuffer();
        if (textBuffer) {
            const textData = new Uint8Array(textBuffer);
            doc.addImage(textData, 'JPEG', 45, startY, 120, 13.5);
        }
    } catch (e) {
        console.error('Failed to load text image', e);
    }

    startY += 18;
    doc.setTextColor(0, 0, 0);
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
    doc.setFontSize(9);
    let addressLines: string[] = [];
    if (eq.address) {
        addressLines = doc.splitTextToSize(eq.address, 96);
    }

    const details = [];
    if (eq.company_name && eq.customer_name) details.push(eq.customer_name);
    if (eq.phone) details.push(`Ph: ${eq.phone}`);
    if (eq.email) details.push(`Email: ${eq.email}`);
    
    let detailsLines: string[] = [];
    if (details.length > 0) {
        detailsLines = doc.splitTextToSize(details.join(" | "), 96);
    }

    // Calculate dynamic box height based on contents
    let boxHeight = 22; // Space for "To," and mainName
    if (addressLines.length > 0) boxHeight += addressLines.length * 4.5;
    if (detailsLines.length > 0) boxHeight += detailsLines.length * 4.5;
    if (addressLines.length > 0 && detailsLines.length > 0) boxHeight += 2; // gap between address and details

    boxHeight = Math.max(28, boxHeight); // Ensure minimum height

    doc.setLineWidth(0.5);
    doc.rect(14, startY, 100, boxHeight); // x,y,w,h
    
    // Add "To," text inside
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("To,", 16, startY + 5);

    const mainName = eq.company_name || eq.customer_name || "Customer";
    
    // 1. Company Name
    doc.setTextColor(43, 61, 115); // Dark blueish
    doc.setFontSize(13);
    doc.text(mainName, 64, startY + 14, { align: "center", maxWidth: 96 });

    let nextY = startY + 21;
    
    // 2. Address
    if (addressLines.length > 0) {
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text(addressLines, 64, nextY, { align: "center" });
        nextY += addressLines.length * 4.5 + 2; // Move Y down for the next section
    }

    // 3. Name, Phone, Email
    if (detailsLines.length > 0) {
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(detailsLines, 64, nextY, { align: "center" });
    }

    // Quotation No & Date (Right)
    doc.setFont("helvetica", "bold");
    doc.text(`Quotation No. : ${id}`, 140, startY + 10);
    doc.text(`Date : ${new Date().toLocaleDateString('en-IN')}`, 140, startY + 16);

    startY += boxHeight + 7; // past the box

    const tableColumn = ["Product", "Model No", "MRP", "Gross Price", "Quantity", "Total (Incl. GST)"];
    const tableRows: any[] = [];

    items.forEach((item: any) => {
        const itemData = [
            item.productName || "Unknown",
            item.variantName || "-",
            `Rs. ${(item.mrp !== undefined ? item.mrp : item.price || 0).toLocaleString("en-IN")}`,
            `Rs. ${(item.price || 0).toLocaleString("en-IN")}`,
            item.quantity || 0,
            `Rs. ${((item.price || 0) * (item.quantity || 0)).toLocaleString("en-IN")}`
        ];
        tableRows.push(itemData);
    });

    let headerBottomY = startY;

    const tableConfig: any = {
        startY: startY,
        head: [tableColumn],
        body: tableRows,
        foot: [["", "", "", "", "Total Amount", `Rs. ${finalQuotedAmount.toLocaleString("en-IN")}`]],
        theme: 'plain',
        headStyles: {
            fillColor: [180, 198, 231],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            lineColor: [0, 0, 0],
            lineWidth: 0.5,
            halign: 'center'
        },
        bodyStyles: {
            fillColor: [162, 185, 219],
            textColor: [0, 0, 0],
            halign: 'center'
        },
        footStyles: {
            fillColor: [162, 185, 219],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            halign: 'center'
        },
        didDrawCell: function(data: any) {
            if (data.section === 'head') {
                headerBottomY = data.cell.y + data.cell.height;
            }
        }
    };

    autoTable(doc, tableConfig);

    // @ts-ignore
    let finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY : startY + 20;

    // Draw outer border around the entire table
    doc.setLineWidth(0.5);
    doc.setDrawColor(0, 0, 0);
    doc.rect(14, startY, 182, finalY - startY);

    // Draw the bottom border of the heading bar
    if (headerBottomY > startY) {
        doc.line(14, headerBottomY, 196, headerBottomY);
    }

    finalY += 15;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Terms & condition :", 14, finalY);

    finalY += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(" * HSN CODE for Product 91052100.", 14, finalY);
    finalY += 6;
    doc.text(" * Includes battery.", 14, finalY);
    finalY += 6;
    doc.text(" * Including GST @18%.", 14, finalY);
    finalY += 6;
    doc.text(" * One year warranty from the date of purchase.", 14, finalY);
    finalY += 6;
    doc.text(" * Company service center available all over India.", 14, finalY);
    finalY += 6;
    doc.text("( please refer company warranty card )", 14, finalY);
    finalY += 6;
    doc.text(" * Payment 50% Advance on Order Confirmation", 14, finalY);
    finalY += 6;
    doc.text(" * Balance On or before Delivery of Goods.", 14, finalY);

    const pdfArrayBuffer = doc.output('arraybuffer');
    return Buffer.from(pdfArrayBuffer);
}
