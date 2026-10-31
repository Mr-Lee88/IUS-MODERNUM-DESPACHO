-- IUS MODERNUM · datos demostrativos
--
-- TODO lo que hay aquí es INVENTADO. Nombres, expedientes, fechas y órganos no
-- corresponden a ninguna persona ni a ningún asunto real. El §5 del prompt
-- maestro prohíbe usar información real de clientes durante el desarrollo.
--
-- Sirve para ver la agenda con contenido: tres asuntos, uno de amparo, uno
-- mercantil y uno familiar, con sus audiencias y sus términos.
--
-- REGLA QUE ESTA SEMILLA RESPETA (§4 y §8): ningún término se marca como
-- calculado por el sistema. Todos nacen con `fecha_limite_origen = 'manual'` y
-- `estado_verificacion = 'pendiente_verificar'`, y su fundamento queda escrito
-- como lo que es: una referencia que el abogado responsable tiene que confirmar.
-- El sistema no computa plazos todavía; eso llega con los catálogos normativos
-- y los calendarios de días inhábiles de los dos fueros.
--
-- Para borrarlo todo: ver el final del archivo.

-- ---------- Órganos ----------
insert into organo (nombre, ambito, tipo, ciudad) values
  ('Juzgado Primero de Distrito en el Estado de Campeche', 'federal', 'juzgado', 'San Francisco de Campeche'),
  ('Juzgado Segundo de Distrito en el Estado de Campeche', 'federal', 'juzgado', 'San Francisco de Campeche'),
  ('Juzgado Tercero Civil de Primera Instancia', 'local_campeche', 'juzgado', 'San Francisco de Campeche'),
  ('Juzgado Primero Familiar de Primera Instancia', 'local_campeche', 'juzgado', 'San Francisco de Campeche'),
  ('Centro de Justicia Alternativa del Poder Judicial del Estado', 'local_campeche', 'centro', 'San Francisco de Campeche')
on conflict do nothing;

-- ---------- Clientes ----------
insert into cliente (clave_externa, tipo_persona, nombre_o_razon_social, rfc, telefono, correo, ciudad, estado, estado_cliente, observaciones_internas) values
  ('DEMO-C-01', 'fisica', 'Uc Tzab, María Guadalupe', 'UCTM850314HG2', '9811112233', 'maria.uctzab@ejemplo.mx',
   'San Francisco de Campeche', 'Campeche', 'activo', 'Datos de demostración. Prefiere que le avisen por teléfono.'),
  ('DEMO-C-02', 'moral', 'Grupo Peninsular del Sureste, S.A. de C.V.', 'GPS150820KL4', '9812223344', 'contacto@gpsureste.ejemplo.mx',
   'San Francisco de Campeche', 'Campeche', 'activo', 'Datos de demostración. Representante: apoderado legal.'),
  ('DEMO-C-03', 'fisica', 'Pat Chablé, Rosa María', 'PACR900712RM8', '9813334455', null,
   'Champotón', 'Campeche', 'activo', 'Datos de demostración. Asunto delicado: no llamar al domicilio.')
on conflict (clave_externa) do nothing;

update cliente set representante = 'Lic. apoderado legal del grupo'
where clave_externa = 'DEMO-C-02';

-- ---------- Asuntos ----------
insert into asunto (clave_externa, nombre, materia_clave, procedimiento_clave, ambito, organo_id,
                    numero_expediente, anio, etapa, estado_asunto, fecha_apertura, cuantia, observaciones)
values
  ('DEMO-A-01', 'Uc Tzab contra actos del Director de Catastro Municipal',
   'amparo', 'amparo_indirecto', 'federal',
   (select id from organo where nombre like 'Juzgado Primero de Distrito%'),
   '601', 2026, 'informe', 'activo', '2026-10-09', null,
   'Demostración. Se reclama el cobro del impuesto predial y la orden de embargo.'),

  ('DEMO-A-02', 'Grupo Peninsular del Sureste vs. Díaz Alcocer',
   'mercantil', 'ejecutivo_mercantil', 'local_campeche',
   (select id from organo where nombre like 'Juzgado Tercero Civil%'),
   '73', 2026, 'contestacion', 'activo', '2026-09-18', 486500.00,
   'Demostración. Pagaré vencido. Se obtuvo auto de ejecución.'),

  ('DEMO-A-03', 'Divorcio incausado Pat Chablé',
   'familiar', 'divorcio_incausado', 'local_campeche',
   (select id from organo where nombre like 'Juzgado Primero Familiar%'),
   '902', 2026, 'pruebas', 'activo', '2026-08-25', null,
   'Demostración. Hay dos menores; se discute guarda y custodia y pensión.')
on conflict (clave_externa) do nothing;

-- ---------- Partes ----------
insert into parte (clave_externa, asunto_id, cliente_id, nombre, caracter, es_nuestro_cliente) values
  ('DEMO-P-01', (select id from asunto where clave_externa = 'DEMO-A-01'),
   (select id from cliente where clave_externa = 'DEMO-C-01'),
   'Uc Tzab, María Guadalupe', 'quejoso', true),
  ('DEMO-P-02', (select id from asunto where clave_externa = 'DEMO-A-01'), null,
   'Director de Catastro Municipal de Campeche', 'autoridad', false),
  ('DEMO-P-03', (select id from asunto where clave_externa = 'DEMO-A-01'), null,
   'Tesorero Municipal de Campeche', 'autoridad', false),

  ('DEMO-P-04', (select id from asunto where clave_externa = 'DEMO-A-02'),
   (select id from cliente where clave_externa = 'DEMO-C-02'),
   'Grupo Peninsular del Sureste, S.A. de C.V.', 'actor', true),
  ('DEMO-P-05', (select id from asunto where clave_externa = 'DEMO-A-02'), null,
   'Díaz Alcocer, Fernando', 'demandado', false),
  ('DEMO-P-06', (select id from asunto where clave_externa = 'DEMO-A-02'), null,
   'Díaz Moo, Carmen', 'demandado', false),

  ('DEMO-P-07', (select id from asunto where clave_externa = 'DEMO-A-03'),
   (select id from cliente where clave_externa = 'DEMO-C-03'),
   'Pat Chablé, Rosa María', 'promovente', true),
  ('DEMO-P-08', (select id from asunto where clave_externa = 'DEMO-A-03'), null,
   'Canché Ek, Jorge Alberto', 'demandado', false)
on conflict (clave_externa) do nothing;

-- ---------- Bitácora ----------
insert into gestion (clave_externa, asunto_id, ocurrio_en, hora, tipo, clase, titulo, descripcion, publicada_al_cliente) values
  ('DEMO-G-01', (select id from asunto where clave_externa = 'DEMO-A-01'), '2026-10-09', '11:20', 'promocion', 'hecho_procesal',
   'Se presentó la demanda de amparo', 'Con copias para el traslado y el anexo del recibo predial.', true),
  ('DEMO-G-02', (select id from asunto where clave_externa = 'DEMO-A-01'), '2026-10-14', '09:50', 'acuerdo', 'hecho_procesal',
   'Se admitió la demanda', 'Se señaló fecha para la audiencia constitucional y se pidió el informe a las responsables.', true),
  ('DEMO-G-03', (select id from asunto where clave_externa = 'DEMO-A-01'), '2026-10-22', '13:05', 'notificacion', 'hecho_procesal',
   'Se notificó a las autoridades responsables', 'Corre el plazo para rendir el informe justificado. Pendiente de computar.', true),
  ('DEMO-G-04', (select id from asunto where clave_externa = 'DEMO-A-01'), '2026-10-27', '16:40', 'nota', 'nota_interna',
   'Estrategia', 'Si el informe llega incompleto, pedir que se tenga por presuntamente cierto el acto.', false),

  ('DEMO-G-05', (select id from asunto where clave_externa = 'DEMO-A-02'), '2026-09-18', '10:00', 'promocion', 'hecho_procesal',
   'Se presentó la demanda ejecutiva', 'Con el pagaré original como documento base de la acción.', true),
  ('DEMO-G-06', (select id from asunto where clave_externa = 'DEMO-A-02'), '2026-09-30', '12:15', 'acuerdo', 'hecho_procesal',
   'Auto de ejecución', 'Se mandó requerir de pago, embargar y emplazar.', true),
  ('DEMO-G-07', (select id from asunto where clave_externa = 'DEMO-A-02'), '2026-10-20', '09:30', 'notificacion', 'hecho_procesal',
   'Se emplazó a los demandados', 'Diligencia practicada en el domicilio señalado. Corre el plazo para contestar.', true),
  ('DEMO-G-08', (select id from asunto where clave_externa = 'DEMO-A-02'), '2026-10-28', '17:10', 'llamada', 'administrativa',
   'Llamada del apoderado', 'Pregunta si conviene aceptar un convenio de pago en parcialidades.', false),

  ('DEMO-G-09', (select id from asunto where clave_externa = 'DEMO-A-03'), '2026-08-25', '11:00', 'promocion', 'hecho_procesal',
   'Se presentó la solicitud de divorcio', 'Con la propuesta de convenio sobre los menores.', true),
  ('DEMO-G-10', (select id from asunto where clave_externa = 'DEMO-A-03'), '2026-09-15', '10:30', 'audiencia', 'hecho_procesal',
   'Primera junta de avenencia', 'No hubo acuerdo sobre la pensión. Se señaló nueva fecha.', true),
  ('DEMO-G-11', (select id from asunto where clave_externa = 'DEMO-A-03'), '2026-10-24', '13:40', 'reunion', 'administrativa',
   'Reunión con la cliente', 'Trajo los comprobantes de gastos escolares de los menores.', false)
on conflict (clave_externa) do nothing;

-- ---------- Audiencias ----------
insert into evento (clave_externa, asunto_id, clase, titulo, fecha_hora, organo_id, ubicacion, estado, observaciones) values
  ('DEMO-E-01', (select id from asunto where clave_externa = 'DEMO-A-01'), 'audiencia',
   'Audiencia constitucional', '2026-11-12 10:30:00-06',
   (select id from organo where nombre like 'Juzgado Primero de Distrito%'),
   'Sala de audiencias', 'confirmado', 'Llevar copia del informe justificado y de las pruebas.'),

  ('DEMO-E-02', (select id from asunto where clave_externa = 'DEMO-A-02'), 'audiencia',
   'Audiencia de desahogo de pruebas', '2026-11-19 09:00:00-06',
   (select id from organo where nombre like 'Juzgado Tercero Civil%'),
   'Juzgado, planta baja', 'confirmado', 'Está ofrecida la pericial en grafoscopía.'),

  ('DEMO-E-03', (select id from asunto where clave_externa = 'DEMO-A-03'), 'audiencia',
   'Segunda junta de avenencia', '2026-11-06 11:00:00-06',
   (select id from organo where nombre like 'Juzgado Primero Familiar%'),
   'Sala familiar', 'confirmado', 'La cliente pide que no coincidan en el pasillo.'),

  ('DEMO-E-04', (select id from asunto where clave_externa = 'DEMO-A-03'), 'diligencia',
   'Plática con la psicóloga adscrita', '2026-11-13 12:00:00-06',
   (select id from organo where nombre like 'Centro de Justicia Alternativa%'),
   'Centro de Justicia Alternativa', 'pendiente', 'Asisten los dos menores.')
on conflict (clave_externa) do nothing;

-- ---------- Términos ----------
-- Todos capturados a mano y SIN VERIFICAR. El sistema no los calculó: la fecha
-- límite es la que escribió una persona, y el fundamento está anotado como
-- referencia a confirmar, no como cita aplicada.
insert into evento (clave_externa, asunto_id, clase, titulo, organo_id,
                    fecha_notificacion, modalidad_notificacion, surte_efectos_en,
                    dias, unidad, fecha_limite, fecha_limite_origen,
                    estado, estado_verificacion, bloqueado_por_falta_de_datos, fundamento_texto, observaciones)
values
  ('DEMO-T-01', (select id from asunto where clave_externa = 'DEMO-A-01'), 'termino',
   'Rendir informe justificado (plazo de las responsables)',
   (select id from organo where nombre like 'Juzgado Primero de Distrito%'),
   '2026-10-22', 'Por oficio', '2026-10-23', 15, 'habiles', '2026-11-13', 'manual',
   'proximo_vencer', 'pendiente_verificar', false,
   'Referencia por confirmar: Ley de Amparo, informe justificado. Verificar plazo, vigencia del precepto y calendario federal de días inhábiles antes de darlo por bueno.',
   'Dato de demostración.'),

  ('DEMO-T-02', (select id from asunto where clave_externa = 'DEMO-A-01'), 'termino',
   'Alegatos antes de la audiencia constitucional',
   (select id from organo where nombre like 'Juzgado Primero de Distrito%'),
   null, null, null, null, null, '2026-11-11', 'manual',
   'pendiente_verificar', 'pendiente_verificar', true,
   'Falta la fecha de notificación y la fecha en que surte efectos: sin esos dos datos no se puede computar.',
   'Dato de demostración. Muestra un término bloqueado por falta de datos.'),

  ('DEMO-T-03', (select id from asunto where clave_externa = 'DEMO-A-02'), 'termino',
   'Contestar la demanda y oponer excepciones',
   (select id from organo where nombre like 'Juzgado Tercero Civil%'),
   '2026-10-20', 'Personal', '2026-10-21', 8, 'habiles', '2026-11-03', 'manual',
   'proximo_vencer', 'pendiente_verificar', false,
   'Referencia por confirmar: Código de Comercio, juicio ejecutivo mercantil. Verificar plazo, reforma vigente y días inhábiles del fuero local.',
   'Dato de demostración.'),

  ('DEMO-T-04', (select id from asunto where clave_externa = 'DEMO-A-02'), 'termino',
   'Ofrecer pruebas',
   (select id from organo where nombre like 'Juzgado Tercero Civil%'),
   null, null, null, null, null, '2026-11-24', 'manual',
   'pendiente', 'pendiente_verificar', false,
   'Referencia por confirmar. Depende de cuándo quede fijada la litis.',
   'Dato de demostración.'),

  ('DEMO-T-05', (select id from asunto where clave_externa = 'DEMO-A-03'), 'termino',
   'Exhibir los comprobantes de ingresos del demandado',
   (select id from organo where nombre like 'Juzgado Primero Familiar%'),
   '2026-10-24', 'Por lista', '2026-10-27', 3, 'habiles', '2026-11-04', 'manual',
   'proximo_vencer', 'pendiente_verificar', false,
   'Referencia por confirmar: requerimiento del juzgado. Verificar desde cuándo corre y el calendario local.',
   'Dato de demostración.'),

  ('DEMO-T-06', (select id from asunto where clave_externa = 'DEMO-A-03'), 'termino',
   'Objetar el dictamen psicológico',
   (select id from organo where nombre like 'Juzgado Primero Familiar%'),
   '2026-10-16', 'Por lista', '2026-10-19', 3, 'habiles', '2026-10-22', 'manual',
   'vencido', 'pendiente_verificar', false,
   'Referencia por confirmar.',
   'Dato de demostración. Muestra un término ya vencido.')
on conflict (clave_externa) do nothing;


-- ---------- Honorarios, pagos, gastos y facturas ----------
-- Importes inventados. Devengado, cobrado y gastos se llevan por separado (§4).
insert into honorario (asunto_id, concepto, tipo, importe, fecha, notas) values
  ((select id from asunto where clave_externa = 'DEMO-A-01'), 'Honorarios por el juicio de amparo indirecto, primera instancia', 'pactado', 45000.00, '2026-10-08', 'Convenio firmado. No incluye recurso de revision.'),
  ((select id from asunto where clave_externa = 'DEMO-A-01'), 'Estudio del caso y elaboracion de la demanda', 'devengado', 20000.00, '2026-10-09', null),
  ((select id from asunto where clave_externa = 'DEMO-A-01'), 'Seguimiento hasta la audiencia constitucional', 'devengado', 15000.00, '2026-10-22', null),
  ((select id from asunto where clave_externa = 'DEMO-A-02'), 'Honorarios por juicio ejecutivo mercantil', 'pactado', 90000.00, '2026-09-17', 'Mas 10% sobre lo efectivamente recuperado.'),
  ((select id from asunto where clave_externa = 'DEMO-A-02'), 'Elaboracion de demanda y tramite del auto de ejecucion', 'devengado', 40000.00, '2026-09-30', null),
  ((select id from asunto where clave_externa = 'DEMO-A-02'), 'Diligencia de requerimiento, embargo y emplazamiento', 'devengado', 18000.00, '2026-10-20', null),
  ((select id from asunto where clave_externa = 'DEMO-A-03'), 'Honorarios por divorcio incausado con convenio', 'pactado', 38000.00, '2026-08-24', 'Incluye dos juntas de avenencia.'),
  ((select id from asunto where clave_externa = 'DEMO-A-03'), 'Solicitud inicial y propuesta de convenio', 'devengado', 18000.00, '2026-08-25', null),
  ((select id from asunto where clave_externa = 'DEMO-A-03'), 'Asistencia a la primera junta de avenencia', 'devengado', 6000.00, '2026-09-15', null);

insert into pago (asunto_id, concepto, importe, fecha, forma_pago, referencia) values
  ((select id from asunto where clave_externa = 'DEMO-A-01'), 'Anticipo', 20000.00, '2026-10-08', 'transferencia', 'SPEI 8842193'),
  ((select id from asunto where clave_externa = 'DEMO-A-02'), 'Anticipo', 35000.00, '2026-09-17', 'transferencia', 'SPEI 7731045'),
  ((select id from asunto where clave_externa = 'DEMO-A-02'), 'Segundo pago', 20000.00, '2026-10-15', 'cheque', 'Cheque 001287'),
  ((select id from asunto where clave_externa = 'DEMO-A-03'), 'Anticipo', 15000.00, '2026-08-24', 'efectivo', null),
  ((select id from asunto where clave_externa = 'DEMO-A-03'), 'Abono', 10000.00, '2026-10-02', 'transferencia', 'SPEI 9120338');

insert into gasto (asunto_id, concepto, importe, fecha, reembolsable, reembolsado) values
  ((select id from asunto where clave_externa = 'DEMO-A-01'), 'Copias certificadas del expediente administrativo', 850.00, '2026-10-10', true, true),
  ((select id from asunto where clave_externa = 'DEMO-A-01'), 'Traslado al Juzgado de Distrito', 600.00, '2026-10-22', true, false),
  ((select id from asunto where clave_externa = 'DEMO-A-02'), 'Honorarios del perito en grafoscopia', 8500.00, '2026-10-26', true, false),
  ((select id from asunto where clave_externa = 'DEMO-A-02'), 'Publicacion de edictos', 3200.00, '2026-10-05', true, true),
  ((select id from asunto where clave_externa = 'DEMO-A-03'), 'Dictamen psicologico particular', 4500.00, '2026-10-16', true, false),
  ((select id from asunto where clave_externa = 'DEMO-A-03'), 'Copias simples y engargolado', 320.00, '2026-09-12', false, false);

-- El folio fiscal lo asigna el SAT; estos son inventados y se marcan como tales.
insert into factura (cliente_id, asunto_id, serie, folio, folio_fiscal, fecha, subtotal, iva, total, estado, notas) values
  ((select id from cliente where clave_externa = 'DEMO-C-01'), (select id from asunto where clave_externa = 'DEMO-A-01'),
   'A', '1042', 'A1B2C3D4-0000-4000-8000-DEMO00000001', '2026-10-08', 20000.00, 3200.00, 23200.00, 'pagada',
   'La emite el contador. Aqui solo se registra el folio fiscal.'),
  ((select id from cliente where clave_externa = 'DEMO-C-02'), (select id from asunto where clave_externa = 'DEMO-A-02'),
   'A', '1043', 'A1B2C3D4-0000-4000-8000-DEMO00000002', '2026-09-17', 35000.00, 5600.00, 40600.00, 'pagada', null),
  ((select id from cliente where clave_externa = 'DEMO-C-02'), (select id from asunto where clave_externa = 'DEMO-A-02'),
   'A', '1051', 'A1B2C3D4-0000-4000-8000-DEMO00000003', '2026-10-15', 20000.00, 3200.00, 23200.00, 'emitida', null),
  ((select id from cliente where clave_externa = 'DEMO-C-03'), (select id from asunto where clave_externa = 'DEMO-A-03'),
   'A', '1038', 'A1B2C3D4-0000-4000-8000-DEMO00000004', '2026-08-24', 15000.00, 2400.00, 17400.00, 'pagada', null);

-- ============================================================
-- PARA BORRAR TODO LO DEMOSTRATIVO
-- ============================================================
-- delete from factura where folio_fiscal like '%DEMO%';
-- delete from gasto   where asunto_id in (select id from asunto where clave_externa like 'DEMO-%');
-- delete from pago    where asunto_id in (select id from asunto where clave_externa like 'DEMO-%');
-- delete from honorario where asunto_id in (select id from asunto where clave_externa like 'DEMO-%');
-- delete from evento   where clave_externa like 'DEMO-%';
-- delete from gestion  where clave_externa like 'DEMO-%';
-- delete from parte    where clave_externa like 'DEMO-%';
-- delete from asunto   where clave_externa like 'DEMO-%';
-- delete from cliente  where clave_externa like 'DEMO-%';
