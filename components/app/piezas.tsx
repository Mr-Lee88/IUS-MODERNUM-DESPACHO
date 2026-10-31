import Link from "next/link";
import { AlertTriangle, CalendarClock, CheckCircle2, HelpCircle } from "lucide-react";
import { cn } from "cn";
import type { EstadoTermino } from "@/lib/maqueta";

/** Encabezado de sección: título institucional en mayúsculas más una acción a la derecha. */
export function Seccion({
  titulo,
  nota,
  accion,
  children,
}: {
  titulo: string;
  nota?: string;
  accion?: { href: string; texto: string };
  children: React.ReactNode;
}) {
  return (
    <section className="border border-[var(--border)] bg-white">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-[var(--border)] px-4 py-3">
        <h2 className="text-[13px] text-[var(--verde)]">{titulo}</h2>
        {nota && <p className="text-xs text-[var(--muted-foreground)]">{nota}</p>}
        {accion && (
          <Link
            href={accion.href}
            className="ml-auto text-xs font-medium text-[var(--dorado-tinta)] underline-offset-4 hover:underline"
          >
            {accion.texto}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

/** Indicador del encabezado del panel. */
export function Indicador({
  etiqueta,
  valor,
  pie,
}: {
  etiqueta: string;
  valor: string;
  pie: string;
}) {
  return (
    <div className="filete-dorado border border-[var(--border)] bg-white px-3 py-2.5 md:px-4 md:py-3">
      <p className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)] md:text-[11px]">{etiqueta}</p>
      <p className="mt-1 font-[family-name:var(--font-serif)] text-xl text-[var(--verde)] md:text-2xl">{valor}</p>
      <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)] md:text-xs">{pie}</p>
    </div>
  );
}

const ESTADOS: Record<EstadoTermino, { texto: string; icono: typeof AlertTriangle; color: string }> = {
  vence_hoy: { texto: "Vence hoy", icono: AlertTriangle, color: "var(--vence-hoy)" },
  proximo: { texto: "Próximo", icono: CalendarClock, color: "var(--proximo)" },
  cumplido: { texto: "Cumplido", icono: CheckCircle2, color: "var(--cumplido)" },
  por_verificar: { texto: "Por verificar", icono: HelpCircle, color: "var(--por-verificar)" },
};

/**
 * §3: el estado se comunica con texto e icono, no solo con color. Quien no
 * distingue los colores tiene que poder leerlo igual.
 */
export function ChipEstado({ estado, className }: { estado: EstadoTermino; className?: string }) {
  const { texto, icono: Icono, color } = ESTADOS[estado];
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 text-xs font-medium", className)}
      style={{ color }}
    >
      <Icono className="size-3.5 shrink-0" aria-hidden />
      {texto}
    </span>
  );
}

/** Aviso de que un dato jurídico no está verificado (§4 y §8). */
export function AvisoPorVerificar() {
  return (
    <span className="inline-flex items-center gap-1 border border-[var(--por-verificar)]/40 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-[var(--por-verificar)]">
      <HelpCircle className="size-3" aria-hidden />
      Sin verificar
    </span>
  );
}
