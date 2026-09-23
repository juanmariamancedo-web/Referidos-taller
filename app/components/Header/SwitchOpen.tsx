"use client";

import { useState, useEffect, ReactNode } from "react";
import { useMenu } from "./HeaderInteractive";

export default function SwitchOpen({ children }: { children: ReactNode }) {
  const { closeMenu } = useMenu();
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");

    const updateScreenSize = (e: MediaQueryList | MediaQueryListEvent) => {
      // Si coincide con min-width 1024px, no estamos en pantalla pequeña (mobile/tablet)
      setIsSmallScreen(!e.matches);
    };

    // Evaluamos el estado inicial
    updateScreenSize(mql);

    // Listener moderno y seguro
    mql.addEventListener("change", updateScreenSize);
    return () => mql.removeEventListener("change", updateScreenSize);
  }, []);

  const handleClick = () => {
    // Si estamos en pantalla chica, cerramos el menú desplegable al hacer clic
    if (isSmallScreen) {
      closeMenu();
    }
  };

  return <div onClick={handleClick}>{children}</div>;
}