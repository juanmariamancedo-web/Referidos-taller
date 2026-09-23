"use client";

import { useEffect, useState, ReactNode, createContext, useContext } from "react";

// Contexto para compartir la función de cerrar el menú en móvil
const MenuContext = createContext<{ closeMenu: () => void }>({
  closeMenu: () => {},
});

export const useMenu = () => useContext(MenuContext);

interface HeaderInteractiveProps {
  children: ReactNode;
}

export function HeaderInteractive({ children }: HeaderInteractiveProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 768px)");
    const handleChange = (e: MediaQueryListEvent) => {
      if (!e.matches) setOpen(false);
    };

    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, []);

  const toggleOpen = () => setOpen((prev) => !prev);
  const closeMenu = () => setOpen(false);

  return (
    <MenuContext.Provider value={{ closeMenu }}>
      <header className="z-10 fixed w-full h-14 flex justify-center items-center">
        <nav className="w-full h-full relative">
          {/* Botón Abrir (Móvil) */}
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

          {/* Contenedor del Menú */}
          <div
            className={`${
              open ? "translate-x-full" : ""
            } bg-white/80 dark:bg-neutral-900/80 backdrop-blur-2xl lg:backdrop-blur-0 text-gray-800 dark:text-white lg:bg-transparent lg:dark:bg-transparent lg:transition-none z-20 lg:z-auto fixed inset-y-0 -left-full right-full lg:absolute lg:inset-0 transition-transform duration-300`}
          >
            {/* Botón Cerrar (Móvil) */}
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

            {children}
          </div>
        </nav>
      </header>
    </MenuContext.Provider>
  );
}