import { notFound } from "next/navigation";
import { getUserQR } from "@/app/actions/getUserQR";
import Estandarte from "@/app/components/Estandarte";

interface PageProps {
  params: Promise<{
    IDUser: string;
  }>;
}

export default async function QRByUserPage({ params }: PageProps) {
  // 1. Extraemos IDUser de los params (asegúrate de respetar las mayúsculas/minúsculas de tu carpeta [IDUser])
  const { IDUser } = await params;

  // 2. Le pasamos IDUser a la Server Action
  const { data, success } = await getUserQR(IDUser);

  if (!success || !data?.qrToken) {
    return notFound();
  }

  return <Estandarte qrUser={data.qrToken} />;
}