# IUS MODERNUM

Plataforma privada de gestión jurídica y seguimiento procesal para un despacho
litigante en Campeche, México.

> **Toda la información de un asunto, en segundos.**

El sistema responde una sola pregunta, y la responde rápido: *¿en qué quedó este
asunto, qué ocurrió recientemente, qué sigue y quién es responsable?*

---

## Probarlo ahora

### 🔗 https://ius-modernum.vercel.app

<small>También responde en <code>ius-modernum-hackaton88.vercel.app</code>.</small>

**Acceso de demostración:**

| | |
|---|---|
| Correo | `demo@iusmodernum.mx` |
| Contraseña | `IusModernum2026` |

Esa cuenta tiene rol de **socio**, así que ve todo el sistema, incluidos los
honorarios. **Todos los datos que verá son inventados**: nombres, expedientes,
órganos, fechas e importes. No corresponden a ninguna persona ni a ningún asunto
real.

> Es una cuenta pública de demostración, puesta a propósito para que el jurado
> pueda entrar. Cualquiera que tenga la dirección puede usarla y modificar los
> datos de ejemplo. **Antes de usar el sistema con información real hay que
> borrarla** y dar de alta cuentas propias.

### Qué vale la pena mirar

| Pantalla | Qué enseña |
|---|---|
| **Asuntos del día** | Lo que vence primero, audiencias y últimos movimientos |
| **Asuntos → un asunto** | Ficha, bitácora, documentos, términos, partes y honorarios |
| **Agenda y términos** | Cuatro vistas: día, semana, mes y lista |
| **Honorarios** | Devengado, cobrado y gastos por separado; **botón de PDF** |
| **Reportes** | Cifras del despacho y **descarga del reporte en PDF** |
| `Ctrl + K` | Buscador universal: pruebe «Uc Tzab», «412» o «emplazó» |

Dos detalles que no se ven pero sostienen el resto:

1. **Los términos salen marcados «sin verificar»**, y uno aparece *bloqueado por
   falta de datos*. El sistema todavía no computa plazos y lo dice en pantalla en
   vez de aparentar que sí. Un plazo mal calculado hace perder un derecho.
2. **Las cifras de dinero están cerradas en la base de datos**, no solo en la
   interfaz. Un abogado que consulte la API directamente recibe cero filas. Las
   pruebas están en `supabase/pruebas/rls.sql`.

---

## Advertencia sobre este repositorio

**Es público.** Por lo tanto:

- Ninguna credencial de servicio entra aquí. Las llaves viven en `.env.local`,
  que está en `.gitignore`, y en las variables de entorno de Vercel.
- **Ningún dato real de clientes, expedientes o contrapartes.** El desarrollo se
  hace con información ficticia. La información del despacho está sujeta a
  secreto profesional y no se versiona.
- La contraseña de demostración de arriba es, a propósito, pública: da acceso
  solo a datos inventados.

## Estado

| Fase | Qué incluye | Estado |
|---|---|---|
| 0 | Validación de bocetos, plantilla y código reutilizable | Terminada |
| 1 | Sesión, roles, clientes, asuntos, buscador, bitácora, documentos | Hecha, salvo el importador de Excel |
| 2 | Agenda y términos | Pantalla hecha; falta el **motor de cómputo de plazos** |
| 3 | Honorarios, gastos, facturas, reportes | Hecha, salvo poderes y conflictos de intereses |
| 4 | Portal del cliente | Pendiente |

**Lo que falta y se sabe que falta:**

- El **importador de la plantilla de Excel** (`plantilla-ius-modernum.xlsx`).
- El **cómputo de plazos**: catálogos normativos con vigencia y calendarios de
  días inhábiles federales y locales. Hoy los términos se capturan a mano.
- Estado de poderes y revisión de conflictos de intereses.
- OCR de documentos escaneados.

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind 4 · shadcn/ui sobre Base UI ·
Supabase (Auth, PostgreSQL, Storage, RLS) · pdf-lib · Vercel.

## Correr en local

```bash
pnpm install
```

Copie `.env.example` como `.env.local` y ponga los valores de su proyecto de
Supabase. Después:

```bash
pnpm dev
```

Abre en http://localhost:3100.

La base se levanta aplicando en orden los archivos de `supabase/migrations/`, y
`supabase/semilla-demostrativa.sql` carga los datos de ejemplo.

## Convenciones

- Código, comentarios, tablas y columnas **en español**; palabras reservadas y
  librerías en su idioma original.
- Archivos en minúsculas con guiones, sin acentos.
- Fechas en datos: ISO `AAAA-MM-DD`. En documentos del foro: el mes con letra y
  sin abreviar.
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
