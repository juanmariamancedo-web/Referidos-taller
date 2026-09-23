"use client";

import { logoutAction } from "@/app/actions/auth";
import Logout from "../icons/LogoutIcon";

export default function LogoutButton() {
  return (
    <button
      onClick={async () => {
        await logoutAction();
      }}
      className="flex items-center gap-2"
    >
      <Logout className="" />
    </button>
  );
}