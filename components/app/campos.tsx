"use client";

import { AlertTriangle } from "lucide-react";

/**
 * Campos de formulario para la captura a mano (§7 bis).
 *
 * Alto de 44 px: el prompt exige que ninguna zona táctil baje de eso, porque
 * estos formularios también se llenan desde el teléfono.
 */

const BASE =
  "h-11 w-full rounded-sm border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--verde-claro)] disabled:bg-[var(--muted)]";

export function Campo({
  nombre,
  etiqueta,
  obligatorio,
  tipo = "text",
  ayuda,
  valor,
  ...resto
}: {
  nombre: string;
  etiqueta: string;
  obligatorio?: boolean;
  tipo?: string;
  ayuda?: string;
  valor?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={nombre} className="block text-xs uppercase tracking-wider text-[var(--muted-foreground)]">
        {etiqueta}
        {obligatorio && <span className="ml-1 text-[var(--vence-hoy)]" aria-hidden>*</span>}
      </label>
      <input
        id={nombre}
        name={nombre}
        type={tipo}
        required={obligatorio}
        defaultValue={valor}
        className={BASE}
        {...resto}
      />
      {ayuda && <p className="text-xs text-[var(--muted-foreground)]">{ayuda}</p>}
    </div>
  );
}

export function Lista({
  nombre,
  etiqueta,
  opciones,
  obligatorio,
  valor,
  ayuda,
  vacio = "Elija una opción",
  ...resto
}: {
  nombre: string;
  etiqueta: string;
  opciones: { clave: string; nombre: string }[];
  obligatorio?: boolean;
  valor?: string;
  ayuda?: string;
  vacio?: string;
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={nombre} className="block text-xs uppercase tracking-wider text-[var(--muted-foreground)]">
        {etiqueta}
        {obligatorio && <span className="ml-1 text-[var(--vence-hoy)]" aria-hidden>*</span>}
      </label>
      <select id={nombre} name={nombre} required={obligatorio} defaultValue={valor ?? ""} className={BASE} {...resto}>
        <option value="">{vacio}</option>
        {opciones.map((o) => (
          <option key={o.clave} value={o.clave}>{o.nombre}</option>
        ))}
      </select>
      {ayuda && <p className="text-xs text-[var(--muted-foreground)]">{ayuda}</p>}
    </div>
  );
}

export function Texto({
  nombre,
  etiqueta,
  filas = 3,
  obligatorio,
  valor,
  ayuda,
}: {
  nombre: string;
  etiqueta: string;
  filas?: number;
  obligatorio?: boolean;
  valor?: string;
  ayuda?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={nombre} className="block text-xs uppercase tracking-wider text-[var(--muted-foreground)]">
        {etiqueta}
        {obligatorio && <span className="ml-1 text-[var(--vence-hoy)]" aria-hidden>*</span>}
      </label>
      <textarea
        id={nombre}
        name={nombre}
        rows={filas}
        required={obligatorio}
        defaultValue={valor}
        className="w-full rounded-sm border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--verde-claro)]"
      />
      {ayuda && <p className="text-xs text-[var(--muted-foreground)]">{ayuda}</p>}
    </div>
  );
}

export function Error({ mensaje }: { mensaje?: string }) {
  if (!mensaje) return null;
  return (
    <p role="alert" className="flex items-start gap-2 border border-[var(--vence-hoy)]/40 px-3 py-2 text-sm text-[var(--vence-hoy)]">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
      {mensaje}
    </p>
  );
}

export function Botones({ enviando, texto }: { enviando: boolean; texto: string }) {
  return (
    <div className="flex flex-wrap gap-2 pt-2">
      <button
        type="submit"
        disabled={enviando}
        className="h-11 rounded-sm bg-[var(--verde)] px-5 text-sm font-medium text-white hover:bg-[var(--verde-claro)] disabled:opacity-60"
      >
        {enviando ? "Guardando…" : texto}
      </button>
      <button
        type="reset"
        className="h-11 rounded-sm border border-[var(--border)] bg-white px-5 text-sm hover:border-[var(--verde-claro)]"
      >
        Limpiar
      </button>
    </div>
  );
}

export function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <fieldset className="border border-[var(--border)] bg-white">
      <legend className="ml-4 px-2 text-[11px] uppercase tracking-wider text-[var(--verde)]">
        {titulo}
      </legend>
      <div className="grid gap-4 p-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}
