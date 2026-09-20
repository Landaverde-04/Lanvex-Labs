# Lanvex — Catálogo de sistemas

Sitio web de la marca **Lanvex** (Kevin Landaverde). Funciona como catálogo de
los sistemas que he desarrollado: cada proyecto tiene una **demo navegable** que
el cliente puede recorrer sin registrarse, para que vea cómo se siente el
sistema antes de contratar.

Todo está hecho con **HTML, CSS y JavaScript puros**. No hay compiladores, ni
dependencias, ni servidor: basta abrir `index.html` en el navegador.

---

## Estructura

```
index.html                        Portada: hero, catálogo, servicios, contacto
assets/
  css/site.css                    Estilos del sitio
  js/site.js                      Menú, filtros del catálogo, animaciones
  data/projects.js                ← Lista de proyectos del catálogo
demos/
  expediente-clinico/             Demo 1: módulo de expediente clínico
    index.html
    css/app.css
    js/data.js                    Pacientes de ejemplo (ficticios)
    js/app.js                     Lógica del módulo
```

## Cómo verlo

Abre `index.html` con doble clic. Si prefieres un servidor local:

```bash
python3 -m http.server 8000
# luego abre http://localhost:8000
```

---

## Agregar un proyecto al catálogo

Todo el catálogo se genera desde **`assets/data/projects.js`**. Para publicar un
proyecto nuevo, copia uno de los objetos de la lista y cambia sus campos:

```js
{
  id: 'inventario-farmacia',
  titulo: 'Control de Inventario',
  cliente: 'Farmacia',              // o el rubro, si el nombre es confidencial
  categoria: 'gestion',             // 'salud' | 'gestion' | 'web' — alimenta los filtros
  autoria: 'individual',            // 'individual' | 'grupal'
  estado: 'demo',                   // 'demo' si ya hay demo, 'pronto' si aún no
  descripcion: 'Qué gana el cliente con este sistema, en 2 o 3 líneas.',
  stack: ['HTML', 'CSS', 'JavaScript'],
  demo: 'demos/inventario-farmacia/index.html',   // null si todavía no existe
  acento: '#1baf7a'                 // color del mockup de la tarjeta
}
```

Los proyectos hechos en equipo se marcan con `autoria: 'grupal'` y la tarjeta
muestra la etiqueta **"Proyecto grupal"** automáticamente.

> En la lista quedaron dos tarjetas de ejemplo marcadas como `'pronto'`.
> Reemplázalas con tus proyectos reales o bórralas.

---

## Demo incluida: Expediente Clínico (`demos/expediente-clinico/`)

Módulo de expediente para un consultorio médico. Es la versión **básica a
propósito**: muestra lo esencial bien resuelto para que el cliente entienda el
valor y pregunte por el resto.

**Lo que el visitante puede hacer:**

- Ver la lista de pacientes, buscarlos por nombre o expediente (funciona aunque
  escriba sin tildes) y filtrarlos por estado o por alergias.
- Abrir un expediente y recorrer sus cinco pestañas: resumen, antecedentes,
  consultas, recetas y estudios.
- Leer los signos vitales con su interpretación automática (presión, IMC y
  glucosa se marcan en ámbar o rojo cuando salen de rango).
- Ver la gráfica de evolución de peso, presión, glucosa o frecuencia cardiaca,
  con el dato exacto al pasar el cursor o tocar la pantalla.
- **Registrar una consulta nueva**: la nota aparece en el historial y sus signos
  vitales se suman a la gráfica al instante.
- **Crear un expediente nuevo** desde cero.
- Abrir una receta con formato imprimible (el botón *Imprimir* saca solo la
  hoja de receta, sin el resto de la pantalla).

**Lo que está deliberadamente bloqueado:** Agenda, Recetas, Laboratorio,
Reportes y Configuración. Al hacer clic explican que se construyen a la medida
y llevan al formulario de contacto.

**Datos:** todos los pacientes son ficticios y viven en `js/data.js`. Las fechas
se guardan como "hace N días" y se calculan al cargar la página, así que la demo
siempre se ve actual sin tener que actualizar el archivo. Nada se guarda: al
recargar, todo vuelve a su estado inicial.

---

## Antes de publicar

Un par de datos son de relleno y conviene cambiarlos:

- El número de WhatsApp en `index.html` (`wa.me/50300000000`).
- El correo de contacto, si quieres usar uno distinto al que está puesto.
- Los datos de la doctora en `demos/expediente-clinico/js/data.js` (objeto
  `MEDICO`): nombre, cédula, dirección y teléfono son ficticios a propósito.
  Si vas a mostrar la demo como trabajo hecho para una clienta real, pídele
  permiso antes de usar su nombre.

## Publicar en línea

Al ser archivos estáticos, sirve cualquier hosting gratuito. Con **GitHub
Pages**: entra a *Settings → Pages*, elige la rama y la carpeta raíz (`/`), y el
sitio queda publicado en unos minutos.
