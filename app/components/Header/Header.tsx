"use client";

import { useEffect, useState } from "react";
import ButtonOfDarkMode from "./ButtonOfDarkMode";
import SwitchOpen from "./SwitchOpen";
import Home from "@/app/components/icons/HomeIcon";
import Link from "next/link";
import { Page } from "@/lib/types/page";

interface HeaderProps {
  pages: Page[];
  homeUrl: string;
}

export function Header({ pages, homeUrl }: HeaderProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 768px)");
    mql.onchange = (e) => {
      if (!e.matches) setOpen(false);
    };
  }, []);

  function toggleOpen() {
    setOpen((prevState) => !prevState);
  }

  return (
    <header className="z-10 fixed w-full h-14 flex justify-center items-center">
      <nav className="w-full h-full relative">
        {/* Botón de Menú Hamburguesa para Móviles */}
        <div className="absolute inset-0 flex justify-center items-center lg:hidden">
          <div className="container p-3">
            <button
              onClick={toggleOpen}
              className="bg-neutral-200/80 dark:bg-neutral-800/80 hover:bg-black/10 dark:hover:bg-white/10 rounded-full px-3 py-1 text-gray-800 dark:text-white transition"
              aria-label="Abrir menú"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M4 6l16 0" />
                <path d="M4 12l16 0" />
                <path d="M4 18l16 0" />
              </svg>
            </button>
          </div>
        </div>

        {/* Contenedor del Menú (Móvil desplegable / Desktop) */}
        <div
          className={`${
            open ? "translate-x-full" : ""
          } bg-white/80 dark:bg-neutral-900/80 backdrop-blur-2xl lg:backdrop-blur-0 text-gray-800 dark:text-white lg:bg-transparent lg:dark:bg-transparent lg:transition-none z-20 lg:z-auto fixed inset-y-0 -left-full right-full lg:absolute lg:inset-0 transition-transform duration-300`}
        >
          {/* Botón de Cierre en Móvil */}
          <div className="w-full h-14 flex justify-center items-center lg:hidden">
            <div className="container p-3 flex items-center">
              <button
                onClick={toggleOpen}
                className="z-10 bg-neutral-200/80 dark:bg-neutral-800/80 hover:bg-black/10 dark:hover:bg-white/10 rounded-full px-3 py-1 text-gray-800 dark:text-white transition"
                aria-label="Cerrar menú"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M18 6l-12 12" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Barra Flotante Principal (Pill Layout) */}
          <div className="absolute inset-0 flex justify-center items-center lg:h-14 p-3">
            <ul className="flex flex-col lg:flex-row items-center justify-between gap-5 container lg:border lg:border-black/10 dark:lg:border-white/15 rounded-full px-4 py-1.5 lg:bg-white/70 lg:dark:bg-neutral-900/70 lg:backdrop-blur-md shadow-sm dark:shadow-none text-gray-800 dark:text-white flex-grow-0">
              
              {/* Inicio / Home */}
              <li className="hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition p-1.5 flex justify-center items-center">
                <SwitchOpen setOpen={setOpen}>
                  <Link
                    className="flex justify-center items-center cursor-pointer"
                    href={homeUrl}
                  >
                    <Home className="w-5 h-5" />
                  </Link>
                </SwitchOpen>
              </li>

              {/* Rutas / Páginas */}
              <div className="flex flex-col lg:flex-row items-center justify-center gap-2 lg:gap-4 font-medium text-sm">
                {pages.length > 0 &&
                  pages.map((page, index) => (
                    <li key={index}>
                      <SwitchOpen setOpen={setOpen}>
                        <Link
                          className="hover:bg-black/5 dark:hover:bg-white/10 px-3 py-1 rounded-full transition block"
                          href={page.href}
                        >
                          {page.name}
                        </Link>
                      </SwitchOpen>
                    </li>
                  ))}
              </div>

              {/* Controles del Header */}
              <div className="flex flex-col lg:flex-row items-center justify-center gap-3">
                <div className="flex flex-row items-center justify-center gap-3">
                  <li className="hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition flex justify-center items-center p-1">
                    <SwitchOpen setOpen={setOpen}>
                      <ButtonOfDarkMode />
                    </SwitchOpen>
                  </li>
                </div>
              </div>

            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
}