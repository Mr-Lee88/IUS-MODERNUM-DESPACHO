"use client";

import { useActionState } from "react";
import { Botones, Campo, Error, Grupo, Lista, Texto } from "@/components/app/campos";
import { ESTADOS_CLIENTE, TIPOS_PERSONA } from "@/lib/catalogos";
import { crearCliente, type EstadoFormulario } from "../acciones";

const INICIAL: EstadoFormulario = {};

export function FormularioCliente({ hoy }: { hoy: string }) {
  const [estado, enviar, enviando] = useActionState(crearCliente, INICIAL);

  return (
    <form action={enviar} className="space-y-4">
      <Grupo titulo="Quién es">
        <Lista
          nombre="tipo_persona"
          etiqueta="Tipo de persona"
          opciones={TIPOS_PERSONA}
          valor="fisica"
          obligatorio
        />
        <Lista
          nombre="estado_cliente"
          etiqueta="Estado"
          opciones={ESTADOS_CLIENTE}
          valor="activo"
          obligatorio
        />
        <div className="sm:col-span-2">
          <Campo
            nombre="nombre_o_razon_social"
            etiqueta="Nombre o razón social"
            obligatorio
            ayuda="Para persona física conviene «Apellidos, Nombre»: así ordena bien en las listas."
          />
        </div>
        <Campo nombre="rfc" etiqueta="RFC" ayuda="Opcional. Si lo escribe, se valida su forma." />
        <Campo
          nombre="representante"
          etiqueta="Representante"
          ayuda="Para persona moral: quién firma."
        />
      </Grupo>

      <Grupo titulo="Cómo se le localiza">
        <Campo nombre="telefono" etiqueta="Teléfono" tipo="tel" inputMode="tel" />
        <Campo nombre="correo" etiqueta="Correo" tipo="email" inputMode="email" />
        <Campo nombre="calle_y_numero" etiqueta="Calle y número" />
        <Campo nombre="colonia" etiqueta="Colonia" />
        <Campo nombre="ciudad" etiqueta="Ciudad" valor="San Francisco de Campeche" />
        <Campo nombre="estado" etiqueta="Estado" valor="Campeche" />
        <Campo nombre="cp" etiqueta="Código postal" inputMode="numeric" maxLength={5} />
        <Campo nombre="cliente_desde" etiqueta="Cliente desde" tipo="date" valor={hoy} />
      </Grupo>

      <Grupo titulo="Para el despacho">
        <div className="sm:col-span-2">
          <Texto
            nombre="observaciones_internas"
            etiqueta="Observaciones internas"
            ayuda="No las ve el cliente en su portal."
          />
        </div>
      </Grupo>

      <Error mensaje={estado.error} />
      <Botones enviando={enviando} texto="Guardar cliente" />
    </form>
  );
}
