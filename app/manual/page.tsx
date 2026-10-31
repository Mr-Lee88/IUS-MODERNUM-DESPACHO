import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle, ArrowRight, CalendarClock, FileText, Lock,
  Search, Upload, Users,
} from "lucide-react";

export const metadata = {
  title: "Manual de uso",
  description: "Qué problemas resuelve IUS MODERNUM y dónde verlos funcionando.",
};

/** Un problema del despacho, lo que el sistema hace con él, y dónde comprobarlo. */
function Punto({
  numero,
  icono: Icono,
  titulo,
  problema,
  solucion,
  donde,
  enlace,
  children,
}: {
  numero: string;
  icono: typeof Search;
  titulo: string;
  problema: string;
  solucion: React.ReactNode;
  donde: string;
  enlace?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="border border-[var(--border)] bg-white">
      <div className="filete-dorado" />
      <div className="p-6">
        <div className="flex items-start gap-4">
          <span className="flex size-10 shrink-0 items-center justify-center bg-[var(--verde)] text-[var(--dorado)]">
            <Icono className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--dorado-tinta)]">
              {numero}
            </p>
            <h2 className="mt-1 text-base text-[var(--verde)]">{titulo}</h2>
          </div>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div>
            <h3 className="text-[11px] uppercase tracking-wider text-[var(--muted-foreground)]">
              El problema
            </h3>
            <p className="mt-1.5 text-sm">{problema}</p>
          </div>
          <div>
            <h3 className="text-[11px] uppercase tracking-wider text-[var(--muted-foreground)]">
              Qué hace el sistema
            </h3>
            <div className="mt-1.5 space-y-2 text-sm">{solucion}</div>
          </div>
        </div>

        {children}

        <p className="mt-5 flex flex-wrap items-center gap-2 border-t border-[var(--border)] pt-4 text-sm">
          <span className="text-[11px] uppercase tracking-wider text-[var(--muted-foreground)]">
            Dónde verlo
          </span>
          {enlace ? (
            <Link href={enlace} className="inline-flex items-center gap-1.5 font-medium text-[var(--verde)] underline-offset-4 hover:underline">
              {donde}
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          ) : (
            <span className="font-medium text-[var(--verde)]">{donde}</span>
          )}
        </p>
      </div>
    </section>
  );
}

export default function PaginaManual() {
  return (
    <div className="min-h-screen bg-[var(--marfil)]">
      {/* Membrete */}
      <header className="bg-[var(--verde)] px-6 py-7">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4">
          <Image src="/logo.png" alt="IUS MODERNUM Abogados" width={800} height={166} priority sizes="240px" className="h-auto w-56" />
          <Link
            href="/"
            className="flex h-11 items-center gap-2 border border-[var(--dorado)] px-4 text-sm text-[var(--dorado)] hover:bg-[var(--verde-claro)]"
          >
            Entrar al sistema
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-5 px-4 py-8 md:px-6">
        {/* Portada */}
        <div className="border border-[var(--border)] bg-white p-6 md:p-8">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--dorado-tinta)]">
            Manual de uso
          </p>
          <h1 className="mt-2 text-2xl text-[var(--verde)]">
            Toda la información de un asunto, en segundos
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed">
            IUS MODERNUM es el sistema de un despacho litigante. No es un CRM al que
            se le pusieron palabras jurídicas encima: está construido alrededor de la
            pregunta que un abogado se hace veinte veces al día —
            <strong> ¿en qué quedó este asunto, qué sigue y quién responde?</strong>—
            y alrededor del riesgo que de verdad duele, que es perder un plazo.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              ["Encontrar", "Cualquier asunto, su última actuación y su siguiente paso en menos de 30 segundos"],
              ["No equivocarse", "El sistema dice lo que no sabe en vez de calcular un plazo a ciegas"],
              ["Guardar el secreto", "Lo que cada quien puede ver está cerrado en la base, no solo en la pantalla"],
            ].map(([t, d]) => (
              <div key={t} className="filete-dorado border border-[var(--border)] p-4">
                <p className="text-sm font-medium text-[var(--verde)]">{t}</p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">{d}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Cómo entrar */}
        <div className="border border-[var(--border)] bg-white p-6">
          <h2 className="text-base text-[var(--verde)]">Para entrar</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <dl className="space-y-2 text-sm">
              <div className="flex gap-3">
                <dt className="w-24 shrink-0 text-xs uppercase tracking-wider text-[var(--muted-foreground)]">Correo</dt>
                <dd className="font-mono">demo@iusmodernum.mx</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-24 shrink-0 text-xs uppercase tracking-wider text-[var(--muted-foreground)]">Contraseña</dt>
                <dd className="font-mono">IusModernum2026</dd>
              </div>
            </dl>
            <p className="text-xs text-[var(--muted-foreground)]">
              Esa cuenta tiene rol de <strong>socio</strong>: ve todo el sistema,
              incluidos los honorarios. Todos los datos son inventados —nombres,
              expedientes, órganos, fechas e importes—. No corresponden a ninguna
              persona ni a ningún asunto real.
            </p>
          </div>
        </div>

        {/* Recorrido rápido */}
        <div className="border border-[var(--border)] bg-white p-6">
          <h2 className="text-base text-[var(--verde)]">Recorrido de cinco minutos</h2>
          <ol className="mt-4 space-y-3">
            {[
              ["Abra «Asuntos del día».", "Lo primero que se ve es lo que vence, no un tablero de adornos."],
              ["Pulse Ctrl + K y escriba «emplazó».", "Encuentra una gestión escrita hace días, dentro de un asunto que no recordaba. Pruebe también «412» o «Uc Tzab»."],
              ["Entre a un asunto y lea su bitácora.", "Cada renglón dice qué pasó, cuándo pasó, cuándo se anotó y quién lo anotó."],
              ["Vaya a «Agenda y términos», vista Mes.", "Fíjese en los términos: todos salen marcados «sin verificar», y uno dice «falta un dato para computar»."],
              ["Abra «Honorarios» y descargue un estado de cuenta.", "Sale en PDF, con el membrete del despacho."],
              ["Abra «Reportes» y descargue el reporte.", "Las mismas cifras de la pantalla, en un documento presentable."],
            ].map(([paso, nota], i) => (
              <li key={paso} className="flex gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--verde)] text-xs font-medium text-white">
                  {i + 1}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{paso}</span>
                  <span className="block text-xs text-[var(--muted-foreground)]">{nota}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>

        <h2 className="pt-3 text-lg text-[var(--verde)]">Lo que este sistema resuelve</h2>

        <Punto
          numero="Problema uno"
          icono={Search}
          titulo="«¿En qué quedó este asunto?»"
          problema="Un cliente llama y pregunta por su juicio. La respuesta está repartida entre la memoria de quien lo llevaba, un correo, una carpeta y una libreta. Encontrarla cuesta diez minutos, o una llamada de vuelta. Multiplicado por veinte asuntos, el despacho vive persiguiendo su propia información."
          solucion={
            <>
              <p>
                Un <strong>buscador universal</strong> que se abre con <kbd className="rounded-sm border border-[var(--border)] bg-[var(--muted)] px-1.5 py-0.5 text-xs">Ctrl + K</kbd> desde
                cualquier pantalla y busca a la vez en clientes, asuntos, gestiones,
                partes y documentos.
              </p>
              <p>
                Encuentra por número de expediente, por nombre de la contraparte o por
                una palabra suelta de algo que alguien anotó hace meses. <strong>No
                distingue acentos</strong>: «emplazo» encuentra «emplazó».
              </p>
              <p>
                Y cada asunto tiene una <strong>bitácora cronológica</strong> que es la
                fuente única del historial.
              </p>
            </>
          }
          donde="Ctrl + K, y la pestaña Bitácora de cualquier asunto"
          enlace="/buscar?q=emplazo"
        />

        <Punto
          numero="Problema dos"
          icono={CalendarClock}
          titulo="Un plazo mal contado hace perder un derecho"
          problema="Es el daño más grave que un sistema así puede causar. Y es fácil de causar: basta confundir la fecha de notificación con la fecha en que surte efectos, o contar días hábiles con el calendario federal cuando el asunto es local. Un sistema que calcula plazos sin saber lo suficiente es peor que no tener sistema, porque da confianza falsa."
          solucion={
            <>
              <p>
                IUS MODERNUM <strong>no computa plazos todavía, y lo dice</strong>. Cada
                término aparece marcado «sin verificar», y si le falta un dato esencial
                queda marcado «falta un dato para computar» en vez de inventar una fecha.
              </p>
              <p>
                La estructura ya está puesta para cuando sí calcule: fecha de
                notificación y fecha de efectos son <strong>dos columnas distintas</strong>,
                nunca se deduce una de la otra; cada asunto sabe su fuero y de ahí sale
                qué calendario de días inhábiles le toca; y ninguna regla de cómputo se
                aplica mientras un abogado no la haya marcado como verificada.
              </p>
            </>
          }
          donde="Agenda y términos — vea las marcas rojas y ámbar"
          enlace="/agenda?vista=mes&f=2026-11-01"
        >
          <div className="mt-5 flex items-start gap-3 border border-[var(--dorado)] bg-[var(--marfil)] p-4">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[var(--dorado-tinta)]" aria-hidden />
            <p className="text-sm">
              <strong>Esto es una decisión de diseño, no una carencia.</strong> Un
              sistema jurídico serio tiene que distinguir entre lo que sabe y lo que
              supone, y decirlo en la pantalla. La verificación del cómputo es del
              abogado responsable, y el sistema está construido para recordárselo.
            </p>
          </div>
        </Punto>

        <Punto
          numero="Problema tres"
          icono={Lock}
          titulo="El secreto profesional no se cuida escondiendo botones"
          problema="En muchos sistemas, «el pasante no ve los honorarios» significa que no le aparece el menú. Pero los datos siguen ahí, a una consulta de distancia para cualquiera que sepa abrir la consola del navegador. Para información sujeta a secreto profesional, eso no es protección: es apariencia de protección."
          solucion={
            <>
              <p>
                Los permisos están en la <strong>base de datos</strong>, no en la
                interfaz. Las tablas de honorarios, pagos, gastos y facturas tienen una
                sola política y es para el socio: quien no lo sea <strong>recibe cero
                filas</strong>, aunque pregunte directamente a la API.
              </p>
              <p>
                Lo mismo con los documentos, que llevan tres niveles —socio, equipo,
                cliente— y con la bitácora: el cliente solo ve lo que se publicó
                expresamente, y nunca una nota interna.
              </p>
              <p className="text-xs text-[var(--muted-foreground)]">
                Las pruebas que lo comprueban están en el repositorio, en
                <code className="ml-1">supabase/pruebas/rls.sql</code>, y se pueden
                volver a correr.
              </p>
            </>
          }
          donde="Pestaña Honorarios de un asunto, y el candado de cada documento"
          enlace="/honorarios"
        />

        <Punto
          numero="Problema cuatro"
          icono={FileText}
          titulo="Los documentos del despacho andan sueltos"
          problema="Las carpetas compartidas no distinguen entre el escrito que el cliente puede ver y el convenio de honorarios que solo el socio debe tocar. Y un enlace para compartir, una vez creado, vive para siempre."
          solucion={
            <>
              <p>
                El almacenamiento es <strong>privado</strong>: ningún archivo tiene
                dirección permanente. Cada descarga pasa por el servidor, que comprueba
                quién pregunta y firma un enlace que <strong>caduca a los dos minutos</strong>.
              </p>
              <p>
                Al subir un documento se elige quién puede verlo. Y lo que sube un
                cliente queda <strong>pendiente de revisión</strong>: no entra al
                expediente hasta que alguien del despacho lo apruebe.
              </p>
            </>
          }
          donde="Pestaña Documentos de un asunto"
        />

        <Punto
          numero="Problema cinco"
          icono={Upload}
          titulo="Empezar a usar un sistema cuesta más que seguir sin él"
          problema="Cargar a mano lo que ya existe es el motivo por el que tantos despachos abandonan un sistema en la primera semana. Pero obligar a pasar todo por un Excel tampoco sirve para el día a día, cuando lo que hace falta es anotar una cosa rápido."
          solucion={
            <>
              <p>
                Dos vías de entrada <strong>de igual rango</strong>, y ninguna depende
                de la otra: captura a mano para el día a día, y una plantilla de Excel
                para dar de alta muchos registros de golpe.
              </p>
              <p>
                Anotar una gestión se hace <strong>sin salir del asunto</strong>, que es
                donde uno está cuando se acuerda. Y los formularios están pensados para
                llenarse también desde el teléfono.
              </p>
            </>
          }
          donde="El botón «Registrar gestión» dentro de cualquier asunto"
          enlace="/asuntos"
        />

        <Punto
          numero="Problema seis"
          icono={Users}
          titulo="El trabajo ocurre en el juzgado, no en el escritorio"
          problema="La información se necesita de pie, en un pasillo, con una mano ocupada por un expediente. Un sistema que solo sirve sentado frente a la computadora se consulta al día siguiente, cuando ya no importa."
          solucion={
            <>
              <p>
                Las cuatro cosas que hacen falta ahí —buscar un asunto, leer su
                bitácora, anotar una gestión y ver la audiencia del día— están pensadas
                para el teléfono.
              </p>
              <p>
                Las tablas se vuelven tarjetas, el buscador tiene una lupa fija siempre
                visible, y ningún botón baja de 44 × 44 píxeles de zona táctil.
              </p>
            </>
          }
          donde="Abra esta misma dirección en su teléfono"
        />

        {/* Lo que no hace */}
        <div className="border border-[var(--border)] bg-white p-6">
          <h2 className="text-base text-[var(--verde)]">Lo que este sistema todavía no hace</h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Un sistema jurídico que esconde sus límites es peligroso. Estos son los
            del nuestro, hoy:
          </p>
          <ul className="mt-4 space-y-2.5 text-sm">
            {[
              ["No calcula plazos.", "Faltan los catálogos normativos con su vigencia y los calendarios de días inhábiles de los dos fueros. Los términos se capturan a mano y nacen sin verificar."],
              ["El importador de Excel está pendiente.", "La plantilla existe y define las columnas; falta la pantalla que la sube."],
              ["No lee documentos escaneados todavía.", "El OCR está diseñado —con bandas de confianza y confirmación humana— pero no construido."],
              ["No timbra facturas.", "Y no va a hacerlo: las emite el contador. El sistema solo registra el folio fiscal y guarda el PDF."],
              ["Faltan poderes y conflictos de intereses.", "Están en el plan del módulo de reportes."],
            ].map(([t, d]) => (
              <li key={t} className="flex gap-3">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--dorado-tinta)]" aria-hidden />
                <span>
                  <strong>{t}</strong>{" "}
                  <span className="text-[var(--muted-foreground)]">{d}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Pie */}
        <footer className="border-t border-[var(--border)] pt-5 text-xs text-[var(--muted-foreground)]">
          <p>
            IUS MODERNUM · Plataforma privada de gestión jurídica · Campeche, México.
            Los datos de esta demostración son ficticios.
          </p>
          <p className="mt-2">
            <Link href="/" className="font-medium text-[var(--verde)] underline-offset-4 hover:underline">
              Entrar al sistema
            </Link>
          </p>
        </footer>
      </main>
    </div>
  );
}
