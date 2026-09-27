"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Limpia el input por si el escáner lee una URL completa (ej: https://.../validar/CUPON-1001)
function extraerCodigoCupon(input: string): string {
  if (!input) return "";
  const textoLimpio = input.trim();

  if (textoLimpio.startsWith("http://") || textoLimpio.startsWith("https://")) {
    try {
      const url = new URL(textoLimpio);
      const partes = url.pathname.split("/").filter(Boolean);
      return partes[partes.length - 1] || textoLimpio;
    } catch {
      return textoLimpio;
    }
  }

  return textoLimpio;
}

export default function EscanearCuponPage() {
  const router = useRouter();
  const [codigoManual, setCodigoManual] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const isProcessingRef = useRef<boolean>(false);

  // Detener cámara y flujo de escaneo
  const stopCamera = () => {
    isProcessingRef.current = true;

    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Iniciar la cámara
  const startCamera = async () => {
    setErrorMsg(null);
    isProcessingRef.current = false;

    try {
      const stream = await navigator.mediaDevices
        .getUserMedia({
          video: { facingMode: { exact: "environment" } },
        })
        .catch(() => {
          return navigator.mediaDevices.getUserMedia({ video: true });
        });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
        setCameraActive(true);

        iniciarEscaneo();
      }
    } catch (err) {
      console.error("Error al acceder a la cámara:", err);
      setErrorMsg(
        "No se pudo acceder a la cámara. Revisa los permisos de tu navegador."
      );
      setCameraActive(false);
    }
  };

  // Loop de escaneo cuadro a cuadro
  const iniciarEscaneo = () => {
    if (!("BarcodeDetector" in window)) {
      import("@zxing/browser").then(({ BrowserMultiFormatReader }) => {
        const reader = new BrowserMultiFormatReader();
        if (videoRef.current) {
          reader.decodeFromVideoDevice(undefined, videoRef.current, (res) => {
            if (res && !isProcessingRef.current) {
              isProcessingRef.current = true;
              stopCamera();
              redireccionar(res.getText());
            }
          });
        }
      });
      return;
    }

    // @ts-ignore
    const barcodeDetector = new window.BarcodeDetector({
      formats: ["qr_code"],
    });

    const scanFrame = async () => {
      if (isProcessingRef.current || !videoRef.current) return;

      try {
        if (
          videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA
        ) {
          const barcodes = await barcodeDetector.detect(videoRef.current);
          if (barcodes.length > 0 && !isProcessingRef.current) {
            isProcessingRef.current = true;
            const codigoDetectado = barcodes[0].rawValue;
            stopCamera();
            redireccionar(codigoDetectado);
            return;
          }
        }
      } catch (e) {
        // Ignorar frames incompletos
      }

      if (!isProcessingRef.current) {
        animationFrameId.current = requestAnimationFrame(scanFrame);
      }
    };

    animationFrameId.current = requestAnimationFrame(scanFrame);
  };

  // Redireccionar hacia la página /cupones/validar/[codigo]
  const redireccionar = (codigoRaw: string) => {
    const codigoLimpio = extraerCodigoCupon(codigoRaw);
    if (!codigoLimpio) return;
    router.push(`/cupones/validar/${codigoLimpio}`);
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-3 sm:p-6 space-y-6">
      {/* Barra superior */}
      <div className="flex items-center justify-between">
        <Link
          href="/cupones"
          className="text-sm font-medium text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition"
        >
          ← Volver
        </Link>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          Escanear Cupón
        </h1>
      </div>

      {/* Visor de Cámara */}
      <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-black dark:border-white/10 shadow-xl aspect-square flex items-center justify-center">
        <video
          ref={videoRef}
          className={`h-full w-full object-cover ${
            cameraActive ? "block" : "hidden"
          }`}
        />

        {!cameraActive && (
          <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="rounded-full bg-neutral-800 p-4 text-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
            <button
              type="button"
              onClick={startCamera}
              className="rounded-2xl bg-blue-600 px-6 py-3 text-base font-bold text-white shadow-md hover:bg-blue-700 transition cursor-pointer active:scale-95"
            >
              Activar Cámara
            </button>
          </div>
        )}

        {cameraActive && (
          <button
            type="button"
            onClick={stopCamera}
            className="absolute top-3 right-3 z-10 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 transition cursor-pointer"
            aria-label="Detener Cámara"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {errorMsg && (
        <p className="text-center text-sm font-semibold text-red-500">
          {errorMsg}
        </p>
      )}

      {/* Ingreso Manual */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
          O ingresa el código manualmente
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Ej: CUPON-1001"
            value={codigoManual}
            onChange={(e) => setCodigoManual(e.target.value)}
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-mono text-gray-900 focus:border-blue-500 focus:outline-none dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
          />
          <button
            type="button"
            onClick={() => redireccionar(codigoManual)}
            disabled={!codigoManual.trim()}
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-md hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer"
          >
            Buscar
          </button>
        </div>
      </div>
    </div>
  );
}