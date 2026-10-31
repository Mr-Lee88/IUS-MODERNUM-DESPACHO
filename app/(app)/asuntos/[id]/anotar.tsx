"use client";

import { useActionState, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { Error } from "@/components/app/campos";
import { registrarGestion, type EstadoFormulario } from "../acciones";

const INICIAL: EstadoFormulario = {};

const campo =
  "h-11 w-full rounded-sm border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--verde-claro)]";
const etiqueta = "block text-xs uppercase tracking-wider text-[var(--muted-foreground)]";

/**
 * Anotar una gestión sin salir del asunto. Es la captura que más se repite:
 * el §7 bis pide que se pueda hacer desde la misma pantalla donde se está.
 */
export function Anotar({
  asuntoId,
  tipos,
  hoy,
}: {
  asuntoId: string;
  tipos: { clave: string; nombre: string; clase: string }[];
  hoy: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const [tipo, setTipo] = useState("acuerdo");
  const formulario = useRef<HTMLFormElement>(null);

  const [estado, enviar, enviando] = useActionState(
    async (previo: EstadoFormulario, datos: FormData) => {
      const r = await registrarGestion(previo, datos);
      if (!r.error) {
        formulario.current?.reset();
        setAbierto(false);
      }
      return r;
    },
    INICIAL,
  );

  const clase = tipos.find((t) => t.clave === tipo)?.clase;
  const esNotaInterna = clase === "nota_interna";

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        data-toque
        className="flex h-11 items-center gap-2 rounded-sm bg-[var(--verde)] px-3 text-sm font-medium text-white hover:bg-[var(--verde-claro)] md:h-9"
      >
        <Plus className="size-4" aria-hidden />
        Registrar gestión
      </button>
    );
  }

  return (
    <form
      ref={formulario}
      action={enviar}
      className="filete-dorado w-full border border-[var(--border)] bg-white p-4"
    >
      <input type="hidden" name="asunto_id" value={asuntoId} />

      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[13px] text-[var(--verde)]">Anotar en la bitácora</h3>
        <button
          type="button"
          onClick={() => setAbierto(false)}
          aria-label="Cerrar"
          className="flex size-8 items-center justify-center text-[var(--muted-foreground)]"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <div className="space-y-1.5">
          <label htmlFor="ocurrio_en" className={etiqueta}>Ocurrió el *</label>
          <input id="ocurrio_en" name="ocurrio_en" type="date" required defaultValue={hoy} className={campo} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="hora" className={etiqueta}>Hora</label>
          <input id="hora" name="hora" type="time" className={campo} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <label htmlFor="tipo" className={etiqueta}>Tipo *</label>
          <select
            id="tipo" name="tipo" required value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className={campo}
          >
            {tipos.map((t) => (
              <option key={t.clave} value={t.clave}>{t.nombre}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5 sm:col-span-4">
          <label htmlFor="titulo" className={etiqueta}>Qué pasó *</label>
          <input
            id="titulo" name="titulo" required maxLength={200}
            placeholder="Se nos emplazó a juicio"
            className={campo}
          />
        </div>

        <div className="space-y-1.5 sm:col-span-4">
          <label htmlFor="descripcion" className={etiqueta}>Detalle</label>
          <textarea
            id="descripcion" name="descripcion" rows={3}
            className="w-full rounded-sm border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--verde-claro)]"
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="publicada_al_cliente"
            disabled={esNotaInterna}
            className="size-4"
          />
          <span className={esNotaInterna ? "text-[var(--muted-foreground)]" : undefined}>
            Visible para el cliente en su portal
          </span>
        </label>
        {esNotaInterna && (
          <span className="text-xs text-[var(--dorado-tinta)]">
            Las notas internas nunca se publican al cliente.
          </span>
        )}
      </div>

      <div className="mt-3">
        <Error mensaje={estado.error} />
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          disabled={enviando}
          className="h-11 rounded-sm bg-[var(--verde)] px-5 text-sm font-medium text-white hover:bg-[var(--verde-claro)] disabled:opacity-60 md:h-9"
        >
          {enviando ? "Anotando…" : "Anotar"}
        </button>
        <button
          type="button"
          onClick={() => setAbierto(false)}
          className="h-11 rounded-sm border border-[var(--border)] px-5 text-sm hover:border-[var(--verde-claro)] md:h-9"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
