'use client';

import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';

interface CuponProps {
  cupon: {
    codigo: string;
    estado: string;
    tipoDescuento: string;
    valorDescuento: number;
    terminosCondiciones: string | null;
    fechaExpiracion: string | null;
    nombreNegocio: string;
    direccionNegocio: string;
    nombreCliente: string;
  };
}

export default function CardCuponCliente({ cupon }: CuponProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [descargando, setDescargando] = useState(false);

  // URL a la que apuntará el QR impreso en el cupón (para canje en el taller)
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const urlValidacion = `${baseUrl}/validar/${cupon.codigo}`;
  
  // Endpoint ligero para renderizar QR
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(urlValidacion)}`;

  // Función para descargar como imagen PNG
  async function handleDownloadImage() {
    if (!cardRef.current) return;
    setDescargando(true);

    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        quality: 0.95,
        pixelRatio: 2, // Mayor nitidez para pantallas HD
      });

      const link = document.createElement('a');
      link.download = `cupon-${cupon.codigo}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error al generar la imagen del cupón:', err);
    } finally {
      setDescargando(false);
    }
  }

  const esValido = cupon.estado === 'PENDIENTE';

  return (
    <div className="flex flex-col items-center space-y-4 w-full">
      
      {/* CARD DEL CUPÓN (Esta área exacta se exporta como imagen) */}
      <div
        ref={cardRef}
        className="w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative text-slate-100 p-6 flex flex-col items-center"
      >
        {/* Marca/Negocio */}
        <div className="text-center space-y-1 mb-4">
          <span className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase">
            Beneficio Exclusivo
          </span>
          <h2 className="text-xl font-extrabold text-white">
            {cupon.nombreNegocio}
          </h2>
          {cupon.direccionNegocio && (
            <p className="text-[11px] text-slate-400">{cupon.direccionNegocio}</p>
          )}
        </div>

        {/* Descuento Destacado */}
        <div className="w-full bg-emerald-950/60 border border-emerald-500/30 rounded-2xl p-4 text-center my-2">
          <p className="text-xs text-emerald-300 font-medium uppercase tracking-wide">
            ¡Obtenés!
          </p>
          <div className="text-4xl font-black text-emerald-400 my-1">
            {cupon.tipoDescuento === 'PORCENTAJE'
              ? `${cupon.valorDescuento}% OFF`
              : `$${cupon.valorDescuento.toLocaleString('es-AR')}`}
          </div>
          <p className="text-[11px] text-slate-300">
            Asignado a: <span className="font-semibold text-white">{cupon.nombreCliente}</span>
          </p>
        </div>

        {/* Código QR de Validación */}
        <div className="my-4 p-3 bg-white rounded-2xl shadow-inner flex flex-col items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrImageUrl}
            alt={`QR de validación ${cupon.codigo}`}
            className="w-40 h-40 object-contain"
          />
        </div>

        {/* Código en texto e Indicador de Estado */}
        <div className="text-center space-y-1">
          <p className="font-mono text-sm tracking-widest text-slate-300 font-bold">
            {cupon.codigo}
          </p>
          <div className="flex justify-center items-center gap-2 mt-2">
            <span
              className={`inline-block w-2.5 h-2.5 rounded-full ${
                esValido ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
              }`}
            />
            <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">
              {cupon.estado}
            </span>
          </div>
        </div>

        {/* Muescas/Cortes de Ticket Físico */}
        <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-slate-950 rounded-full border border-slate-800" />
        <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-slate-950 rounded-full border border-slate-800" />

        {/* Términos y Vencimiento */}
        <div className="w-full border-t border-dashed border-slate-800 pt-4 mt-4 text-center space-y-1">
          {cupon.fechaExpiracion && (
            <p className="text-[11px] text-amber-400/90 font-medium">
              Válido hasta: {new Date(cupon.fechaExpiracion).toLocaleDateString('es-AR')}
            </p>
          )}
          <p className="text-[9px] text-slate-500 leading-tight">
            {cupon.terminosCondiciones || 'Uso único por cliente. Presentar en recepción para su verificación.'}
          </p>
        </div>
      </div>

      {/* ACCIONES DEL CLIENTE */}
      <div className="w-full space-y-3 pt-2">
        {/* Botón Descargar Imagen */}
        <button
          onClick={handleDownloadImage}
          disabled={descargando || !esValido}
          className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-98 disabled:opacity-50 text-white font-semibold py-3.5 px-4 rounded-xl shadow-lg transition-all text-sm flex items-center justify-center gap-2"
        >
          {descargando ? (
            <span>Guardando imagen...</span>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Guardar Cupón en Galería
            </>
          )}
        </button>

        {/* Placeholder / Banner para Apple & Google Wallet */}
        <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-center space-y-1">
          <p className="text-[11px] text-slate-400">
            📲 <span className="font-semibold text-slate-300">Próximamente:</span> Guardá tus cupones directamente en <span className="text-white">Apple Wallet</span> o <span className="text-white">Google Wallet</span>.
          </p>
        </div>
      </div>

    </div>
  );
}