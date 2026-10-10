import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import CardCuponCliente from './CardCuponCliente';
import TarjetaBeneficio from './TarjetaBeneficio';

interface PageProps {
  params: Promise<{ codigo: string }>;
}

export default async function VistaCuponPage({ params }: PageProps) {
  const { codigo } = await params;

  const cupon = await prisma.cupon.findUnique({
    where: { codigo },
    include: {
      cliente: true,
      usuario: {
        include: {
          negocio: true,
        },
      },
    },
  });

  if (!cupon) {
    notFound();
  }

  // Mapeo seguro de datos
  const datosCupon = {
    codigo: cupon.codigo,
    estado: cupon.estado,
    tipoDescuento: cupon.tipoDescuento,
    valorDescuento: Number(cupon.valorDescuento),
    terminosCondiciones: cupon.terminosCondiciones,
    fechaExpiracion: cupon.fechaExpiracion ? cupon.fechaExpiracion.toISOString() : null,
    nombreNegocio: cupon.usuario.negocio?.nombre || 'Comercio Adherido',
    direccionNegocio: cupon.usuario.negocio?.direccion || '',
    nombreCliente: cupon.cliente.nombre || 'Cliente',
  };

  return (
    <main className="min-h-screen text-slate-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* <CardCuponCliente cupon={datosCupon} /> */}
        <TarjetaBeneficio cupon={datosCupon} />
      </div>
    </main>
  );
}