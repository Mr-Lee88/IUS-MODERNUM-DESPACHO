"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

/**
 * Buscador universal (§2.A). Se abre con Ctrl + K en escritorio y con el botón de
 * lupa en teléfono. Por ahora manda a /buscar?q=; en el paso 9 consultará la
 * función `buscar_todo` de Postgres y mostrará resultados por tipo.
 */
export function Buscador() {
  const [abierto, setAbierto] = useState(false);
  const [consulta, setConsulta] = useState("");
  const campo = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    function atajo(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setAbierto(true);
      }
      if (e.key === "Escape") setAbierto(false);
    }
    window.addEventListener("keydown", atajo);
    return () => window.removeEventListener("keydown", atajo);
  }, []);

  useEffect(() => {
    if (abierto) campo.current?.focus();
  }, [abierto]);

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!consulta.trim()) return;
    setAbierto(false);
    router.push(`/buscar?q=${encodeURIComponent(consulta.trim())}`);
  }

  return (
    <>
      {/* Escritorio: campo visible en la barra superior */}
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="hidden h-9 w-full max-w-md items-center gap-2 rounded-sm border border-[var(--border)] bg-white px-3 text-left text-sm text-[var(--muted-foreground)] hover:border-[var(--verde-claro)] md:flex"
      >
        <Search className="size-4 shrink-0" aria-hidden />
        <span className="flex-1">Buscar cliente, expediente, contraparte, gestión…</span>
        <kbd className="rounded-sm border border-[var(--border)] bg-[var(--muted)] px-1.5 py-0.5 text-[10px] font-medium">
          Ctrl + K
        </kbd>
      </button>

      {/* Teléfono: lupa fija y siempre visible */}
      <button
        type="button"
        onClick={() => setAbierto(true)}
        aria-label="Buscar"
        className="flex size-11 items-center justify-center rounded-sm border border-[var(--border)] bg-white text-[var(--verde)] md:hidden"
      >
        <Search className="size-5" aria-hidden />
      </button>

      {abierto && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[12vh]"
          onClick={() => setAbierto(false)}
          role="presentation"
        >
          <div
            className="w-full max-w-xl border border-[var(--border)] bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={enviar} className="flex items-center gap-2 border-b border-[var(--border)] px-4">
              <Search className="size-4 shrink-0 text-[var(--muted-foreground)]" aria-hidden />
              <input
                ref={campo}
                value={consulta}
                onChange={(e) => setConsulta(e.target.value)}
                placeholder="Número de expediente, cliente, contraparte, órgano, palabras de una gestión…"
                aria-label="Buscar en todo el despacho"
                className="h-14 flex-1 bg-transparent text-sm outline-none"
              />
              <button type="button" onClick={() => setAbierto(false)} aria-label="Cerrar" className="flex size-8 items-center justify-center text-[var(--muted-foreground)]">
                <X className="size-4" aria-hidden />
              </button>
            </form>
            <p className="px-4 py-3 text-xs text-[var(--muted-foreground)]">
              Busca en clientes, asuntos, gestiones y documentos a la vez. Los resultados
              se distinguen por tipo.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
