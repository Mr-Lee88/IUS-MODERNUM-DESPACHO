import { Pendiente } from "@/components/app/pendiente";

export const metadata = { title: "Reportes y control" };

export default function Pagina() {
  return (
    <Pendiente
      titulo="Reportes y control"
      paso="Fase 3"
      descripcion="Asuntos por materia, carga de trabajo por responsable, próximos vencimientos, estado de poderes y conflictos de intereses. Los reportes salen en PDF."
    />
  );
}
