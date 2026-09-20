/* ========================================================================
   Lanvex — lógica del sitio: menú, catálogo, filtros y animaciones.
   ===================================================================== */
(function () {
  'use strict';

  /* ---------------- Navegación ---------------- */
  const nav = document.querySelector('.nav');
  const links = document.getElementById('navLinks');
  const toggle = document.querySelector('.nav__toggle');

  const onScroll = () => nav.classList.toggle('is-stuck', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  links.addEventListener('click', (e) => {
    if (e.target.closest('a')) {
      links.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });

  /* ---------------- Mockup SVG de cada tarjeta ----------------
     Genera una vista previa abstracta para no depender de capturas
     de pantalla: sidebar + filas, teñido con el acento del proyecto. */
  function mockup(acento) {
    const fila = (y) => `
      <rect x="112" y="${y}" width="196" height="26" rx="6" fill="#161D29"/>
      <circle cx="126" cy="${y + 13}" r="6" fill="${acento}" opacity=".55"/>
      <rect x="140" y="${y + 7}" width="86" height="5" rx="2.5" fill="#33415A"/>
      <rect x="140" y="${y + 16}" width="52" height="4" rx="2" fill="#26334A"/>
      <rect x="272" y="${y + 9}" width="24" height="8" rx="4" fill="${acento}" opacity=".3"/>`;

    return `<svg viewBox="0 0 320 180" role="img" aria-label="Vista previa del sistema" preserveAspectRatio="xMidYMid slice">
      <rect width="320" height="180" fill="#0F141D"/>
      <rect x="0" y="0" width="96" height="180" fill="#0B1017"/>
      <rect x="16" y="18" width="20" height="20" rx="6" fill="${acento}"/>
      <rect x="44" y="24" width="38" height="7" rx="3.5" fill="#2A374C"/>
      ${[56, 76, 96, 116].map((y, i) => `
        <rect x="14" y="${y}" width="68" height="12" rx="4" fill="${i === 0 ? acento : '#161D29'}" opacity="${i === 0 ? '.18' : '1'}"/>
        <rect x="22" y="${y + 4}" width="${i === 0 ? 44 : 38 - i * 4}" height="4" rx="2" fill="${i === 0 ? acento : '#2A374C'}"/>`).join('')}
      <rect x="112" y="18" width="120" height="9" rx="4.5" fill="#2A374C"/>
      <rect x="112" y="34" width="196" height="16" rx="8" fill="#161D29"/>
      <rect x="122" y="39" width="60" height="6" rx="3" fill="#26334A"/>
      ${[62, 96, 130].map(fila).join('')}
    </svg>`;
  }

  /* ---------------- Render del catálogo ---------------- */
  const grid = document.getElementById('catalogo');

  const flecha = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`;

  function tarjeta(p) {
    const esDemo = p.estado === 'demo';
    const autoria = p.autoria === 'grupal'
      ? '<span class="badge badge--team">Proyecto grupal</span>'
      : '<span class="badge badge--solo">Desarrollo individual</span>';
    const estado = esDemo
      ? '<span class="badge badge--live">Demo disponible</span>'
      : '<span class="badge badge--soon">Próximamente</span>';

    const pie = esDemo
      ? `<a class="card__link" href="${p.demo}">Abrir demo ${flecha}</a>`
      : `<span class="card__note">Demo en preparación</span>`;

    return `
      <article class="card reveal" data-categoria="${p.categoria}" data-autoria="${p.autoria}" data-estado="${p.estado}">
        <div class="card__thumb">
          ${mockup(p.acento)}
          <div class="card__badges">${estado}${autoria}</div>
        </div>
        <div class="card__body">
          <p class="card__kicker">${p.cliente}</p>
          <h3>${p.titulo}</h3>
          <p class="card__desc">${p.descripcion}</p>
          <div class="tags">${p.stack.map((t) => `<span class="tag">${t}</span>`).join('')}</div>
          <div class="card__foot">${pie}</div>
        </div>
      </article>`;
  }

  grid.innerHTML = PROYECTOS.map(tarjeta).join('');

  /* ---------------- Filtros ---------------- */
  const botones = Array.from(document.querySelectorAll('.filter'));
  const tarjetas = Array.from(grid.children);
  const vacio = document.getElementById('sinResultados');

  function filtrar(valor) {
    let visibles = 0;
    tarjetas.forEach((el) => {
      const coincide =
        valor === 'todos' ||
        el.dataset.categoria === valor ||
        el.dataset.autoria === valor;
      el.classList.toggle('is-hidden', !coincide);
      if (coincide) visibles++;
    });
    vacio.hidden = visibles > 0;
  }

  botones.forEach((btn) => {
    btn.addEventListener('click', () => {
      botones.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      filtrar(btn.dataset.filtro);
    });
  });

  /* ---------------- Reveal al hacer scroll ---------------- */
  const io = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    },
    { rootMargin: '0px 0px -60px 0px', threshold: 0.08 }
  );
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  /* ---------------- Año del footer ---------------- */
  document.getElementById('anio').textContent = new Date().getFullYear();
})();
