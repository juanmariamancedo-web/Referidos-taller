import { NextResponse } from "next/server"
import { consultarDeudaPorNegocios } from "@/app/actions/liquidaciones"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const accion = searchParams.get("accion")
    
    // Obtiene el token desde la URL (?token=...) o desde el Header (Bearer ...)
    const urlToken = searchParams.get("token")
    const headerToken = req.headers.get("authorization")?.replace("Bearer ", "")
    const tokenRecibido = urlToken || headerToken

    // Token esperado (se lee de la variable de entorno o usa el valor de respaldo)
    const tokenEsperado = process.env.AGENTE_SECRET_TOKEN || "sk_live_finanzas_982f3a7d1e4b6c89012a45678f"

    // Validar autorización
    if (!tokenRecibido || tokenRecibido !== tokenEsperado) {
      return NextResponse.json(
        { success: false, error: "No autorizado." },
        { status: 401 }
      )
    }

    if (accion === "consultar_deudas") {
      const resultado = await consultarDeudaPorNegocios()
      return NextResponse.json(resultado)
    }

    return NextResponse.json(
      { success: false, error: "Acción no válida." },
      { status: 400 }
    )
  } catch (error) {
    console.error("Error en API GET finanzas:", error)
    return NextResponse.json(
      { success: false, error: "Error interno del servidor." },
      { status: 500 }
    )
  }
}
