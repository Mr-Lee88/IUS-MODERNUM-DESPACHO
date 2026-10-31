"use client";

import { useActionState } from "react";
import { AlertTriangle } from "lucide-react";
import { crearPrimerUsuario, ingresar, type EstadoFormulario } from "../acciones";

const INICIAL: EstadoFormulario = {};

const campo =
  "h-11 w-full rounded-sm border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--verde-claro)]";
const etiqueta = "block text-xs uppercase tracking-wider text-[var(--muted-foreground)]";

export function FormularioIngreso({ primerUso }: { primerUso: boolean }) {
  const accion = primerUso ? crearPrimerUsuario : ingresar;
  const [estado, enviar, enviando] = useActionState(accion, INICIAL);

  return (
    <form action={enviar} className="space-y-4">
      {primerUso && (
        <p className="border border-[var(--dorado)] bg-[var(--marfil)] px-3 py-2 text-xs">
          Es la primera cuenta del despacho: quedará registrada como <strong>socio</strong>,
          con acceso a todo. Las demás cuentas las crea usted después.
        </p>
      )}

      {primerUso && (
        <div className="space-y-1.5">
          <label htmlFor="nombre" className={etiqueta}>Nombre completo</label>
          <input id="nombre" name="nombre" required autoComplete="name" className={campo} />
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="correo" className={etiqueta}>Correo</label>
        <input
          id="correo" name="correo" type="email" required
          autoComplete="email" inputMode="email" className={campo}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="contrasena" className={etiqueta}>Contraseña</label>
        <input
          id="contrasena" name="contrasena" type="password" required
          autoComplete={primerUso ? "new-password" : "current-password"}
          minLength={primerUso ? 8 : undefined}
          className={campo}
        />
        {primerUso && (
          <p className="text-xs text-[var(--muted-foreground)]">Al menos 8 caracteres.</p>
        )}
      </div>

      {estado.error && (
        <p role="alert" className="flex items-start gap-2 border border-[var(--vence-hoy)]/40 px-3 py-2 text-sm text-[var(--vence-hoy)]">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {estado.error}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="h-11 w-full rounded-sm bg-[var(--verde)] text-sm font-medium text-white hover:bg-[var(--verde-claro)] disabled:opacity-60"
      >
        {enviando ? "Un momento…" : primerUso ? "Crear la cuenta del socio" : "Entrar"}
      </button>
    </form>
  );
}
