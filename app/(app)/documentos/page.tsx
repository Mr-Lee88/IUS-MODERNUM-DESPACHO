import { Pendiente } from "@/components/app/pendiente";

export const metadata = { title: "Documentos" };

export default function Pagina() {
  return (
    <Pendiente
      titulo="Documentos"
      paso="Paso 8 de la fase 1"
      descripcion="Bandeja de documentos pendientes de revisión, subida al almacenamiento privado y nivel de acceso por documento: socio, equipo o cliente."
    />
  );
}
