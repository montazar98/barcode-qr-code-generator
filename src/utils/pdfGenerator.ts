import jsPDF from 'jspdf';

export interface PrintPdfOptions {
  title: string;
  dataUrl: string;
  valueText: string;
  gridRows?: number;
  gridCols?: number;
  copies?: number;
  pageSize?: 'a4' | 'letter' | 'singleLabel';
}

export function generatePrintPDF(options: PrintPdfOptions): jsPDF {
  const { title, dataUrl, valueText, gridRows = 3, gridCols = 2, copies = 6, pageSize = 'a4' } = options;

  if (pageSize === 'singleLabel') {
    // 100mm x 60mm thermal shipping/product sticker label size
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [100, 60],
    });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(title || 'Product Label', 50, 8, { align: 'center' });

    // Barcode / QR Image
    doc.addImage(dataUrl, 'PNG', 15, 12, 70, 38);

    if (valueText) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(valueText, 50, 56, { align: 'center' });
    }

    return doc;
  }

  // Standard A4 Grid Print
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210; // mm
  const pageHeight = 297; // mm
  const marginX = 15;
  const marginY = 20;

  const totalCols = Math.max(1, gridCols);
  const totalRows = Math.max(1, gridRows);

  const cellWidth = (pageWidth - marginX * 2) / totalCols;
  const cellHeight = (pageHeight - marginY * 2) / totalRows;

  let currentCopy = 0;
  let pageIndex = 0;

  while (currentCopy < copies) {
    if (pageIndex > 0) {
      doc.addPage();
    }

    // Header title on page
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`Label Sheet - ${title}`, marginX, 12);

    doc.setLineWidth(0.2);
    doc.setDrawColor(200, 200, 200);

    for (let r = 0; r < totalRows && currentCopy < copies; r++) {
      for (let c = 0; c < totalCols && currentCopy < copies; c++) {
        const x = marginX + c * cellWidth;
        const y = marginY + r * cellHeight;

        // Draw dotted cell outline
        doc.rect(x + 2, y + 2, cellWidth - 4, cellHeight - 4);

        // Add code image
        const imgSize = Math.min(cellWidth - 12, cellHeight - 16);
        const imgX = x + (cellWidth - imgSize) / 2;
        const imgY = y + 4;

        doc.addImage(dataUrl, 'PNG', imgX, imgY, imgSize, imgSize);

        // Text below image
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        const truncatedText = valueText.length > 30 ? valueText.slice(0, 28) + '...' : valueText;
        doc.text(truncatedText, x + cellWidth / 2, y + cellHeight - 4, { align: 'center' });

        currentCopy++;
      }
    }

    pageIndex++;
  }

  return doc;
}
