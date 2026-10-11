import { consultarDeudaPorNegocios, registrarLiquidacionYPagonegocio } from "@/app/actions/liquidaciones"
import { NextResponse } from "next/server"
import { MetodoPago } from "@prisma/client"


export async function POST(req: Request) {
  try {
    // 🔒 SEGURIDAD: Validar el Token Secreto (Bearer Token)
    const authHeader = req.headers.get("authorization")
    const secretToken = process.env.AGENTE_SECRET_TOKEN

    if (!authHeader || authHeader !== `Bearer ${secretToken}`) {
      return NextResponse.json(
        { success: false, error: "No autorizado. Token inválido o faltante." },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { accion, negocioId, periodo, metodoPago, numeroTransferencia } = body

    // 📊 Acción 1: Consultar deudas desglosadas por negocios y vendedores
    if (accion === "consultar_deudas") {
      const resultado = await consultarDeudaPorNegocios()
      return NextResponse.json(resultado)
    }

    // 💸 Acción 2: Registrar liquidación, pago al local y actualización de cupones
    if (accion === "registrar_pago") {
      if (!negocioId || !periodo) {
        return NextResponse.json(
          { success: false, error: "Faltan datos obligatorios (negocioId y periodo)." },
          { status: 400 }
        )
      }

      // Validar método de pago si viene provisto, por defecto usa TRANSFERENCIA
      const metodoValido = Object.values(MetodoPago).includes(metodoPago)
        ? metodoPago
        : MetodoPago.TRANSFERENCIA

      const resultado = await registrarLiquidacionYPagonegocio({
        negocioId,
        periodo,
        metodoPago: metodoValido,
        numeroTransferencia,
      })

      return NextResponse.json(resultado)
    }

    return NextResponse.json(
      { success: false, error: "Acción no reconocida. Acciones válidas: 'consultar_deudas', 'registrar_pago'." },
      { status: 400 }
    )
  } catch (error) {
    console.error("Error en API de agente /finanzas:", error)
    return NextResponse.json(
      { success: false, error: "Error interno del servidor al procesar la solicitud del agente." },
      { status: 500 }
    )
  }
}