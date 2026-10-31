import { Pendiente } from "@/components/app/pendiente";

export const metadata = { title: "Agenda y términos" };

export default function Pagina() {
  return (
    <Pendiente
      titulo="Agenda y términos"
      paso="Paso de la fase 2"
      descripcion="Vistas día, semana, mes y lista. Aquí vive el cómputo de plazos, que no se construye hasta tener los catálogos normativos y los calendarios de días inhábiles de los dos fueros."
    />
  );
}
