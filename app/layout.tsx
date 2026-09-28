"use server";

import { JSX } from "react";
import Link from "next/link";
import "./globals.css";
import { cookies } from "next/headers";
import StoreProvider from "./components/StoreProvider";

export default async function AdminLayout({children}:{children: JSX.Element}){
  const cookieStore = await cookies()

  const theme = cookieStore.get("theme")?.value || "light";

  const isDark = theme === "dark";

  return(
      <html lang="es">
        <body className={`${isDark? "dark" : ""}`}>
            <StoreProvider>
                <div className="min-h-screen flex flex-col justify-between gap-10">
                    <div
                        className="fixed top-0 left-0 z-[-2] h-screen w-screen bg-neutral-100 dark:bg-neutral-950
                        bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(217,216,255,0.5),rgba(255,255,255,0.9))]
                        dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"
                    ></div>
                    {children}
                    <div className="p-3 sm:p-0">
                        <footer className="rounded-lg shadow bg-black/5 px-3 py-1.5 text-base text-gray-900 sm:text-sm/6 dark:bg-white/5 dark:text-white backdrop-blur-lg container mx-auto mb-10">
                            <div className="w-full mx-auto max-w-screen-xl p-4 md:flex md:items-center md:justify-between">
                                <span className="text-sm sm:text-center text-yellow-800/90 dark:text-yellow-200/90">© 2026 <a href="https://midu.dev/" className="hover:underline">Juan María Mancedo</a>. Todos los derechos reservados</span>
                                <ul className="flex flex-wrap items-center mt-3 text-sm font-medium dark:text-white/90 sm:mt-0">
                                    <li>
                                        <Link href="/quienes-somos" className="hover:underline me-4 md:me-6">Quienes somos?</Link>
                                    </li>
                                    <li>
                                        <Link href="/contacto" className="hover:underline">Contacto</Link>
                                    </li>
                                </ul>
                            </div>
                        </footer>
                    </div>
                </div>
            </StoreProvider>
        </body>
      </html>
  )
}