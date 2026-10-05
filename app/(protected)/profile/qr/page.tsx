import { notFound } from "next/navigation";
import Estandarte from "@/app/components/Estandarte";
import { getUserAuth } from "@/app/actions/auth";


export default async function QRByUserPage() {
  // Consultamos la Server Action pasando el idUser
  const { data, success } = await getUserAuth()

  // Si no se encuentra el token o no tiene permisos, mostramos la página 404
  if (!success || !data?.qrToken) {
    return notFound();
  }

  return <Estandarte qrUser={data.qrToken} />;
}