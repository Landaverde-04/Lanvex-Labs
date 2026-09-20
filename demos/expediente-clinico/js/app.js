/* ========================================================================
   Clinia · Módulo de Expediente Clínico — demo
   Lanvex · HTML + CSS + JavaScript sin dependencias
   ===================================================================== */
(function () {
  'use strict';

  /* ===================== Utilidades ===================== */
  const $  = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  /* Escapa texto antes de insertarlo como HTML */
  const esc = (v) => String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  const fFecha  = (f) => `${f.getDate()} ${MESES[f.getMonth()]} ${f.getFullYear()}`;
  const fCorta  = (f) => `${String(f.getDate()).padStart(2, '0')}/${String(f.getMonth() + 1).padStart(2, '0')}/${String(f.getFullYear()).slice(2)}`;

  /* "hace 3 días" / "en 2 semanas" */
  function relativo(f) {
    const dias = Math.round((f - new Date().setHours(9, 0, 0, 0)) / 86400000);
    const abs = Math.abs(dias);
    let txt;
    if (abs === 0) txt = 'hoy';
    else if (abs === 1) txt = dias < 0 ? 'ayer' : 'mañana';
    else if (abs < 30) txt = `${abs} días`;
    else if (abs < 365) txt = `${Math.round(abs / 30)} meses`;
    else txt = `${(abs / 365).toFixed(1)} años`;
    if (abs <= 1) return txt;
    return dias < 0 ? `hace ${txt}` : `en ${txt}`;
  }

  function edadDe(nacimiento) {
    const n = new Date(nacimiento + 'T00:00:00');
    const hoy = new Date();
    let e = hoy.getFullYear() - n.getFullYear();
    const m = hoy.getMonth() - n.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < n.getDate())) e--;
    return e;
  }

  /* Quita acentos para que "guzman" encuentre a "Guzmán" */
  const normaliza = (t) => String(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const iniciales = (nombre) => nombre.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase();

  /* ---------- Interpretación clínica básica (solo adultos) ---------- */
  function clasificaPresion(pas, pad, edad) {
    if (edad < 18) return { texto: 'Según percentil por edad', nivel: '' };
    if (pas >= 140 || pad >= 90) return { texto: 'Hipertensión grado 2', nivel: 'alto' };
    if (pas >= 130 || pad >= 80) return { texto: 'Hipertensión grado 1', nivel: 'medio' };
    if (pas >= 120) return { texto: 'Presión elevada', nivel: 'medio' };
    return { texto: 'En rango normal', nivel: 'ok' };
  }

  function clasificaIMC(imc, edad) {
    if (edad < 18) return { texto: 'Según percentil por edad', nivel: '' };
    if (imc >= 30) return { texto: 'Obesidad', nivel: 'alto' };
    if (imc >= 25) return { texto: 'Sobrepeso', nivel: 'medio' };
    if (imc < 18.5) return { texto: 'Bajo peso', nivel: 'medio' };
    return { texto: 'Peso adecuado', nivel: 'ok' };
  }

  function clasificaGlucosa(g) {
    if (g >= 126) return { texto: 'Glucosa alta', nivel: 'alto' };
    if (g >= 100) return { texto: 'Glucosa alterada', nivel: 'medio' };
    if (g < 70)  return { texto: 'Glucosa baja', nivel: 'alto' };
    return { texto: 'En rango normal', nivel: 'ok' };
  }

  const claseVital = (nivel) => nivel === 'alto' ? ' vital--alto' : nivel === 'medio' ? ' vital--medio' : '';
  const colorNota  = (nivel) => nivel === 'alto' ? 'var(--danger)' : nivel === 'medio' ? 'var(--warn)' : 'var(--ok)';

  /* ===================== Estado ===================== */
  /* Se clona el dataset y se resuelven las fechas relativas (campo `d`) */
  const pacientes = PACIENTES.map((p) => {
    const conFecha = (arr) => arr
      .map((x) => Object.assign({}, x, { fecha: fechaDesde(x.d) }))
      .sort((a, b) => b.fecha - a.fecha);
    return Object.assign({}, p, {
      vitales:   arr_ordenAsc(conFecha(p.vitales)),
      consultas: conFecha(p.consultas),
      recetas:   conFecha(p.recetas),
      estudios:  conFecha(p.estudios),
      proximaCita: p.proximaCita == null ? null : fechaDesde(p.proximaCita)
    });
  });

  function arr_ordenAsc(arr) { return arr.slice().sort((a, b) => a.fecha - b.fecha); }

  const estado = {
    filtro: 'todos',
    busqueda: '',
    pacienteId: null,
    tab: 'resumen',
    metrica: 'peso',
    notaNueva: null
  };

  /* Elementos fijos */
  const vistaLista = $('#vistaLista');
  const vistaExp   = $('#vistaExpediente');
  const tbody      = $('#tablaPacientes');
  const overlay    = $('#overlay');
  const modal      = $('#modal');

  $('#medicoNombre').textContent = MEDICO.nombre.replace('Alvarado', '').trim();
  $('#medicoRol').textContent = MEDICO.especialidad;

  /* ===================== Avisos (toasts) ===================== */
  function toast(titulo, texto, ms) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>
      <span><b>${esc(titulo)}</b>${texto}</span>`;
    $('#toasts').appendChild(el);
    setTimeout(() => {
      el.style.transition = 'opacity .3s ease, transform .3s ease';
      el.style.opacity = '0';
      el.style.transform = 'translateY(8px)';
      setTimeout(() => el.remove(), 320);
    }, ms || 5200);
  }

  /* ===================== Modales ===================== */
  let ultimoFoco = null;

  function abrirModal(html) {
    ultimoFoco = document.activeElement;
    modal.innerHTML = html;
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    const primero = modal.querySelector('input, textarea, select, button');
    if (primero) primero.focus();
  }

  function cerrarModal() {
    overlay.hidden = true;
    modal.innerHTML = '';
    document.body.style.overflow = '';
    if (ultimoFoco) ultimoFoco.focus();
  }

  overlay.addEventListener('click', (e) => { if (e.target === overlay) cerrarModal(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !overlay.hidden) cerrarModal();
    /* Mantiene el foco dentro del modal */
    if (e.key === 'Tab' && !overlay.hidden) {
      const focos = $$('button, input, select, textarea, a[href]', modal).filter((el) => !el.disabled);
      if (!focos.length) return;
      const primero = focos[0], ultimo = focos[focos.length - 1];
      if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
    }
  });

  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-cerrar]')) cerrarModal();
  });

  /* ===================== Listado de pacientes ===================== */
  function ultimaConsulta(p) { return p.consultas.length ? p.consultas[0].fecha : null; }

  function etiquetaEstado(p) {
    if (p.estado === 'nuevo')  return '<span class="pill pill--info">Primera vez</span>';
    if (p.estado === 'alta')   return '<span class="pill pill--mute">De alta</span>';
    return '<span class="pill pill--ok">En control</span>';
  }

  function filtrados() {
    const q = normaliza(estado.busqueda.trim());
    return pacientes.filter((p) => {
      const coincideTexto = !q ||
        normaliza(p.nombre).includes(q) ||
        normaliza(p.exp).includes(q) ||
        normaliza(p.motivo).includes(q);
      let coincideFiltro = true;
      if (estado.filtro === 'control') coincideFiltro = p.estado === 'control';
      else if (estado.filtro === 'nuevo') coincideFiltro = p.estado === 'nuevo';
      else if (estado.filtro === 'alergia') coincideFiltro = p.alergias.length > 0;
      return coincideTexto && coincideFiltro;
    });
  }

  function pintarLista() {
    const lista = filtrados();
    $('#contador').textContent = `${lista.length} de ${pacientes.length} expedientes`;
    $('#resumenLista').textContent =
      `${pacientes.length} pacientes registrados · ${pacientes.filter((p) => p.alergias.length).length} con alergias documentadas`;

    tbody.innerHTML = lista.map((p) => {
      const uc = ultimaConsulta(p);
      const edad = edadDe(p.nacimiento);
      const alergia = p.alergias.length
        ? `<span class="pill pill--danger" title="Alergias: ${esc(p.alergias.join(', '))}">Alergias</span>`
        : '';
      return `
        <tr data-id="${p.id}" tabindex="0" role="button" aria-label="Abrir expediente de ${esc(p.nombre)}">
          <td>
            <div class="patient-cell">
              <span class="avatar avatar--${p.sexo === 'F' ? 'f' : 'm'}">${esc(iniciales(p.nombre))}</span>
              <span>
                <span class="patient-cell__name">${esc(p.nombre)}</span>
                <span class="patient-cell__exp">${esc(p.exp)}</span>
              </span>
            </div>
          </td>
          <td data-label="Edad" class="nowrap num">${edad} años · ${p.sexo === 'F' ? 'F' : 'M'}</td>
          <td data-label="Motivo" class="muted">${esc(p.motivo)}</td>
          <td data-label="Última consulta" class="nowrap muted">${uc ? `${fCorta(uc)} <span style="color:var(--dim)">(${relativo(uc)})</span>` : '—'}</td>
          <td data-label="Estado" class="nowrap">${etiquetaEstado(p)} ${alergia}</td>
        </tr>`;
    }).join('');

    $('#listaVacia').hidden = lista.length > 0;
  }

  tbody.addEventListener('click', (e) => {
    const fila = e.target.closest('tr');
    if (fila) abrirExpediente(fila.dataset.id);
  });
  tbody.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('tr')) {
      e.preventDefault();
      abrirExpediente(e.target.closest('tr').dataset.id);
    }
  });

  $('#buscador').addEventListener('input', (e) => {
    estado.busqueda = e.target.value;
    if (vistaLista.hidden) volverALista();  /* volverALista ya repinta */
    else pintarLista();
  });

  $$('.chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      $$('.chip').forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
      estado.filtro = chip.dataset.estado;
      pintarLista();
    });
  });

  /* ===================== Expediente ===================== */
  const getPaciente = (id) => pacientes.find((p) => p.id === id);

  function abrirExpediente(id) {
    estado.pacienteId = id;
    estado.tab = 'resumen';
    estado.metrica = 'peso';
    vistaLista.hidden = true;
    vistaExp.hidden = false;
    pintarExpediente();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function volverALista() {
    estado.pacienteId = null;
    estado.notaNueva = null;
    vistaExp.hidden = true;
    vistaLista.hidden = false;
    pintarLista();
  }

  function pintarExpediente() {
    const p = getPaciente(estado.pacienteId);
    if (!p) return volverALista();

    const edad = edadDe(p.nacimiento);
    const tabs = [
      ['resumen', 'Resumen', null],
      ['antecedentes', 'Antecedentes', null],
      ['consultas', 'Consultas', p.consultas.length],
      ['recetas', 'Recetas', p.recetas.length],
      ['estudios', 'Estudios', p.estudios.length]
    ];

    vistaExp.innerHTML = `
      <button class="back" id="btnVolver">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>
        Volver a expedientes
      </button>

      <div class="record-head">
        <span class="avatar avatar--lg avatar--${p.sexo === 'F' ? 'f' : 'm'}">${esc(iniciales(p.nombre))}</span>
        <div class="record-head__main">
          <h2>${esc(p.nombre)}</h2>
          <div class="record-head__meta">
            <span>Expediente <b>${esc(p.exp)}</b></span>
            <span><b>${edad}</b> años · ${p.sexo === 'F' ? 'Femenino' : 'Masculino'}</span>
            <span>Nacimiento <b>${fFecha(new Date(p.nacimiento + 'T00:00:00'))}</b></span>
            <span>Sangre <b>${esc(p.sangre)}</b></span>
            <span>Tel. <b>${esc(p.telefono)}</b></span>
          </div>
          <div class="record-head__actions">
            <button class="btn btn--primary" id="btnNuevaConsulta">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
              Registrar consulta
            </button>
            ${p.recetas.length ? `<button class="btn" data-receta="0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V4h12v5M6 18H4v-6h16v6h-2M8 14h8v7H8z"/></svg>
              Imprimir última receta
            </button>` : ''}
          </div>
          ${p.alergias.length ? `
            <div class="alert-strip">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex:none;margin-top:2px"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></svg>
              <span><b>Alergias documentadas:</b> ${esc(p.alergias.join(' · '))}</span>
            </div>` : ''}
        </div>
      </div>

      <div class="tabs" role="tablist">
        ${tabs.map(([id, txt, n]) => `
          <button class="tab" role="tab" data-tab="${id}" aria-selected="${estado.tab === id}">
            ${txt}${n != null ? `<span class="tab__count">${n}</span>` : ''}
          </button>`).join('')}
      </div>

      <div id="panel"></div>`;

    $('#btnVolver').addEventListener('click', volverALista);
    $('#btnNuevaConsulta').addEventListener('click', () => modalConsulta(p));
    $$('.tab', vistaExp).forEach((t) => t.addEventListener('click', () => {
      estado.tab = t.dataset.tab;
      $$('.tab', vistaExp).forEach((x) => x.setAttribute('aria-selected', String(x === t)));
      pintarPanel();
    }));
    const btnRx = vistaExp.querySelector('[data-receta]');
    if (btnRx) btnRx.addEventListener('click', () => modalReceta(p, 0));

    pintarPanel();
  }

  function pintarPanel() {
    const p = getPaciente(estado.pacienteId);
    const panel = $('#panel');
    const render = {
      resumen: panelResumen,
      antecedentes: panelAntecedentes,
      consultas: panelConsultas,
      recetas: panelRecetas,
      estudios: panelEstudios
    }[estado.tab];
    panel.innerHTML = render(p);
    if (estado.tab === 'resumen') activarGrafica(p);
    if (estado.tab === 'recetas' || estado.tab === 'resumen') {
      $$('[data-receta]', panel).forEach((b) =>
        b.addEventListener('click', () => modalReceta(p, Number(b.dataset.receta))));
    }
    if (estado.tab === 'consultas') {
      $$('.note__head', panel).forEach((h) => h.addEventListener('click', () => {
        const nota = h.closest('.note');
        const abierto = nota.hasAttribute('open');
        nota.toggleAttribute('open', !abierto);
        $('.note__body', nota).hidden = abierto;
        h.setAttribute('aria-expanded', String(!abierto));
      }));
    }
  }

  /* ---------- Panel: resumen ---------- */
  function panelResumen(p) {
    const v = p.vitales[p.vitales.length - 1];
    const edad = edadDe(p.nacimiento);
    const imc = v.peso / (p.talla * p.talla);
    const pa = clasificaPresion(v.pas, v.pad, edad);
    const ci = clasificaIMC(imc, edad);
    const cg = clasificaGlucosa(v.glucosa);

    const vital = (label, valor, unidad, clas) => `
      <div class="vital${clas ? claseVital(clas.nivel) : ''}">
        <div class="vital__label">${label}</div>
        <div class="vital__value">${valor}${unidad ? `<small>${unidad}</small>` : ''}</div>
        ${clas && clas.texto ? `<div class="vital__note" style="color:${colorNota(clas.nivel)}">${clas.texto}</div>` : ''}
      </div>`;

    return `
      <div class="cols">
        <div class="stack">
          <div class="card">
            <div class="card__head">
              <div>
                <h3>Signos vitales</h3>
                <p>Última toma: ${fFecha(v.fecha)} (${relativo(v.fecha)})</p>
              </div>
            </div>
            <div class="card__body">
              <div class="vitals">
                ${vital('Presión arterial', `${v.pas}/${v.pad}`, 'mmHg', pa)}
                ${vital('Frecuencia cardiaca', v.fc, 'lpm')}
                ${vital('Temperatura', v.temp.toFixed(1), '°C')}
                ${vital('Saturación O₂', v.spo2, '%')}
                ${vital('Peso', v.peso.toFixed(1), 'kg')}
                ${vital('Índice de masa corporal', imc.toFixed(1), '', ci)}
                ${vital('Glucosa en ayunas', v.glucosa, 'mg/dL', cg)}
                ${vital('Talla', p.talla.toFixed(2), 'm')}
              </div>
            </div>
          </div>

          ${graficaHTML(p)}
        </div>

        <div class="stack">
          <div class="card">
            <div class="card__head"><h3>Padecimientos activos</h3></div>
            <div class="card__body">
              ${p.padecimientos.length ? `<div class="datalist">
                ${p.padecimientos.map((d) => `
                  <div style="display:flex;justify-content:space-between;gap:10px;align-items:center">
                    <span>
                      <b style="font-weight:600">${esc(d.nombre)}</b><br>
                      <span class="muted" style="font-size:12.5px">Desde ${esc(d.desde)}</span>
                    </span>
                    <span class="pill ${d.estado === 'controlado' ? 'pill--ok' : 'pill--warn'}">${esc(d.estado)}</span>
                  </div>`).join('')}
              </div>` : '<p class="muted">Sin padecimientos crónicos registrados.</p>'}
            </div>
          </div>

          <div class="card">
            <div class="card__head"><h3>Medicación actual</h3></div>
            <div class="card__body">
              ${p.medicacion.length ? p.medicacion.map((m) => `
                <div style="padding:9px 0;border-bottom:1px solid var(--line-soft)">
                  <b style="font-weight:600">${esc(m.nombre)}</b><br>
                  <span class="muted" style="font-size:13px">${esc(m.dosis)} — ${esc(m.indicacion)}</span>
                </div>`).join('') : '<p class="muted">Sin medicación permanente.</p>'}
            </div>
          </div>

          ${p.proximaCita ? `
          <div class="card">
            <div class="card__head"><h3>Próxima cita</h3></div>
            <div class="card__body" style="display:flex;align-items:center;gap:13px">
              <span class="avatar" style="background:var(--teal-soft);color:var(--teal)">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 10h18"/></svg>
              </span>
              <span>
                <b style="font-weight:620">${fFecha(p.proximaCita)}</b><br>
                <span class="muted" style="font-size:13px">${relativo(p.proximaCita)} · control programado</span>
              </span>
            </div>
          </div>` : ''}
        </div>
      </div>`;
  }

  /* ---------- Panel: antecedentes ---------- */
  function panelAntecedentes(p) {
    const bloque = (titulo, items) => `
      <div class="card">
        <div class="card__head"><h3>${titulo}</h3></div>
        <div class="card__body">
          ${items && items.length
            ? `<ul class="bullets">${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`
            : '<p class="muted">Sin datos registrados.</p>'}
        </div>
      </div>`;

    const a = p.antecedentes;
    return `
      <div class="cols">
        <div class="stack">
          ${bloque('Antecedentes patológicos', a.patologicos)}
          ${bloque('Antecedentes quirúrgicos', a.quirurgicos)}
          ${a.ginecoObstetricos ? bloque('Antecedentes gineco-obstétricos', a.ginecoObstetricos) : ''}
        </div>
        <div class="stack">
          ${bloque('Antecedentes familiares', a.familiares)}
          ${bloque('Antecedentes no patológicos', a.noPatologicos)}
          <div class="card">
            <div class="card__head"><h3>Alergias</h3></div>
            <div class="card__body">
              ${p.alergias.length
                ? p.alergias.map((al) => `<span class="pill pill--danger" style="margin:0 6px 6px 0">${esc(al)}</span>`).join('')
                : '<p class="muted">Sin alergias conocidas.</p>'}
            </div>
          </div>
        </div>
      </div>`;
  }

  /* ---------- Panel: consultas ---------- */
  function panelConsultas(p) {
    if (!p.consultas.length) {
      return `<div class="card"><div class="empty"><p>Este paciente aún no tiene notas de consulta.</p></div></div>`;
    }
    return `<div class="timeline">${p.consultas.map((c, i) => {
      const abierto = i === 0 || c.id === estado.notaNueva;
      const v = c.vitales;
      return `
        <article class="note${c.id === estado.notaNueva ? ' is-new' : ''}"${abierto ? ' open' : ''}>
          <button class="note__head" aria-expanded="${abierto}">
            <span class="note__date">
              <b>${c.fecha.getDate()}</b>
              <span>${MESES[c.fecha.getMonth()]} ${String(c.fecha.getFullYear()).slice(2)}</span>
            </span>
            <span class="note__title">
              <b>${esc(c.motivo)}</b>
              <span>${esc(c.diagnostico)}</span>
            </span>
            ${c.id === estado.notaNueva ? '<span class="pill pill--info">Nueva</span>' : ''}
            <svg class="note__chev" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </button>
          <div class="note__body"${abierto ? '' : ' hidden'}>
            ${v ? `<div class="note__vitals">
              <span>PA <b>${v.pas}/${v.pad}</b> mmHg</span>
              <span>FC <b>${v.fc}</b> lpm</span>
              <span>Temp <b>${Number(v.temp).toFixed(1)}</b> °C</span>
              <span>Peso <b>${Number(v.peso).toFixed(1)}</b> kg</span>
              ${v.glucosa ? `<span>Glucosa <b>${v.glucosa}</b> mg/dL</span>` : ''}
              ${v.spo2 ? `<span>SpO₂ <b>${v.spo2}</b> %</span>` : ''}
            </div>` : ''}
            <div class="note__section"><h4>Subjetivo — lo que refiere el paciente</h4><p>${esc(c.subjetivo)}</p></div>
            <div class="note__section"><h4>Objetivo — exploración física</h4><p>${esc(c.objetivo)}</p></div>
            <div class="note__section"><h4>Diagnóstico</h4><p>${esc(c.diagnostico)}</p></div>
            <div class="note__section"><h4>Plan de tratamiento</h4><p>${esc(c.plan)}</p></div>
            <p class="muted" style="font-size:12.5px">Atendió: ${esc(MEDICO.nombre)}</p>
          </div>
        </article>`;
    }).join('')}</div>`;
  }

  /* ---------- Panel: recetas ---------- */
  function panelRecetas(p) {
    if (!p.recetas.length) {
      return `<div class="card"><div class="empty"><p>No hay recetas emitidas para este paciente.</p></div></div>`;
    }
    return `<div class="card"><div class="card__body">${p.recetas.map((r, i) => `
      <div class="rx">
        <span class="rx__icon">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h6a3 3 0 0 1 0 6H5zM5 10l8 10"/><path d="m14 14 6 6M20 14l-6 6"/></svg>
        </span>
        <span class="rx__info">
          <b>${esc(r.dx)}</b>
          <span>${fFecha(r.fecha)} · ${r.medicamentos.length} medicamento${r.medicamentos.length > 1 ? 's' : ''} · ${relativo(r.fecha)}</span>
        </span>
        <button class="btn btn--sm" data-receta="${i}">Ver / Imprimir</button>
      </div>`).join('')}</div></div>`;
  }

  /* ---------- Panel: estudios ---------- */
  function panelEstudios(p) {
    if (!p.estudios.length) {
      return `<div class="card"><div class="empty"><p>No hay estudios solicitados.</p></div></div>`;
    }
    return `<div class="card"><table class="table">
      <thead><tr><th>Estudio</th><th>Tipo</th><th>Fecha</th><th>Estado</th><th>Resultado</th></tr></thead>
      <tbody>${p.estudios.map((e) => `
        <tr style="cursor:default">
          <td data-label="Estudio"><b style="font-weight:600">${esc(e.nombre)}</b></td>
          <td data-label="Tipo" class="muted nowrap">${esc(e.tipo)}</td>
          <td data-label="Fecha" class="muted nowrap">${fCorta(e.fecha)}</td>
          <td data-label="Estado" class="nowrap">${e.estado === 'listo'
            ? '<span class="pill pill--ok">Listo</span>'
            : '<span class="pill pill--warn">Pendiente</span>'}</td>
          <td data-label="Resultado" class="muted">${e.resultado ? esc(e.resultado) : '<span style="color:var(--dim)">En espera del laboratorio</span>'}</td>
        </tr>`).join('')}
      </tbody></table></div>`;
  }

  /* ===================== Gráfica de evolución =====================
     Una sola métrica a la vez: el título nombra la serie, así que no
     hace falta leyenda. Rejilla discreta, línea de 2px, marcadores
     visibles al pasar el cursor y tabla de datos como alternativa
     accesible. */
  const METRICAS = {
    peso:    { etiqueta: 'Peso corporal',        unidad: 'kg',     campo: 'peso',    decimales: 1 },
    pas:     { etiqueta: 'Presión sistólica',    unidad: 'mmHg',   campo: 'pas',     decimales: 0 },
    glucosa: { etiqueta: 'Glucosa en ayunas',    unidad: 'mg/dL',  campo: 'glucosa', decimales: 0 },
    fc:      { etiqueta: 'Frecuencia cardiaca',  unidad: 'lpm',    campo: 'fc',      decimales: 0 }
  };

  function graficaHTML(p) {
    ajustarGeometria();
    const m = METRICAS[estado.metrica];
    const pocos = p.vitales.length < 2;
    return `
      <div class="card chart">
        <div class="card__head">
          <div>
            <h3 id="tituloGrafica">${m.etiqueta} <span class="muted" style="font-weight:500">(${m.unidad})</span></h3>
            <p>Evolución de las tomas registradas en consulta</p>
          </div>
          <div class="chart__controls" role="group" aria-label="Indicador a graficar">
            ${Object.entries(METRICAS).map(([k, v]) => `
              <button class="chart__btn" data-metrica="${k}" aria-pressed="${estado.metrica === k}">${v.etiqueta.split(' ')[0]}</button>`).join('')}
          </div>
        </div>
        <div class="card__body">
          ${pocos
            ? `<p class="muted">Se necesitan al menos dos tomas para mostrar la evolución. Este paciente tiene ${p.vitales.length}.</p>`
            : `<div class="chart__figure" id="figura">
                 ${svgLinea(p, m)}
                 <div class="chart__tooltip" id="tooltipGrafica" role="status"></div>
               </div>
               <p class="chart__caption">${p.vitales.length} tomas · del ${fCorta(p.vitales[0].fecha)} al ${fCorta(p.vitales[p.vitales.length - 1].fecha)}</p>
               <button class="table-toggle" id="verTabla" aria-expanded="false">Ver los datos en tabla</button>
               <div id="tablaDatos" hidden>${tablaDatos(p, m)}</div>`}
        </div>
      </div>`;
  }

  /* Geometría compartida entre el dibujo y la interacción.
     En pantallas chicas el SVG se reduce mucho, así que se usa un lienzo
     más alto y tipografía mayor para que las cifras sigan siendo legibles. */
  const G = { w: 660, h: 240, top: 18, right: 14, bottom: 30, left: 46, fuente: 11, fuenteVal: 13 };

  function ajustarGeometria() {
    const angosta = window.matchMedia('(max-width: 860px)').matches;
    G.h         = angosta ? 320 : 240;
    G.left      = angosta ? 78  : 46;
    G.right     = angosta ? 18  : 14;
    G.bottom    = angosta ? 48  : 30;
    G.fuente    = angosta ? 22  : 11;
    G.fuenteVal = angosta ? 26  : 13;
  }

  /* Referencias del eje en valores redondos (10, 20, 25, 50…) en lugar
     de los mínimos y máximos crudos, que dan cifras como 80.4 o 73.1 */
  function ticksRedondos(min, max, cuantos) {
    const bruto = (max - min) / (cuantos - 1);
    const magnitud = Math.pow(10, Math.floor(Math.log10(bruto)));
    const norm = bruto / magnitud;
    const paso = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * magnitud;
    const inicio = Math.floor(min / paso) * paso;
    const fin = Math.ceil(max / paso) * paso;
    const ticks = [];
    for (let v = inicio; v <= fin + paso * 1e-6; v += paso) ticks.push(Number(v.toFixed(6)));
    return { ticks, decimales: paso < 1 ? 1 : 0 };
  }

  function escalas(p, m) {
    const vals = p.vitales.map((v) => v[m.campo]);
    const bajo = Math.min.apply(null, vals);
    const alto = Math.max.apply(null, vals);
    const margen = (alto - bajo) * 0.18 || Math.max(1, alto * 0.05);
    const { ticks, decimales } = ticksRedondos(bajo - margen, alto + margen, 5);
    const min = ticks[0];
    const max = ticks[ticks.length - 1];
    const n = p.vitales.length;
    const x = (i) => G.left + (i / (n - 1)) * (G.w - G.left - G.right);
    const y = (val) => G.top + (1 - (val - min) / (max - min)) * (G.h - G.top - G.bottom);
    return { x, y, min, max, ticks, decimales };
  }

  function svgLinea(p, m) {
    const { x, y, ticks, decimales } = escalas(p, m);
    const puntos = p.vitales.map((v, i) => ({ x: x(i), y: y(v[m.campo]), v }));
    const linea = puntos.map((pt, i) => `${i ? 'L' : 'M'}${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join(' ');
    const area = `${linea} L${puntos[puntos.length - 1].x.toFixed(1)} ${G.h - G.bottom} L${puntos[0].x.toFixed(1)} ${G.h - G.bottom} Z`;

    /* Referencias horizontales en valores redondos */
    const grid = ticks.map((t) => {
      const yy = y(t);
      return `<line x1="${G.left}" y1="${yy.toFixed(1)}" x2="${G.w - G.right}" y2="${yy.toFixed(1)}" stroke="var(--grid)" stroke-width="1"/>
              <text x="${G.left - 9}" y="${(yy + G.fuente * 0.36).toFixed(1)}" text-anchor="end" font-size="${G.fuente}" fill="var(--axis-text)">${t.toFixed(decimales)}</text>`;
    }).join('');

    /* Etiquetas de fecha: se colocan sólo las que caben sin encimarse */
    const ultimoIdx = p.vitales.length - 1;
    const separacion = G.fuente * 4.6;           /* ancho aproximado de "dd/mm/aa" */
    const elegidos = [0];
    for (let i = 1; i < ultimoIdx; i++) {
      const suficienteAntes = x(i) - x(elegidos[elegidos.length - 1]) >= separacion;
      const suficienteDespues = x(ultimoIdx) - x(i) >= separacion;
      if (suficienteAntes && suficienteDespues) elegidos.push(i);
    }
    if (ultimoIdx > 0 && x(ultimoIdx) - x(elegidos[elegidos.length - 1]) >= separacion * 0.7) {
      elegidos.push(ultimoIdx);
    }
    const fechas = elegidos.map((i) => {
      const anchor = i === 0 ? 'start' : i === ultimoIdx ? 'end' : 'middle';
      return `<text x="${x(i).toFixed(1)}" y="${G.h - G.bottom / 3}" text-anchor="${anchor}" font-size="${G.fuente}" fill="var(--axis-text)">${fCorta(p.vitales[i].fecha)}</text>`;
    }).join('');

    const ultimo = puntos[puntos.length - 1];

    return `
      <svg class="chart__svg" id="svgGrafica" viewBox="0 0 ${G.w} ${G.h}" role="img"
           aria-labelledby="tituloGrafica" aria-describedby="descGrafica">
        <desc id="descGrafica">Evolución de ${m.etiqueta} en ${m.unidad}, de ${fCorta(p.vitales[0].fecha)} a ${fCorta(ultimo.v.fecha)}. Valores: ${p.vitales.map((v) => v[m.campo]).join(', ')}.</desc>
        <defs>
          <linearGradient id="relleno" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stop-color="var(--series-1)" stop-opacity=".16"/>
            <stop offset="100%" stop-color="var(--series-1)" stop-opacity="0"/>
          </linearGradient>
        </defs>

        ${grid}
        ${fechas}

        <path d="${area}" fill="url(#relleno)"/>
        <path d="${linea}" fill="none" stroke="var(--series-1)" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>

        ${puntos.map((pt) => `<circle cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="${G.fuente * 0.28}"
              fill="#fff" stroke="var(--series-1)" stroke-width="2" vector-effect="non-scaling-stroke"/>`).join('')}

        <!-- Último valor rotulado directamente -->
        <circle cx="${ultimo.x.toFixed(1)}" cy="${ultimo.y.toFixed(1)}" r="4.5" fill="var(--series-1)"/>
        <text x="${(ultimo.x - 8).toFixed(1)}" y="${(ultimo.y - G.fuenteVal).toFixed(1)}" text-anchor="end"
              font-size="${G.fuenteVal}" font-weight="600" fill="var(--ink)">${ultimo.v[m.campo].toFixed(m.decimales)}</text>

        <line id="cruz" x1="0" y1="${G.top}" x2="0" y2="${G.h - G.bottom}"
              stroke="var(--series-1)" stroke-width="1" stroke-dasharray="3 3" opacity="0"/>
        <circle id="marcador" r="${G.fuente * 0.5}" fill="var(--series-1)" stroke="#fff" stroke-width="2" opacity="0"/>
        <rect id="captura" x="${G.left}" y="${G.top}" width="${G.w - G.left - G.right}"
              height="${G.h - G.top - G.bottom}" fill="transparent" style="cursor:crosshair"/>
      </svg>`;
  }

  function tablaDatos(p, m) {
    return `<table class="mini-table">
      <thead><tr><th>Fecha</th><th>${m.etiqueta} (${m.unidad})</th></tr></thead>
      <tbody>${p.vitales.slice().reverse().map((v) => `
        <tr><td>${fFecha(v.fecha)}</td><td>${v[m.campo].toFixed(m.decimales)}</td></tr>`).join('')}
      </tbody></table>`;
  }

  function activarGrafica(p) {
    /* Cambio de indicador */
    $$('[data-metrica]').forEach((b) => b.addEventListener('click', () => {
      estado.metrica = b.dataset.metrica;
      pintarPanel();
    }));

    const svg = $('#svgGrafica');
    if (!svg) return;

    ajustarGeometria();
    const m = METRICAS[estado.metrica];
    const { x, y } = escalas(p, m);
    const cruz = $('#cruz');
    const marcador = $('#marcador');
    const tip = $('#tooltipGrafica');
    const captura = $('#captura');

    function mostrar(e) {
      const caja = svg.getBoundingClientRect();
      const px = ((e.clientX - caja.left) / caja.width) * G.w;
      /* Punto más cercano en el eje horizontal */
      let idx = 0, mejor = Infinity;
      p.vitales.forEach((_, i) => {
        const d = Math.abs(x(i) - px);
        if (d < mejor) { mejor = d; idx = i; }
      });
      const v = p.vitales[idx];
      const cx = x(idx), cy = y(v[m.campo]);

      cruz.setAttribute('x1', cx); cruz.setAttribute('x2', cx); cruz.setAttribute('opacity', '.5');
      marcador.setAttribute('cx', cx); marcador.setAttribute('cy', cy); marcador.setAttribute('opacity', '1');

      tip.innerHTML = `<b>${v[m.campo].toFixed(m.decimales)}</b> ${m.unidad}<br><span>${fFecha(v.fecha)}</span>`;
      tip.style.left = `${(cx / G.w) * 100}%`;
      tip.style.top  = `${(cy / G.h) * 100}%`;
      tip.style.marginTop = '-12px';
      tip.classList.add('is-visible');
    }

    function ocultar() {
      cruz.setAttribute('opacity', '0');
      marcador.setAttribute('opacity', '0');
      tip.classList.remove('is-visible');
    }

    captura.addEventListener('pointermove', mostrar);
    captura.addEventListener('pointerdown', mostrar);
    captura.addEventListener('pointerleave', ocultar);

    /* Tabla alternativa */
    const btnTabla = $('#verTabla');
    if (btnTabla) {
      btnTabla.addEventListener('click', () => {
        const caja = $('#tablaDatos');
        caja.hidden = !caja.hidden;
        btnTabla.setAttribute('aria-expanded', String(!caja.hidden));
        btnTabla.textContent = caja.hidden ? 'Ver los datos en tabla' : 'Ocultar la tabla';
      });
    }
  }

  /* ===================== Modal: registrar consulta ===================== */
  function modalConsulta(p) {
    const ult = p.vitales[p.vitales.length - 1];
    abrirModal(`
      <div class="modal__head">
        <div>
          <h3 id="modalTitulo">Registrar consulta</h3>
          <p>${esc(p.nombre)} · ${esc(p.exp)}</p>
        </div>
        <button class="modal__close" data-cerrar aria-label="Cerrar">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <form class="modal__body" id="formConsulta">
        <div class="form-grid">
          <div class="field field--full">
            <label for="f_motivo">Motivo de la consulta *</label>
            <input id="f_motivo" name="motivo" required placeholder="Ej. Control mensual de presión arterial">
          </div>

          <div class="fieldset-title">Signos vitales</div>
          <div class="field">
            <label for="f_pas">Presión arterial (mmHg) *</label>
            <div style="display:flex;gap:8px;align-items:center">
              <input id="f_pas" name="pas" type="number" min="60" max="260" required value="${ult.pas}" style="width:50%">
              <span class="muted">/</span>
              <input id="f_pad" name="pad" type="number" min="30" max="160" required value="${ult.pad}" style="width:50%">
            </div>
          </div>
          <div class="field">
            <label for="f_fc">Frecuencia cardiaca (lpm) *</label>
            <input id="f_fc" name="fc" type="number" min="30" max="220" required value="${ult.fc}">
          </div>
          <div class="field">
            <label for="f_temp">Temperatura (°C) *</label>
            <input id="f_temp" name="temp" type="number" step="0.1" min="33" max="43" required value="${ult.temp}">
          </div>
          <div class="field">
            <label for="f_peso">Peso (kg) *</label>
            <input id="f_peso" name="peso" type="number" step="0.1" min="2" max="300" required value="${ult.peso}">
          </div>
          <div class="field">
            <label for="f_glucosa">Glucosa en ayunas (mg/dL)</label>
            <input id="f_glucosa" name="glucosa" type="number" min="30" max="600" value="${ult.glucosa}">
          </div>
          <div class="field">
            <label for="f_spo2">Saturación de oxígeno (%)</label>
            <input id="f_spo2" name="spo2" type="number" min="60" max="100" value="${ult.spo2}">
          </div>

          <div class="fieldset-title">Nota clínica</div>
          <div class="field field--full">
            <label for="f_subjetivo">Subjetivo — lo que refiere el paciente *</label>
            <textarea id="f_subjetivo" name="subjetivo" required placeholder="Síntomas, evolución desde la última consulta, apego al tratamiento…"></textarea>
          </div>
          <div class="field field--full">
            <label for="f_objetivo">Objetivo — exploración física *</label>
            <textarea id="f_objetivo" name="objetivo" required placeholder="Hallazgos de la exploración por aparatos y sistemas…"></textarea>
          </div>
          <div class="field field--full">
            <label for="f_diagnostico">Diagnóstico *</label>
            <input id="f_diagnostico" name="diagnostico" required placeholder="Ej. Hipertensión arterial controlada">
          </div>
          <div class="field field--full">
            <label for="f_plan">Plan de tratamiento *</label>
            <textarea id="f_plan" name="plan" required placeholder="Medicamentos, estudios solicitados, indicaciones y fecha de control…"></textarea>
            <span class="field__hint">En la versión completa esta nota queda firmada con fecha, hora y no se puede alterar después.</span>
          </div>
        </div>
      </form>
      <div class="modal__foot">
        <button class="btn" data-cerrar>Cancelar</button>
        <button class="btn btn--primary" type="submit" form="formConsulta">Guardar consulta</button>
      </div>`);

    $('#formConsulta').addEventListener('submit', (e) => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(e.target));
      const hoy = new Date();
      const nuevosVitales = {
        fecha: hoy,
        pas: Number(d.pas), pad: Number(d.pad), fc: Number(d.fc),
        temp: Number(d.temp), peso: Number(d.peso),
        glucosa: Number(d.glucosa || 0) || p.vitales[p.vitales.length - 1].glucosa,
        spo2: Number(d.spo2 || 0) || p.vitales[p.vitales.length - 1].spo2
      };
      const id = 'c' + Date.now();

      p.vitales.push(nuevosVitales);
      p.consultas.unshift({
        id,
        fecha: hoy,
        motivo: d.motivo,
        subjetivo: d.subjetivo,
        objetivo: d.objetivo,
        diagnostico: d.diagnostico,
        plan: d.plan,
        vitales: nuevosVitales
      });
      if (p.estado === 'nuevo') p.estado = 'control';

      estado.notaNueva = id;
      estado.tab = 'consultas';
      cerrarModal();
      pintarExpediente();
      toast('Consulta registrada', ' La nota se agregó al expediente y los signos vitales se sumaron a la gráfica de evolución.');
    });
  }

  /* ===================== Modal: receta ===================== */
  function modalReceta(p, indice) {
    const r = p.recetas[indice];
    const edad = edadDe(p.nacimiento);
    abrirModal(`
      <div class="modal__head">
        <div>
          <h3 id="modalTitulo">Receta médica</h3>
          <p>${fFecha(r.fecha)}</p>
        </div>
        <button class="modal__close" data-cerrar aria-label="Cerrar">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="modal__body">
        <div class="rxsheet">
          <div class="rxsheet__head">
            <div class="rxsheet__doc">
              <b>${esc(MEDICO.nombre)}</b>
              <span>${esc(MEDICO.especialidad)} · Cédula profesional ${esc(MEDICO.cedula)}</span>
              <span>${esc(MEDICO.consultorio)} · Tel. ${esc(MEDICO.telefono)}</span>
            </div>
            <div class="rxsheet__meta">
              ${fFecha(r.fecha)}<br>
              Folio ${esc(p.exp)}-${String(indice + 1).padStart(3, '0')}
            </div>
          </div>

          <div class="rxsheet__pt">
            <b>Paciente:</b> ${esc(p.nombre)} &nbsp;·&nbsp;
            <b>Edad:</b> ${edad} años &nbsp;·&nbsp;
            <b>Expediente:</b> ${esc(p.exp)}<br>
            <b>Diagnóstico:</b> ${esc(r.dx)}
            ${p.alergias.length ? `<br><b style="color:var(--danger)">Alergias:</b> ${esc(p.alergias.join(', '))}` : ''}
          </div>

          <div class="rxsheet__rx">℞</div>
          ${r.medicamentos.map((m) => `
            <div class="rxsheet__med">
              <b>${esc(m.nombre)}</b>
              <span>${esc(m.presentacion)} — ${esc(m.dosis)} · ${esc(m.duracion)}</span>
            </div>`).join('')}

          <div style="margin-top:18px">
            <h4 style="font-size:11.5px;letter-spacing:.07em;text-transform:uppercase;color:var(--dim);margin-bottom:5px">Indicaciones generales</h4>
            <p style="font-size:13.5px">${esc(r.indicaciones)}</p>
          </div>

          <div class="rxsheet__sign">
            <hr>
            <span>Firma y sello del médico</span>
          </div>
        </div>
      </div>
      <div class="modal__foot">
        <button class="btn" data-cerrar>Cerrar</button>
        <button class="btn btn--primary" id="btnImprimir">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V4h12v5M6 18H4v-6h16v6h-2M8 14h8v7H8z"/></svg>
          Imprimir
        </button>
      </div>`);

    $('#btnImprimir').addEventListener('click', () => window.print());
  }

  /* ===================== Modal: nuevo paciente ===================== */
  $('#btnNuevoPaciente').addEventListener('click', () => {
    abrirModal(`
      <div class="modal__head">
        <div>
          <h3 id="modalTitulo">Nuevo expediente</h3>
          <p>Datos de identificación del paciente</p>
        </div>
        <button class="modal__close" data-cerrar aria-label="Cerrar">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <form class="modal__body" id="formPaciente">
        <div class="form-grid">
          <div class="field field--full">
            <label for="n_nombre">Nombre completo *</label>
            <input id="n_nombre" name="nombre" required placeholder="Nombres y apellidos">
          </div>
          <div class="field">
            <label for="n_nac">Fecha de nacimiento *</label>
            <input id="n_nac" name="nacimiento" type="date" required max="${new Date().toISOString().slice(0, 10)}">
          </div>
          <div class="field">
            <label for="n_sexo">Sexo *</label>
            <select id="n_sexo" name="sexo" required>
              <option value="F">Femenino</option>
              <option value="M">Masculino</option>
            </select>
          </div>
          <div class="field">
            <label for="n_tel">Teléfono *</label>
            <input id="n_tel" name="telefono" required placeholder="0000-0000">
          </div>
          <div class="field">
            <label for="n_sangre">Tipo de sangre</label>
            <select id="n_sangre" name="sangre">
              <option>O+</option><option>O-</option><option>A+</option><option>A-</option>
              <option>B+</option><option>B-</option><option>AB+</option><option>AB-</option>
              <option value="No registrado">No registrado</option>
            </select>
          </div>
          <div class="field">
            <label for="n_talla">Talla (m)</label>
            <input id="n_talla" name="talla" type="number" step="0.01" min="0.4" max="2.3" value="1.65">
          </div>
          <div class="field">
            <label for="n_peso">Peso actual (kg)</label>
            <input id="n_peso" name="peso" type="number" step="0.1" min="2" max="300" value="70">
          </div>
          <div class="field field--full">
            <label for="n_motivo">Motivo de consulta *</label>
            <input id="n_motivo" name="motivo" required placeholder="Ej. Dolor de cabeza recurrente">
          </div>
          <div class="field field--full">
            <label for="n_alergias">Alergias conocidas</label>
            <input id="n_alergias" name="alergias" placeholder="Separadas por coma. Ej. Penicilina, Mariscos">
            <span class="field__hint">Se muestran en rojo en la ficha del paciente y en cada receta.</span>
          </div>
        </div>
      </form>
      <div class="modal__foot">
        <button class="btn" data-cerrar>Cancelar</button>
        <button class="btn btn--primary" type="submit" form="formPaciente">Crear expediente</button>
      </div>`);

    $('#formPaciente').addEventListener('submit', (e) => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(e.target));
      const num = String(600 + pacientes.length).padStart(4, '0');
      const nuevo = {
        id: 'p' + Date.now(),
        exp: 'EXP-' + num,
        nombre: d.nombre.trim(),
        sexo: d.sexo,
        nacimiento: d.nacimiento,
        telefono: d.telefono,
        sangre: d.sangre || 'No registrado',
        ocupacion: 'No registrada',
        direccion: 'No registrada',
        estado: 'nuevo',
        motivo: d.motivo,
        proximaCita: null,
        alergias: d.alergias ? d.alergias.split(',').map((a) => a.trim()).filter(Boolean) : [],
        padecimientos: [],
        medicacion: [],
        antecedentes: { patologicos: [], quirurgicos: [], familiares: [], noPatologicos: [] },
        talla: Number(d.talla) || 1.65,
        vitales: [{
          fecha: new Date(), pas: 120, pad: 80, fc: 74, temp: 36.5,
          peso: Number(d.peso) || 70, glucosa: 90, spo2: 98
        }],
        consultas: [],
        recetas: [],
        estudios: []
      };
      pacientes.unshift(nuevo);
      cerrarModal();
      abrirExpediente(nuevo.id);
      toast('Expediente creado', ` Se generó el número ${nuevo.exp}. Ya puedes registrar la primera consulta.`);
    });
  });

  /* ===================== Módulos bloqueados ===================== */
  $$('.navitem').forEach((item) => {
    item.addEventListener('click', () => {
      const modulo = item.dataset.modulo;
      cerrarSidebar();
      if (modulo === 'expedientes') {
        $$('.navitem').forEach((n) => n.classList.toggle('is-active', n === item));
        volverALista();
        return;
      }
      abrirModal(`
        <div class="modal__head">
          <div>
            <h3 id="modalTitulo">${esc(modulo)}</h3>
            <p>Módulo no incluido en esta demostración</p>
          </div>
          <button class="modal__close" data-cerrar aria-label="Cerrar">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div class="modal__body">
          <div class="locked">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
            <h3>${esc(modulo)}</h3>
            <p>
              Esta demostración muestra únicamente el módulo de expedientes para que
              veas cómo se siente el sistema. El resto de módulos se construyen a la
              medida de cada consultorio.
            </p>
            <a class="btn btn--primary" href="../../index.html#contacto">Pedir una cotización</a>
          </div>
        </div>`);
    });
  });

  /* ===================== Menú lateral en móvil ===================== */
  const sidebar = $('#sidebar');
  const scrim = $('#scrim');
  function cerrarSidebar() { sidebar.classList.remove('is-open'); scrim.hidden = true; }
  $('#menuBtn').addEventListener('click', () => {
    const abierto = sidebar.classList.toggle('is-open');
    scrim.hidden = !abierto;
  });
  scrim.addEventListener('click', cerrarSidebar);

  /* Redibuja la gráfica si cambia el tamaño de la ventana */
  let temporizadorResize;
  window.addEventListener('resize', () => {
    clearTimeout(temporizadorResize);
    temporizadorResize = setTimeout(() => {
      if (!vistaExp.hidden && estado.tab === 'resumen') pintarPanel();
    }, 220);
  });

  /* ===================== Arranque ===================== */
  pintarLista();
  setTimeout(() => {
    toast('Estás viendo una demo', ' Abre un expediente, registra una consulta o imprime una receta. Al recargar, todo vuelve a su estado inicial. <a href="../../index.html#contacto">Quiero un sistema así</a>', 9000);
  }, 1200);
})();
