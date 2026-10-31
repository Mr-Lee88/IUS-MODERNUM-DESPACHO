"use client";

import { useActionState, useState } from "react";
import { Botones, Campo, Error, Grupo, Lista, Texto } from "@/components/app/campos";
import { AMBITOS, type Catalogos, type Opcion } from "@/lib/catalogos";
import { crearAsunto, type EstadoFormulario } from "../acciones";

const INICIAL: EstadoFormulario = {};

export function FormularioAsunto({
  catalogos,
  clientes,
  clientePreseleccionado,
  hoy,
}: {
  catalogos: Catalogos;
  clientes: Opcion[];
  clientePreseleccionado?: string;
  hoy: string;
}) {
  const [estado, enviar, enviando] = useActionState(crearAsunto, INICIAL);
  const [materia, setMateria] = useState("");

  // El procedimiento depende de la materia: de ahí sale el marco normativo.
  const procedimientos = materia
    ? catalogos.procedimientos.filter((p) => p.materia_clave === materia)
    : [];

  return (
    <form action={enviar} className="space-y-4">
      <Grupo titulo="De qué se trata">
        <div className="sm:col-span-2">
          <Campo
            nombre="nombre"
            etiqueta="Nombre del asunto"
            obligatorio
            ayuda="Cómo lo llaman en el despacho. Por ejemplo: «Rosado Pech vs. Constructora del Golfo»."
          />
        </div>
        <Lista
          nombre="cliente_id"
          etiqueta="Cliente"
          opciones={clientes}
          valor={clientePreseleccionado}
          obligatorio
          vacio={clientes.length ? "Elija el cliente" : "Primero dé de alta un cliente"}
        />
        <Lista
          nombre="caracter_cliente"
          etiqueta="Carácter del cliente"
          opciones={catalogos.caracteres}
          obligatorio
          ayuda="Con qué carácter actúa en el juicio."
        />
      </Grupo>

      <Grupo titulo="Marco del asunto">
        <Lista
          nombre="materia_clave"
          etiqueta="Materia"
          opciones={catalogos.materias}
          obligatorio
          onChange={(e) => setMateria(e.target.value)}
        />
        <Lista
          nombre="procedimiento_clave"
          etiqueta="Tipo de procedimiento"
          opciones={procedimientos}
          disabled={!materia}
          vacio={materia ? "Elija el procedimiento" : "Elija primero la materia"}
          ayuda="De aquí sale la ley que rige, y de la ley salen las reglas de plazos."
        />
        <Lista
          nombre="ambito"
          etiqueta="Fuero"
          opciones={AMBITOS}
          obligatorio
          ayuda="Decide qué calendario de días inhábiles aplica. No son los mismos."
        />
        <Lista
          nombre="organo_id"
          etiqueta="Órgano jurisdiccional"
          opciones={catalogos.organos}
          vacio={catalogos.organos.length ? "Elija el órgano" : "Aún no hay órganos capturados"}
        />
        <Campo nombre="numero_expediente" etiqueta="Número de expediente" ayuda="Solo el número, sin el año." />
        <Campo nombre="anio" etiqueta="Año" tipo="number" inputMode="numeric" min={1990} max={2100} />
      </Grupo>

      <Grupo titulo="Contraparte">
        <div className="sm:col-span-2">
          <Campo
            nombre="contrapartes"
            etiqueta="Contraparte o contrapartes"
            ayuda="Si son varias, sepárelas con punto y coma. Cada una queda como parte del asunto."
          />
        </div>
        <Lista
          nombre="caracter_contraparte"
          etiqueta="Carácter de la contraparte"
          opciones={catalogos.caracteres}
          valor="demandado"
        />
      </Grupo>

      <Grupo titulo="Seguimiento">
        <Lista nombre="etapa" etiqueta="Etapa actual" opciones={catalogos.etapas} valor="consulta" obligatorio />
        <Lista
          nombre="responsable_id"
          etiqueta="Abogado responsable"
          opciones={catalogos.responsables}
          vacio="Sin asignar"
        />
        <Campo nombre="fecha_apertura" etiqueta="Fecha de apertura" tipo="date" valor={hoy} obligatorio />
        <Campo nombre="cuantia" etiqueta="Cuantía" tipo="number" inputMode="decimal" step="0.01" min={0} />
        <div className="sm:col-span-2">
          <Texto nombre="observaciones" etiqueta="Observaciones" />
        </div>
      </Grupo>

      <Error mensaje={estado.error} />
      <Botones enviando={enviando} texto="Abrir el asunto" />
    </form>
  );
}
