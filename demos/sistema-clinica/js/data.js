/* ========================================================================
   Demo · Sistema de gestión clínica — datos de ejemplo

   Reproduce las entidades del sistema real (Persona, Contacto, Expediente,
   Consulta, SignosVitales, Receta) con datos COMPLETAMENTE FICTICIOS.
   Ningún paciente, médico, teléfono ni dirección de este archivo
   corresponde a una persona real.

   Las fechas se guardan como "hace N días" (campo `d`) o como minutos
   hacia atrás (`m`) y se convierten a fechas reales al cargar, para que la
   demo siempre se vea al día sin tener que editar este archivo.
   ===================================================================== */

/* ---------- Clínicas (el sistema real es multiclínica) ---------- */

const CLINICAS = [
  {
    id: 'prosalud',
    nombre: 'ProSalud',
    nombreLargo: 'Clínica ProSalud',
    tema: 'medica',
    usaCola: true,
    direccion: 'Calle Principal #000, Santa Tecla',
    telefono: '0000-0000'
  },
  {
    id: 'estetica',
    nombre: 'Estética',
    nombreLargo: 'Medicina Estética y Longevidad',
    tema: 'estetica',
    usaCola: false,
    direccion: 'Av. Las Magnolias #000, San Salvador',
    telefono: '0000-0000'
  }
];

/* ---------- Usuarios y roles ----------
   Los roles son los mismos del sistema: la enfermera hace la preconsulta
   y administra la cola, el médico atiende solo su propia cola, y la
   doctora administradora ve todo y puede alternar entre las dos vistas. */

const USUARIOS = [
  {
    id: 'u-enf',
    nombre: 'Karla Méndez',
    tratamiento: 'Enf. Karla Méndez',
    rol: 'Enfermera',
    iniciales: 'KM',
    genero: 'f',
    clinicas: ['prosalud']
  },
  {
    id: 'u-doc',
    nombre: 'Mauricio Alfaro',
    tratamiento: 'Dr. Mauricio Alfaro',
    rol: 'Doctor',
    iniciales: 'MA',
    jvpm: '00000',
    especialidad: 'Medicina General',
    clinicas: ['prosalud']
  },
  {
    id: 'u-admin',
    nombre: 'Fernanda Ruiz',
    tratamiento: 'Dra. Fernanda Ruiz',
    rol: 'Doctora Administradora',
    iniciales: 'FR',
    genero: 'f',
    jvpm: '00000',
    especialidad: 'Medicina General',
    clinicas: ['prosalud', 'estetica']
  }
];

/* Médicos de la clínica: quienes pueden tener cola propia. */
const MEDICOS = ['u-doc', 'u-admin'];

/* Permisos por rol. En el sistema real esto son permisos de Django
   agrupados en Groups; aquí se resume en la misma forma para que la demo
   muestre por qué cada rol ve pantallas distintas. */
const PERMISOS = {
  Enfermera: {
    verPacientes: true,
    registrarPaciente: true,
    verExpediente: true,
    registrarPreconsulta: true,
    editarPreconsulta: true,
    verCola: true,
    gestionarCola: true,   // reasignar, retirar, marcar emergencia
    atender: false,
    seguridad: false
  },
  Doctor: {
    verPacientes: true,
    registrarPaciente: false,
    verExpediente: true,
    registrarPreconsulta: false,
    editarPreconsulta: false,
    verCola: true,
    gestionarCola: false,
    atender: true,
    soloSuCola: true,
    seguridad: false
  },
  'Doctora Administradora': {
    verPacientes: true,
    registrarPaciente: true,
    verExpediente: true,
    registrarPreconsulta: true,
    editarPreconsulta: true,
    verCola: true,
    gestionarCola: true,
    atender: true,
    seguridad: true
  }
};

/* ---------- Catálogos ---------- */

const PARENTESCOS = [
  'Madre', 'Padre', 'Hijo/a', 'Cónyuge', 'Hermano/a',
  'Abuelo/a', 'Tío/a', 'Otro'
];

const TIPOS_ANTECEDENTE = [
  'Patológico', 'Quirúrgico', 'Familiar', 'No patológico', 'Alérgico', 'Gineco-obstétrico'
];

/* ---------- Pacientes ----------
   Estructura equivalente a Persona + Contacto + Expediente + Consulta. */

const PACIENTES = [
  {
    id: 'p1',
    nombres: 'María Elena',
    apellidos: 'Guzmán Rivas',
    dui: '04512338-7',
    telefono: '7845-1120',
    nacimiento: '1962-03-14',
    sexo: 'F',
    clinica: 'prosalud',
    alergias: 'Penicilina, sulfas',
    contactos: [
      { nombres: 'Ana Sofía', apellidos: 'Guzmán Rivas', telefono: '7845-3391', tipo: 'referencia', parentesco: 'Hijo/a' }
    ],
    antecedentes: [
      { tipo: 'Patológico', detalle: 'Hipertensión arterial esencial desde 2014. Diabetes mellitus tipo 2 desde 2018.' },
      { tipo: 'Quirúrgico', detalle: 'Colecistectomía laparoscópica (2009). Cesárea (1991).' },
      { tipo: 'Familiar', detalle: 'Madre con diabetes tipo 2 e infarto a los 71 años. Padre hipertenso.' },
      { tipo: 'No patológico', detalle: 'No fuma. Alcohol ocasional. Camina 30 min tres veces por semana.' }
    ],
    controles: [
      { d: -14, motivo: 'Control de presión arterial y revisión de HbA1c' }
    ],
    consultas: [
      {
        d: 6,
        doctor: 'u-admin',
        motivo: 'Control mensual de presión arterial',
        historia: 'Refiere buen apego al tratamiento. Niega cefalea, mareo o visión borrosa. Ha mantenido caminata tres veces por semana.',
        examen: 'Consciente, orientada, hidratada. Ruidos cardíacos rítmicos sin soplos. Campos pulmonares limpios. Abdomen blando, no doloroso. Sin edema en miembros inferiores.',
        diagnostico: 'Hipertensión arterial esencial en control. Diabetes mellitus tipo 2 en control.',
        tratamiento: 'Continuar losartán 50 mg cada 12 h y metformina 850 mg con desayuno y cena.',
        indicaciones: 'Dieta baja en sodio. Continuar caminata. Traer glucometría capilar del último mes en la siguiente cita.',
        vitales: { peso: 74.1, presion: '128/80', temp: 36.5, fc: 73, saturacion: 98 },
        receta: {
          folio: 'R-002418',
          detalles: [
            { medicamento: 'Losartán 50 mg', dosis: '1 tableta cada 12 horas', duracion: '30 días' },
            { medicamento: 'Metformina 850 mg', dosis: '1 tableta con desayuno y cena', duracion: '30 días' },
            { medicamento: 'Ácido acetilsalicílico 100 mg', dosis: '1 tableta después del almuerzo', duracion: '30 días' }
          ]
        }
      },
      {
        d: 38,
        doctor: 'u-admin',
        motivo: 'Cifras de presión elevadas en casa',
        historia: 'Reporta lecturas de 150/95 durante la última semana. Consumo de sal aumentado por celebraciones familiares.',
        examen: 'Presión arterial elevada al ingreso. Resto del examen sin hallazgos relevantes.',
        diagnostico: 'Hipertensión arterial no controlada.',
        tratamiento: 'Se ajusta losartán a 50 mg cada 12 h (antes cada 24 h).',
        indicaciones: 'Reducir sal. Toma diaria de presión en casa y registro escrito. Control en un mes.',
        vitales: { peso: 75.6, presion: '150/94', temp: 36.6, fc: 81, saturacion: 97 },
        receta: {
          folio: 'R-002307',
          detalles: [
            { medicamento: 'Losartán 50 mg', dosis: '1 tableta cada 12 horas', duracion: '30 días' },
            { medicamento: 'Metformina 850 mg', dosis: '1 tableta con desayuno y cena', duracion: '30 días' }
          ]
        }
      },
      {
        d: 96,
        doctor: 'u-doc',
        motivo: 'Consulta por dolor lumbar',
        historia: 'Dolor lumbar de una semana, sin irradiación. Se relaciona con esfuerzo al cargar bultos.',
        examen: 'Dolor a la palpación de musculatura paravertebral lumbar. Sin signos de compromiso radicular.',
        diagnostico: 'Lumbalgia mecánica.',
        tratamiento: 'Analgésico y relajante muscular por 5 días.',
        indicaciones: 'Reposo relativo. Calor local. Volver si el dolor irradia a la pierna.',
        vitales: { peso: 76.2, presion: '138/86', temp: 36.4, fc: 78, saturacion: 98 },
        receta: {
          folio: 'R-002105',
          detalles: [
            { medicamento: 'Ibuprofeno 400 mg', dosis: '1 tableta cada 8 horas con alimentos', duracion: '5 días' },
            { medicamento: 'Metocarbamol 750 mg', dosis: '1 tableta cada 12 horas', duracion: '5 días' }
          ]
        }
      }
    ]
  },

  {
    id: 'p2',
    nombres: 'Jorge Alberto',
    apellidos: 'Ramírez Soto',
    dui: '05127744-2',
    telefono: '7712-6408',
    nacimiento: '1986-07-02',
    sexo: 'M',
    clinica: 'prosalud',
    alergias: '',
    contactos: [
      { nombres: 'Claudia', apellidos: 'Soto de Ramírez', telefono: '7712-6409', tipo: 'referencia', parentesco: 'Cónyuge' }
    ],
    antecedentes: [
      { tipo: 'Patológico', detalle: 'Dislipidemia mixta desde 2023. Sobrepeso grado I.' },
      { tipo: 'No patológico', detalle: 'Fumador social. Trabajo de oficina, sedentario.' }
    ],
    controles: [],
    consultas: [
      {
        d: 12,
        doctor: 'u-doc',
        motivo: 'Resultado de perfil lipídico',
        historia: 'Asintomático. Trae resultados de laboratorio solicitados en la consulta anterior.',
        examen: 'Peso estable. Sin hallazgos al examen físico.',
        diagnostico: 'Dislipidemia mixta en tratamiento.',
        tratamiento: 'Continuar atorvastatina 20 mg por la noche.',
        indicaciones: 'Dieta baja en grasas saturadas. Iniciar actividad física 150 min por semana. Repetir perfil lipídico en tres meses.',
        vitales: { peso: 88.4, presion: '126/82', temp: 36.5, fc: 76, saturacion: 98 },
        receta: {
          folio: 'R-002395',
          detalles: [
            { medicamento: 'Atorvastatina 20 mg', dosis: '1 tableta por la noche', duracion: '90 días' }
          ]
        }
      }
    ]
  },

  {
    id: 'p3',
    nombres: 'Ana Lucía',
    apellidos: 'Mendoza Cruz',
    dui: '06330915-4',
    telefono: '6034-9971',
    nacimiento: '1994-11-23',
    sexo: 'F',
    clinica: 'prosalud',
    alergias: 'Dipirona',
    contactos: [
      { nombres: 'Rosa', apellidos: 'Cruz Villalta', telefono: '6034-2218', tipo: 'referencia', parentesco: 'Madre' }
    ],
    antecedentes: [
      { tipo: 'Patológico', detalle: 'Migraña sin aura desde la adolescencia. Anemia ferropénica en tratamiento.' },
      { tipo: 'Alérgico', detalle: 'Reacción cutánea a dipirona.' },
      { tipo: 'Gineco-obstétrico', detalle: 'G0 P0. Ciclos regulares. Último Papanicolaou hace 8 meses, normal.' }
    ],
    controles: [
      { d: -21, motivo: 'Control de hemograma tras tres meses de hierro oral' }
    ],
    consultas: [
      {
        d: 18,
        doctor: 'u-admin',
        motivo: 'Cefalea recurrente y cansancio',
        historia: 'Tres episodios de cefalea pulsátil en el último mes, con fotofobia. Refiere cansancio al subir gradas.',
        examen: 'Palidez conjuntival leve. Examen neurológico normal.',
        diagnostico: 'Migraña sin aura. Anemia ferropénica.',
        tratamiento: 'Sulfato ferroso 300 mg diario. Analgésico en crisis.',
        indicaciones: 'Tomar el hierro con jugo de naranja, nunca con café o leche. Traer hemograma de control en tres meses.',
        vitales: { peso: 54.8, presion: '108/68', temp: 36.3, fc: 88, saturacion: 99 },
        receta: {
          folio: 'R-002341',
          detalles: [
            { medicamento: 'Sulfato ferroso 300 mg', dosis: '1 tableta diaria en ayunas', duracion: '90 días' },
            { medicamento: 'Naproxeno 500 mg', dosis: '1 tableta al iniciar la crisis, máximo 2 al día', duracion: 'Según necesidad' }
          ]
        }
      }
    ]
  },

  {
    id: 'p4',
    nombres: 'Carlos Iván',
    apellidos: 'Palacios Núñez',
    dui: '',
    telefono: '',
    nacimiento: '2017-05-09',
    sexo: 'M',
    clinica: 'prosalud',
    alergias: '',
    contactos: [
      { nombres: 'Jessica', apellidos: 'Núñez Ayala', telefono: '7299-5514', tipo: 'responsable', parentesco: 'Madre' },
      { nombres: 'Iván', apellidos: 'Palacios Mejía', telefono: '7299-8830', tipo: 'responsable', parentesco: 'Padre' }
    ],
    antecedentes: [
      { tipo: 'Patológico', detalle: 'Asma bronquial leve persistente desde los 4 años.' },
      { tipo: 'No patológico', detalle: 'Esquema de vacunación completo para la edad.' }
    ],
    controles: [],
    consultas: [
      {
        d: 25,
        doctor: 'u-doc',
        motivo: 'Tos nocturna de cuatro días',
        historia: 'Tos seca que empeora de noche. Sin fiebre. La madre refiere dos episodios similares este año.',
        examen: 'Buen estado general. Sibilancias espiratorias escasas en ambos campos. Saturación normal al aire ambiente.',
        diagnostico: 'Crisis asmática leve.',
        tratamiento: 'Salbutamol inhalado con aerocámara.',
        indicaciones: 'Dos disparos cada 6 horas por 5 días. Consultar de inmediato si presenta dificultad para respirar.',
        vitales: { peso: 26.5, talla: 1.22, imc: 17.8, temp: 36.8, fc: 96, saturacion: 97 },
        receta: {
          folio: 'R-002288',
          detalles: [
            { medicamento: 'Salbutamol inhalador 100 mcg', dosis: '2 disparos cada 6 horas con aerocámara', duracion: '5 días' }
          ]
        }
      }
    ]
  },

  {
    id: 'p5',
    nombres: 'Rosa Estela',
    apellidos: 'Vargas Lemus',
    dui: '02218806-9',
    telefono: '6688-2037',
    nacimiento: '1951-01-30',
    sexo: 'F',
    clinica: 'prosalud',
    alergias: 'Penicilina',
    contactos: [
      { nombres: 'Mario', apellidos: 'Vargas Lemus', telefono: '6688-4471', tipo: 'referencia', parentesco: 'Hijo/a' }
    ],
    antecedentes: [
      { tipo: 'Patológico', detalle: 'Osteoartrosis de rodillas. Hipotiroidismo en tratamiento sustitutivo.' },
      { tipo: 'Quirúrgico', detalle: 'Histerectomía total abdominal (2003).' }
    ],
    controles: [
      { d: -7, motivo: 'Revisión de perfil tiroideo' }
    ],
    consultas: [
      {
        d: 31,
        doctor: 'u-admin',
        motivo: 'Dolor de rodillas al caminar',
        historia: 'Dolor bilateral de predominio derecho, peor al levantarse. Rigidez matinal menor de 30 minutos.',
        examen: 'Crepitación en ambas rodillas. Limitación leve de la flexión. Sin derrame articular.',
        diagnostico: 'Osteoartrosis de rodillas.',
        tratamiento: 'Acetaminofén en dolor. Continuar levotiroxina 75 mcg.',
        indicaciones: 'Ejercicios de fortalecimiento de cuádriceps. Evitar gradas prolongadas. Control en dos meses.',
        vitales: { peso: 68.9, presion: '134/78', temp: 36.4, fc: 71, saturacion: 97 },
        receta: {
          folio: 'R-002260',
          detalles: [
            { medicamento: 'Acetaminofén 500 mg', dosis: '1 tableta cada 8 horas si hay dolor', duracion: '15 días' },
            { medicamento: 'Levotiroxina 75 mcg', dosis: '1 tableta diaria en ayunas', duracion: '90 días' }
          ]
        }
      }
    ]
  },

  {
    id: 'p6',
    nombres: 'Diego Fernando',
    apellidos: 'Torres Mejía',
    dui: '07741230-5',
    telefono: '7450-1183',
    nacimiento: '1999-02-17',
    sexo: 'M',
    clinica: 'prosalud',
    alergias: '',
    contactos: [],
    antecedentes: [],
    controles: [],
    consultas: []
  },

  {
    id: 'p7',
    nombres: 'Sofía Alejandra',
    apellidos: 'Moreno Castillo',
    dui: '06012477-8',
    telefono: '7188-3364',
    nacimiento: '1990-09-05',
    sexo: 'F',
    clinica: 'estetica',
    alergias: '',
    contactos: [],
    antecedentes: [
      { tipo: 'No patológico', detalle: 'Sin antecedentes de importancia.' }
    ],
    controles: [],
    consultas: []
  }
];

/* ---------- Cola de consulta ----------
   Consultas creadas en la preconsulta y todavía sin atender. `m` son los
   minutos transcurridos desde que el paciente llegó. */

const COLA_INICIAL = [
  {
    paciente: 'p3',
    doctor: 'u-doc',
    m: 42,
    esEmergencia: false,
    vitales: { peso: 54.8, presion: '106/70', temp: 36.4, fc: 84, saturacion: 99 }
  },
  {
    paciente: 'p5',
    doctor: 'u-doc',
    m: 28,
    esEmergencia: true,
    motivoPrioridad: 'Dolor torácico de inicio súbito',
    vitales: { peso: 68.9, presion: '158/96', temp: 36.7, fc: 102, saturacion: 94 }
  },
  {
    paciente: 'p4',
    doctor: 'u-admin',
    m: 33,
    esEmergencia: false,
    reasignadoDesde: 'Dr. Mauricio Alfaro',
    vitales: { peso: 26.8, talla: 1.23, imc: 17.7, temp: 37.1, fc: 94, saturacion: 97 }
  }
];

/* Cifras del día que la pantalla de inicio muestra y que no se derivan
   de la cola (ya pasaron). */
const CIFRAS_DIA = {
  atendidosHoy: 11,
  atendidosPorMedico: { 'u-doc': 6, 'u-admin': 5 },
  nuevosHoy: 2
};
