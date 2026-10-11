import { NextResponse } from "next/server"
import { consultarDeudaPorNegocios, registrarLiquidacionYPagonegocio } from "@/app/actions/liquidaciones" 

export async function POST(req: Request) {
  try {
    // 🔒 SEGURIDAD: Verificar el Token Secreto
    const authHeader = req.headers.get("authorization")
    const secretToken = process.env.AGENTE_SECRET_TOKEN

    if (!authHeader || authHeader !== `Bearer ${secretToken}`) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 })
    }

    const body = await req.json()
    const { accion, negocioId, periodo, metodoPago, numeroTransferencia } = body

    // Acción 1: Consultar deudas pendientes
    if (accion === "consultar_deudas") {
      const resultado = await consultarDeudaPorNegocios()
      return NextResponse.json(resultado)
    }

    // Acción 2: Registrar liquidación y pago
    if (accion === "registrar_pago") {
      if (!negocioId || !periodo) {
        return NextResponse.json({ success: false, error: "Faltan datos obligatorios (negocioId, periodo)" }, { status: 400 })
      }

      const resultado = await registrarLiquidacionYPagonegocio({
        negocioId,
        periodo,
        metodoPago,
        numeroTransferencia,
      })
      return NextResponse.json(resultado)
    }

    return NextResponse.json({ success: false, error: "Acción no reconocida" }, { status: 400 })
  } catch (error) {
    console.error("Error en API de agente:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}