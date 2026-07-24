import Link from "next/link";
import React from "react";
import { LogoutButton } from "@/components/ui/LogoutButton";

const Menu = () => {
  return (
    <>
      <header className="fixed top-0 z-50 w-full neu-surface border-b border-white/10">
        <div className="flex items-center justify-between px-6 py-4 h-16">
          <Link href="/" className="no-underline">
            <span className="text-xl font-black bg-gradient-to-r from-[#22d3ee] to-[#2dd4bf] bg-clip-text text-transparent">
              Calculadora Nutricional
            </span>
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/creator"
              className="flex items-center gap-2 px-4 py-2 text-white/70 font-semibold hover:text-tertiary transition"
            >
              <span className="text-lg">✏️</span>
              Crear Plan
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>
      <div className="h-16" />
    </>
  );
};

export default Menu;
