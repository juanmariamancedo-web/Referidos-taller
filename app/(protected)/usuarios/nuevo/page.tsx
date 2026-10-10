// app/(protected)/usuarios/nuevo/page.tsx
import { getUserAuth } from "@/app/actions/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Rol } from "@prisma/client";
import NuevoUsuarioForm from "./NuevoUsuarioForm";

export default async function NuevoUsuarioPage() {
  const { data: currentUser } = await getUserAuth();

  if (!currentUser || !currentUser.id) {
    redirect("/login");
  }

  if (currentUser.rol !== Rol.ADMIN && currentUser.rol !== Rol.GERENTE) {
    redirect("/usuarios");
  }

  if (currentUser.rol === Rol.GERENTE && !currentUser.negocioId) {
    redirect("/usuarios");
  }

  let negocios: { id: string; nombre: string }[] = [];
  if (currentUser.rol === Rol.ADMIN) {
    negocios = await prisma.negocio.findMany({
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    });
  } else {
    const negocioGerente = await prisma.negocio.findUnique({
      where: { id: currentUser.negocioId! },
      select: { id: true, nombre: true },
    });
    if (negocioGerente) {
      negocios = [negocioGerente];
    }
  }

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <NuevoUsuarioForm
        currentUserRol={currentUser.rol}
        currentUserNegocioNombre={negocios[0]?.nombre}
        negocios={negocios}
      />
    </div>
  );
}