"use server"

import { prisma } from "@/lib/prisma"
import { EstadoCupon, EstadoLiquidacion, MetodoPago, Prisma } from "@prisma/client"

export interface RegistrarPagoNegocioParams {
  negocioId: string
  periodo: string // Ej: "2026-10-Q1"
  metodoPago?: MetodoPago // EFECTIVO, TRANSFERENCIA, CHEQUE
  numeroTransferencia?: string
}

/**
 * Consulta cuánto se debe al local y a los vendedores basándose en los cupones
 * en estado USADO que aún no tienen una liquidación asociada.
 */
export async function consultarDeudaPorNegocios() {
  try {
    const cuponesPendientes = await prisma.cupon.findMany({
      where: {
        estado: EstadoCupon.USADO,
        liquidacionDetalleId: null,
      },
      include: {
        usuario: {
          include: {
            negocio: true,
          },
        },
      },
    })

    if (cuponesPendientes.length === 0) {
      return {
        success: true,
        mensaje: "No hay cupones pendientes de liquidación en ningún negocio.",
        data: [],
      }
    }

    const resumenNegocios: Record<string, any> = {}

    for (const cupon of cuponesPendientes) {
      const negocio = cupon.usuario?.negocio
      if (!negocio) continue

      if (!resumenNegocios[negocio.id]) {
        resumenNegocios[negocio.id] = {
          negocioId: negocio.id,
          nombreNegocio: negocio.nombre,
          alias: negocio.alias || "No registrado",
          cbuCvu: negocio.cbuCvu || "No registrado",
          banco: negocio.bancoOProveedor || "-",
          totalCupones: 0,
          montoTotalBruto: 0,
          deudaConElLocal: 0,        // Suma de comisionDuenoCalculada (lo que va al local)
          deudaConVendedores: 0,     // Suma de (montoComisionVendedor - comisionDuenoCalculada)
          desgloseVendedores: {},    // Detalle por cada vendedor individual
        }
      }

      const comisionVendedor = Number(cupon.montoComisionVendedor || 0)
      const comisionDueno = Number(cupon.comisionDuenoCalculada || 0)
      const netoVendedor = comisionVendedor - comisionDueno

      const vendedorId = cupon.usuarioId
      const nombreVendedor = cupon.usuario
        ? `${cupon.usuario.nombre || ""} ${cupon.usuario.apellido || ""}`.trim() || cupon.usuario.email
        : "Desconocido"

      // Acumuladores del negocio
      resumenNegocios[negocio.id].totalCupones += 1
      resumenNegocios[negocio.id].montoTotalBruto += comisionVendedor
      resumenNegocios[negocio.id].deudaConElLocal += comisionDueno
      resumenNegocios[negocio.id].deudaConVendedores += netoVendedor

      // Acumulador por vendedor individual
      if (!resumenNegocios[negocio.id].desgloseVendedores[vendedorId]) {
        resumenNegocios[negocio.id].desgloseVendedores[vendedorId] = {
          vendedorId,
          nombre: nombreVendedor,
          cupones: 0,
          netoACobrar: 0,
        }
      }

      resumenNegocios[negocio.id].desgloseVendedores[vendedorId].cupones += 1
      resumenNegocios[negocio.id].desgloseVendedores[vendedorId].netoACobrar += netoVendedor
    }

    // Formatear desgloseVendedores de objeto a array para facilitar consumo
    const resultado = Object.values(resumenNegocios).map((item) => ({
      ...item,
      desgloseVendedores: Object.values(item.desgloseVendedores),
    }))

    return { success: true, data: resultado }
  } catch (error) {
    console.error("Error al consultar deuda por negocios:", error)
    return { success: false, error: "Ocurrió un error al consultar las deudas." }
  }
}

/**
 * Registra de forma atómica la liquidación, los detalles por vendedor, el pago consolidado al negocio
 * y actualiza el estado de los cupones a LIQUIDADO.
 */
export async function registrarLiquidacionYPagonegocio({
  negocioId,
  periodo,
  metodoPago = MetodoPago.TRANSFERENCIA,
  numeroTransferencia,
}: RegistrarPagoNegocioParams) {
  try {
    const cuponesPendientes = await prisma.cupon.findMany({
      where: {
        estado: EstadoCupon.USADO,
        liquidacionDetalleId: null,
        usuario: {
          negocioId: negocioId,
        },
      },
      include: {
        usuario: true,
      },
    })

    if (cuponesPendientes.length === 0) {
      return { success: false, error: "No hay cupones pendientes para este negocio." }
    }

    const cuponesPorVendedor: Record<string, typeof cuponesPendientes> = {}
    for (const c of cuponesPendientes) {
      if (!cuponesPorVendedor[c.usuarioId]) {
        cuponesPorVendedor[c.usuarioId] = []
      }
      cuponesPorVendedor[c.usuarioId].push(c)
    }

    let sumaTotalRetencionDueno = 0

    const detallesDataToCreate = Object.entries(cuponesPorVendedor).map(([usuarioId, cuponesV]) => {
      let montoBrutoV = 0
      let comisionDuenoV = 0

      for (const c of cuponesV) {
        const comisionV = Number(c.montoComisionVendedor || 0)
        const retencionD = Number(c.comisionDuenoCalculada || 0)
        montoBrutoV += comisionV
        comisionDuenoV += retencionD
      }

      const montoNetoV = montoBrutoV - comisionDuenoV
      sumaTotalRetencionDueno += comisionDuenoV

      return {
        usuarioId,
        montoBruto: new Prisma.Decimal(montoBrutoV),
        comisionDueno: new Prisma.Decimal(comisionDuenoV),
        montoNeto: new Prisma.Decimal(montoNetoV),
        estado: EstadoLiquidacion.PAGADA,
        metodoPago,
        cuponesIds: cuponesV.map((c) => c.id),
      }
    })

    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Crear cabecera de la Liquidación
      const liquidacion = await tx.liquidacion.create({
        data: {
          periodo,
          estado: EstadoLiquidacion.PAGADA,
          fechaPago: new Date(),
        },
      })

      // 2. Crear el PagoNegocio consolidado (correspondiente a lo que se debe al local)
      const pagoNegocio = await tx.pagoNegocio.create({
        data: {
          negocioId,
          liquidacionId: liquidacion.id,
          monto: new Prisma.Decimal(sumaTotalRetencionDueno),
          estado: EstadoLiquidacion.PAGADA,
          metodoPago,
          numeroTransferencia,
          fechaPago: new Date(),
        },
      })

      // 3. Crear cada LiquidacionDetalle vinculándolo al pagoNegocio y conectando los cupones
      for (const detalle of detallesDataToCreate) {
        await tx.liquidacionDetalle.create({
          data: {
            liquidacionId: liquidacion.id,
            pagoNegocioId: pagoNegocio.id,
            usuarioId: detalle.usuarioId,
            montoBruto: detalle.montoBruto,
            comisionDueno: detalle.comisionDueno,
            montoNeto: detalle.montoNeto,
            estado: EstadoLiquidacion.PAGADA,
            metodoPago,
            numeroTransferencia,
            fechaPago: new Date(),
            cupones: {
              connect: detalle.cuponesIds.map((id) => ({ id })),
            },
          },
        })
      }

      // 4. Actualizar el estado de todos los cupones involucrados a LIQUIDADO
      await prisma.cupon.updateMany({
        where: {
          id: { in: cuponesPendientes.map((c) => c.id) },
        },
        data: {
          estado: EstadoCupon.LIQUIDADO,
        },
      })

      return { liquidacionId: liquidacion.id, pagoNegocioId: pagoNegocio.id }
    })

    return {
      success: true,
      mensaje: `¡Liquidación y pago registrados con éxito para ${cuponesPendientes.length} cupones!`,
      data: resultado,
    }
  } catch (error) {
    console.error("Error al registrar liquidación y pago de negocio:", error)
    return { success: false, error: "Ocurrió un error en la base de datos al registrar el pago." }
  }
}