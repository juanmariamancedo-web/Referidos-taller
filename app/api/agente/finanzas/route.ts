import { NextResponse } from "next/server"
import { consultarDeudaPorNegocios } from "@/app/actions/liquidaciones"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const accion = searchParams.get("accion")
    const token = searchParams.get("token")
    const secretToken = process.env.AGENTE_SECRET_TOKEN

    // Validamos que la clave secreta sea correcta
    if (!token || token !== secretToken) {
      return NextResponse.json({ success: false, error: "No autorizado." }, { status: 401 })
    }

    if (accion === "consultar_deudas") {
      const resultado = await consultarDeudaPorNegocios()
      return NextResponse.json(resultado)
    }

    return NextResponse.json({ success: false, error: "Acción no válida." }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Error en el servidor." }, { status: 500 })
  }
}