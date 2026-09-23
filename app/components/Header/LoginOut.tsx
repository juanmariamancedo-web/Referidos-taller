"use client";

import { useTransition } from "react"; // 👈 Hook para manejar la transición del estado del servidor
import LogoutIcon from "../icons/LogoutIcon";
import { logoutAction } from "@/app/actions/auth"; // 👈 Importamos tu Server Action de logout

export default function LogoutButton() {
  // isPending se pone en true automáticamente mientras corre el logout en el servidor
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    // startTransition envuelve la ejecución asíncrona del servidor
    startTransition(async () => {
      try {
        await logoutAction(); 
      } catch (error) {
        console.error("Error al cerrar sesión:", error);
      }
    });
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isPending} // Deshabilitamos el botón mientras borra las cookies
      className="hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition flex justify-center items-center cursor-pointer p-2 disabled:opacity-50"
      title={isPending ? "Cerrando sesión..." : "Cerrar Sesión"}
    >
      {/* Usé el icono de Logout para cuando sale, invertilo si los tenías al revés */}
      <LogoutIcon className={isPending ? "animate-pulse" : ""} />
    </button>
  );
}