import { Pendiente } from "@/components/app/pendiente";

export const metadata = { title: "Configuración" };

export default function Pagina() {
  return (
    <Pendiente
      titulo="Configuración"
      paso="Paso 4 de la fase 1"
      descripcion="Usuarios y roles, catálogos de materias y procedimientos, marcos normativos con su vigencia, y calendarios de días inhábiles federales y locales de Campeche."
    />
  );
}
