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

    // Tokens válidos (acepta el token directo o la variable de entorno de Railway)
    const TOKEN_DIRECTO = "sk_live_finanzas_982f3a7d1e4b6c89012a45678f"
    const envToken = process.env.AGENTE_SECRET_TOKEN

    const esValido =
      tokenRecibido === TOKEN_DIRECTO ||
      (!!envToken && tokenRecibido === envToken)

    // Validar autorización
    if (!tokenRecibido || !esValido) {
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
