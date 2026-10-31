import { Pendiente } from "@/components/app/pendiente";

export const metadata = { title: "Nuevo asunto" };

export default function Pagina() {
  return (
    <Pendiente
      titulo="Nuevo asunto"
      paso="Paso 6 de la fase 1"
      descripcion="Alta del asunto: cliente, partes con su carácter procesal, materia, procedimiento, órgano, fuero y etapa. El procedimiento se elige de catálogo porque de él depende el marco normativo."
    />
  );
}
