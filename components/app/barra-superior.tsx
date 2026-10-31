"use client";

import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Buscador } from "./buscador";

export function BarraSuperior() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-[var(--border)] bg-[var(--marfil)]/95 px-4 backdrop-blur md:px-6">
      {/* Marca, solo en teléfono: ahí no hay barra lateral */}
      <Link href="/" className="flex items-center md:hidden" aria-label="IUS MODERNUM, ir al inicio">
        <span className="flex items-center rounded-sm bg-[var(--verde)] px-2 py-1.5">
          <Image src="/logo.png" alt="IUS MODERNUM" width={800} height={166} priority sizes="120px" className="h-5 w-auto" />
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
