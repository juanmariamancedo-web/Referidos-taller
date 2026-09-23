"use client";

import { useState } from "react"
import DarkMode from "../icons/DarkMode"
import LightMode from "../icons/lightMode"

type Theme = "light" | "dark"

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; SameSite=Lax`
}

interface ButtonOfDarkModeProps {
  isDark: boolean
}

export default function ButtonOfDarkMode({ isDark }: ButtonOfDarkModeProps) {
  // El script inline del layout ya aplicó la clase "dark" a <html> antes del paint,
  // así que acá solo reflejamos ese estado inicial (calculado en el server) sin lógica extra.
  const [theme, setTheme] = useState<Theme>(isDark ? "dark" : "light")

  function toggleTheme() {
    const newTheme: Theme = theme === "dark" ? "light" : "dark"
    setTheme(newTheme)
    document.body.classList.toggle("dark", newTheme === "dark")
    setCookie("theme", newTheme)
  }

  return (
    <span
      onClick={toggleTheme}
      className="flex justify-center items-center cursor-pointer"
    >
      {theme === "dark"
        ? <LightMode className="dark:text-white" />
        : <DarkMode className="dark:text-white" />
      }
    </span>
  )
}