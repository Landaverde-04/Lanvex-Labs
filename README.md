# Lanvex — Galería de demos

Sitio web de la marca **Lanvex** (Kevin Landaverde). Es una **galería de demos**
de los sistemas que he desarrollado: cada proyecto tiene una demo navegable que
se puede recorrer sin registro ni instalación, para que quien visite el
portafolio vea el sistema funcionando en vez de leer una descripción.

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
  img/og-cover.png                Vista previa al compartir la portada
  img/og-cover-clinica.png        Vista previa al compartir la demo
  img/*.src.html                  Fuente editable de esas dos imágenes
demos/
  sistema-clinica/                Demo 1: sistema de gestión clínica
    index.html
    css/app.css
    js/data.js                    Pacientes, personal y cola (ficticios)
    js/app.js                     Lógica de la demo
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

## Demo incluida: Sistema de Gestión Clínica (`demos/sistema-clinica/`)

Reproducción navegable del sistema web interno que desarrollé **en equipo para
Clínica ProSalud** (Django + PostgreSQL). La demo es estática —HTML, CSS y
JavaScript— pero respeta la identidad visual real (paleta "Verde salud"), la
estructura de pantallas y, sobre todo, el flujo de trabajo del sistema
entregado.

**Lo que el visitante puede hacer:**

- **Cambiar de rol** desde la barra superior: Enfermera, Doctor y Doctora
  Administradora. Cambian el menú, las acciones disponibles y lo que se ve en
  cada pantalla, igual que con los permisos del sistema real.
- Buscar pacientes por nombre, DUI o teléfono (funciona sin tildes y por
  palabras sueltas, por los nombres compuestos).
- Registrar un paciente adulto o menor de edad: la **edad real** decide si se
  exige responsable, no el interruptor de la pantalla.
- Abrir un expediente: cabecera con contactos, antecedentes, controles
  pendientes y últimos signos vitales, más el panel de tarjetas del historial.
- **Registrar la preconsulta** (enfermería): signos vitales, IMC calculado en
  vivo para menores, y elegir a qué médico se manda, viendo cuántos pacientes
  tiene cada uno en espera.
- **Administrar la cola**: tablero con la cola de cada médico, reasignar a otro
  médico, marcar emergencia con motivo obligatorio y registrar el retiro de un
  paciente que se fue antes de pasar.
- **Atender la consulta** (médico): ve solo su propia cola, con el siguiente
  paciente destacado; nota clínica con campos separados y preguardado
  automático.
- **Emitir la receta**, que es la que cierra la consulta: sale con el membrete
  de la clínica, su folio y la firma, lista para imprimir.
- Cambiar de clínica (la doctora pertenece a dos): cambia el logo, la paleta y
  las pantallas disponibles — la clínica estética atiende por cita, sin cola.

**Qué no está en la demo:** las pantallas de Usuarios, Roles y Bitácora
aparecen en el menú con candado. Existen en el sistema entregado, pero no se
recorren aquí para no alargar el flujo.

**Datos:** todo es ficticio —pacientes, personal, teléfonos, DUI y la dirección
de la clínica—. Las fechas se guardan como "hace N días" y se calculan al
cargar, así que la demo siempre se ve actual. Nada se guarda: al recargar,
todo vuelve a su estado inicial.

---

## Vista previa al compartir el enlace

Cuando pegas el enlace en LinkedIn o WhatsApp, la miniatura sale de la etiqueta
`og:image` del `<head>`. Hay dos imágenes de 1200×630: una para la portada y
otra para la demo de la clínica.

Para regenerarlas después de editar su `.src.html`:

```bash
chrome --headless --window-size=1200,630   --screenshot=assets/img/og-cover.png   assets/img/og-cover.src.html
```

> ⚠️ `og:image` y `og:url` llevan la **URL absoluta** del sitio; los scrapers no
> resuelven rutas relativas. Si algún día se muda a un dominio propio, hay que
> cambiar el dominio en esas etiquetas, en `index.html` y en la demo.

Para que LinkedIn deje de mostrar una miniatura vieja, pasa la URL por el
[Post Inspector](https://www.linkedin.com/post-inspector/) y dale a *Inspect*:
refresca su caché al instante.

---

## Antes de publicar

- El catálogo trae dos tarjetas de relleno marcadas como `'pronto'` en
  `assets/data/projects.js`. Reemplázalas con proyectos reales o bórralas.
- La demo nombra a **Clínica ProSalud** como cliente. Pídele permiso a la
  doctora antes de dejarlo público, aunque los datos de adentro sean
  inventados.

---

## Publicar en línea

Al ser archivos estáticos, sirve cualquier hosting gratuito. Con **GitHub
Pages**: entra a *Settings → Pages*, elige la rama y la carpeta raíz (`/`), y el
sitio queda publicado en unos minutos.
