/* ========================================================================
   Demo · Sistema de gestión clínica (Clínica ProSalud)

   Reproduce el ciclo de atención del sistema real:
     preconsulta (enfermería) → cola por médico → atención → receta

   El sistema real es Django + PostgreSQL con permisos por rol. Aquí todo
   corre en el navegador y nada se guarda: al recargar vuelve al inicio.
   ===================================================================== */
(function () {
  'use strict';

  /* ===================== Utilidades ===================== */

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  const esc = (v) => String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

  const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

  const fFecha = (f) => `${f.getDate()} de ${MESES[f.getMonth()]} de ${f.getFullYear()}`;

  const fCorta = (f) => `${String(f.getDate()).padStart(2, '0')}/${String(f.getMonth() + 1).padStart(2, '0')}/${f.getFullYear()}`;

  const fHora = (f) => `${String(f.getHours()).padStart(2, '0')}:${String(f.getMinutes()).padStart(2, '0')}`;

  /* "hace 3 días", "hace 1 mes", "hace 25 minutos". Singular y plural. */
  function relativo(f) {
    const min = Math.round((Date.now() - f.getTime()) / 60000);
    if (min < 1) return 'hace un momento';
    if (min < 60) return `hace ${min} ${min === 1 ? 'minuto' : 'minutos'}`;
    const horas = Math.round(min / 60);
    if (horas < 24) return `hace ${horas} ${horas === 1 ? 'hora' : 'horas'}`;
    const dias = Math.round(min / 1440);
    if (dias < 30) return `hace ${dias} ${dias === 1 ? 'día' : 'días'}`;
    const meses = Math.round(dias / 30);
    if (meses < 12) return `hace ${meses} ${meses === 1 ? 'mes' : 'meses'}`;
    const anios = Math.floor(dias / 365);
    return `hace ${anios} ${anios === 1 ? 'año' : 'años'}`;
  }

  /* Cuánto lleva esperando, en el formato corto de la cola */
  function espera(f) {
    const min = Math.max(0, Math.round((Date.now() - f.getTime()) / 60000));
    if (min < 60) return `${min} min`;
    const horas = Math.floor(min / 60);
    return `${horas} h ${min % 60} min`;
  }

  function fechaDesdeDias(dias) {
    const f = new Date();
    f.setHours(9, 30, 0, 0);
    f.setDate(f.getDate() - dias);
    return f;
  }

  function fechaDesdeMinutos(min) {
    return new Date(Date.now() - min * 60000);
  }

  function edadDe(nacimiento) {
    const n = new Date(nacimiento + 'T00:00:00');
    const hoy = new Date();
    let e = hoy.getFullYear() - n.getFullYear();
    const m = hoy.getMonth() - n.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < n.getDate())) e--;
    return e;
  }

  /* Quita acentos: el buscador del sistema real encuentra "guzman"
     escribiendo sin tilde, usando unaccent de PostgreSQL. */
  const normaliza = (t) => String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  const iniciales = (nombres, apellidos) =>
    ((nombres || ' ')[0] + (apellidos || ' ')[0]).toUpperCase();

  const nombreCompleto = (p) => `${p.nombres} ${p.apellidos}`;

  /* ===================== Iconos ===================== */

  const svg = (d, extra) =>
    `<svg width="${(extra && extra.size) || 18}" height="${(extra && extra.size) || 18}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${(extra && extra.w) || 1.9}" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;

  const ICON = {
    inicio: svg('<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>'),
    pacientes: svg('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/>'),
    nuevoPaciente: svg('<path d="M15 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>'),
    cola: svg('<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4.5 5v3M3.5 5h1.5M3.5 8h2"/><path d="M3.5 11.5h2l-2 2.5h2"/><path d="M3.5 17h2v3h-2v-1.5h2"/>'),
    usuarios: svg('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>'),
    roles: svg('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="M9.5 12.5 11 14l3.5-3.5"/>'),
    bitacora: svg('<path d="M4 4h12l4 4v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z"/><path d="M15 4v5h5M8 13h8M8 17h5"/>'),
    lock: svg('<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>', { size: 13, w: 2 }),
    buscar: svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>', { size: 16, w: 2.2 }),
    reloj: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', { size: 14 }),
    espera: svg('<path d="M6 2h12M6 22h12"/><path d="M6 2c0 4 3 5 3 10 0-5 3-6 3-10M18 2c0 4-3 5-3 10 0-5-3-6-3-10"/><path d="M6 22c0-4 3-5 3-10M18 22c0-4-3-5-3-10"/>'),
    cronometro: svg('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/>'),
    check: svg('<circle cx="12" cy="12" r="9"/><path d="m8.5 12.5 2.5 2.5 4.5-5"/>'),
    alerta: svg('<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>'),
    play: svg('<path d="M6 4.5v15l13-7.5z" fill="currentColor" stroke="none"/>'),
    volver: svg('<path d="M19 12H5M11 6l-6 6 6 6"/>', { size: 15 }),
    flecha: svg('<path d="M9 6l6 6-6 6"/>', { size: 15 }),
    folder: svg('<path d="M4 4h10l6 6v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z"/><path d="M14 4v6h6M9 14h6M9 17h4"/>', { size: 26 }),
    pulso: svg('<path d="M3 12h4l2.5-6 4 12L16 12h5"/>', { size: 26 }),
    receta: svg('<path d="M5 4h6a3 3 0 0 1 0 6H5zM5 10l8 10"/><path d="m14 14 6 6M20 14l-6 6"/>', { size: 26 }),
    documento: svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 15h6M9 11h2"/>', { size: 26 }),
    antecedentes: svg('<path d="M4 4h12l4 4v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z"/><path d="M12 9v6M9 12h6"/>', { size: 26 }),
    enviar: svg('<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>', { size: 26 }),
    editar: svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>', { size: 14 }),
    reasignar: svg('<path d="M17 3l4 4-4 4"/><path d="M3 7h18"/><path d="M7 21l-4-4 4-4"/><path d="M21 17H3"/>', { size: 14 }),
    salir: svg('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>', { size: 14 }),
    emergencia: svg('<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>', { size: 14 }),
    imprimir: svg('<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/>', { size: 15 }),
    cerrar: svg('<path d="M18 6 6 18M6 6l12 12"/>', { size: 18, w: 2 }),
    info: svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>', { size: 16 }),
    personas: svg('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>', { size: 30 })
  };

  /* ===================== Estado ===================== */

  /* Se clona el dataset y se resuelven las fechas relativas. */
  const pacientes = PACIENTES.map((p) => ({
    ...p,
    contactos: p.contactos.map((c) => ({ ...c, activo: true })),
    antecedentes: p.antecedentes.map((a) => ({ ...a })),
    controles: p.controles.map((c) => ({ ...c, fecha: fechaDesdeDias(c.d) })),
    consultas: p.consultas.map((c, i) => ({
      ...c,
      id: `${p.id}-c${i}`,
      fecha: fechaDesdeDias(c.d),
      cerrada: true
    }))
  }));

  let contadorConsulta = 0;
  let contadorFolio = 2420;

  /* Consultas vivas: las de la cola y las que se van creando. */
  const consultas = COLA_INICIAL.map((c) => ({
    id: `q${++contadorConsulta}`,
    pacienteId: c.paciente,
    doctorId: c.doctor,
    horaLlegada: fechaDesdeMinutos(c.m),
    inicio: null,
    cierre: null,
    esEmergencia: c.esEmergencia,
    motivoPrioridad: c.motivoPrioridad || '',
    reasignadoDesde: c.reasignadoDesde || '',
    notaRetiro: '',
    vitales: { ...c.vitales },
    motivo: '',
    historia: '',
    examen: '',
    diagnostico: '',
    tratamiento: '',
    indicaciones: '',
    receta: null,
    documentos: []
  }));

  const estado = {
    usuarioId: 'u-enf',
    clinicaId: 'prosalud',
    vista: 'inicio',
    pacienteId: null,
    consultaId: null,
    busqueda: '',
    vistaAdmin: 'enfermeria',   // switch de la Doctora Administradora en la cola
    tabExpediente: 'panel'
  };

  const usuario = () => USUARIOS.find((u) => u.id === estado.usuarioId);
  const clinica = () => CLINICAS.find((c) => c.id === estado.clinicaId);
  const permisos = () => PERMISOS[usuario().rol];
  const getPaciente = (id) => pacientes.find((p) => p.id === id);
  const getConsulta = (id) => consultas.find((c) => c.id === id);
  const getUsuario = (id) => USUARIOS.find((u) => u.id === id);

  /* Médicos de la clínica activa que pueden tener cola. */
  const medicosDeClinica = () =>
    MEDICOS.map(getUsuario).filter((m) => m.clinicas.includes(estado.clinicaId));

  const enCola = (doctorId) => consultas.filter((c) =>
    c.inicio === null && c.cierre === null &&
    getPaciente(c.pacienteId).clinica === estado.clinicaId &&
    (doctorId ? c.doctorId === doctorId : true)
  ).sort((a, b) => (b.esEmergencia - a.esEmergencia) || (a.horaLlegada - b.horaLlegada));

  const enAtencion = (doctorId) => consultas.filter((c) =>
    c.inicio !== null && c.cierre === null &&
    (doctorId ? c.doctorId === doctorId : true)
  );

  /* ===================== Avisos ===================== */

  function toast(titulo, texto) {
    const cont = $('#toasts');
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `${ICON.check}<div><b>${esc(titulo)}</b><span>${esc(texto)}</span></div>`;
    cont.appendChild(el);
    setTimeout(() => {
      el.style.transition = 'opacity .3s ease';
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 320);
    }, 5200);
  }

  /* ===================== Modales ===================== */

  let alCerrarModal = null;

  function abrirModal(html, opciones) {
    const modal = $('#modal');
    modal.className = 'modal' + ((opciones && opciones.ancho) ? ' modal--wide' : '');
    modal.innerHTML = html;
    $('#overlay').hidden = false;
    document.body.style.overflow = 'hidden';
    alCerrarModal = (opciones && opciones.alCerrar) || null;
    const primero = modal.querySelector('input, textarea, select, button');
    if (primero) primero.focus();
  }

  function cerrarModal() {
    $('#overlay').hidden = true;
    $('#modal').innerHTML = '';
    document.body.style.overflow = '';
    if (alCerrarModal) { const f = alCerrarModal; alCerrarModal = null; f(); }
  }

  $('#overlay').addEventListener('click', (e) => {
    if (e.target.id === 'overlay' || e.target.closest('[data-cerrar]')) cerrarModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !$('#overlay').hidden) cerrarModal();
  });

  function cabezaModal(titulo, sub) {
    return `<div class="modal__head no-print">
      <div>
        <h2 id="modalTitulo">${esc(titulo)}</h2>
        ${sub ? `<p>${esc(sub)}</p>` : ''}
      </div>
      <button class="modal__close" data-cerrar aria-label="Cerrar">${ICON.cerrar}</button>
    </div>`;
  }

  /* Módulo que existe en el sistema real pero no se recorre en la demo. */
  function modalBloqueado(nombre, detalle) {
    abrirModal(`${cabezaModal(nombre, 'Módulo del sistema real')}
      <div class="modal__body">
        <div class="alert alert--info">${ICON.info}<div>${esc(detalle)}</div></div>
        <p class="small muted">Esta demo recorre el ciclo de atención completo: preconsulta, cola,
        atención y receta. Los módulos de administración existen en el sistema entregado, pero no
        se incluyen aquí para no alargar el recorrido.</p>
      </div>
      <div class="modal__foot">
        <button class="btn" data-cerrar>Entendido</button>
        <a class="btn btn--primary" href="../../index.html#proyectos">Ver más proyectos</a>
      </div>`);
  }

  /* ===================== Sidebar y topbar ===================== */

  function pintarSidebar() {
    const perm = permisos();
    const u = usuario();
    const cl = clinica();
    const items = [];

    const item = (id, icono, texto, extra) => {
      const activa = estado.vista === id ? ' is-active' : '';
      return `<button class="navitem${activa}" data-ir="${id}" title="${esc(texto)}" aria-label="${esc(texto)}"${estado.vista === id ? ' aria-current="page"' : ''}>${icono}<span>${esc(texto)}</span>${extra || ''}</button>`;
    };

    const bloqueado = (nombre, detalle) =>
      `<button class="navitem" data-bloqueado="${esc(nombre)}" data-detalle="${esc(detalle)}" title="${esc(nombre)}" aria-label="${esc(nombre)}">
        ${ICON[nombre === 'Usuarios' ? 'usuarios' : nombre === 'Roles' ? 'roles' : 'bitacora']}
        <span>${esc(nombre)}</span><span class="navitem__lock">${ICON.lock}</span>
      </button>`;

    items.push(item('inicio', ICON.inicio, 'Inicio'));

    if (perm.verPacientes) {
      items.push('<div class="sidebar__section">Pacientes</div>');
      items.push(item('pacientes', ICON.pacientes, 'Lista de pacientes'));
      if (perm.registrarPaciente) {
        items.push(item('registrar', ICON.nuevoPaciente, 'Nuevo paciente'));
      }
      if (perm.verCola && cl.usaCola) {
        const total = perm.soloSuCola ? enCola(u.id).length : enCola().length;
        const badge = total ? `<span class="navitem__count">${total}</span>` : '';
        items.push(item('cola', ICON.cola, 'Cola de consulta', badge));
      }
    }

    if (perm.seguridad) {
      items.push('<div class="sidebar__section">Seguridad</div>');
      items.push(bloqueado('Usuarios', 'Alta de usuarios del personal, asignación de rol y de clínica, reseteo de contraseña y desactivación sin borrar el historial.'));
      items.push(bloqueado('Roles', 'Roles con permisos por pantalla, agrupados por módulo. Un usuario tiene un solo rol.'));
      items.push(bloqueado('Bitácora', 'Registro de auditoría: quién hizo qué y cuándo, con el antes y el después de cada cambio.'));
    }

    $('#marca').innerHTML = cl.id === 'prosalud'
      ? `<span class="sidebar__logo"><small>CLÍNICA</small>PR<span>&#10084;</span>SALUD</span>`
      : `<span class="sidebar__logo"><small>MEDICINA</small>EST<span>&#201;</span>TICA</span>`;

    $('#sidebarNav').innerHTML = items.join('');

    $('#sidebarUser').innerHTML =
      `<span class="avatar avatar--sm ${u.genero === 'f' ? 'avatar--f' : ''}">${esc(u.iniciales)}</span>
       <span><b>${esc(u.nombre)}</b><small>${esc(u.rol)}</small></span>`;

    /* Selector de clínica: solo para quien pertenece a más de una */
    const suyas = CLINICAS.filter((c) => u.clinicas.includes(c.id));
    $('#selectorClinica').hidden = suyas.length < 2;
    $('#clinicasGroup').innerHTML = suyas.map((c) =>
      `<button class="clinicas__opt${c.id === estado.clinicaId ? ' is-active' : ''}" data-clinica="${c.id}">${esc(c.nombre)}</button>`
    ).join('');

    document.documentElement.setAttribute('data-tema', cl.tema);
  }

  function pintarTopbar() {
    const u = usuario();
    $('#rolePicker').innerHTML = USUARIOS.map((x) =>
      `<button class="rolepicker__opt${x.id === estado.usuarioId ? ' is-active' : ''}" data-usuario="${x.id}">${esc(x.rol === 'Doctora Administradora' ? 'Administradora' : x.rol)}</button>`
    ).join('');
    $('#userAvatar').textContent = u.iniciales;
    $('#userAvatar').className = 'avatar avatar--sm' + (u.genero === 'f' ? ' avatar--f' : '');
    $('#userName').textContent = u.tratamiento;
    $('#userRole').textContent = u.rol;
  }

  /* ===================== Pantalla: Inicio ===================== */

  function vistaInicio() {
    const u = usuario();
    const perm = permisos();
    const cl = clinica();
    const hoy = new Date();
    const soloSuyo = !!perm.soloSuCola;

    const espera_ = soloSuyo ? enCola(u.id) : enCola();
    const atendiendo = soloSuyo ? enAtencion(u.id) : enAtencion();
    const emergencias = espera_.filter((c) => c.esEmergencia).length;
    const atendidos = soloSuyo
      ? (CIFRAS_DIA.atendidosPorMedico[u.id] || 0)
      : CIFRAS_DIA.atendidosHoy;

    let cifras = '';
    if (cl.usaCola && perm.verCola) {
      cifras = `<div class="stats-grid">
        <button class="stat-card" data-ir="cola">
          ${emergencias ? `<span class="stat-card__flag"><span class="badge badge--danger">${ICON.emergencia} ${emergencias}</span></span>` : ''}
          <span class="stat-card__icon">${ICON.espera}</span>
          <div class="stat-card__value">${espera_.length}</div>
          <div class="stat-card__label">${soloSuyo ? 'En tu cola' : 'En espera'}</div>
        </button>
        <div class="stat-card">
          <span class="stat-card__icon stat-card__icon--amber">${ICON.cronometro}</span>
          <div class="stat-card__value">${atendiendo.length}</div>
          <div class="stat-card__label">${soloSuyo ? 'Atendiendo ahora' : 'En consulta ahora'}</div>
        </div>
        <div class="stat-card">
          <span class="stat-card__icon">${ICON.check}</span>
          <div class="stat-card__value">${atendidos}</div>
          <div class="stat-card__label">${soloSuyo ? 'Atendiste hoy' : 'Atendidos hoy'}</div>
        </div>
        ${perm.registrarPaciente ? `<div class="stat-card">
          <span class="stat-card__icon">${ICON.nuevoPaciente}</span>
          <div class="stat-card__value">${CIFRAS_DIA.nuevosHoy}</div>
          <div class="stat-card__label">Pacientes nuevos hoy</div>
        </div>` : ''}
      </div>`;
    }

    /* Accesos rápidos según permisos */
    const accesos = [];
    if (perm.verPacientes) {
      accesos.push({ id: 'pacientes', icono: ICON.pacientes, t: 'Lista de pacientes', d: 'Buscar y abrir un expediente' });
    }
    if (perm.registrarPaciente) {
      accesos.push({ id: 'registrar', icono: ICON.nuevoPaciente, t: 'Nuevo paciente', d: 'Registrar adulto o menor de edad' });
    }
    if (perm.verCola && cl.usaCola) {
      accesos.push({ id: 'cola', icono: ICON.cola, t: 'Cola de consulta', d: soloSuyo ? 'Atender a tus pacientes' : 'Tablero de todos los médicos' });
    }

    /* Panel lateral: al médico le muestra a quién sigue */
    let panel = '';
    if (perm.atender && cl.usaCola) {
      const mios = enCola(u.id).slice(0, 4);
      panel = `<div>
        <div class="eyebrow">Tus próximos pacientes</div>
        <div class="card"><div class="card__body">
          ${mios.length ? mios.map((c, i) => {
            const p = getPaciente(c.pacienteId);
            return `<div class="queue-item">
              <span class="badge badge--num ${c.esEmergencia ? 'badge--num-emg' : i === 0 ? 'badge--num-first' : ''}">${i + 1}</span>
              <div class="queue-item__body">
                <div class="queue-item__name">${esc(nombreCompleto(p))}</div>
                <div class="queue-item__meta">Llegó a las ${fHora(c.horaLlegada)} · ${espera(c.horaLlegada)} esperando</div>
              </div>
            </div>`;
          }).join('') : `<p class="small muted mb-0">No tienes pacientes en espera.</p>`}
        </div></div>
      </div>`;
    } else if (perm.gestionarCola && cl.usaCola) {
      panel = `<div>
        <div class="eyebrow">Carga por médico</div>
        <div class="card"><div class="card__body stack-sm">
          ${medicosDeClinica().map((m) => {
            const n = enCola(m.id).length;
            return `<div class="row-between">
              <span class="small strong">${esc(m.tratamiento)}</span>
              <span class="badge ${n ? 'badge--soft' : 'badge--muted'}">${n} en espera</span>
            </div>`;
          }).join('')}
        </div></div>
      </div>`;
    }

    return `<div class="page">
      <div class="page-head">
        <div>
          <div class="eyebrow">${esc(DIAS[hoy.getDay()])} ${hoy.getDate()} de ${MESES[hoy.getMonth()]}</div>
          <h1>${esc(cl.nombreLargo)}</h1>
        </div>
        <div class="small muted">${esc(u.tratamiento)} · <span class="badge badge--soft">${esc(u.rol)}</span></div>
      </div>

      ${cifras}

      <div class="home-grid">
        <div>
          <div class="eyebrow">Accesos rápidos</div>
          <div class="access-grid">
            ${accesos.map((a) => `<button class="access" data-ir="${a.id}">
              <span class="access__icon">${a.icono}</span>
              <span>
                <span class="access__title">${esc(a.t)}</span>
                <span class="access__desc">${esc(a.d)}</span>
              </span>
              <span class="access__arrow">${ICON.flecha}</span>
            </button>`).join('')}
          </div>
        </div>
        ${panel}
      </div>
    </div>`;
  }

  /* ===================== Pantalla: Lista de pacientes ===================== */

  function pacientesFiltrados() {
    const q = normaliza(estado.busqueda.trim());
    return pacientes.filter((p) => {
      if (p.clinica !== estado.clinicaId) return false;
      if (!q) return true;
      /* El sistema real busca por palabras sueltas, por los nombres
         compuestos: "guzman maria" también encuentra a María Guzmán. */
      const campos = normaliza(`${p.nombres} ${p.apellidos} ${p.dui} ${p.telefono}`);
      return q.split(/\s+/).every((palabra) => campos.includes(palabra));
    });
  }

  function vistaPacientes() {
    const perm = permisos();
    const cl = clinica();
    const lista = pacientesFiltrados();

    const filas = lista.map((p) => {
      const edad = edadDe(p.nacimiento);
      const enEspera = consultas.find((c) =>
        c.pacienteId === p.id && c.cierre === null);
      const acciones = [];

      if (perm.registrarPreconsulta && cl.usaCola && !enEspera) {
        acciones.push(`<button class="btn btn--sm btn--ghost" data-preconsulta="${p.id}">${ICON.editar} Enviar a consulta</button>`);
      }
      if (enEspera) {
        acciones.push(`<span class="badge badge--warn">${enEspera.inicio ? 'En consulta' : 'En cola'}</span>`);
      }
      if (!acciones.length) acciones.push('<span class="td-muted">—</span>');

      const contactoDe = pacientes.filter((otro) =>
        otro.id !== p.id && otro.contactos.some((c) =>
          c.activo && `${c.nombres} ${c.apellidos}` === nombreCompleto(p)));

      return `<tr class="${perm.verExpediente ? 'is-clickable' : ''}" data-expediente="${p.id}">
        <td data-label="Nombre" class="td-strong">${esc(nombreCompleto(p))}</td>
        <td data-label="Edad">${edad} años</td>
        <td data-label="DUI" class="td-muted">${p.dui ? esc(p.dui) : (edad < 18 ? 'Menor de edad' : 'Sin DUI')}</td>
        <td data-label="Teléfono" class="td-muted">${esc(p.telefono || '—')}</td>
        <td data-label="También contacto de" class="td-muted">${contactoDe.length ? esc(contactoDe.map(nombreCompleto).join(', ')) : '—'}</td>
        <td data-label=""><div class="row-actions">${acciones.join('')}</div></td>
      </tr>`;
    }).join('');

    return `<div class="page">
      <div class="page-head">
        <div>
          <h1>Pacientes</h1>
          <p>${lista.length} paciente${lista.length === 1 ? '' : 's'} con expediente en ${esc(cl.nombreLargo)}</p>
        </div>
        ${perm.registrarPaciente ? `<button class="btn btn--primary" data-ir="registrar">${ICON.nuevoPaciente} Nuevo paciente</button>` : ''}
      </div>

      <div class="toolbar">
        <label class="search">
          ${ICON.buscar}
          <input type="search" id="buscador" value="${esc(estado.busqueda)}"
                 placeholder="Buscar por nombre, DUI o teléfono…" aria-label="Buscar paciente" autocomplete="off">
        </label>
        <span class="toolbar__count">Busca sin tildes: <b>guzman</b> encuentra a <b>Guzmán</b></span>
      </div>

      ${lista.length ? `<div class="card table-wrap">
        <table class="table">
          <thead><tr>
            <th>Nombre completo</th><th>Edad</th><th>DUI</th>
            <th>Teléfono</th><th>También es contacto de</th><th>Acciones</th>
          </tr></thead>
          <tbody>${filas}</tbody>
        </table>
      </div>` : `<div class="card"><div class="empty">
        ${ICON.buscar}
        <p>No se encontraron pacientes con ese criterio.</p>
      </div></div>`}
    </div>`;
  }

  /* ===================== Pantalla: Registrar paciente ===================== */

  let registroEsMenor = false;

  function vistaRegistrar() {
    return `<div class="page">
      <button class="backlink" data-ir="pacientes">${ICON.volver} Volver a pacientes</button>
      <div class="page-head">
        <div>
          <h1>Registrar paciente</h1>
          <p>El sistema decide por la fecha de nacimiento, no por el interruptor: si es menor, el responsable es obligatorio.</p>
        </div>
      </div>

      <div class="card" style="max-width:760px">
        <div class="card__body">
          <div class="switch-group" role="group" aria-label="Tipo de paciente">
            <button data-tipo="adulto" class="${registroEsMenor ? '' : 'is-active'}">Adulto</button>
            <button data-tipo="menor" class="${registroEsMenor ? 'is-active' : ''}">Menor de edad</button>
          </div>

          <form id="formPaciente" novalidate>
            <div class="form-grid">
              <div class="form-row">
                <label class="form-label" for="rNombres">Nombres <span class="req">*</span></label>
                <input class="input" id="rNombres" name="nombres" required>
              </div>
              <div class="form-row">
                <label class="form-label" for="rApellidos">Apellidos <span class="req">*</span></label>
                <input class="input" id="rApellidos" name="apellidos" required>
              </div>
              <div class="form-row">
                <label class="form-label" for="rNacimiento">Fecha de nacimiento <span class="req">*</span></label>
                <input class="input" id="rNacimiento" name="nacimiento" type="date" required>
                <div class="form-help" id="avisoEdad"></div>
              </div>
              <div class="form-row">
                <label class="form-label" for="rSexo">Sexo</label>
                <select class="select" id="rSexo" name="sexo">
                  <option value="F">Femenino</option>
                  <option value="M">Masculino</option>
                </select>
              </div>
              <div class="form-row" id="filaDui">
                <label class="form-label" for="rDui">DUI ${registroEsMenor ? '' : '<span class="req">*</span>'}</label>
                <input class="input" id="rDui" name="dui" placeholder="00000000-0" maxlength="10"
                       ${registroEsMenor ? 'disabled' : ''}>
                <div class="form-help">${registroEsMenor ? 'Un menor no tiene DUI. Se registra al cumplir 18.' : 'Se formatea solo al escribir.'}</div>
              </div>
              <div class="form-row">
                <label class="form-label" for="rTelefono">Teléfono</label>
                <input class="input" id="rTelefono" name="telefono" placeholder="0000-0000" maxlength="9">
              </div>
            </div>

            <hr class="divider">

            <div class="subhead">${registroEsMenor ? 'Responsable (obligatorio)' : 'Contacto de referencia (opcional)'}</div>
            <div class="form-grid">
              <div class="form-row">
                <label class="form-label" for="cNombres">Nombres ${registroEsMenor ? '<span class="req">*</span>' : ''}</label>
                <input class="input" id="cNombres" name="cNombres">
              </div>
              <div class="form-row">
                <label class="form-label" for="cApellidos">Apellidos ${registroEsMenor ? '<span class="req">*</span>' : ''}</label>
                <input class="input" id="cApellidos" name="cApellidos">
              </div>
              <div class="form-row">
                <label class="form-label" for="cTelefono">Teléfono</label>
                <input class="input" id="cTelefono" name="cTelefono" placeholder="0000-0000" maxlength="9">
              </div>
              <div class="form-row">
                <label class="form-label" for="cParentesco">Parentesco ${registroEsMenor ? '<span class="req">*</span>' : ''}</label>
                <select class="select" id="cParentesco" name="cParentesco">
                  <option value="">Seleccionar…</option>
                  ${PARENTESCOS.map((x) => `<option>${esc(x)}</option>`).join('')}
                </select>
              </div>
            </div>

            <div id="erroresRegistro"></div>

            <div class="row-between mt-2" style="justify-content:flex-end">
              <button type="button" class="btn" data-ir="pacientes">Cancelar</button>
              <button type="submit" class="btn btn--primary">Guardar paciente</button>
            </div>
          </form>
        </div>
      </div>
    </div>`;
  }

  /* ===================== Pantalla: Expediente ===================== */

  function bloqueVitales(v, edad, titulo) {
    if (!v) return '';
    const items = [];
    const fuera = (cond) => cond ? ' vital--medio' : '';

    if (v.presion) {
      const [pas, pad] = v.presion.split('/').map(Number);
      items.push(`<div class="vital${fuera(pas >= 140 || pad >= 90)}">
        <div class="vital__label">Presión arterial</div>
        <div class="vital__value">${esc(v.presion)} <small>mmHg</small></div>
      </div>`);
    }
    if (v.peso != null) {
      items.push(`<div class="vital">
        <div class="vital__label">Peso</div>
        <div class="vital__value">${v.peso} <small>kg</small></div>
      </div>`);
    }
    if (v.talla != null) {
      items.push(`<div class="vital">
        <div class="vital__label">Talla</div>
        <div class="vital__value">${v.talla} <small>m</small></div>
      </div>`);
    }
    if (v.imc != null) {
      items.push(`<div class="vital">
        <div class="vital__label">IMC</div>
        <div class="vital__value">${v.imc}</div>
        <div class="vital__note muted">Calculado en la preconsulta</div>
      </div>`);
    }
    if (v.temp != null) {
      items.push(`<div class="vital${fuera(v.temp >= 38)}">
        <div class="vital__label">Temperatura</div>
        <div class="vital__value">${v.temp} <small>°C</small></div>
      </div>`);
    }
    if (v.fc != null) {
      items.push(`<div class="vital${fuera(v.fc > 100 || v.fc < 50)}">
        <div class="vital__label">Frecuencia cardíaca</div>
        <div class="vital__value">${v.fc} <small>lpm</small></div>
      </div>`);
    }
    if (v.saturacion != null) {
      items.push(`<div class="vital${fuera(v.saturacion < 95)}">
        <div class="vital__label">Saturación O₂</div>
        <div class="vital__value">${v.saturacion} <small>%</small></div>
      </div>`);
    }

    return `${titulo ? `<div class="subhead">${esc(titulo)}</div>` : ''}
      <div class="vitals-grid">${items.join('')}</div>`;
  }

  function vistaExpediente() {
    const p = getPaciente(estado.pacienteId);
    const perm = permisos();
    const cl = clinica();
    const edad = edadDe(p.nacimiento);
    const esMenor = edad < 18;
    const contactos = p.contactos.filter((c) => c.activo);
    const responsables = contactos.filter((c) => c.tipo === 'responsable');
    const ultimaConsulta = p.consultas[0];
    const enCurso = consultas.find((c) => c.pacienteId === p.id && c.cierre === null);
    const vitalesRecientes = enCurso ? enCurso.vitales : (ultimaConsulta && ultimaConsulta.vitales);

    /* Aviso de mayoría de edad: solo al abrir el expediente, no bloquea nada. */
    const avisoDui = (!p.dui && edad >= 18)
      ? `<div class="alert alert--warn">${ICON.alerta}
          <div><b>Este paciente ya cumplió 18 años y no tiene DUI registrado.</b>
          Al registrarlo, sus responsables pasan automáticamente a contacto de referencia.</div>
        </div>`
      : '';

    const tarjetas = [
      { id: 'historial', icono: ICON.folder, t: 'Historial clínico', s: `${p.consultas.length} consulta${p.consultas.length === 1 ? '' : 's'}` },
      { id: 'antecedentes', icono: ICON.antecedentes, t: 'Antecedentes', s: 'Ver y registrar' },
      { id: 'recetas', icono: ICON.receta, t: 'Recetas', s: 'Documentos emitidos' },
      { id: 'estudios', icono: ICON.pulso, t: 'Estudios clínicos', s: 'Órdenes de examen', soon: true },
      { id: 'constancias', icono: ICON.documento, t: 'Constancias médicas', s: 'Incapacidades', soon: true },
      { id: 'referencias', icono: ICON.enviar, t: 'Referencias médicas', s: 'A especialista', soon: true }
    ];

    return `<div class="page">
      <div class="row-between" style="margin-bottom:14px">
        <button class="backlink" data-ir="pacientes" style="margin:0">${ICON.volver} Volver a pacientes</button>
        ${(perm.registrarPreconsulta && cl.usaCola && !enCurso)
          ? `<button class="btn btn--primary btn--sm" data-preconsulta="${p.id}">${ICON.editar} Enviar a consulta</button>` : ''}
      </div>

      ${avisoDui}

      <div class="card exp-head">
        <div class="card__body">
          <div class="exp-head__top">
            <div>
              <h1 class="exp-head__name">${esc(nombreCompleto(p))}</h1>
              <div class="exp-head__meta">${edad} años · ${p.sexo === 'F' ? 'Femenino' : 'Masculino'} · Nacimiento: ${fCorta(new Date(p.nacimiento + 'T00:00:00'))}</div>
            </div>
            <span class="badge badge--soft">${esc(cl.nombreLargo)}</span>
          </div>

          <div class="field-grid">
            <div>
              <div class="field__label">DUI</div>
              <div class="field__value">${p.dui ? esc(p.dui) : (esMenor ? 'Sin DUI (menor de edad)' : 'Sin DUI registrado')}</div>
              ${esMenor && responsables.length ? `<div class="small muted mt-2">Responsable: ${esc(nombreCompleto(responsables[0]))} · ${esc(responsables[0].telefono || 'sin teléfono')}</div>` : ''}
            </div>
            <div>
              <div class="field__label">Teléfono</div>
              <div class="field__value">${esc(p.telefono || '—')}</div>
            </div>
            <div>
              <div class="field__label">Alergias</div>
              <div class="field__value ${p.alergias ? 'text-danger' : ''}">${esc(p.alergias || 'Ninguna documentada')}</div>
            </div>
          </div>

          <hr class="divider">

          <div class="row-between" style="margin-bottom:9px">
            <div class="subhead" style="margin:0">Contactos</div>
            <button class="btn btn--sm btn--ghost" data-agregar-contacto>Agregar</button>
          </div>
          ${contactos.length ? contactos.map((c, i) => `
            <div class="contact-row">
              <div>
                <span class="strong">${esc(nombreCompleto(c))}</span>
                <span class="contact-row__meta"> · ${esc(c.parentesco)} · ${esc(c.telefono || 'sin teléfono')}</span>
              </div>
              <div class="row-actions">
                <span class="badge ${c.tipo === 'responsable' ? 'badge--warn' : 'badge--muted'}">${c.tipo === 'responsable' ? 'Responsable' : 'Contacto de referencia'}</span>
                <button class="btn btn--sm btn--icon" data-quitar-contacto="${i}" title="Desactivar contacto" aria-label="Desactivar contacto">${ICON.cerrar}</button>
              </div>
            </div>`).join('')
          : '<p class="small muted">Sin contactos registrados.</p>'}

          <hr class="divider">

          <div class="field-grid">
            <div>
              <div class="subhead">Antecedentes</div>
              ${p.antecedentes.length
                ? p.antecedentes.slice(0, 3).map((a) => `<div class="small" style="margin-bottom:4px"><b>${esc(a.tipo)}:</b> <span class="muted">${esc(a.detalle.length > 74 ? a.detalle.slice(0, 74) + '…' : a.detalle)}</span></div>`).join('')
                : '<p class="small muted">Aún no se registran antecedentes.</p>'}
            </div>
            <div>
              <div class="subhead">Controles pendientes</div>
              ${p.controles.length
                ? p.controles.map((c) => `<div class="small" style="margin-bottom:4px"><b>${fCorta(c.fecha)}:</b> <span class="muted">${esc(c.motivo)}</span></div>`).join('')
                : '<p class="small muted">Sin controles pendientes.</p>'}
            </div>
          </div>

          <hr class="divider">

          ${vitalesRecientes
            ? bloqueVitales(vitalesRecientes, edad, enCurso ? 'Signos vitales (preconsulta de hoy)' : 'Signos vitales (última consulta)')
            : '<div class="subhead">Signos vitales</div><p class="small muted">No hay datos de preconsulta registrados.</p>'}
        </div>
      </div>

      <div class="subhead">Historial del paciente</div>
      <div class="shortcut-grid">
        ${tarjetas.map((t) => `<button class="shortcut ${t.soon ? 'shortcut--soon' : ''}" data-tarjeta="${t.id}">
          ${t.icono}
          <span class="shortcut__title">${esc(t.t)}</span>
          <span class="shortcut__sub">${t.soon ? 'Módulo entregado' : esc(t.s)}</span>
        </button>`).join('')}
      </div>
    </div>`;
  }

  /* ===================== Pantalla: Preconsulta ===================== */

  let preconsultaMedico = null;

  function vistaPreconsulta() {
    const p = getPaciente(estado.pacienteId);
    const edad = edadDe(p.nacimiento);
    const esMenor = edad < 18;
    const medicos = medicosDeClinica();
    if (!preconsultaMedico) preconsultaMedico = medicos[0].id;

    return `<div class="page">
      <button class="backlink" data-ir="pacientes">${ICON.volver} Volver a pacientes</button>
      <div class="page-head">
        <div>
          <h1>Preconsulta</h1>
          <p>${esc(nombreCompleto(p))} · ${edad} años${esMenor ? ' · menor de edad' : ''}</p>
        </div>
      </div>

      <div class="attend-grid">
        <div class="card">
          <div class="card__head"><h2>Signos vitales</h2></div>
          <div class="card__body">
            <form id="formPreconsulta" novalidate>
              <div class="form-row">
                <label class="form-label" for="vPeso">Peso (kg) <span class="req">*</span></label>
                <input class="input" id="vPeso" name="peso" type="number" step="0.1" min="0" required>
              </div>

              ${esMenor ? `
              <div class="form-row">
                <label class="form-label" for="vTalla">Talla (metros)</label>
                <input class="input" id="vTalla" name="talla" type="number" step="0.01" min="0" placeholder="1.20">
                <div class="form-help">Se usa para calcular el IMC.</div>
              </div>
              <div class="form-row">
                <div class="calc-box">
                  <div class="calc-box__label">IMC calculado</div>
                  <div class="calc-box__value" id="imcCalculado">—</div>
                  <div class="calc-box__note">Se calcula solo con el peso y la talla de arriba, y se guarda con la preconsulta.</div>
                </div>
              </div>` : `
              <div class="form-row">
                <label class="form-label" for="vPresion">Presión arterial</label>
                <input class="input" id="vPresion" name="presion" placeholder="120/80" maxlength="7">
                <div class="form-help">Formato 120/80.</div>
              </div>`}

              <div class="form-grid">
                <div class="form-row">
                  <label class="form-label" for="vTemp">Temperatura (°C)</label>
                  <input class="input" id="vTemp" name="temp" type="number" step="0.1" placeholder="36.5">
                  <div class="form-help">Opcional.</div>
                </div>
                <div class="form-row">
                  <label class="form-label" for="vFc">Frecuencia cardíaca (lpm)</label>
                  <input class="input" id="vFc" name="fc" type="number" placeholder="72">
                  <div class="form-help">Opcional.</div>
                </div>
              </div>

              <div class="form-row">
                <label class="form-label" for="vSat">Saturación de oxígeno (%)</label>
                <input class="input" id="vSat" name="saturacion" type="number" placeholder="98">
                <div class="form-help">Solo en casos de emergencia.</div>
              </div>

              <hr class="divider">

              <label class="form-label" style="display:flex;align-items:center;gap:8px;font-weight:500">
                <input type="checkbox" id="vEmergencia"> Marcar como emergencia
              </label>
              <div class="form-row hide" id="filaMotivoEmg">
                <label class="form-label" for="vMotivoEmg">Motivo de la prioridad <span class="req">*</span></label>
                <input class="input" id="vMotivoEmg" placeholder="Por qué pasa adelante en la cola">
              </div>

              <div id="erroresPreconsulta"></div>

              <div class="row-between mt-2" style="justify-content:flex-end">
                <button type="button" class="btn" data-ir="pacientes">Cancelar</button>
                <button type="submit" class="btn btn--primary">Enviar a la cola</button>
              </div>
            </form>
          </div>
        </div>

        <div class="card">
          <div class="card__head"><h2>Médico asignado</h2></div>
          <div class="card__body">
            <p class="small muted" style="margin-bottom:12px">
              La consulta se crea siempre con médico asignado. Entre paréntesis, cuántos
              pacientes tiene cada uno esperando ahora.
            </p>
            <div class="doctor-pick">
              ${medicos.map((m) => {
                const n = enCola(m.id).length;
                return `<button type="button" class="doctor-opt${m.id === preconsultaMedico ? ' is-selected' : ''}" data-medico="${m.id}" aria-label="Asignar a ${esc(m.tratamiento)}">
                  <span class="avatar avatar--sm ${m.genero === 'f' ? 'avatar--f' : ''}">${esc(m.iniciales)}</span>
                  <span>
                    <span class="doctor-opt__name">${esc(m.tratamiento)}</span>
                    <span class="doctor-opt__load">${esc(m.especialidad || '')}</span>
                  </span>
                  <span class="doctor-opt__count badge ${n ? 'badge--soft' : 'badge--muted'}">${n}</span>
                </button>`;
              }).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>`;
  }

  /* ===================== Pantalla: Cola de consulta ===================== */

  function vistaCola() {
    const u = usuario();
    const perm = permisos();

    /* La administradora alterna entre el tablero de enfermería y su
       propia cola de médica, como en el sistema real. */
    const esVistaMedico = perm.soloSuCola ||
      (perm.atender && perm.gestionarCola && estado.vistaAdmin === 'medico');

    const switchAdmin = (perm.atender && perm.gestionarCola) ? `
      <div class="switch-group" style="margin:0">
        <button data-vista-admin="enfermeria" class="${estado.vistaAdmin === 'enfermeria' ? 'is-active' : ''}">Vista de enfermería</button>
        <button data-vista-admin="medico" class="${estado.vistaAdmin === 'medico' ? 'is-active' : ''}">Vista de médico</button>
      </div>` : '';

    const cabecera = `<div class="page-head">
      <div>
        <h1>Cola de consulta</h1>
        <p>${esVistaMedico ? 'Solo ves a tus propios pacientes.' : 'Tablero con la cola de cada médico.'}
        Se actualiza sola cada 30 segundos.</p>
      </div>
      ${switchAdmin}
    </div>`;

    if (esVistaMedico) return `<div class="page">${cabecera}${colaDelMedico(u)}</div>`;
    return `<div class="page">${cabecera}${tableroEnfermeria()}</div>`;
  }

  function colaDelMedico(u) {
    const atendiendo = enAtencion(u.id);
    const cola = enCola(u.id);
    let html = '';

    if (atendiendo.length) {
      html += `<div class="eyebrow">En atención</div>`;
      html += atendiendo.map((c) => {
        const p = getPaciente(c.pacienteId);
        return `<div class="card queue-attending" style="margin-bottom:18px"><div class="card__body row-between">
          <div>
            <div class="queue-next__name" style="font-size:19px">${esc(nombreCompleto(p))}</div>
            <div class="small muted">${ICON.reloj} Iniciada a las ${fHora(c.inicio)} · ${relativo(c.inicio)}</div>
          </div>
          <button class="btn btn--warn" data-atender="${c.id}">Continuar</button>
        </div></div>`;
      }).join('');
    }

    if (!cola.length) {
      return html + `<div class="card"><div class="empty">
        ${ICON.check}
        <p>No tienes ${atendiendo.length ? 'más ' : ''}pacientes en espera.</p>
      </div></div>`;
    }

    const [siguiente, ...despues] = cola;
    const p = getPaciente(siguiente.pacienteId);
    const bloqueado = atendiendo.length && !siguiente.esEmergencia;

    html += `<div class="eyebrow">Siguiente paciente</div>
      <div class="card queue-next ${siguiente.esEmergencia ? 'is-emergency' : ''}" style="margin-bottom:22px">
        <div class="card__body">
          ${siguiente.esEmergencia ? `<div class="alert alert--danger">${ICON.alerta}
            <div><b>Emergencia:</b> ${esc(siguiente.motivoPrioridad)}</div></div>` : ''}
          <div class="row-between">
            <div>
              <div class="queue-next__name">${esc(nombreCompleto(p))}</div>
              ${siguiente.reasignadoDesde ? `<div class="small muted">Reasignado desde ${esc(siguiente.reasignadoDesde)}</div>` : ''}
              <div class="small muted mt-2">${ICON.reloj} Llegó a las ${fHora(siguiente.horaLlegada)}
                <span class="badge badge--muted">${espera(siguiente.horaLlegada)} esperando</span></div>
            </div>
            <div style="text-align:right">
              <button class="btn ${siguiente.esEmergencia ? 'btn--danger' : 'btn--primary'} btn--lg"
                      data-atender="${siguiente.id}" ${bloqueado ? 'disabled' : ''}>${ICON.play} Atender</button>
              ${bloqueado ? '<div class="small muted mt-2">Finaliza la consulta en atención primero</div>' : ''}
            </div>
          </div>
        </div>
      </div>`;

    if (despues.length) {
      html += `<div class="eyebrow">Después (${despues.length})</div>
        <div class="card"><div class="card__body">
          ${despues.map((c, i) => {
            const pac = getPaciente(c.pacienteId);
            return `<div class="queue-item">
              <span class="badge badge--num ${c.esEmergencia ? 'badge--num-emg' : ''}">${i + 2}</span>
              <div class="queue-item__body">
                <div class="queue-item__name">${esc(nombreCompleto(pac))}</div>
                ${c.esEmergencia ? `<div class="queue-item__emg">${ICON.emergencia} ${esc(c.motivoPrioridad)}</div>` : ''}
                ${c.reasignadoDesde ? `<div class="queue-item__meta">Reasignado desde ${esc(c.reasignadoDesde)}</div>` : ''}
                <div class="queue-item__meta">${fHora(c.horaLlegada)} · ${espera(c.horaLlegada)} esperando</div>
              </div>
              <div class="queue-item__actions">
                <button class="btn btn--sm btn--ghost" data-atender="${c.id}" ${atendiendo.length && !c.esEmergencia ? 'disabled' : ''}>Atender</button>
              </div>
            </div>`;
          }).join('')}
        </div></div>`;
    }

    return html;
  }

  function tableroEnfermeria() {
    const perm = permisos();
    const medicos = medicosDeClinica();

    return `<div class="queue-board">
      ${medicos.map((m) => {
        const cola = enCola(m.id);
        const atendiendo = enAtencion(m.id);
        return `<div class="card"><div class="card__body">
          <div class="queue-doctor__head">
            <span>${esc(m.tratamiento)}</span>
            <span class="badge ${cola.length ? 'badge--soft' : 'badge--muted'}">${cola.length}</span>
          </div>

          ${atendiendo.map((c) => {
            const p = getPaciente(c.pacienteId);
            return `<div class="alert alert--warn" style="margin-bottom:10px">
              ${ICON.cronometro}
              <div>
                <b>En consulta:</b> ${esc(nombreCompleto(p))}<br>
                <span class="small">desde las ${fHora(c.inicio)}</span>
              </div>
            </div>`;
          }).join('')}

          ${cola.length ? cola.map((c, i) => {
            const p = getPaciente(c.pacienteId);
            return `<div class="queue-item">
              <span class="badge badge--num ${c.esEmergencia ? 'badge--num-emg' : i === 0 ? 'badge--num-first' : ''}">${i + 1}</span>
              <div class="queue-item__body">
                <div class="queue-item__name">${esc(nombreCompleto(p))}</div>
                ${c.esEmergencia ? `<div class="queue-item__emg">${ICON.emergencia} ${esc(c.motivoPrioridad)}</div>` : ''}
                ${c.reasignadoDesde ? `<div class="queue-item__meta">Reasignado desde ${esc(c.reasignadoDesde)}</div>` : ''}
                <div class="queue-item__meta">${fHora(c.horaLlegada)} · ${espera(c.horaLlegada)}</div>
              </div>
              ${perm.gestionarCola ? `<div class="queue-item__actions">
                <button class="btn btn--sm btn--icon" data-editar-preconsulta="${c.id}" title="Editar preconsulta" aria-label="Editar preconsulta">${ICON.editar}</button>
                <button class="btn btn--sm btn--icon" data-reasignar="${c.id}" title="Reasignar a otro médico" aria-label="Reasignar">${ICON.reasignar}</button>
                <button class="btn btn--sm btn--icon" data-retiro="${c.id}" title="Registrar que se retiró" aria-label="Registrar retiro">${ICON.salir}</button>
                <button class="btn btn--sm btn--icon" data-emergencia="${c.id}" title="${c.esEmergencia ? 'Quitar emergencia' : 'Marcar emergencia'}" aria-label="Emergencia"
                        style="${c.esEmergencia ? 'color:var(--danger);border-color:var(--danger)' : ''}">${ICON.emergencia}</button>
              </div>` : ''}
            </div>`;
          }).join('') : '<p class="small muted mb-0">Sin pacientes en espera.</p>'}
        </div></div>`;
      }).join('')}
    </div>`;
  }

  /* ===================== Pantalla: Atención médica ===================== */

  const CAMPOS_CONSULTA = [
    { k: 'motivo', label: 'Motivo de consulta', req: true, ph: 'Por qué viene el paciente hoy' },
    { k: 'historia', label: 'Historia de la enfermedad actual', ph: 'Desde cuándo, cómo empezó, cómo ha evolucionado' },
    { k: 'examen', label: 'Examen físico', ph: 'Hallazgos de la exploración' },
    { k: 'diagnostico', label: 'Diagnóstico', req: true, ph: 'Impresión diagnóstica' },
    { k: 'tratamiento', label: 'Tratamiento', ph: 'Qué se indica' },
    { k: 'indicaciones', label: 'Indicaciones al paciente', ph: 'Recomendaciones, señales de alarma, próximo control' }
  ];

  function vistaAtencion() {
    const c = getConsulta(estado.consultaId);
    const p = getPaciente(c.pacienteId);
    const edad = edadDe(p.nacimiento);

    return `<div class="page">
      <button class="backlink" data-ir="cola">${ICON.volver} Volver a la cola</button>

      <div class="page-head">
        <div>
          <div class="eyebrow">Consulta en atención · iniciada a las ${fHora(c.inicio)}</div>
          <h1>${esc(nombreCompleto(p))}</h1>
          <p>${edad} años · ${p.alergias ? `<span class="text-danger strong">Alergias: ${esc(p.alergias)}</span>` : 'Sin alergias documentadas'}</p>
        </div>
        <div class="row-actions">
          <button class="btn" data-ver-expediente="${p.id}">Ver expediente</button>
          <button class="btn btn--primary" data-finalizar="${c.id}">Finalizar y emitir receta</button>
        </div>
      </div>

      ${c.esEmergencia ? `<div class="alert alert--danger">${ICON.alerta}
        <div><b>Emergencia:</b> ${esc(c.motivoPrioridad)}</div></div>` : ''}

      <div class="attend-grid">
        <div class="card">
          <div class="card__head">
            <h2>Nota de consulta</h2>
            <span class="autosave" id="autosave">Los cambios se preguardan solos</span>
          </div>
          <div class="card__body">
            <form id="formConsulta">
              ${CAMPOS_CONSULTA.map((campo) => `
                <div class="form-row">
                  <label class="form-label" for="f-${campo.k}">${esc(campo.label)} ${campo.req ? '<span class="req">*</span>' : ''}</label>
                  <textarea class="textarea" id="f-${campo.k}" name="${campo.k}" placeholder="${esc(campo.ph)}">${esc(c[campo.k])}</textarea>
                </div>`).join('')}
            </form>
          </div>
        </div>

        <div class="stack-md">
          <div class="card">
            <div class="card__head"><h2>Preconsulta</h2></div>
            <div class="card__body">
              ${bloqueVitales(c.vitales, edad)}
              <p class="small muted mt-2">Tomados por enfermería. Si se corrigen mientras atiendes,
              esta tarjeta se actualiza sola cada 30 segundos.</p>
            </div>
          </div>

          <div class="card">
            <div class="card__head"><h2>Documentos</h2></div>
            <div class="card__body">
              <div class="doc-grid">
                <button class="doc-btn" data-doc="incapacidad">
                  <span class="doc-btn__title">Incapacidad</span>
                  <span class="doc-btn__desc">Constancia con días de reposo</span>
                </button>
                <button class="doc-btn" data-doc="referencia">
                  <span class="doc-btn__title">Referencia</span>
                  <span class="doc-btn__desc">Envío a especialista</span>
                </button>
                <button class="doc-btn" data-doc="control">
                  <span class="doc-btn__title">Control posterior</span>
                  <span class="doc-btn__desc">Agendar seguimiento</span>
                </button>
                <button class="doc-btn" data-doc="examen">
                  <span class="doc-btn__title">Orden de examen</span>
                  <span class="doc-btn__desc">Laboratorio o gabinete</span>
                </button>
              </div>
              <p class="small muted mt-2">La receta se emite al finalizar: es la que cierra la consulta.</p>
            </div>
          </div>

          <div class="card">
            <div class="card__head"><h2>Consultas anteriores</h2></div>
            <div class="card__body">
              ${p.consultas.length ? p.consultas.slice(0, 3).map((x) => `
                <div class="queue-item">
                  <div class="queue-item__body">
                    <div class="queue-item__name">${esc(x.motivo)}</div>
                    <div class="queue-item__meta">${fCorta(x.fecha)} · ${esc(getUsuario(x.doctor).tratamiento)}</div>
                  </div>
                </div>`).join('')
              : '<p class="small muted mb-0">Primera consulta de este paciente.</p>'}
            </div>
          </div>
        </div>
      </div>
    </div>`;
  }

  /* ===================== Pantalla: Historial clínico ===================== */

  function vistaHistorial() {
    const p = getPaciente(estado.pacienteId);

    return `<div class="page">
      <button class="backlink" data-ir="expediente">${ICON.volver} Volver al expediente</button>
      <div class="page-head">
        <div>
          <h1>Historial clínico</h1>
          <p>${esc(nombreCompleto(p))} · ${p.consultas.length} consulta${p.consultas.length === 1 ? '' : 's'} registrada${p.consultas.length === 1 ? '' : 's'}</p>
        </div>
      </div>

      ${p.consultas.length ? `<div class="timeline">
        ${p.consultas.map((c) => `
          <div class="tl-item ${c.retirada ? 'tl-item--retirada' : ''}">
            <div class="card"><div class="card__body">
              <div class="row-between" style="margin-bottom:10px">
                <div>
                  <div class="tl-date">${fFecha(c.fecha)} · ${relativo(c.fecha)}</div>
                  <h3>${esc(c.motivo)}</h3>
                </div>
                <div class="row-actions">
                  <span class="badge badge--muted">${esc(getUsuario(c.doctor).tratamiento)}</span>
                  ${c.receta ? `<button class="btn btn--sm btn--ghost" data-receta="${c.id}">${ICON.imprimir} Receta</button>` : ''}
                </div>
              </div>
              ${c.retirada
                ? `<div class="alert alert--warn" style="margin:0">${ICON.info}<div><b>Se retiró antes de la consulta.</b> ${esc(c.notaRetiro)}</div></div>`
                : `<div class="kv"><div class="kv__k">Diagnóstico</div><div class="kv__v">${esc(c.diagnostico)}</div></div>
                   <button class="btn btn--sm" data-detalle="${c.id}">Ver detalle completo</button>`}
            </div></div>
          </div>`).join('')}
      </div>` : `<div class="card"><div class="empty">${ICON.folder}
        <p>Este paciente todavía no tiene consultas registradas.</p></div></div>`}
    </div>`;
  }

  /* ===================== Pantalla: Antecedentes y recetas ===================== */

  function vistaAntecedentes() {
    const p = getPaciente(estado.pacienteId);
    return `<div class="page">
      <button class="backlink" data-ir="expediente">${ICON.volver} Volver al expediente</button>
      <div class="page-head">
        <div>
          <h1>Antecedentes</h1>
          <p>${esc(nombreCompleto(p))}</p>
        </div>
        <button class="btn btn--primary" data-nuevo-antecedente>Registrar antecedente</button>
      </div>

      ${p.antecedentes.length ? `<div class="card"><div class="card__body stack-md">
        ${p.antecedentes.map((a) => `<div>
          <div class="kv__k">${esc(a.tipo)}</div>
          <div class="kv__v">${esc(a.detalle)}</div>
        </div>`).join('')}
      </div></div>` : `<div class="card"><div class="empty">${ICON.antecedentes}
        <p>Aún no se registran antecedentes de este paciente.</p></div></div>`}
    </div>`;
  }

  function vistaRecetas() {
    const p = getPaciente(estado.pacienteId);
    const conReceta = p.consultas.filter((c) => c.receta);

    return `<div class="page">
      <button class="backlink" data-ir="expediente">${ICON.volver} Volver al expediente</button>
      <div class="page-head">
        <div>
          <h1>Recetas</h1>
          <p>${esc(nombreCompleto(p))} · ${conReceta.length} receta${conReceta.length === 1 ? '' : 's'} emitida${conReceta.length === 1 ? '' : 's'}</p>
        </div>
      </div>

      ${conReceta.length ? `<div class="card table-wrap">
        <table class="table">
          <thead><tr><th>Folio</th><th>Fecha</th><th>Médico</th><th>Medicamentos</th><th></th></tr></thead>
          <tbody>
            ${conReceta.map((c) => `<tr>
              <td data-label="Folio" class="td-strong">${esc(c.receta.folio)}</td>
              <td data-label="Fecha">${fCorta(c.fecha)}</td>
              <td data-label="Médico" class="td-muted">${esc(getUsuario(c.doctor).tratamiento)}</td>
              <td data-label="Medicamentos" class="td-muted">${c.receta.detalles.length}</td>
              <td data-label=""><button class="btn btn--sm btn--ghost" data-receta="${c.id}">${ICON.imprimir} Ver</button></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>` : `<div class="card"><div class="empty">${ICON.receta}
        <p>Este paciente todavía no tiene recetas emitidas.</p></div></div>`}
    </div>`;
  }

  /* ===================== Modales de la cola ===================== */

  function modalReasignar(consultaId) {
    const c = getConsulta(consultaId);
    const p = getPaciente(c.pacienteId);
    const otros = medicosDeClinica().filter((m) => m.id !== c.doctorId);

    abrirModal(`${cabezaModal('Reasignar paciente', nombreCompleto(p))}
      <div class="modal__body">
        <p class="small muted" style="margin-bottom:14px">
          Actualmente asignado a <b>${esc(getUsuario(c.doctorId).tratamiento)}</b>.
          Cada cambio queda registrado: una visita puede reasignarse más de una vez.
        </p>
        <div class="form-row">
          <label class="form-label" for="reMedico">Nuevo médico <span class="req">*</span></label>
          <select class="select" id="reMedico">
            ${otros.map((m) => `<option value="${m.id}">${esc(m.tratamiento)} · ${enCola(m.id).length} en espera</option>`).join('')}
          </select>
        </div>
        <div class="form-row">
          <label class="form-label" for="reMotivo">Motivo (opcional)</label>
          <input class="input" id="reMotivo" placeholder="Por qué se reasigna">
        </div>
      </div>
      <div class="modal__foot">
        <button class="btn" data-cerrar>Cancelar</button>
        <button class="btn btn--primary" id="btnReasignar">Reasignar</button>
      </div>`);

    $('#btnReasignar').addEventListener('click', () => {
      const nuevo = $('#reMedico').value;
      c.reasignadoDesde = getUsuario(c.doctorId).tratamiento;
      c.doctorId = nuevo;
      cerrarModal();
      render();
      toast('Paciente reasignado', `${nombreCompleto(p)} pasó a la cola de ${getUsuario(nuevo).tratamiento}. Conserva su hora de llegada.`);
    });
  }

  function modalRetiro(consultaId) {
    const c = getConsulta(consultaId);
    const p = getPaciente(c.pacienteId);

    abrirModal(`${cabezaModal('Registrar retiro', nombreCompleto(p))}
      <div class="modal__body">
        <div class="alert alert--warn">${ICON.alerta}
          <div>El paciente sale de la cola y queda libre para volver. La visita se
          guarda en su historial como retirada. No se puede deshacer.</div>
        </div>
        <div class="form-row">
          <label class="form-label" for="reNota">Nota del retiro <span class="req">*</span></label>
          <textarea class="textarea" id="reNota" placeholder="Por qué se fue antes de pasar a consulta"></textarea>
          <div class="form-error hide" id="errRetiro">La nota es obligatoria.</div>
        </div>
      </div>
      <div class="modal__foot">
        <button class="btn" data-cerrar>Cancelar</button>
        <button class="btn btn--danger" id="btnRetiro">Registrar retiro</button>
      </div>`);

    $('#btnRetiro').addEventListener('click', () => {
      const nota = $('#reNota').value.trim();
      if (!nota) { $('#errRetiro').classList.remove('hide'); return; }
      c.cierre = new Date();
      c.notaRetiro = nota;
      p.consultas.unshift({
        id: c.id, fecha: new Date(), doctor: c.doctorId,
        motivo: 'Se retiró antes de la consulta', retirada: true,
        notaRetiro: nota, diagnostico: '', vitales: c.vitales, receta: null
      });
      cerrarModal();
      render();
      toast('Retiro registrado', `${nombreCompleto(p)} salió de la cola. Queda constancia en su historial.`);
    });
  }

  function modalEmergencia(consultaId) {
    const c = getConsulta(consultaId);
    const p = getPaciente(c.pacienteId);

    if (c.esEmergencia) {
      c.esEmergencia = false;
      c.motivoPrioridad = '';
      render();
      toast('Prioridad retirada', `${nombreCompleto(p)} vuelve a su lugar por hora de llegada.`);
      return;
    }

    abrirModal(`${cabezaModal('Marcar como emergencia', nombreCompleto(p))}
      <div class="modal__body">
        <p class="small muted" style="margin-bottom:14px">
          El paciente pasa adelante en la cola de su médico. El motivo es obligatorio
          y queda visible para quien atiende.
        </p>
        <div class="form-row">
          <label class="form-label" for="emMotivo">Motivo de la prioridad <span class="req">*</span></label>
          <input class="input" id="emMotivo" placeholder="Ej: dolor torácico de inicio súbito">
          <div class="form-error hide" id="errEmg">El motivo es obligatorio.</div>
        </div>
      </div>
      <div class="modal__foot">
        <button class="btn" data-cerrar>Cancelar</button>
        <button class="btn btn--danger" id="btnEmg">Marcar emergencia</button>
      </div>`);

    $('#btnEmg').addEventListener('click', () => {
      const motivo = $('#emMotivo').value.trim();
      if (!motivo) { $('#errEmg').classList.remove('hide'); return; }
      c.esEmergencia = true;
      c.motivoPrioridad = motivo;
      cerrarModal();
      render();
      toast('Marcado como emergencia', `${nombreCompleto(p)} pasa adelante en la cola.`);
    });
  }

  function modalEditarPreconsulta(consultaId) {
    const c = getConsulta(consultaId);
    const p = getPaciente(c.pacienteId);
    const esMenor = edadDe(p.nacimiento) < 18;
    const v = c.vitales;

    abrirModal(`${cabezaModal('Editar preconsulta', nombreCompleto(p))}
      <div class="modal__body">
        <p class="small muted" style="margin-bottom:14px">
          Solo signos vitales. Queda registrado quién corrigió y cuándo, con el antes y el después.
        </p>
        <div class="form-grid">
          <div class="form-row">
            <label class="form-label" for="epPeso">Peso (kg)</label>
            <input class="input" id="epPeso" type="number" step="0.1" value="${v.peso != null ? v.peso : ''}">
          </div>
          ${esMenor
            ? `<div class="form-row">
                <label class="form-label" for="epTalla">Talla (m)</label>
                <input class="input" id="epTalla" type="number" step="0.01" value="${v.talla != null ? v.talla : ''}">
              </div>`
            : `<div class="form-row">
                <label class="form-label" for="epPresion">Presión arterial</label>
                <input class="input" id="epPresion" value="${esc(v.presion || '')}" placeholder="120/80">
              </div>`}
          <div class="form-row">
            <label class="form-label" for="epTemp">Temperatura (°C)</label>
            <input class="input" id="epTemp" type="number" step="0.1" value="${v.temp != null ? v.temp : ''}">
          </div>
          <div class="form-row">
            <label class="form-label" for="epFc">Frecuencia cardíaca</label>
            <input class="input" id="epFc" type="number" value="${v.fc != null ? v.fc : ''}">
          </div>
          <div class="form-row">
            <label class="form-label" for="epSat">Saturación (%)</label>
            <input class="input" id="epSat" type="number" value="${v.saturacion != null ? v.saturacion : ''}">
          </div>
        </div>
      </div>
      <div class="modal__foot">
        <button class="btn" data-cerrar>Cancelar</button>
        <button class="btn btn--primary" id="btnEditarPre">Guardar cambios</button>
      </div>`);

    $('#btnEditarPre').addEventListener('click', () => {
      const num = (sel) => {
        const el = $(sel);
        if (!el || el.value === '') return null;
        return Number(el.value);
      };
      v.peso = num('#epPeso');
      if (esMenor) {
        v.talla = num('#epTalla');
        v.imc = (v.peso && v.talla) ? Number((v.peso / (v.talla * v.talla)).toFixed(1)) : null;
      } else {
        v.presion = $('#epPresion').value.trim();
      }
      v.temp = num('#epTemp');
      v.fc = num('#epFc');
      v.saturacion = num('#epSat');
      cerrarModal();
      render();
      toast('Preconsulta corregida', 'El cambio quedó en la bitácora con el antes y el después.');
    });
  }

  /* ===================== Finalizar consulta y receta ===================== */

  function modalFinalizar(consultaId) {
    const c = getConsulta(consultaId);
    const p = getPaciente(c.pacienteId);

    guardarFormularioConsulta(c);

    const faltan = CAMPOS_CONSULTA.filter((campo) => campo.req && !c[campo.k].trim());
    if (faltan.length) {
      abrirModal(`${cabezaModal('Faltan datos de la consulta')}
        <div class="modal__body">
          <div class="alert alert--danger">${ICON.alerta}
            <div>Antes de emitir la receta hay que completar:
            <b>${esc(faltan.map((f) => f.label).join(' y '))}</b>.</div>
          </div>
        </div>
        <div class="modal__foot"><button class="btn btn--primary" data-cerrar>Volver a la consulta</button></div>`);
      return;
    }

    const fila = (i) => `<div class="form-grid" data-med style="margin-bottom:10px">
      <div class="form-row form-row--full" style="margin-bottom:6px">
        <label class="form-label" for="med${i}">Medicamento ${i + 1}</label>
        <input class="input" id="med${i}" data-k="medicamento" placeholder="Nombre y presentación">
      </div>
      <div class="form-row" style="margin-bottom:0">
        <input class="input" data-k="dosis" placeholder="Dosis — ej: 1 tableta cada 8 horas" aria-label="Dosis">
      </div>
      <div class="form-row" style="margin-bottom:0">
        <input class="input" data-k="duracion" placeholder="Duración — ej: 7 días" aria-label="Duración">
      </div>
    </div>`;

    abrirModal(`${cabezaModal('Finalizar consulta y emitir receta', nombreCompleto(p))}
      <div class="modal__body">
        <div class="alert alert--info">${ICON.info}
          <div>La receta es la que cierra la consulta: al emitirla, el paciente sale de la
          cola y la nota queda guardada en su historial.</div>
        </div>
        ${p.alergias ? `<div class="alert alert--danger">${ICON.alerta}
          <div><b>Alergias documentadas:</b> ${esc(p.alergias)}</div></div>` : ''}
        <div id="medicamentos">${fila(0)}${fila(1)}</div>
        <button class="btn btn--sm" id="btnMasMed" type="button">Agregar otro medicamento</button>
        <div class="form-error hide" id="errReceta">Escribe al menos un medicamento.</div>
      </div>
      <div class="modal__foot">
        <button class="btn" data-cerrar>Seguir editando</button>
        <button class="btn btn--primary" id="btnEmitir">Emitir receta y finalizar</button>
      </div>`, { ancho: true });

    let n = 2;
    $('#btnMasMed').addEventListener('click', () => {
      $('#medicamentos').insertAdjacentHTML('beforeend', fila(n++));
    });

    $('#btnEmitir').addEventListener('click', () => {
      const detalles = $$('#medicamentos [data-med]').map((bloque) => ({
        medicamento: $('[data-k="medicamento"]', bloque).value.trim(),
        dosis: $('[data-k="dosis"]', bloque).value.trim(),
        duracion: $('[data-k="duracion"]', bloque).value.trim()
      })).filter((d) => d.medicamento);

      if (!detalles.length) { $('#errReceta').classList.remove('hide'); return; }

      c.cierre = new Date();
      c.receta = { folio: `R-00${++contadorFolio}`, detalles, fecha: new Date() };

      /* La consulta pasa al historial del paciente */
      p.consultas.unshift({
        id: c.id,
        fecha: c.inicio,
        doctor: c.doctorId,
        motivo: c.motivo,
        historia: c.historia,
        examen: c.examen,
        diagnostico: c.diagnostico,
        tratamiento: c.tratamiento,
        indicaciones: c.indicaciones,
        vitales: c.vitales,
        receta: c.receta,
        cerrada: true
      });

      cerrarModal();
      estado.vista = 'cola';
      render();
      toast('Consulta finalizada', `Receta ${c.receta.folio} emitida. La nota quedó en el historial de ${nombreCompleto(p)}.`);
      setTimeout(() => modalReceta(c.id, p.id), 400);
    });
  }

  function modalReceta(consultaId, pacienteId) {
    const p = getPaciente(pacienteId || estado.pacienteId);
    const c = p.consultas.find((x) => x.id === consultaId) || getConsulta(consultaId);
    const medico = getUsuario(c.doctor || c.doctorId);
    const cl = CLINICAS.find((x) => x.id === p.clinica);
    const fecha = c.fecha || c.receta.fecha || new Date();
    const edad = edadDe(p.nacimiento);

    abrirModal(`${cabezaModal('Receta médica', `Folio ${c.receta.folio}`)}
      <div class="receta">
        <div class="receta__head">
          ${cl.id === 'prosalud' ? `
            <div class="receta__brand">CLÍNICA</div>
            <div class="receta__logo">PR<em>&#10084;</em>SALUD</div>
            <div class="receta__sub">CONSULTA MÉDICA · ODONTOLOGÍA Y LABORATORIO</div>
          ` : `<div class="receta__logo">${esc(cl.nombreLargo)}</div>`}
          <div class="receta__doctor">${esc(medico.tratamiento.toUpperCase())}</div>
          <div class="receta__especialidad">${esc((medico.especialidad || '').toUpperCase())}</div>
          <div class="receta__clinica">${esc(cl.direccion)}<br>CEL. ${esc(cl.telefono)}</div>
        </div>

        <hr class="receta__rule">

        <div class="receta__meta">
          <span>Folio: <b>${esc(c.receta.folio)}</b></span>
          <span>${fFecha(fecha)}</span>
        </div>

        <div class="receta__paciente">
          Paciente: <b>${esc(nombreCompleto(p))}</b> · ${edad} años
          ${p.alergias ? `<br>Alergias: <b>${esc(p.alergias)}</b>` : ''}
        </div>

        <div class="receta__rx">&#8478;</div>
        ${c.receta.detalles.map((d) => `<div class="receta__item">
          <b>${esc(d.medicamento)}</b>
          <span>${esc(d.dosis)}${d.duracion ? ` · ${esc(d.duracion)}` : ''}</span>
        </div>`).join('')}

        <div class="receta__firma">
          <hr>
          <div>${esc(medico.tratamiento.toUpperCase())}</div>
          ${medico.jvpm ? `<small>J.V.P.M. ${esc(medico.jvpm)}</small>` : ''}
        </div>
      </div>
      <div class="modal__foot">
        <span class="small muted" style="margin-right:auto;max-width:330px;text-align:left">
          Datos ficticios. En el sistema real el membrete, la dirección y el número de
          J.V.P.M. salen de la clínica y del perfil del médico, y el documento se genera en PDF.
        </span>
        <button class="btn" data-cerrar>Cerrar</button>
        <button class="btn btn--primary" id="btnImprimir">${ICON.imprimir} Imprimir</button>
      </div>`, { ancho: true });

    $('#btnImprimir').addEventListener('click', () => window.print());
  }

  function modalDetalleConsulta(consultaId) {
    const p = getPaciente(estado.pacienteId);
    const c = p.consultas.find((x) => x.id === consultaId);
    const campos = [
      ['Motivo de consulta', c.motivo],
      ['Historia de la enfermedad actual', c.historia],
      ['Examen físico', c.examen],
      ['Diagnóstico', c.diagnostico],
      ['Tratamiento', c.tratamiento],
      ['Indicaciones', c.indicaciones]
    ].filter((x) => x[1]);

    abrirModal(`${cabezaModal(fFecha(c.fecha), `${nombreCompleto(p)} · ${getUsuario(c.doctor).tratamiento}`)}
      <div class="modal__body">
        ${bloqueVitales(c.vitales, edadDe(p.nacimiento), 'Signos vitales de la preconsulta')}
        <hr class="divider">
        ${campos.map(([k, v]) => `<div class="kv"><div class="kv__k">${esc(k)}</div><div class="kv__v">${esc(v)}</div></div>`).join('')}
      </div>
      <div class="modal__foot">
        <button class="btn" data-cerrar>Cerrar</button>
        ${c.receta ? `<button class="btn btn--primary" id="btnVerReceta">${ICON.imprimir} Ver receta</button>` : ''}
      </div>`, { ancho: true });

    const btn = $('#btnVerReceta');
    if (btn) btn.addEventListener('click', () => modalReceta(c.id, p.id));
  }

  function modalAgregarContacto() {
    const p = getPaciente(estado.pacienteId);
    const esMenor = edadDe(p.nacimiento) < 18;

    abrirModal(`${cabezaModal('Agregar contacto', nombreCompleto(p))}
      <div class="modal__body">
        <p class="small muted" style="margin-bottom:14px">
          El sistema busca primero si esa persona ya existe: una misma madre puede ser
          responsable de varios pacientes sin duplicarse.
        </p>
        ${esMenor ? `<div class="form-row">
          <label class="form-label" for="acTipo">Tipo de relación</label>
          <select class="select" id="acTipo">
            <option value="responsable">Responsable</option>
            <option value="referencia">Contacto de referencia</option>
          </select>
        </div>` : ''}
        <div class="form-grid">
          <div class="form-row">
            <label class="form-label" for="acNombres">Nombres <span class="req">*</span></label>
            <input class="input" id="acNombres">
          </div>
          <div class="form-row">
            <label class="form-label" for="acApellidos">Apellidos <span class="req">*</span></label>
            <input class="input" id="acApellidos">
          </div>
          <div class="form-row">
            <label class="form-label" for="acTelefono">Teléfono</label>
            <input class="input" id="acTelefono" placeholder="0000-0000" maxlength="9">
          </div>
          <div class="form-row">
            <label class="form-label" for="acParentesco">Parentesco <span class="req">*</span></label>
            <select class="select" id="acParentesco">
              <option value="">Seleccionar…</option>
              ${PARENTESCOS.map((x) => `<option>${esc(x)}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-error hide" id="errContacto">Nombres, apellidos y parentesco son obligatorios.</div>
      </div>
      <div class="modal__foot">
        <button class="btn" data-cerrar>Cancelar</button>
        <button class="btn btn--primary" id="btnContacto">Agregar</button>
      </div>`);

    $('#acTelefono').addEventListener('input', formatoTelefono);

    $('#btnContacto').addEventListener('click', () => {
      const nombres = $('#acNombres').value.trim();
      const apellidos = $('#acApellidos').value.trim();
      const parentesco = $('#acParentesco').value;
      if (!nombres || !apellidos || !parentesco) {
        $('#errContacto').classList.remove('hide');
        return;
      }
      p.contactos.push({
        nombres, apellidos, parentesco,
        telefono: $('#acTelefono').value.trim(),
        tipo: esMenor ? $('#acTipo').value : 'referencia',
        activo: true
      });
      cerrarModal();
      render();
      toast('Contacto agregado', `${nombres} ${apellidos} quedó vinculado al expediente.`);
    });
  }

  function modalAntecedente() {
    const p = getPaciente(estado.pacienteId);
    abrirModal(`${cabezaModal('Registrar antecedente', nombreCompleto(p))}
      <div class="modal__body">
        <div class="form-row">
          <label class="form-label" for="anTipo">Tipo <span class="req">*</span></label>
          <select class="select" id="anTipo">${TIPOS_ANTECEDENTE.map((t) => `<option>${esc(t)}</option>`).join('')}</select>
        </div>
        <div class="form-row">
          <label class="form-label" for="anDetalle">Detalle <span class="req">*</span></label>
          <textarea class="textarea" id="anDetalle" placeholder="Qué antecedente, desde cuándo"></textarea>
          <div class="form-error hide" id="errAnt">El detalle es obligatorio.</div>
        </div>
      </div>
      <div class="modal__foot">
        <button class="btn" data-cerrar>Cancelar</button>
        <button class="btn btn--primary" id="btnAnt">Guardar</button>
      </div>`);

    $('#btnAnt').addEventListener('click', () => {
      const detalle = $('#anDetalle').value.trim();
      if (!detalle) { $('#errAnt').classList.remove('hide'); return; }
      p.antecedentes.push({ tipo: $('#anTipo').value, detalle });
      cerrarModal();
      render();
      toast('Antecedente registrado', 'Queda visible en la cabecera del expediente.');
    });
  }

  function modalDocumento(tipo) {
    const nombres = {
      incapacidad: ['Incapacidad / constancia', 'Constancia con los días de reposo, en el papel membretado de la clínica, con folio y firma del médico.'],
      referencia: ['Referencia médica', 'Envío a especialista, con el motivo y las observaciones, sobre el mismo papel de la clínica.'],
      control: ['Control posterior', 'Agenda una fecha de seguimiento que aparece en la cabecera del expediente como control pendiente.'],
      examen: ['Orden de examen', 'Órdenes de laboratorio o gabinete, que pueden existir con o sin consulta asociada.']
    };
    const [titulo, detalle] = nombres[tipo];
    modalBloqueado(titulo, detalle + ' Está construido en el sistema entregado; en esta demo no se recorre para no alargar el flujo.');
  }

  /* ===================== Guardado del formulario de consulta ===================== */

  function guardarFormularioConsulta(c) {
    const form = $('#formConsulta');
    if (!form) return;
    CAMPOS_CONSULTA.forEach((campo) => {
      const el = form.elements[campo.k];
      if (el) c[campo.k] = el.value;
    });
  }

  /* ===================== Formato de campos ===================== */

  function formatoTelefono(e) {
    const v = e.target.value.replace(/\D/g, '').slice(0, 8);
    e.target.value = v.length > 4 ? `${v.slice(0, 4)}-${v.slice(4)}` : v;
  }

  function formatoDui(e) {
    const v = e.target.value.replace(/\D/g, '').slice(0, 9);
    e.target.value = v.length > 8 ? `${v.slice(0, 8)}-${v.slice(8)}` : v;
  }

  /* ===================== Router ===================== */

  const VISTAS = {
    inicio: vistaInicio,
    pacientes: vistaPacientes,
    registrar: vistaRegistrar,
    expediente: vistaExpediente,
    preconsulta: vistaPreconsulta,
    cola: vistaCola,
    atencion: vistaAtencion,
    historial: vistaHistorial,
    antecedentes: vistaAntecedentes,
    recetas: vistaRecetas
  };

  function render() {
    pintarSidebar();
    pintarTopbar();
    const fn = VISTAS[estado.vista] || vistaInicio;
    $('#vista').innerHTML = fn();
    conectarVista();
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }

  function ir(vista) {
    estado.vista = vista;
    cerrarSidebar();
    render();
  }

  /* Eventos que dependen de la pantalla recién pintada */
  function conectarVista() {
    const buscador = $('#buscador');
    if (buscador) {
      buscador.addEventListener('input', (e) => {
        estado.busqueda = e.target.value;
        /* Se repinta solo la tabla, como el listado en vivo del sistema real */
        const page = $('#vista .page');
        const scroll = window.scrollY;
        $('#vista').innerHTML = vistaPacientes();
        conectarVista();
        const nuevo = $('#buscador');
        nuevo.focus();
        nuevo.setSelectionRange(nuevo.value.length, nuevo.value.length);
        window.scrollTo(0, scroll);
        void page;
      });
    }

    /* --- Registrar paciente --- */
    const formPaciente = $('#formPaciente');
    if (formPaciente) {
      $('#rDui') && $('#rDui').addEventListener('input', formatoDui);
      $('#rTelefono').addEventListener('input', formatoTelefono);
      $('#cTelefono').addEventListener('input', formatoTelefono);

      $('#rNacimiento').addEventListener('change', (e) => {
        if (!e.target.value) { $('#avisoEdad').textContent = ''; return; }
        const edad = edadDe(e.target.value);
        $('#avisoEdad').textContent = edad >= 0 ? `${edad} años` : '';
        $('#avisoEdad').className = 'form-help';
      });

      formPaciente.addEventListener('submit', (e) => {
        e.preventDefault();
        guardarPaciente();
      });
    }

    /* --- Preconsulta --- */
    const formPre = $('#formPreconsulta');
    if (formPre) {
      const recalcular = () => {
        const peso = Number($('#vPeso').value);
        const talla = Number($('#vTalla') ? $('#vTalla').value : 0);
        const caja = $('#imcCalculado');
        if (!caja) return;
        caja.textContent = (peso > 0 && talla > 0)
          ? (peso / (talla * talla)).toFixed(1)
          : '—';
      };
      $('#vPeso').addEventListener('input', recalcular);
      if ($('#vTalla')) $('#vTalla').addEventListener('input', recalcular);

      $('#vEmergencia').addEventListener('change', (e) => {
        $('#filaMotivoEmg').classList.toggle('hide', !e.target.checked);
      });

      formPre.addEventListener('submit', (e) => {
        e.preventDefault();
        guardarPreconsulta();
      });
    }

    /* --- Atención: preguardado --- */
    const formConsulta = $('#formConsulta');
    if (formConsulta) {
      let temporizador = null;
      formConsulta.addEventListener('input', () => {
        const aviso = $('#autosave');
        aviso.textContent = 'Guardando…';
        aviso.classList.remove('is-saved');
        clearTimeout(temporizador);
        temporizador = setTimeout(() => {
          guardarFormularioConsulta(getConsulta(estado.consultaId));
          aviso.textContent = 'Preguardado ' + fHora(new Date());
          aviso.classList.add('is-saved');
        }, 700);
      });
    }
  }

  /* ===================== Acciones ===================== */

  function guardarPaciente() {
    const f = $('#formPaciente');
    const nombres = f.nombres.value.trim();
    const apellidos = f.apellidos.value.trim();
    const nacimiento = f.nacimiento.value;
    const errores = [];

    if (!nombres || !apellidos) errores.push('El nombre y los apellidos son obligatorios.');
    if (!nacimiento) errores.push('La fecha de nacimiento es obligatoria.');

    const edad = nacimiento ? edadDe(nacimiento) : null;
    /* La edad real decide, no el interruptor: así no se puede usar el
       interruptor para saltarse la regla del responsable. */
    if (edad !== null && edad >= 18 && !f.dui.value.trim()) {
      errores.push('Un paciente mayor de edad necesita DUI.');
    }
    if (edad !== null && edad < 18) {
      if (!f.cNombres.value.trim() || !f.cApellidos.value.trim() || !f.cParentesco.value) {
        errores.push('Un paciente menor de edad necesita un responsable con nombre, apellidos y parentesco.');
      }
    }

    const cont = $('#erroresRegistro');
    if (errores.length) {
      cont.innerHTML = `<div class="alert alert--danger">${ICON.alerta}
        <div>${errores.map(esc).join('<br>')}</div></div>`;
      return;
    }
    cont.innerHTML = '';

    const nuevo = {
      id: 'p' + (pacientes.length + 1) + Date.now(),
      nombres, apellidos,
      dui: f.dui.value.trim(),
      telefono: f.telefono.value.trim(),
      nacimiento,
      sexo: f.sexo.value,
      clinica: estado.clinicaId,
      alergias: '',
      contactos: [],
      antecedentes: [],
      controles: [],
      consultas: []
    };

    if (f.cNombres.value.trim()) {
      nuevo.contactos.push({
        nombres: f.cNombres.value.trim(),
        apellidos: f.cApellidos.value.trim(),
        telefono: f.cTelefono.value.trim(),
        parentesco: f.cParentesco.value || 'Otro',
        tipo: edad < 18 ? 'responsable' : 'referencia',
        activo: true
      });
    }

    pacientes.push(nuevo);
    estado.pacienteId = nuevo.id;
    registroEsMenor = false;
    ir('expediente');
    toast('Paciente registrado', `Se creó el expediente de ${nombres} ${apellidos} en ${clinica().nombreLargo}.`);
  }

  function guardarPreconsulta() {
    const p = getPaciente(estado.pacienteId);
    const esMenor = edadDe(p.nacimiento) < 18;
    const peso = Number($('#vPeso').value);
    const errores = [];

    if (!peso || peso <= 0) errores.push('El peso es obligatorio.');

    const presion = $('#vPresion') ? $('#vPresion').value.trim() : '';
    if (presion && !/^\d{2,3}\/\d{2,3}$/.test(presion)) {
      errores.push('La presión arterial se escribe como 120/80.');
    }

    const esEmergencia = $('#vEmergencia').checked;
    const motivoEmg = $('#vMotivoEmg').value.trim();
    if (esEmergencia && !motivoEmg) errores.push('Si marcas emergencia, el motivo es obligatorio.');

    const cont = $('#erroresPreconsulta');
    if (errores.length) {
      cont.innerHTML = `<div class="alert alert--danger">${ICON.alerta}
        <div>${errores.map(esc).join('<br>')}</div></div>`;
      return;
    }
    cont.innerHTML = '';

    const num = (sel) => ($(sel) && $(sel).value !== '') ? Number($(sel).value) : null;
    const talla = esMenor ? num('#vTalla') : null;

    const vitales = { peso };
    if (esMenor) {
      vitales.talla = talla;
      vitales.imc = talla ? Number((peso / (talla * talla)).toFixed(1)) : null;
    } else {
      vitales.presion = presion;
    }
    vitales.temp = num('#vTemp');
    vitales.fc = num('#vFc');
    vitales.saturacion = num('#vSat');

    consultas.push({
      id: 'q' + (++contadorConsulta),
      pacienteId: p.id,
      doctorId: preconsultaMedico,
      horaLlegada: new Date(),
      inicio: null,
      cierre: null,
      esEmergencia,
      motivoPrioridad: motivoEmg,
      reasignadoDesde: '',
      notaRetiro: '',
      vitales,
      motivo: '', historia: '', examen: '',
      diagnostico: '', tratamiento: '', indicaciones: '',
      receta: null,
      documentos: []
    });

    const medico = getUsuario(preconsultaMedico);
    preconsultaMedico = null;
    ir('cola');
    toast('Preconsulta registrada',
      `${nombreCompleto(p)} entró a la cola de ${medico.tratamiento}${esEmergencia ? ' como emergencia' : ''}.`);
  }

  function iniciarAtencion(consultaId) {
    const c = getConsulta(consultaId);
    const u = usuario();

    /* Un médico solo atiende sus propias consultas. */
    if (c.doctorId !== u.id) {
      toast('No puedes atender esta consulta', `Está asignada a ${getUsuario(c.doctorId).tratamiento}. Reasígnala primero desde la cola.`);
      return;
    }
    if (!c.inicio) c.inicio = new Date();
    estado.consultaId = c.id;
    ir('atencion');
  }

  /* ===================== Eventos globales ===================== */

  document.addEventListener('click', (e) => {
    const t = e.target;

    const ir_ = t.closest('[data-ir]');
    if (ir_) { ir(ir_.dataset.ir); return; }

    const rol = t.closest('[data-usuario]');
    if (rol) {
      estado.usuarioId = rol.dataset.usuario;
      const u = usuario();
      if (!u.clinicas.includes(estado.clinicaId)) estado.clinicaId = u.clinicas[0];
      /* Si la pantalla actual ya no le corresponde a este rol, vuelve al inicio. */
      const perm = permisos();
      const permitida = {
        pacientes: perm.verPacientes,
        registrar: perm.registrarPaciente,
        cola: perm.verCola,
        preconsulta: perm.registrarPreconsulta,
        atencion: perm.atender,
        expediente: perm.verExpediente,
        historial: perm.verExpediente,
        antecedentes: perm.verExpediente,
        recetas: perm.verExpediente
      };
      if (estado.vista in permitida && !permitida[estado.vista]) estado.vista = 'inicio';
      render();
      toast(`Ahora navegas como ${u.rol}`, 'Cambian las pantallas del menú, las acciones disponibles y lo que se ve en cada una.');
      return;
    }

    const cl = t.closest('[data-clinica]');
    if (cl) {
      estado.clinicaId = cl.dataset.clinica;
      estado.vista = 'inicio';
      render();
      toast('Clínica cambiada', `Trabajas en ${clinica().nombreLargo}. Cambia el color, el logo y las pantallas disponibles.`);
      return;
    }

    const bloq = t.closest('[data-bloqueado]');
    if (bloq) { modalBloqueado(bloq.dataset.bloqueado, bloq.dataset.detalle); return; }

    const exp = t.closest('[data-expediente]');
    if (exp && permisos().verExpediente && !t.closest('button[data-preconsulta]')) {
      estado.pacienteId = exp.dataset.expediente;
      ir('expediente');
      return;
    }

    const verExp = t.closest('[data-ver-expediente]');
    if (verExp) {
      estado.pacienteId = verExp.dataset.verExpediente;
      ir('expediente');
      return;
    }

    const pre = t.closest('[data-preconsulta]');
    if (pre) {
      estado.pacienteId = pre.dataset.preconsulta;
      preconsultaMedico = null;
      ir('preconsulta');
      return;
    }

    /* Solo cambia la selección: repintar aquí borraría los signos
       vitales que ya se escribieron en el formulario de al lado. */
    const medico = t.closest('[data-medico]');
    if (medico) {
      preconsultaMedico = medico.dataset.medico;
      $$('[data-medico]').forEach((el) =>
        el.classList.toggle('is-selected', el === medico));
      return;
    }

    /* El interruptor Adulto/Menor cambia qué campos se piden, así que sí
       repinta — pero conservando lo que ya se había escrito. */
    const tipo = t.closest('[data-tipo]');
    if (tipo) {
      registroEsMenor = tipo.dataset.tipo === 'menor';
      const form = $('#formPaciente');
      const previos = {};
      if (form) {
        Array.from(form.elements).forEach((el) => {
          if (el.name) previos[el.name] = el.value;
        });
      }
      render();
      const nuevo = $('#formPaciente');
      if (nuevo) {
        Object.keys(previos).forEach((k) => {
          const el = nuevo.elements[k];
          if (el && !el.disabled) el.value = previos[k];
        });
      }
      return;
    }

    const vistaAdmin = t.closest('[data-vista-admin]');
    if (vistaAdmin) {
      estado.vistaAdmin = vistaAdmin.dataset.vistaAdmin;
      render();
      return;
    }

    const atender = t.closest('[data-atender]');
    if (atender && !atender.disabled) { iniciarAtencion(atender.dataset.atender); return; }

    const fin = t.closest('[data-finalizar]');
    if (fin) { modalFinalizar(fin.dataset.finalizar); return; }

    const reasignar = t.closest('[data-reasignar]');
    if (reasignar) { modalReasignar(reasignar.dataset.reasignar); return; }

    const retiro = t.closest('[data-retiro]');
    if (retiro) { modalRetiro(retiro.dataset.retiro); return; }

    const emg = t.closest('[data-emergencia]');
    if (emg) { modalEmergencia(emg.dataset.emergencia); return; }

    const editarPre = t.closest('[data-editar-preconsulta]');
    if (editarPre) { modalEditarPreconsulta(editarPre.dataset.editarPreconsulta); return; }

    const doc = t.closest('[data-doc]');
    if (doc) { modalDocumento(doc.dataset.doc); return; }

    const tarjeta = t.closest('[data-tarjeta]');
    if (tarjeta) {
      const id = tarjeta.dataset.tarjeta;
      if (id === 'historial') ir('historial');
      else if (id === 'antecedentes') ir('antecedentes');
      else if (id === 'recetas') ir('recetas');
      else modalDocumento(id === 'estudios' ? 'examen' : id === 'constancias' ? 'incapacidad' : 'referencia');
      return;
    }

    const receta = t.closest('[data-receta]');
    if (receta) { modalReceta(receta.dataset.receta); return; }

    const detalle = t.closest('[data-detalle]');
    if (detalle) { modalDetalleConsulta(detalle.dataset.detalle); return; }

    if (t.closest('[data-agregar-contacto]')) { modalAgregarContacto(); return; }
    if (t.closest('[data-nuevo-antecedente]')) { modalAntecedente(); return; }

    const quitar = t.closest('[data-quitar-contacto]');
    if (quitar) {
      const p = getPaciente(estado.pacienteId);
      const activos = p.contactos.filter((c) => c.activo);
      const c = activos[Number(quitar.dataset.quitarContacto)];
      const responsables = activos.filter((x) => x.tipo === 'responsable');
      /* Misma guarda que el sistema real: un menor no puede quedarse sin responsable. */
      if (c.tipo === 'responsable' && responsables.length === 1 && edadDe(p.nacimiento) < 18) {
        toast('No se puede desactivar', 'Es el último responsable de un paciente menor de edad. Agrega otro antes de quitarlo.');
        return;
      }
      c.activo = false;
      render();
      toast('Contacto desactivado', 'No se borra: se puede reactivar volviéndolo a agregar.');
      return;
    }
  });

  /* ===================== Sidebar móvil ===================== */

  function cerrarSidebar() {
    $('#sidebar').classList.remove('is-open');
    $('#scrim').classList.add('hide');
  }

  $('#menuBtn').addEventListener('click', () => {
    $('#sidebar').classList.add('is-open');
    $('#scrim').classList.remove('hide');
  });

  $('#scrim').addEventListener('click', cerrarSidebar);

  /* ===================== Refresco de la cola ===================== */

  /* El sistema real refresca la cola cada 30 s sin recargar la página.
     Aquí se repinta solo esa pantalla, para que los tiempos de espera
     avancen solos sin interrumpir lo que se esté haciendo en otra. */
  setInterval(() => {
    if (estado.vista === 'cola' && $('#overlay').hidden) render();
  }, 30000);

  /* ===================== Arranque ===================== */

  render();

  setTimeout(() => {
    toast('Estás viendo una demo',
      'Sistema real desarrollado para Clínica ProSalud. Pacientes y personal ficticios; nada se guarda al recargar.');
  }, 900);
})();
