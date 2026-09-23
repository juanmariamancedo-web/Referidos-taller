import ButtonOfDarkMode from "./ButtonOfDarkMode";
import SwitchOpen from "./SwitchOpen";
import Home from "@/app/components/icons/HomeIcon";
import Link from "next/link";
import { Page } from "@/lib/types/page";
import { getUserAuth, logoutAction } from "@/app/actions/auth";
import ProfileIcon from "../icons/ProfileIcon";
import { HeaderInteractive } from "./HeaderInteractive";
import Logout from "../icons/LogoutIcon";
import { redirect } from "next/navigation";
import LogoutButton from "./LogoutButton";

interface HeaderProps {
  pages: Page[];
  homeUrl: string;
  isDark: boolean;
}

export async function Header({ pages, homeUrl, isDark }: HeaderProps) {
  const {success} = await getUserAuth();

  if (!success) return null

  return (
    <HeaderInteractive>
      <div className="absolute inset-0 flex justify-center items-center lg:h-14 p-3">
        <ul className="flex flex-col lg:flex-row items-center justify-between gap-5 container lg:border lg:border-black/10 dark:lg:border-white/15 rounded-full px-4 py-1.5 lg:bg-white/70 lg:dark:bg-neutral-900/70 lg:backdrop-blur-md shadow-sm dark:shadow-none text-gray-800 dark:text-white flex-grow-0">
          
          {/* Inicio / Home */}
          <li className="hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition p-1.5 flex justify-center items-center">
            <Link
              className="flex justify-center items-center cursor-pointer"
              href={homeUrl}
            >
              <Home className="w-5 h-5" />
            </Link>
          </li>

          {/* Rutas / Páginas */}
          <div className="flex flex-col lg:flex-row items-center justify-center gap-2 lg:gap-4 font-medium text-sm">
            {pages.length > 0 &&
              pages.map((page, index) => (
                <li key={index}>
                  <Link
                    className="hover:bg-black/5 dark:hover:bg-white/10 px-3 py-1 rounded-full transition block"
                    href={page.href}
                  >
                    {page.name}
                  </Link>
                </li>
              ))}
          </div>

          {/* Controles del Header */}
          <div className="flex flex-col lg:flex-row items-center justify-center gap-3">
            <div className="flex flex-row items-center justify-center gap-3">
              <li className="hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition flex justify-center items-center p-1 gap-2">
                <ButtonOfDarkMode isDark={isDark} />
              </li>
              <li>
                <Link href="/profile">
                  <ProfileIcon />
                </Link>
              </li>
              <LogoutButton />
            </div>
          </div>

        </ul>
      </div>
    </HeaderInteractive>
  );
}