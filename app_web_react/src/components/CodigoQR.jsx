// src/components/CodigoQR.jsx
// Código QR dibujado en el navegador (librería qrcode)
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export function CodigoQR({ texto, tamano = 180, etiqueta }) {
  const [imagen, setImagen] = useState('');
  useEffect(() => {
    QRCode.toDataURL(texto, { width: tamano, margin: 1, errorCorrectionLevel: 'M' }).then(setImagen).catch(() => setImagen(''));
  }, [texto, tamano]);
  return imagen ? <img className="codigo-qr" src={imagen} width={tamano} height={tamano} alt={etiqueta ?? `Código QR ${texto}`} /> : null;
}

// Texto del QR: lo lee la garita. "G15|EST-00018|OP-XXXX"
export const textoPase = (codigo, operacion) => `G15|${codigo}|${operacion}`;
