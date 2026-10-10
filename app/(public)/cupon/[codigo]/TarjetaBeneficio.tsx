"use client";

import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import QRCode from "qrcode";

export interface CuponProps {
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

export default function TarjetaBeneficio({ cupon }: CuponProps) {
  const [qrUrl, setQrUrl] = useState("");
  const [descargando, setDescargando] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const tieneDescuentoEspecial = Boolean(
    cupon.valorDescuento && cupon.valorDescuento > 0
  );

  const fechaVencimiento = cupon.fechaExpiracion
    ? new Date(cupon.fechaExpiracion).toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "SIN VENCIMIENTO";

  useEffect(() => {
    if (!cupon.codigo) return;
    const baseUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/canje/${cupon.codigo}`;
    QRCode.toDataURL(baseUrl, {
      width: 500,
      margin: 0,
      errorCorrectionLevel: "M",
    })
      .then(setQrUrl)
      .catch(console.error);
  }, [cupon.codigo]);

  const descargarImagen = async () => {
    if (!cardRef.current || !qrUrl) return;
    setDescargando(true);
    try {
      const node = cardRef.current;
      await document.fonts.ready;

      // Siempre exporta ~1300px de ancho, sin importar el tamaño en pantalla
      const dataUrl = await toPng(node, {
        pixelRatio: 1300 / node.offsetWidth,
        cacheBust: true,
        style: { boxShadow: "none" },
      });

      const link = document.createElement("a");
      link.download = `tarjeta-beneficios-${cupon.codigo}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Error al generar la imagen:", error);
      alert("No se pudo generar la imagen. Intentá de nuevo.");
    } finally {
      setDescargando(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] w-full flex-col items-center justify-center gap-6 p-4">
      {/* Tarjeta */}
      <div
        ref={cardRef}
        id="print-area"
        className="relative flex aspect-[13/18] h-auto w-full max-w-[340px] items-center justify-center bg-white bg-contain bg-center bg-no-repeat shadow-2xl sm:h-[18cm] sm:w-[13cm] sm:max-w-none"
        style={{ backgroundImage: "url('/TARJETA-BENEFICIOS-RM.png')" }}
      >
        {/* Descuento sobre la franja roja */}
        {tieneDescuentoEspecial && (
          <div className="absolute top-[30.5%] left-1/2 flex w-[85%] -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center font-black uppercase leading-none text-white">
            <span className="text-4xl sm:text-6xl">
              {cupon.tipoDescuento === "PORCENTAJE"
                ? `${cupon.valorDescuento}%`
                : `$${cupon.valorDescuento?.toLocaleString("es-AR")}`}
            </span>
            <span className="mt-1.5 text-base tracking-tight sm:text-2xl">
              {cupon.tipoDescuento === "PORCENTAJE"
                ? "DESCUENTO EN REPROS"
                : "OFF EN REPROS"}
            </span>
          </div>
        )}

        {/* CLIENTE */}
        <div className="absolute top-[52.5%] left-[12.5%] w-[27.5%] text-left">
          <p className="truncate font-sans text-[11px] font-extrabold uppercase text-gray-900 sm:text-sm">
            {cupon.nombreCliente}
          </p>
        </div>

        {/* ESTADO */}
        <div className="absolute top-[52.5%] left-[60%] w-[28%] text-left">
          <p className="truncate font-sans text-[11px] font-extrabold uppercase text-gray-900 sm:text-sm">
            {cupon.estado}
          </p>
        </div>

        {/* REFERIDO */}
        <div className="absolute top-[66.5%] left-[12.5%] w-[27.5%] text-left">
          <p className="truncate font-sans text-[11px] font-extrabold uppercase text-gray-900 sm:text-sm">
            {cupon.nombreNegocio}
          </p>
        </div>

        {/* VENCIMIENTO */}
        <div className="absolute top-[66.5%] left-[60%] w-[28%] text-left">
          <p className="truncate font-sans text-[11px] font-extrabold uppercase text-gray-900 sm:text-sm">
            {fechaVencimiento}
          </p>
        </div>

        {/* QR */}
        <div className="absolute bottom-[5.2%] left-[50.4%] flex aspect-square w-[27%] -translate-x-1/2 items-center justify-center bg-white p-[1%]">
          {qrUrl ? (
            <img
              src={qrUrl}
              alt={`Cupón de beneficio ${cupon.codigo}`}
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="font-sans text-xs text-gray-400">Cargando...</div>
          )}
        </div>
      </div>

      {/* Botón de descarga */}
      <button
        onClick={descargarImagen}
        disabled={descargando || !qrUrl}
        className="rounded-xl bg-red-600 px-6 py-2.5 font-bold text-white shadow-md transition hover:bg-red-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {descargando ? "Generando..." : "⬇️ Descargar Tarjeta de Beneficios"}
      </button>
    </div>
  );
}