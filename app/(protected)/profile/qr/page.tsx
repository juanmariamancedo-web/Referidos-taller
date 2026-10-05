"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function PrintQRPage() {
  const searchParams = useSearchParams();
  const qrvendedor = searchParams.get("vendedor") || "promotor-1";

  const [qrUrl, setQrUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const baseUrl = `${window.location.origin}/c/${qrvendedor}`;
      setQrUrl(
        `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(
          baseUrl
        )}`
      );
    }
  }, [qrvendedor]);

  return (
    <div className="flex min-h-[100dvh] w-full flex-col items-center justify-center gap-6 p-4 print:h-auto print:min-h-0 print:p-0">
      <style>{`
        @media print {
          @page {
            size: 13cm 18cm;
            margin: 0;
          }
          html, body {
            height: 18cm;
            overflow: hidden;
            margin: 0;
            padding: 0;
          }
          #print-area {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 13cm !important;
            height: 18cm !important;
            z-index: 50 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      {/* Tarjeta imprimible responsive */}
      <div
        id="print-area"
        className="relative flex aspect-[13/18] h-auto w-full max-w-[340px] items-center justify-center bg-white bg-contain bg-center bg-no-repeat shadow-2xl sm:h-[18cm] sm:w-[13cm] sm:max-w-none print:shadow-none"
        style={{ backgroundImage: "url('/ESTANDARTE-RM.png')" }}
      >
        {/* Posicionamiento porcentual absoluto que escala proporcionalmente */}
        <div className="absolute top-1/2 left-1/2 flex aspect-square w-[44.6%] -translate-x-1/2 -translate-y-1/2 items-center justify-center bg-white p-[2%]">
          {qrUrl ? (
            <img
              src={qrUrl}
              alt={`QR para ${qrvendedor}`}
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="font-sans text-xs text-gray-400">Cargando...</div>
          )}
        </div>
      </div>

      {/* Botón de Impresión */}
      <button
        onClick={() => window.print()}
        className="rounded-xl bg-red-600 px-6 py-2.5 font-bold text-white shadow-md transition hover:bg-red-700 active:scale-95 print:hidden"
      >
        🖨️ Imprimir Estandarte
      </button>
    </div>
  );
}