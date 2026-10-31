# IUS MODERNUM

Plataforma privada de gestión jurídica y seguimiento procesal para un despacho
litigante en Campeche, México.

> **Toda la información de un asunto, en segundos.**

El sistema responde una sola pregunta, y la responde rápido: *¿en qué quedó este
asunto, qué ocurrió recientemente, qué sigue y quién es responsable?*

## Advertencia sobre este repositorio

**Es público.** Por lo tanto:

- Ninguna credencial entra aquí. Las llaves viven en `.env.local`, que está en
  `.gitignore`, y en las variables de entorno de Vercel.
- **Ningún dato real de clientes, expedientes o contrapartes.** El desarrollo se
  hace con información ficticia. La información del despacho está sujeta a secreto
  profesional y no se versiona.
- Lo que sí es público es el código: esquema, políticas de seguridad y pantallas.

## Estado

| Fase | Qué incluye | Estado |
|---|---|---|
| 0 | Validación de bocetos, plantilla y código reutilizable | Terminada |
| 1 | Sesión, roles, clientes, asuntos, buscador, bitácora, documentos, importador | En curso — paso 1 de 12 |
| 2 | Agenda, términos, catálogos normativos, cómputo verificable | Pendiente |
| 3 | Honorarios, gastos, facturas, poderes, reportes | Pendiente |
| 4 | Portal del cliente | Pendiente |

**Paso 1, terminado:** armazón visual con la paleta institucional, barra lateral,
buscador con `Ctrl + K`, adaptación a teléfono y las pantallas de panel, asuntos,
detalle del asunto y resultados de búsqueda. Las pantallas corren contra
`lib/maqueta.ts` (datos ficticios) hasta el paso 5.

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind 4 · shadcn/ui sobre Base UI ·
Supabase (Auth, PostgreSQL, Storage) · Vercel.

## Correr en local

```bash
pnpm install
pnpm dev
```

Abre en http://localhost:3100.

## Convenciones

- Código, comentarios, tablas y columnas **en español**; palabras reservadas y
  librerías en su idioma original.
- Archivos en minúsculas con guiones, sin acentos.
- Fechas en datos: ISO `AAAA-MM-DD`.
- Nada se borra: se archiva con `archivado_en`.
- La autorización vive en la base de datos (RLS), no solo en la interfaz.

## Reglas jurídicas que el código debe respetar

1. No inventar fundamentos legales ni asumir vigencia normativa.
2. No confundir fecha de notificación con fecha en que surte efectos.
3. No confundir días naturales con días hábiles.
4. Los días inhábiles federales **no** son los mismos que los locales de Campeche.
5. Si falta un dato jurídico esencial, **bloquear el cálculo** y pedir validación.
6. Todo dato extraído por OCR es una propuesta, nunca un dato confirmado.
7. Los términos confirmados no se modifican sin dejar evidencia.

La verificación jurídica del cómputo corresponde al abogado responsable. El
sistema es una herramienta de apoyo.

## Documentación

El encargo, la arquitectura y el plan viven en el vault del proyecto:
`Janus-Vault/02-Proyectos/ius-modernum/`.
