import { Pendiente } from "@/components/app/pendiente";

export const metadata = { title: "Clientes" };

export default function Pagina() {
  return (
    <Pendiente
      titulo="Clientes"
      paso="Paso 5 de la fase 1"
      descripcion="Lista, alta y detalle del cliente, con sus contactos, sus asuntos y sus documentos de personalidad. Es la primera pantalla que se conecta a la base."
    />
  );
}
