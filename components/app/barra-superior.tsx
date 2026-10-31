"use client";

import Link from "next/link";
import { Gavel, Plus } from "lucide-react";
import { Buscador } from "./buscador";

export function BarraSuperior() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-[var(--border)] bg-[var(--marfil)]/95 px-4 backdrop-blur md:px-6">
      {/* Marca, solo en teléfono: ahí no hay barra lateral */}
      <Link href="/" className="flex items-center gap-2 md:hidden">
        <span className="flex size-9 items-center justify-center bg-[var(--verde)] text-[var(--dorado)]">
          <Gavel className="size-4" aria-hidden />
        </span>
        <span className="font-[family-name:var(--font-serif)] text-sm tracking-[0.06em] text-[var(--verde)]">
          IUS MODERNUM
        </span>
      </Link>

      <div className="ml-auto flex flex-1 items-center justify-end gap-3 md:ml-0 md:justify-start">
        <Buscador />
      </div>

      <Link
        href="/asuntos/nuevo"
        data-toque
        className="flex h-11 items-center gap-2 rounded-sm bg-[var(--verde)] px-3 text-sm font-medium text-white hover:bg-[var(--verde-claro)] md:h-9"
      >
        <Plus className="size-4" aria-hidden />
        <span className="hidden sm:inline">Nuevo asunto</span>
      </Link>
    </header>
  );
}
