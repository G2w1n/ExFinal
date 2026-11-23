// src/utils/pdfComprobante.js
// Comprobante en PDF (jsPDF) con el QR: se descarga sin imprimir
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

export async function descargarComprobantePDF({ titulo, empresa, codigo, filas, total, textoQR }) {
  const doc = new jsPDF({ unit: 'mm', format: [90, 170] });
  const ancho = 90;
  doc.setFillColor(15, 39, 64);
  doc.rect(0, 0, ancho, 24, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold').setFontSize(12).text(empresa, ancho / 2, 10, { align: 'center' });
  doc.setFont('helvetica', 'normal').setFontSize(9).text(`${titulo} · Grupo 15 · Viaje a Cusco`, ancho / 2, 17, { align: 'center' });

  doc.setTextColor(23, 103, 58).setFont('helvetica', 'bold').setFontSize(10).text('PAGADO', ancho / 2, 31, { align: 'center' });
  doc.setTextColor(22, 35, 46).setFontSize(16).text(codigo, ancho / 2, 40, { align: 'center' });

  let y = 50;
  doc.setFontSize(9);
  filas.forEach(([nombre, valor]) => {
    doc.setFont('helvetica', 'normal').setTextColor(79, 93, 104).text(nombre, 8, y);
    doc.setFont('helvetica', 'bold').setTextColor(22, 35, 46).text(String(valor), ancho - 8, y, { align: 'right', maxWidth: 52 });
    y += 6.5;
  });
  doc.setDrawColor(200, 208, 216).setLineDashPattern([1, 1], 0).line(8, y, ancho - 8, y);
  y += 8;
  doc.setFont('helvetica', 'bold').setFontSize(12).text('Total pagado', 8, y);
  doc.text(total, ancho - 8, y, { align: 'right' });

  const qr = await QRCode.toDataURL(textoQR, { width: 300, margin: 1 });
  doc.addImage(qr, 'PNG', ancho / 2 - 20, y + 6, 40, 40);
  doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(79, 93, 104)
    .text('Muestra este código QR en la garita o al abordar.', ancho / 2, y + 52, { align: 'center' });
  doc.save(`${codigo}.pdf`);
}
