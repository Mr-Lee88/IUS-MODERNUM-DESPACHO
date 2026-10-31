"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen, CalendarClock, FileText, FolderOpen, Gavel, LayoutList,
  LogOut, Receipt, Settings, UserRound, Users,
} from "lucide-react";
import { cn } from "cn";
import { iniciales, type Perfil } from "@/lib/perfil";
import { cerrarSesion } from "@/app/auth/acciones";

/** §3: menú lateral permanente en escritorio. En teléfono se usa la barra inferior. */
const ENLACES = [
  { href: "/", etiqueta: "Asuntos del día", icono: LayoutList },
  { href: "/asuntos", etiqueta: "Asuntos", icono: FolderOpen },
  { href: "/clientes", etiqueta: "Clientes", icono: Users },
  { href: "/agenda", etiqueta: "Agenda y términos", icono: CalendarClock },
  { href: "/documentos", etiqueta: "Documentos", icono: FileText },
  { href: "/honorarios", etiqueta: "Honorarios", icono: Receipt, soloSocio: true },
  { href: "/reportes", etiqueta: "Reportes", icono: Gavel },
];

export function BarraLateral({
  perfil,
  hayIlustracion,
}: {
  perfil: Perfil;
  hayIlustracion?: boolean;
}) {
  const ruta = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-[var(--verde)] text-white md:flex">
      {/* El logo no llega a los bordes: lleva aire a los lados y abajo. */}
      <Link href="/" className="block px-6 pb-4 pt-6" aria-label="IUS MODERNUM, ir al inicio">
        <Image
          src="/logo.png"
          alt="IUS MODERNUM Abogados"
          width={800}
          height={166}
          priority
          sizes="220px"
          className="h-auto w-[85%]"
        />
      </Link>

      <div className="filete-dorado mx-6 opacity-40" />

      <nav className="mt-4 space-y-0.5 px-3" aria-label="Navegación principal">
        {ENLACES.filter((e) => !e.soloSocio || perfil.rol === "socio").map(({ href, etiqueta, icono: Icono }) => {
          const activo = href === "/" ? ruta === "/" : ruta.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={activo ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm transition-colors",
                "hover:bg-[var(--verde-claro)]",
                activo && "bg-[var(--verde-claro)] font-medium",
              )}
            >
              <Icono className="size-4 shrink-0" aria-hidden />
              <span>{etiqueta}</span>
              {activo && <span className="ml-auto h-4 w-0.5 bg-[var(--dorado)]" aria-hidden />}
            </Link>
          );
        })}
      </nav>

      {/*
        El hueco entre el menú y el pie. La ilustración se asienta abajo, ocupa
        solo una parte de ese espacio y se funde con el verde por arriba: es un
        fondo, no una fotografía que compita con el menú. Si el archivo no está,
        solo se ve el verde.
      */}
      <div className="relative min-h-10 flex-1 overflow-hidden" aria-hidden>
        {hayIlustracion && (
          <div
            className="absolute inset-x-0 bottom-0 h-[58%] bg-cover bg-bottom bg-no-repeat opacity-40"
            style={{
              backgroundImage: "url(/ilustracion.webp)",
              maskImage: "linear-gradient(to bottom, transparent, black 60%)",
              WebkitMaskImage: "linear-gradient(to bottom, transparent, black 60%)",
            }}
          />
        )}
      </div>

      <div className="relative border-t border-white/10 bg-[var(--verde)] p-3">
        <div className="flex items-center gap-3 px-2 py-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-[var(--verde-claro)] text-xs font-medium">
            {perfil.iniciales ?? iniciales(perfil.nombre)}
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-sm">{perfil.nombre}</span>
            <span className="block text-[10px] uppercase tracking-wider text-[var(--dorado)]">
              {perfil.rol}
            </span>
          </span>
        </div>
        <div className="mt-1 space-y-0.5">
          <Link href="/manual" className="flex items-center gap-3 rounded-sm px-3 py-2 text-xs text-white/70 hover:bg-[var(--verde-claro)] hover:text-white">
            <BookOpen className="size-3.5" aria-hidden />
            Manual de uso
          </Link>
          <Link href="/ajustes" className="flex items-center gap-3 rounded-sm px-3 py-2 text-xs text-white/70 hover:bg-[var(--verde-claro)] hover:text-white">
            <Settings className="size-3.5" aria-hidden />
            Configuración
          </Link>
          {/* Un formulario, no un enlace: Next precarga los enlaces visibles y
              el menú está siempre visible. Con un GET, el navegador cerraba la
              sesión él solo. Ver app/auth/acciones.ts. */}
          <form action={cerrarSesion}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-sm px-3 py-2 text-left text-xs text-white/70 hover:bg-[var(--verde-claro)] hover:text-white"
            >
              <LogOut className="size-3.5" aria-hidden />
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}

/** Barra inferior de teléfono: solo las cuatro acciones que el prompt llama prioritarias. */
export function NavegacionMovil() {
  const ruta = usePathname();
  const items = [
    { href: "/", etiqueta: "Hoy", icono: LayoutList },
    { href: "/asuntos", etiqueta: "Asuntos", icono: FolderOpen },
    { href: "/agenda", etiqueta: "Agenda", icono: CalendarClock },
    { href: "/clientes", etiqueta: "Clientes", icono: UserRound },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-[var(--border)] bg-white md:hidden"
      aria-label="Navegación"
    >
      {items.map(({ href, etiqueta, icono: Icono }) => {
        const activo = href === "/" ? ruta === "/" : ruta.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={activo ? "page" : undefined}
            className={cn(
              "flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 text-[11px]",
              activo ? "text-[var(--verde)]" : "text-[var(--muted-foreground)]",
            )}
          >
            <Icono className="size-5" aria-hidden />
            {etiqueta}
          </Link>
        );
      })}
    </nav>
  );
}
