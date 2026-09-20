/* ========================================================================
   Catálogo de proyectos de Lanvex.
   Para agregar un proyecto nuevo basta con copiar un objeto de esta lista.

   Campos:
     id        identificador único (se usa en el HTML)
     titulo    nombre comercial del sistema
     cliente   para quién se construyó (o el rubro, si es confidencial)
     categoria "salud" | "gestion" | "web"  (alimenta los filtros)
     autoria   "individual" | "grupal"
     estado    "demo"  -> tiene demo navegable
               "pronto" -> aún no hay demo publicada
     descripcion  2–3 líneas, orientadas a lo que el cliente gana
     stack     tecnologías visibles en la demo
     demo      ruta de la demo (null si todavía no existe)
     acento    color del mockup de la tarjeta
   ===================================================================== */

const PROYECTOS = [
  {
    id: 'expediente-clinico',
    titulo: 'Expediente Clínico Digital',
    cliente: 'Consultorio médico privado',
    categoria: 'salud',
    autoria: 'individual',
    estado: 'demo',
    descripcion:
      'Sustituye el folder de papel: historial, antecedentes, notas de consulta y recetas de cada paciente en una sola pantalla, con búsqueda inmediata.',
    stack: ['HTML', 'CSS', 'JavaScript'],
    demo: 'demos/expediente-clinico/index.html',
    acento: '#2a78d6'
  },

  /* ----------------------------------------------------------------
     A partir de aquí van tus demás proyectos. Los dejo marcados como
     "pronto" para que los completes: cambia título, cliente y
     descripción, y cuando publiques la demo pon estado: 'demo' y la
     ruta en `demo`. Si no quieres mostrarlos todavía, borra el objeto.
     ---------------------------------------------------------------- */
  {
    id: 'proyecto-2',
    titulo: 'Próximo sistema del catálogo',
    cliente: 'Por publicar',
    categoria: 'gestion',
    autoria: 'individual',
    estado: 'pronto',
    descripcion:
      'Espacio reservado para el siguiente sistema del catálogo. La demo navegable se publica aquí en cuanto esté lista.',
    stack: ['HTML', 'CSS', 'JavaScript'],
    demo: null,
    acento: '#1baf7a'
  },
  {
    id: 'proyecto-3',
    titulo: 'Próximo sistema del catálogo',
    cliente: 'Por publicar',
    categoria: 'web',
    autoria: 'grupal',
    estado: 'pronto',
    descripcion:
      'Espacio reservado para un proyecto desarrollado en equipo. Se indicará el rol que desempeñé dentro del grupo.',
    stack: ['HTML', 'CSS', 'JavaScript'],
    demo: null,
    acento: '#818cf8'
  }
];
