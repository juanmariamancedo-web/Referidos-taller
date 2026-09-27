"use client"

import { useState, useEffect, useRef } from "react"
import { BrowserMultiFormatReader } from "@zxing/browser"
import { validarYCanjearCupon, ValidarCuponResponse } from "@/app/actions/cupones"
import Link from "next/link"

export default function ValidarCuponPage() {
  const [scannedCode, setScannedCode] = useState("")
  const [manualCode, setManualCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [result, setResult] = useState<ValidarCuponResponse | null>(null)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null)

  // Iniciar la cámara cuando cameraActive cambia
  useEffect(() => {
    if (cameraActive && videoRef.current) {
      const codeReader = new BrowserMultiFormatReader()
      codeReaderRef.current = codeReader

      codeReader.decodeFromVideoDevice(
        undefined, // Utiliza la cámara predeterminada (normalmente la trasera en celulares)
        videoRef.current,
        (scanResult, error) => {
          if (scanResult) {
            const code = scanResult.getText()
            setScannedCode(code)
            setCameraActive(false) // Pausa la cámara al detectar un código
            handleValidar(code)
          }
        }
      ).catch((err) => {
        console.error("Error al acceder a la cámara:", err)
        setResult({
          success: false,
          message: "No se pudo acceder a la cámara. Permite los permisos en tu navegador.",
        })
        setCameraActive(false)
      })
    }

    return () => {
      if (codeReaderRef.current) {
        // Detener transmisión al desmontar
        codeReaderRef.current = null
      }
    }
  }, [cameraActive])

  const handleValidar = async (codigoTarget: string) => {
    if (!codigoTarget.trim()) return
    setLoading(true)
    setResult(null)

    const response = await validarYCanjearCupon(codigoTarget)
    setResult(response)
    setLoading(false)
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleValidar(manualCode)
  }

  const reiniciarLector = () => {
    setResult(null)
    setScannedCode("")
    setManualCode("")
    setCameraActive(true)
  }

  return (
    <div className="mx-auto max-w-md p-4 min-h-screen flex flex-col justify-between">
      <div>
        {/* Header con botón Volver */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/cupones"
            className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:underline"
          >
            ← Volver a cupones
          </Link>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Validar Cupón</h1>
        </div>

        {/* visor de cámara o resultado */}
        {result ? (
          <div
            className={`rounded-2xl p-6 text-center border-2 mb-6 ${
              result.success
                ? "bg-green-50 border-green-500 text-green-900 dark:bg-green-950/40 dark:text-green-200"
                : "bg-red-50 border-red-500 text-red-900 dark:bg-red-950/40 dark:text-red-200"
            }`}
          >
            <div className="text-4xl mb-2">{result.success ? "✓" : "✕"}</div>
            <h2 className="text-xl font-bold mb-2">
              {result.success ? "¡Canje Exitoso!" : "Error al Validar"}
            </h2>
            <p className="text-sm mb-4">{result.message}</p>

            {result.cupon && (
              <div className="bg-white dark:bg-black/40 rounded-xl p-4 text-left text-sm space-y-2 border border-gray-200 dark:border-white/10 mb-4">
                <p>
                  <span className="font-semibold">Código:</span> {result.cupon.codigo}
                </p>
                <p>
                  <span className="font-semibold">Descuento:</span>{" "}
                  {result.cupon.tipoDescuento === "PORCENTAJE"
                    ? `${result.cupon.valorDescuento}%`
                    : `$${result.cupon.valorDescuento}`}
                </p>
                <p>
                  <span className="font-semibold">Cliente:</span>{" "}
                  {result.cupon.clienteNombre || result.cupon.clienteTelefono}
                </p>
              </div>
            )}

            <button
              onClick={reiniciarLector}
              className="w-full rounded-xl bg-blue-600 px-4 py-3 text-white font-semibold shadow hover:bg-blue-700 transition"
            >
              Escanear otro cupón
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Visor de Cámara */}
            <div className="relative aspect-square w-full bg-black rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
              {cameraActive ? (
                <video ref={videoRef} className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-6 text-gray-400">
                  <p className="text-sm mb-4">Presiona para activar la cámara del celular</p>
                  <button
                    onClick={() => setCameraActive(true)}
                    className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg hover:bg-blue-700 transition"
                  >
                    Activar Cámara
                  </button>
                </div>
              )}

              {loading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-semibold">
                  Validando código...
                </div>
              )}
            </div>

            {/* Formulario Manual de Respaldo */}
            <div className="pt-4 border-t border-gray-200 dark:border-white/10">
              <p className="text-xs text-gray-500 mb-2 text-center">
                ¿El código QR está borroso? Ingrésalo manualmente:
              </p>
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ej: CUPON-1234"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="flex-1 rounded-xl border border-gray-300 dark:border-white/20 bg-white dark:bg-white/5 px-4 py-2.5 text-sm uppercase text-gray-900 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={loading || !manualCode.trim()}
                  className="rounded-xl bg-gray-900 dark:bg-white dark:text-gray-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Validar
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}