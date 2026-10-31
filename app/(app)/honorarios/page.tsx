import Link from "next/link";
import { Download, Lock, Receipt } from "lucide-react";
import { Indicador, Seccion } from "@/components/app/piezas";
import { requerirSocio } from "@/lib/sesion";
import { uno } from "@/lib/supabase/relaciones";
import { crearClienteServidor } from "@/lib/supabase/server";

export const metadata = { title: "Honorarios" };

const PESOS = new Intl.NumberFormat("es-MX", {
  style: "currency", currency: "MXN", maximumFractionDigits: 2,
});

export default async function PaginaHonorarios() {
  // La pantalla es del socio. En la base también: las tablas de dinero solo
  // tienen política para él, así que un abogado no obtiene filas ni por la API.
  await requerirSocio();

  const supabase = await crearClienteServidor();

  const [{ data: asuntos }, { data: honorarios }, { data: pagos }, { data: gastos }, { data: facturas }] =
    await Promise.all([
      supabase.from("asunto")
        .select("id, nombre, numero_expediente, anio, materia:materia_clave (nombre), partes:parte (nombre, es_nuestro_cliente)")
        .is("archivado_en", null),
      supabase.from("honorario").select("asunto_id, concepto, tipo, importe, fecha, notas")
        .is("archivado_en", null).eq("estado", "vigente"),
      supabase.from("pago").select("asunto_id, concepto, importe, fecha, forma_pago, referencia")
        .is("archivado_en", null),
      supabase.from("gasto").select("asunto_id, concepto, importe, fecha, reembolsable, reembolsado")
        .is("archivado_en", null),
      supabase.from("factura").select("id, folio, folio_fiscal, fecha, total, estado, asunto_id, cliente:cliente_id (nombre_o_razon_social)")
        .is("archivado_en", null).order("fecha", { ascending: false }),
    ]);

  const suma = (xs: { importe: number | string }[]) =>
    xs.reduce((t, x) => t + Number(x.importe), 0);

  const porAsunto = (asuntos ?? []).map((a) => {
    const h = (honorarios ?? []).filter((x) => x.asunto_id === a.id);
    const devengado = suma(h.filter((x) => x.tipo === "devengado"));
    const pactado = suma(h.filter((x) => x.tipo === "pactado" || x.tipo === "presupuesto"));
    const cobrado = suma((pagos ?? []).filter((x) => x.asunto_id === a.id));
    const gastado = suma((gastos ?? []).filter((x) => x.asunto_id === a.id));
    const porReembolsar = suma(
      (gastos ?? []).filter((x) => x.asunto_id === a.id && x.reembolsable && !x.reembolsado));
    return {
      id: a.id,
      nombre: a.nombre,
      expediente: a.numero_expediente ? `${a.numero_expediente}/${a.anio ?? ""}` : null,
      materia: uno(a.materia)?.nombre ?? "",
      cliente: a.partes?.find((p) => p.es_nuestro_cliente)?.nombre ?? "—",
      pactado, devengado, cobrado, gastado, porReembolsar,
      saldo: devengado - cobrado,
    };
  }).filter((a) => a.pactado || a.devengado || a.cobrado || a.gastado);

  const totalDevengado = porAsunto.reduce((t, a) => t + a.devengado, 0);
  const totalCobrado = porAsunto.reduce((t, a) => t + a.cobrado, 0);
  const totalGastos = porAsunto.reduce((t, a) => t + a.gastado, 0);
  const totalSaldo = totalDevengado - totalCobrado;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-baseline gap-x-3">
        <h1 className="text-xl text-[var(--verde)]">Honorarios</h1>
        <p className="inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)]">
          <Lock className="size-3.5" aria-hidden />
          Solo usted ve esta pantalla
        </p>
      </div>

      {porAsunto.length === 0 ? (
        <div className="filete-dorado border border-[var(--border)] bg-white p-8 text-center">
          <Receipt className="mx-auto size-8 text-[var(--dorado-tinta)]" aria-hidden />
          <p className="mt-3 text-sm">Todavía no hay honorarios registrados.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <Indicador etiqueta="Devengado" valor={PESOS.format(totalDevengado)} pie="Trabajo realizado" />
            <Indicador etiqueta="Cobrado" valor={PESOS.format(totalCobrado)} pie="Pagos recibidos" />
            <Indicador etiqueta="Por cobrar" valor={PESOS.format(totalSaldo)} pie="Devengado menos cobrado" />
            <Indicador etiqueta="Gastos" valor={PESOS.format(totalGastos)} pie="Del despacho, por asunto" />
          </div>

          <Seccion titulo="Por asunto" nota="El saldo es lo devengado menos lo cobrado; los gastos van aparte">
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-left text-[11px] uppercase tracking-wider text-[var(--muted-foreground)]">
                    <th scope="col" className="px-4 py-2 font-medium">Asunto</th>
                    <th scope="col" className="px-4 py-2 text-right font-medium">Pactado</th>
                    <th scope="col" className="px-4 py-2 text-right font-medium">Devengado</th>
                    <th scope="col" className="px-4 py-2 text-right font-medium">Cobrado</th>
                    <th scope="col" className="px-4 py-2 text-right font-medium">Saldo</th>
                    <th scope="col" className="px-4 py-2 text-right font-medium">Gastos</th>
                    <th scope="col" className="px-4 py-2 font-medium">Estado de cuenta</th>
                  </tr>
                </thead>
                <tbody>
                  {porAsunto.map((a) => (
                    <tr key={a.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--muted)]/60">
                      <td className="px-4 py-3">
                        <Link href={`/asuntos/${a.id}?t=honorarios`} className="font-medium text-[var(--verde)] underline-offset-2 hover:underline">
                          {a.nombre}
                        </Link>
                        <span className="mt-0.5 block text-xs text-[var(--muted-foreground)]">
                          {a.cliente} · {a.materia}{a.expediente && ` · ${a.expediente}`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">{PESOS.format(a.pactado)}</td>
                      <td className="px-4 py-3 text-right">{PESOS.format(a.devengado)}</td>
                      <td className="px-4 py-3 text-right">{PESOS.format(a.cobrado)}</td>
                      <td className="px-4 py-3 text-right font-medium" style={{ color: a.saldo > 0 ? "var(--dorado-tinta)" : "var(--cumplido)" }}>
                        {PESOS.format(a.saldo)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {PESOS.format(a.gastado)}
                        {a.porReembolsar > 0 && (
                          <span className="mt-0.5 block text-[10px] text-[var(--proximo)]">
                            {PESOS.format(a.porReembolsar)} por reembolsar
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={`/estado-de-cuenta/${a.id}`}
                          target="_blank"
                          rel="noopener"
                          className="inline-flex items-center gap-1.5 rounded-sm border border-[var(--border)] px-2.5 py-1.5 text-xs hover:border-[var(--verde-claro)]"
                        >
                          <Download className="size-3.5" aria-hidden />
                          PDF
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-[var(--border)] md:hidden">
              {porAsunto.map((a) => (
                <li key={a.id} className="px-4 py-3">
                  <Link href={`/asuntos/${a.id}?t=honorarios`} className="font-medium text-[var(--verde)]">
                    {a.nombre}
                  </Link>
                  <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{a.cliente}</p>
                  <p className="mt-1 text-sm">
                    Saldo <strong style={{ color: a.saldo > 0 ? "var(--dorado-tinta)" : "var(--cumplido)" }}>
                      {PESOS.format(a.saldo)}
                    </strong>
                    <span className="text-[var(--muted-foreground)]"> · cobrado {PESOS.format(a.cobrado)}</span>
                  </p>
                  <a href={`/estado-de-cuenta/${a.id}`} target="_blank" rel="noopener"
                    className="mt-2 inline-flex h-11 items-center gap-1.5 rounded-sm border border-[var(--border)] px-3 text-xs">
                    <Download className="size-3.5" aria-hidden />
                    Estado de cuenta en PDF
                  </a>
                </li>
              ))}
            </ul>
          </Seccion>

          <Seccion titulo="Facturas registradas" nota="Las emite el contador; aquí solo se guarda el folio y el PDF">
            {!facturas?.length ? (
              <p className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
                Ninguna factura registrada.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-left text-[11px] uppercase tracking-wider text-[var(--muted-foreground)]">
                      <th scope="col" className="px-4 py-2 font-medium">Folio</th>
                      <th scope="col" className="px-4 py-2 font-medium">Cliente</th>
                      <th scope="col" className="px-4 py-2 font-medium">Folio fiscal</th>
                      <th scope="col" className="px-4 py-2 font-medium">Fecha</th>
                      <th scope="col" className="px-4 py-2 text-right font-medium">Total</th>
                      <th scope="col" className="px-4 py-2 font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {facturas.map((f) => (
                      <tr key={f.id} className="border-b border-[var(--border)] last:border-0">
                        <td className="px-4 py-3">{f.folio ?? "—"}</td>
                        <td className="px-4 py-3">{uno(f.cliente)?.nombre_o_razon_social ?? "—"}</td>
                        <td className="px-4 py-3 font-[family-name:var(--font-mono)] text-xs text-[var(--muted-foreground)]">
                          {f.folio_fiscal ?? "—"}
                        </td>
                        <td className="px-4 py-3">{f.fecha}</td>
                        <td className="px-4 py-3 text-right">{PESOS.format(Number(f.total))}</td>
                        <td className="px-4 py-3">{f.estado}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Seccion>
        </>
      )}

      <p className="text-xs text-[var(--muted-foreground)]">
        Devengado, cobrado y gastos se llevan por separado a propósito: mezclarlos es
        la manera más rápida de no saber cuánto se debe. El sistema <strong>no timbra
        CFDI</strong>; solo registra el folio fiscal de lo que emite el contador.
      </p>
    </div>
  );
}
