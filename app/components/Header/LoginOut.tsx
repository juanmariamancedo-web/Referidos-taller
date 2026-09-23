"use client";

import { useTransition } from "react"; // 👈 Hook para manejar la transición del estado del servidor
import Link from "next/link";
import LoginIcon from "../icons/LoginIcon";
import LogoutIcon from "../icons/LogoutIcon";
import { logoutUser } from "@/app/actions/auth"; // 👈 Importamos tu Server Action de logout

interface LoginOutProps {
  user?: {
    name?: string;
    email?: string;
  } | null;
}

export default function LoginOut({ user }: LoginOutProps) {
  // isPending se pone en true automáticamente mientras corre el logout en el servidor
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    // startTransition envuelve la ejecución asíncrona del servidor
    startTransition(async () => {
      try {
        await logoutUser(); 
        // 💡 Nota: No necesitas router.refresh() ni router.push() acá.
        // El 'signOut' de NextAuth que pusimos adentro del action ya se encarga 
        // de refrescar los tokens y redirigir al usuario en la misma petición.
      } catch (error) {
        console.error("Error al cerrar sesión:", error);
      }
    });
  }

  return (
    <>
      {user ? (
        <button
          onClick={handleLogout}
          disabled={isPending} // Deshabilitamos el botón mientras borra las cookies
          className="hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition flex justify-center items-center cursor-pointer p-2 disabled:opacity-50"
          title={isPending ? "Cerrando sesión..." : "Cerrar Sesión"}
        >
          {/* Usé el icono de Logout para cuando sale, invertilo si los tenías al revés */}
          <LogoutIcon className={isPending ? "animate-pulse" : ""} />
        </button>
      ) : (
        <Link
          className="hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition flex justify-center items-center cursor-pointer p-2"
          href="/login"
          title="Iniciar Sesión"
        >
          <LoginIcon />
        </Link>
      )}
    </>
  );
}