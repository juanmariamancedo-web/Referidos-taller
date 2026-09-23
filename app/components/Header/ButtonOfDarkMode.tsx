"use client";

import { useEffect, useState } from "react"
import DarkMode from "../icons/DarkMode"
import LightMode from "../icons/lightMode"

type Theme = "light" | "dark"

function getCookie(name: string): string | null {
  const cookies = document.cookie.split("; ")

  for (const cookie of cookies) {
    const [key, value] = cookie.split("=")
    if (key === name) return decodeURIComponent(value)
  }

  return null
}

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; SameSite=Lax`
}

function applyTheme(theme: Theme) {
  if (theme === "dark") {
    document.documentElement.classList.add("dark")
  } else {
    document.documentElement.classList.remove("dark")
  }
}

export default function ButtonOfDarkMode() {
  // 1. Iniciamos siempre con un valor por defecto idéntico para Servidor y Cliente
  const [theme, setTheme] = useState<Theme>("light")
  const [mounted, setMounted] = useState(false) // 👈 Flag para evitar desajustes en el primer renderizado

  // 2. Este efecto se ejecuta SOLO en el navegador, después del montaje inicial
  useEffect(() => {
    setMounted(true)

    const cookieTheme = getCookie("theme")

    if (cookieTheme === "dark" || cookieTheme === "light") {
      setTheme(cookieTheme)
      applyTheme(cookieTheme)
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark")
      applyTheme("dark")
    }
  }, [])

  // 3. Este efecto se encarga de aplicar cambios si el estado del tema muta en caliente
  useEffect(() => {
    if (mounted) {
      applyTheme(theme)
    }
  }, [theme, mounted])

  function changeThemeMode() {
    const newTheme: Theme = theme === "dark" ? "light" : "dark"
    setTheme(newTheme)
    applyTheme(newTheme)
    setCookie("theme", newTheme)
  }

  // 4. Clave de hidratación: Mientras no esté montado, mostramos un espacio o esqueleto vacío
  // Esto garantiza un renderizado inicial del servidor 100% idéntico al del cliente.
  if (!mounted) {
    return <span className="w-6 h-6 inline-block" /> // Ajustá el tamaño según tus iconos
  }

  return (
    <span
      onClick={changeThemeMode}
      className="flex justify-center items-center cursor-pointer"
    >
      {theme === "dark"
        ? <LightMode className="dark:text-white" />
        : <DarkMode className="dark:text-white" />
      }
    </span>
  )
}