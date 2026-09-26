'use client';

import { useRef } from 'react';
import { toPng } from 'html-to-image';

export function CouponCard({ cupon }: { cupon: any }) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!cardRef.current) return;

    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, quality: 0.95 });
      const link = document.createElement('a');
      link.download = `cupon-${cupon.codigo}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error al generar la imagen:', err);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Contenedor editable/estilizado que se convierte a imagen */}
      <div ref={cardRef} className="w-80 rounded-2xl bg-slate-900 p-6 text-white shadow-xl border border-slate-800">
        <div className="text-xs uppercase tracking-widest text-emerald-400 font-semibold">
          {cupon.usuario.negocio?.nombre ?? 'Descuento Exclusivo'}
        </div>
        <div className="my-4 text-3xl font-extrabold">
          {cupon.tipoDescuento === 'PORCENTAJE' ? `${cupon.valorDescuento}% OFF` : `$${cupon.valorDescuento}`}
        </div>

        {/* QR embebido para escaneo por parte del comercio */}
        <div className="my-4 flex justify-center bg-white p-3 rounded-xl">
          <img 
            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`https://tuapp.com/validar/${cupon.codigo}`)}`} 
            alt="QR Validación"
            className="w-36 h-36"
          />
        </div>

        <div className="text-center font-mono text-sm tracking-wider text-slate-300">
          CÓDIGO: {cupon.codigo}
        </div>

        {cupon.terminosCondiciones && (
          <p className="mt-4 text-[10px] text-slate-400 text-center leading-tight">
            {cupon.terminosCondiciones}
          </p>
        )}
      </div>

      <button
        onClick={handleDownload}
        className="rounded-xl bg-emerald-600 px-6 py-3 font-medium text-white shadow-lg hover:bg-emerald-500 transition-all"
      >
        Guardar Cupón en la Galería
      </button>
    </div>
  );
}