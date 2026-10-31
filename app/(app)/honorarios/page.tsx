import { Pendiente } from "@/components/app/pendiente";

export const metadata = { title: "Honorarios" };

export default function Pagina() {
  return (
    <Pendiente
      titulo="Honorarios"
      paso="Fase 3"
      descripcion="Presupuesto, honorarios pactados, anticipos, pagos, gastos y registro de facturas emitidas por el contador. Visible solo para el socio, tanto en la pantalla como en la base de datos."
    />
  );
}
