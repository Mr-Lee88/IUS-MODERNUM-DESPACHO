"use client";

import { useActionState, useRef, useState } from "react";
import { Lock, Upload, X } from "lucide-react";
import { Error } from "@/components/app/campos";
import { subirDocumento, type EstadoFormulario } from "@/app/(app)/documentos/acciones";

const INICIAL: EstadoFormulario = {};

const campo =
  "h-11 w-full rounded-sm border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--verde-claro)]";
const etiqueta = "block text-xs uppercase tracking-wider text-[var(--muted-foreground)]";

/**
 * Subir un documento al asunto. El archivo va al almacenamiento privado; aquí
 * solo se elige qué es y quién puede verlo.
 */
export function Subir({
  asuntoId,
  tipos,
  esSocio,
  hoy,
}: {
  asuntoId: string;
  tipos: { clave: string; nombre: string }[];
  esSocio: boolean;
  hoy: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const formulario = useRef<HTMLFormElement>(null);

  const [estado, enviar, enviando] = useActionState(
    async (previo: EstadoFormulario, datos: FormData) => {
      const r = await subirDocumento(previo, datos);
      if (!r.error) formulario.current?.reset();
      return r;
    },
    INICIAL,
  );

  if (!abierto) {
    return (
      <div className="border-t border-[var(--border)] px-4 py-3">
        <button
          type="button"
          onClick={() => setAbierto(true)}
          data-toque
          className="flex h-11 items-center gap-2 rounded-sm border border-[var(--border)] px-3 text-sm hover:border-[var(--verde-claro)] md:h-9"
        >
          <Upload className="size-4" aria-hidden />
          Subir documento
        </button>
        {estado.aviso && (
          <p className="mt-2 text-xs text-[var(--cumplido)]">{estado.aviso}</p>
        )}
      </div>
    );
  }

  return (
    <form
      ref={formulario}
      action={enviar}
      className="border-t border-[var(--border)] p-4"
    >
      <input type="hidden" name="asunto_id" value={asuntoId} />

      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[13px] text-[var(--verde)]">Subir documento</h3>
        <button
          type="button"
          onClick={() => setAbierto(false)}
          aria-label="Cerrar"
          className="flex size-8 items-center justify-center text-[var(--muted-foreground)]"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <label htmlFor="archivo" className={etiqueta}>Archivo *</label>
          <input
            id="archivo"
            name="archivo"
            type="file"
            required
            accept=".pdf,.jpg,.jpeg,.png,.webp,.tif,.tiff,.doc,.docx,.xls,.xlsx"
            className="w-full rounded-sm border border-[var(--border)] bg-white p-2 text-sm file:mr-3 file:rounded-sm file:border-0 file:bg-[var(--verde)] file:px-3 file:py-1.5 file:text-sm file:text-white"
          />
          <p className="text-xs text-[var(--muted-foreground)]">
            PDF, imagen, Word o Excel. Hasta 25 MB.
          </p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="tipo_documental" className={etiqueta}>Tipo *</label>
          <select id="tipo_documental" name="tipo_documental" required defaultValue="escrito" className={campo}>
            {tipos.map((t) => (
              <option key={t.clave} value={t.clave}>{t.nombre}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="fecha_documento" className={etiqueta}>Fecha del documento</label>
          <input id="fecha_documento" name="fecha_documento" type="date" defaultValue={hoy} className={campo} />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <label htmlFor="nivel_acceso" className={etiqueta}>Quién puede verlo *</label>
          <select id="nivel_acceso" name="nivel_acceso" required defaultValue="equipo" className={campo}>
            {esSocio && <option value="socio">Solo el socio</option>}
            <option value="equipo">El despacho</option>
            <option value="cliente">También el cliente, en su portal</option>
          </select>
          <p className="flex items-start gap-1.5 text-xs text-[var(--muted-foreground)]">
            <Lock className="mt-0.5 size-3 shrink-0" aria-hidden />
            El archivo se guarda en almacenamiento privado. Cada descarga usa un
            enlace que caduca a los dos minutos.
          </p>
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <label htmlFor="descripcion" className={etiqueta}>Descripción</label>
          <input id="descripcion" name="descripcion" maxLength={200} className={campo} />
        </div>
      </div>

      <div className="mt-3">
        <Error mensaje={estado.error} />
        {estado.aviso && !estado.error && (
          <p className="text-sm text-[var(--cumplido)]">{estado.aviso}</p>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          disabled={enviando}
          className="h-11 rounded-sm bg-[var(--verde)] px-5 text-sm font-medium text-white hover:bg-[var(--verde-claro)] disabled:opacity-60 md:h-9"
        >
          {enviando ? "Subiendo…" : "Subir"}
        </button>
        <button
          type="button"
          onClick={() => setAbierto(false)}
          className="h-11 rounded-sm border border-[var(--border)] px-5 text-sm hover:border-[var(--verde-claro)] md:h-9"
        >
          Cerrar
        </button>
      </div>
    </form>
  );
}
