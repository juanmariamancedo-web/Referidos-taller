'use server'

import { prisma } from '@/lib/prisma';

export async function getDashboardData(
  rol: string, 
  userId?: string, 
  negocioId?: string | null // <--- Agregado | null
) {
  try {
    const normalizedRole = rol?.toUpperCase()

    // 1. Dashboard para Administradores
    if (normalizedRole === 'ADMIN') {
      const [totalNegocios, totalUsuarios, negociosRecientes, cuponesStats] = await Promise.all([
        prisma.negocio.count(),
        prisma.usuario.count(),
        prisma.negocio.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            usuarios: {
              select: { nombre: true, apellido: true, email: true },
              take: 1
            }
          }
        }),
        prisma.cupon.aggregate({
          _sum: {
            montoFinalCliente: true,
            montoComisionVendedor: true
          },
          where: { estado: 'USADO' }
        })
      ])

      return {
        success: true,
        data: {
          totalNegocios,
          totalUsuarios,
          totalRecaudado: Number(cuponesStats._sum.montoFinalCliente || 0),
          comisionesFees: Number(cuponesStats._sum.montoComisionVendedor || 0),
          lastBusinesses: negociosRecientes,
        }
      }
    }

    // 2. Dashboard para Gerentes
    if (normalizedRole === 'GERENTE') {
      const [totalNegocios, cuponesRecientes, cuponesStats] = await Promise.all([
        prisma.negocio.count(),
        prisma.cupon.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            cliente: true,
            usuario: { select: { nombre: true, apellido: true } }
          }
        }),
        prisma.cupon.aggregate({
          _sum: { montoFinalCliente: true },
          where: { estado: 'USADO' }
        })
      ])

      return {
        success: true,
        data: {
          totalNegocios,
          ventasMes: Number(cuponesStats._sum.montoFinalCliente || 0),
          presupuestosAprobados: await prisma.cupon.count({ where: { estado: 'USADO' } }),
          pendientesCobro: await prisma.cupon.count({ where: { estado: 'PENDIENTE' } }),
          lastCupones: cuponesRecientes,
        }
      }
    }

    // 3. Dashboard para Vendedores
    const misCupones = userId ? await prisma.cupon.findMany({
      where: { usuarioId: userId },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { cliente: true }
    }) : []

    const comisionesStats = userId ? await prisma.cupon.aggregate({
      _sum: { montoComisionVendedor: true },
      where: { usuarioId: userId, estado: 'USADO' }
    }) : { _sum: { montoComisionVendedor: 0 } }

    return {
      success: true,
      data: {
        misPresupuestosCount: misCupones.length,
        ventasAprobadas: Number(comisionesStats._sum.montoComisionVendedor || 0),
        comisionesEstimadas: Number(comisionesStats._sum.montoComisionVendedor || 0),
        lastCupones: misCupones,
      }
    }

  } catch (error) {
    console.error("Error al obtener datos del dashboard:", error)
    return { 
      success: false, 
      message: "Error al consultar los datos del sistema",
      data: null 
    }
  }
}