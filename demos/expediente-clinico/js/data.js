/* ========================================================================
   Clinia · Demo de expediente clínico
   Datos de ejemplo. Todos los pacientes son ficticios.

   Las fechas se guardan como "días hacia atrás" (campo `d`) y se
   convierten a fechas reales al cargar, para que la demo siempre se vea
   al día sin tener que actualizar el archivo.
   ===================================================================== */

const MEDICO = {
  nombre: 'Dra. Fernanda Ruiz Alvarado',
  especialidad: 'Medicina General',
  cedula: '00000000',
  consultorio: 'Consultorio 3B · Av. Las Palmas 1450',
  telefono: '0000-0000'
};

/* Convierte "hace N días" en un objeto Date */
function fechaDesde(dias) {
  const f = new Date();
  f.setHours(9, 0, 0, 0);
  f.setDate(f.getDate() - dias);
  return f;
}

const PACIENTES = [
  /* ------------------------------------------------------------------ */
  {
    id: 'p1',
    exp: 'EXP-0241',
    nombre: 'María Elena Guzmán Rivas',
    sexo: 'F',
    nacimiento: '1962-03-14',
    telefono: '7845-1120',
    sangre: 'O+',
    ocupacion: 'Comerciante',
    direccion: 'Col. San Benito, pasaje 4 #22',
    estado: 'control',
    motivo: 'Hipertensión arterial y diabetes tipo 2',
    proximaCita: -14,
    alergias: ['Penicilina', 'Sulfas'],
    padecimientos: [
      { nombre: 'Hipertensión arterial esencial', desde: '2014', estado: 'controlado' },
      { nombre: 'Diabetes mellitus tipo 2', desde: '2018', estado: 'seguimiento' }
    ],
    medicacion: [
      { nombre: 'Losartán 50 mg', dosis: '1 tableta cada 12 h', indicacion: 'Control de presión arterial' },
      { nombre: 'Metformina 850 mg', dosis: '1 tableta con desayuno y cena', indicacion: 'Control glucémico' },
      { nombre: 'Ácido acetilsalicílico 100 mg', dosis: '1 tableta diaria', indicacion: 'Protección cardiovascular' }
    ],
    antecedentes: {
      patologicos: ['Hipertensión arterial desde 2014', 'Diabetes mellitus tipo 2 desde 2018', 'Dislipidemia mixta'],
      quirurgicos: ['Colecistectomía laparoscópica (2009)', 'Cesárea (1991)'],
      familiares: ['Madre: diabetes tipo 2 e infarto a los 71 años', 'Padre: hipertensión arterial'],
      noPatologicos: ['No fuma', 'Alcohol ocasional en reuniones familiares', 'Camina 30 min, 3 veces por semana', 'Esquema de vacunación completo'],
      ginecoObstetricos: ['G3 P2 C1 A0', 'Menopausia a los 51 años', 'Último Papanicolaou: hace 11 meses, normal']
    },
    vitales: [
      { d: 322, pas: 158, pad: 96, fc: 84, temp: 36.6, peso: 79.4, glucosa: 168, spo2: 96 },
      { d: 265, pas: 152, pad: 94, fc: 82, temp: 36.5, peso: 78.6, glucosa: 155, spo2: 97 },
      { d: 208, pas: 146, pad: 90, fc: 80, temp: 36.7, peso: 77.8, glucosa: 149, spo2: 97 },
      { d: 152, pas: 142, pad: 88, fc: 78, temp: 36.4, peso: 76.9, glucosa: 141, spo2: 98 },
      { d: 96,  pas: 138, pad: 86, fc: 77, temp: 36.6, peso: 76.1, glucosa: 132, spo2: 98 },
      { d: 54,  pas: 134, pad: 84, fc: 76, temp: 36.5, peso: 75.2, glucosa: 124, spo2: 98 },
      { d: 21,  pas: 130, pad: 82, fc: 74, temp: 36.6, peso: 74.6, glucosa: 118, spo2: 98 },
      { d: 6,   pas: 128, pad: 80, fc: 73, temp: 36.5, peso: 74.1, glucosa: 112, spo2: 98 }
    ],
    talla: 1.58,
    consultas: [
      {
        d: 6,
        motivo: 'Control mensual de presión y glucosa',
        subjetivo: 'Refiere sentirse con más energía. Ha mantenido la caminata diaria y redujo el pan dulce. Niega dolor de cabeza, visión borrosa o hinchazón de pies.',
        objetivo: 'Paciente consciente, orientada, hidratada. Ruidos cardiacos rítmicos sin soplos. Campos pulmonares limpios. Abdomen blando, no doloroso. Sin edema en miembros inferiores. Pies sin lesiones, pulsos presentes.',
        diagnostico: 'Hipertensión arterial controlada. Diabetes mellitus tipo 2 con mejoría del control glucémico.',
        plan: 'Continuar el mismo tratamiento. Reforzar plan de alimentación. Solicitar hemoglobina glicosilada y perfil lipídico. Control en 4 semanas.'
      },
      {
        d: 21,
        motivo: 'Control de presión arterial',
        subjetivo: 'Comenta que ha tomado los medicamentos sin olvidos. Ocasionalmente siente cansancio al final del día.',
        objetivo: 'Signos vitales estables. Peso con descenso de 600 g respecto al control previo. Exploración sin datos patológicos.',
        diagnostico: 'Hipertensión arterial en control. Diabetes mellitus tipo 2 en mejoría.',
        plan: 'Se mantiene tratamiento. Se refuerza la importancia de la toma de presión en casa 2 veces por semana.'
      },
      {
        d: 54,
        motivo: 'Revisión de resultados de laboratorio',
        subjetivo: 'Acude con resultados solicitados. Niega síntomas nuevos.',
        objetivo: 'Glucosa en ayunas 124 mg/dL. Colesterol total 198 mg/dL. Creatinina 0.9 mg/dL.',
        diagnostico: 'Control metabólico en mejoría progresiva.',
        plan: 'Se ajusta horario de metformina a desayuno y cena. Se cita en 5 semanas.'
      },
      {
        d: 96,
        motivo: 'Control trimestral',
        subjetivo: 'Refiere buen apego al tratamiento. Preocupada por antecedente materno de infarto.',
        objetivo: 'Presión 138/86 mmHg. Peso 76.1 kg. Exploración cardiopulmonar normal.',
        diagnostico: 'Hipertensión arterial con tendencia a la mejoría. Riesgo cardiovascular moderado.',
        plan: 'Se agrega ácido acetilsalicílico 100 mg al día. Educación sobre signos de alarma.'
      }
    ],
    recetas: [
      {
        d: 6,
        dx: 'Hipertensión arterial · Diabetes mellitus tipo 2',
        medicamentos: [
          { nombre: 'Losartán 50 mg', presentacion: 'Caja con 30 tabletas', dosis: '1 tableta cada 12 horas', duracion: '30 días' },
          { nombre: 'Metformina 850 mg', presentacion: 'Caja con 60 tabletas', dosis: '1 tableta con desayuno y cena', duracion: '30 días' },
          { nombre: 'Ácido acetilsalicílico 100 mg', presentacion: 'Caja con 30 tabletas', dosis: '1 tableta después del almuerzo', duracion: '30 días' }
        ],
        indicaciones: 'Dieta baja en sal y azúcares. Caminata de 30 minutos diarios. Tomar presión arterial dos veces por semana y anotar los valores.'
      },
      {
        d: 54,
        dx: 'Hipertensión arterial · Diabetes mellitus tipo 2',
        medicamentos: [
          { nombre: 'Losartán 50 mg', presentacion: 'Caja con 30 tabletas', dosis: '1 tableta cada 12 horas', duracion: '30 días' },
          { nombre: 'Metformina 850 mg', presentacion: 'Caja con 60 tabletas', dosis: '1 tableta con desayuno y cena', duracion: '30 días' }
        ],
        indicaciones: 'Acudir a laboratorio en ayunas de 8 horas.'
      }
    ],
    estudios: [
      { d: 3,  nombre: 'Hemoglobina glicosilada (HbA1c)', tipo: 'Laboratorio', estado: 'pendiente', resultado: '' },
      { d: 50, nombre: 'Perfil lipídico completo', tipo: 'Laboratorio', estado: 'listo', resultado: 'Colesterol total 198 mg/dL · Triglicéridos 164 mg/dL · HDL 44 mg/dL' },
      { d: 50, nombre: 'Química sanguínea de 6 elementos', tipo: 'Laboratorio', estado: 'listo', resultado: 'Glucosa 124 mg/dL · Creatinina 0.9 mg/dL · Urea 28 mg/dL' },
      { d: 208, nombre: 'Electrocardiograma en reposo', tipo: 'Gabinete', estado: 'listo', resultado: 'Ritmo sinusal, frecuencia 80 lpm, sin datos de isquemia aguda' }
    ]
  },

  /* ------------------------------------------------------------------ */
  {
    id: 'p2',
    exp: 'EXP-0318',
    nombre: 'Jorge Alberto Ramírez Soto',
    sexo: 'M',
    nacimiento: '1985-11-02',
    telefono: '7712-9043',
    sangre: 'A+',
    ocupacion: 'Contador',
    direccion: 'Res. Altavista, block C #9',
    estado: 'control',
    motivo: 'Sobrepeso y dislipidemia',
    proximaCita: -28,
    alergias: [],
    padecimientos: [
      { nombre: 'Dislipidemia mixta', desde: '2023', estado: 'seguimiento' },
      { nombre: 'Sobrepeso grado I', desde: '2022', estado: 'seguimiento' }
    ],
    medicacion: [
      { nombre: 'Atorvastatina 20 mg', dosis: '1 tableta por la noche', indicacion: 'Control de colesterol' }
    ],
    antecedentes: {
      patologicos: ['Dislipidemia diagnosticada en 2023', 'Gastritis por estrés (2021, resuelta)'],
      quirurgicos: ['Apendicectomía (2004)'],
      familiares: ['Padre: infarto agudo de miocardio a los 58 años', 'Hermano: hipertensión arterial'],
      noPatologicos: ['Fumador ocasional (3–4 cigarros por semana)', 'Trabajo de oficina, sedentario', 'Duerme 5–6 horas por noche']
    },
    vitales: [
      { d: 274, pas: 132, pad: 86, fc: 80, temp: 36.6, peso: 94.2, glucosa: 104, spo2: 97 },
      { d: 195, pas: 130, pad: 84, fc: 78, temp: 36.5, peso: 93.0, glucosa: 101, spo2: 98 },
      { d: 118, pas: 128, pad: 82, fc: 76, temp: 36.7, peso: 91.4, glucosa: 99,  spo2: 98 },
      { d: 62,  pas: 126, pad: 82, fc: 75, temp: 36.6, peso: 89.8, glucosa: 96,  spo2: 98 },
      { d: 12,  pas: 124, pad: 80, fc: 72, temp: 36.5, peso: 88.3, glucosa: 94,  spo2: 99 }
    ],
    talla: 1.76,
    consultas: [
      {
        d: 12,
        motivo: 'Control de peso y colesterol',
        subjetivo: 'Refiere que empezó a ir al gimnasio 3 veces por semana y bajó el consumo de gaseosas. Duerme mejor.',
        objetivo: 'Peso 88.3 kg (–5.9 kg en 9 meses). IMC 28.5. Presión 124/80 mmHg. Exploración sin hallazgos.',
        diagnostico: 'Sobrepeso en descenso. Dislipidemia en control con tratamiento.',
        plan: 'Continuar atorvastatina. Meta: 85 kg para el siguiente control. Repetir perfil lipídico en 3 meses.'
      },
      {
        d: 62,
        motivo: 'Seguimiento de dislipidemia',
        subjetivo: 'Refiere buen apego al medicamento, sin dolores musculares.',
        objetivo: 'Peso 89.8 kg. Presión 126/82 mmHg.',
        diagnostico: 'Dislipidemia en control.',
        plan: 'Se mantiene dosis. Se recomienda iniciar actividad física estructurada.'
      },
      {
        d: 118,
        motivo: 'Chequeo general anual',
        subjetivo: 'Acude por chequeo de rutina solicitado por su trabajo.',
        objetivo: 'Signos vitales dentro de parámetros. Peso 91.4 kg.',
        diagnostico: 'Sobrepeso grado I. Dislipidemia mixta.',
        plan: 'Se solicita perfil lipídico, glucosa y pruebas de función hepática.'
      }
    ],
    recetas: [
      {
        d: 12,
        dx: 'Dislipidemia mixta',
        medicamentos: [
          { nombre: 'Atorvastatina 20 mg', presentacion: 'Caja con 30 tabletas', dosis: '1 tableta por la noche', duracion: '90 días' }
        ],
        indicaciones: 'Reducir grasas saturadas y frituras. Ejercicio aeróbico 150 minutos por semana. Suspender el tabaco.'
      }
    ],
    estudios: [
      { d: 58, nombre: 'Perfil lipídico completo', tipo: 'Laboratorio', estado: 'listo', resultado: 'Colesterol total 212 mg/dL · LDL 138 mg/dL · Triglicéridos 186 mg/dL' },
      { d: 58, nombre: 'Pruebas de función hepática', tipo: 'Laboratorio', estado: 'listo', resultado: 'TGO 28 U/L · TGP 33 U/L · Bilirrubinas normales' }
    ]
  },

  /* ------------------------------------------------------------------ */
  {
    id: 'p3',
    exp: 'EXP-0407',
    nombre: 'Ana Lucía Mendoza Cruz',
    sexo: 'F',
    nacimiento: '1994-07-25',
    telefono: '7093-4417',
    sangre: 'B+',
    ocupacion: 'Docente',
    direccion: 'Col. Escalón, calle 5 #118',
    estado: 'control',
    motivo: 'Migraña y anemia ferropénica',
    proximaCita: -9,
    alergias: ['Metamizol (dipirona)'],
    padecimientos: [
      { nombre: 'Migraña sin aura', desde: '2019', estado: 'seguimiento' },
      { nombre: 'Anemia ferropénica leve', desde: '2026', estado: 'en tratamiento' }
    ],
    medicacion: [
      { nombre: 'Sulfato ferroso 325 mg', dosis: '1 tableta en ayunas con jugo de naranja', indicacion: 'Corrección de anemia' },
      { nombre: 'Naproxeno 550 mg', dosis: '1 tableta al inicio de la crisis', indicacion: 'Crisis de migraña' }
    ],
    antecedentes: {
      patologicos: ['Migraña sin aura desde la adolescencia', 'Anemia ferropénica detectada este año'],
      quirurgicos: ['Ninguno'],
      familiares: ['Madre: migraña', 'Abuela materna: hipotiroidismo'],
      noPatologicos: ['No fuma ni consume alcohol', 'Yoga 2 veces por semana', 'Refiere periodos de estrés laboral alto'],
      ginecoObstetricos: ['G0 P0', 'Ciclos regulares, sangrado abundante los primeros 2 días', 'Último Papanicolaou: hace 8 meses, normal']
    },
    vitales: [
      { d: 240, pas: 108, pad: 68, fc: 78, temp: 36.5, peso: 58.4, glucosa: 88, spo2: 99 },
      { d: 140, pas: 106, pad: 68, fc: 82, temp: 36.6, peso: 57.6, glucosa: 86, spo2: 99 },
      { d: 72,  pas: 104, pad: 66, fc: 86, temp: 36.7, peso: 56.9, glucosa: 85, spo2: 98 },
      { d: 18,  pas: 108, pad: 70, fc: 79, temp: 36.5, peso: 57.4, glucosa: 87, spo2: 99 }
    ],
    talla: 1.63,
    consultas: [
      {
        d: 18,
        motivo: 'Seguimiento de anemia y control de migraña',
        subjetivo: 'Refiere menos cansancio desde que inició el hierro. Tuvo 2 crisis de migraña este mes, ambas cedieron con naproxeno.',
        objetivo: 'Palidez de conjuntivas mucho menor que en la consulta previa. Frecuencia cardiaca 79 lpm. Exploración neurológica normal.',
        diagnostico: 'Anemia ferropénica en corrección. Migraña sin aura de frecuencia baja.',
        plan: 'Continuar sulfato ferroso 2 meses más. Llevar diario de cefalea. Repetir hemograma en 6 semanas.'
      },
      {
        d: 72,
        motivo: 'Cansancio y palidez',
        subjetivo: 'Refiere fatiga al subir escaleras, sueño durante el día y uñas quebradizas desde hace 3 meses.',
        objetivo: 'Palidez de conjuntivas y lecho ungueal. Taquicardia leve 86 lpm. Sin soplos.',
        diagnostico: 'Probable anemia ferropénica. Descartar pérdida crónica por sangrado menstrual abundante.',
        plan: 'Se solicita hemograma completo y perfil de hierro. Inicia sulfato ferroso.'
      }
    ],
    recetas: [
      {
        d: 18,
        dx: 'Anemia ferropénica · Migraña sin aura',
        medicamentos: [
          { nombre: 'Sulfato ferroso 325 mg', presentacion: 'Frasco con 60 tabletas', dosis: '1 tableta en ayunas', duracion: '60 días' },
          { nombre: 'Naproxeno 550 mg', presentacion: 'Caja con 10 tabletas', dosis: '1 tableta al inicio del dolor, máximo 2 al día', duracion: 'Según necesidad' }
        ],
        indicaciones: 'Tomar el hierro con jugo cítrico y separado del café o la leche. Evitar ayunos prolongados y dormir al menos 7 horas.'
      }
    ],
    estudios: [
      { d: 68, nombre: 'Hemograma completo', tipo: 'Laboratorio', estado: 'listo', resultado: 'Hemoglobina 10.4 g/dL · Hematocrito 32% · VCM 74 fL' },
      { d: 68, nombre: 'Perfil de hierro', tipo: 'Laboratorio', estado: 'listo', resultado: 'Ferritina 9 ng/mL · Hierro sérico 38 µg/dL' },
      { d: 2,  nombre: 'Hemograma de control', tipo: 'Laboratorio', estado: 'pendiente', resultado: '' }
    ]
  },

  /* ------------------------------------------------------------------ */
  {
    id: 'p4',
    exp: 'EXP-0512',
    nombre: 'Carlos Iván Palacios Núñez',
    sexo: 'M',
    nacimiento: '2017-01-30',
    telefono: '7560-2288',
    sangre: 'O+',
    ocupacion: 'Estudiante (3.º grado)',
    direccion: 'Col. Miramonte, av. Los Pinos #40',
    estado: 'control',
    motivo: 'Asma bronquial leve persistente',
    proximaCita: -21,
    alergias: ['Ácaros del polvo', 'Polen de gramíneas'],
    padecimientos: [
      { nombre: 'Asma bronquial leve persistente', desde: '2023', estado: 'controlado' },
      { nombre: 'Rinitis alérgica', desde: '2023', estado: 'seguimiento' }
    ],
    medicacion: [
      { nombre: 'Salbutamol inhalador 100 mcg', dosis: '2 disparos en caso de crisis', indicacion: 'Rescate' },
      { nombre: 'Budesonida inhalada 200 mcg', dosis: '1 disparo cada 12 h', indicacion: 'Control de fondo' }
    ],
    antecedentes: {
      patologicos: ['Asma diagnosticada a los 6 años', 'Dos hospitalizaciones por crisis (2023 y 2024)'],
      quirurgicos: ['Ninguno'],
      familiares: ['Madre: rinitis alérgica', 'Tío materno: asma'],
      noPatologicos: ['Esquema de vacunación completo para la edad', 'Convive con mascota (perro) dentro de casa', 'Practica fútbol los sábados']
    },
    vitales: [
      { d: 210, pas: 96,  pad: 60, fc: 98, temp: 36.8, peso: 28.4, glucosa: 90, spo2: 95 },
      { d: 132, pas: 98,  pad: 62, fc: 94, temp: 36.7, peso: 29.2, glucosa: 91, spo2: 96 },
      { d: 70,  pas: 98,  pad: 62, fc: 92, temp: 36.6, peso: 30.1, glucosa: 89, spo2: 97 },
      { d: 25,  pas: 100, pad: 64, fc: 90, temp: 36.7, peso: 30.8, glucosa: 90, spo2: 98 }
    ],
    talla: 1.30,
    consultas: [
      {
        d: 25,
        motivo: 'Control de asma',
        subjetivo: 'La madre refiere que no ha tenido crisis en los últimos 3 meses. Duerme toda la noche sin tos. Usa el inhalador de rescate una vez al mes.',
        objetivo: 'Buen estado general. Saturación 98% al aire ambiente. Campos pulmonares bien ventilados, sin sibilancias. Orofaringe sin alteraciones.',
        diagnostico: 'Asma bronquial leve persistente, bien controlada.',
        plan: 'Continuar budesonida. Reforzar técnica de inhalación con espaciador. Medidas de control ambiental en el dormitorio. Control en 3 meses.'
      },
      {
        d: 70,
        motivo: 'Tos nocturna',
        subjetivo: 'Madre refiere tos seca nocturna por 5 noches, sin fiebre.',
        objetivo: 'Sibilancias espiratorias escasas bilaterales. Saturación 97%.',
        diagnostico: 'Exacerbación leve de asma, probablemente por exposición a polvo.',
        plan: 'Salbutamol 2 disparos cada 6 horas por 3 días. Se explican medidas de control ambiental.'
      }
    ],
    recetas: [
      {
        d: 25,
        dx: 'Asma bronquial leve persistente',
        medicamentos: [
          { nombre: 'Budesonida inhalada 200 mcg', presentacion: 'Inhalador de 120 dosis', dosis: '1 disparo cada 12 horas con espaciador', duracion: '90 días' },
          { nombre: 'Salbutamol 100 mcg', presentacion: 'Inhalador de 200 dosis', dosis: '2 disparos en caso de dificultad respiratoria', duracion: 'Según necesidad' }
        ],
        indicaciones: 'Enjuagar la boca después de cada aplicación de budesonida. Fundas antiácaros en colchón y almohada. Evitar peluches en el dormitorio.'
      }
    ],
    estudios: [
      { d: 200, nombre: 'Espirometría', tipo: 'Gabinete', estado: 'listo', resultado: 'Patrón obstructivo leve con respuesta positiva al broncodilatador' },
      { d: 200, nombre: 'Radiografía de tórax', tipo: 'Imagen', estado: 'listo', resultado: 'Sin infiltrados ni consolidaciones' }
    ]
  },

  /* ------------------------------------------------------------------ */
  {
    id: 'p5',
    exp: 'EXP-0126',
    nombre: 'Rosa Estela Vargas Lemus',
    sexo: 'F',
    nacimiento: '1951-09-08',
    telefono: '7331-8865',
    sangre: 'A-',
    ocupacion: 'Jubilada',
    direccion: 'Col. Centro, 3.ª calle poniente #55',
    estado: 'control',
    motivo: 'Osteoartrosis de rodillas e hipotiroidismo',
    proximaCita: -35,
    alergias: ['Ibuprofeno'],
    padecimientos: [
      { nombre: 'Osteoartrosis de rodillas', desde: '2016', estado: 'seguimiento' },
      { nombre: 'Hipotiroidismo primario', desde: '2012', estado: 'controlado' }
    ],
    medicacion: [
      { nombre: 'Levotiroxina 75 mcg', dosis: '1 tableta en ayunas', indicacion: 'Sustitución tiroidea' },
      { nombre: 'Acetaminofén 500 mg', dosis: '1 tableta cada 8 h si hay dolor', indicacion: 'Dolor articular' }
    ],
    antecedentes: {
      patologicos: ['Hipotiroidismo desde 2012', 'Osteoartrosis bilateral de rodillas', 'Osteopenia (densitometría 2024)'],
      quirurgicos: ['Histerectomía total (1998)', 'Cataratas ojo derecho (2022)'],
      familiares: ['Madre: osteoporosis y fractura de cadera', 'Hermana: hipotiroidismo'],
      noPatologicos: ['No fuma ni bebe', 'Camina con bastón en trayectos largos', 'Vive con su hija'],
      ginecoObstetricos: ['G4 P4 A0', 'Menopausia quirúrgica a los 47 años']
    },
    vitales: [
      { d: 300, pas: 136, pad: 80, fc: 72, temp: 36.4, peso: 68.2, glucosa: 98,  spo2: 97 },
      { d: 220, pas: 134, pad: 78, fc: 70, temp: 36.5, peso: 67.8, glucosa: 96,  spo2: 97 },
      { d: 150, pas: 132, pad: 78, fc: 71, temp: 36.6, peso: 67.4, glucosa: 100, spo2: 98 },
      { d: 80,  pas: 130, pad: 76, fc: 70, temp: 36.5, peso: 67.0, glucosa: 97,  spo2: 98 },
      { d: 30,  pas: 128, pad: 76, fc: 69, temp: 36.4, peso: 66.6, glucosa: 95,  spo2: 98 }
    ],
    talla: 1.52,
    consultas: [
      {
        d: 30,
        motivo: 'Dolor de rodillas y control de tiroides',
        subjetivo: 'Refiere dolor en ambas rodillas al bajar gradas, que mejora con el reposo. Niega hinchazón. Toma la levotiroxina puntualmente.',
        objetivo: 'Crepitación en ambas rodillas a la flexión. Sin derrame articular ni signos inflamatorios. Piel y faneras normales. Sin bocio palpable.',
        diagnostico: 'Osteoartrosis de rodillas grado II. Hipotiroidismo compensado.',
        plan: 'Acetaminofén por razón necesaria. Terapia física 2 veces por semana. Solicitar perfil tiroideo. Control en 2 meses.'
      },
      {
        d: 80,
        motivo: 'Control de hipotiroidismo',
        subjetivo: 'Sin síntomas de hipo ni hipertiroidismo. Refiere buen estado de ánimo.',
        objetivo: 'TSH 2.8 mUI/L. Signos vitales estables.',
        diagnostico: 'Hipotiroidismo bien controlado.',
        plan: 'Se mantiene levotiroxina 75 mcg. Recordar tomarla en ayunas, 30 minutos antes del desayuno.'
      }
    ],
    recetas: [
      {
        d: 30,
        dx: 'Osteoartrosis de rodillas · Hipotiroidismo',
        medicamentos: [
          { nombre: 'Levotiroxina 75 mcg', presentacion: 'Caja con 60 tabletas', dosis: '1 tableta en ayunas', duracion: '60 días' },
          { nombre: 'Acetaminofén 500 mg', presentacion: 'Caja con 20 tabletas', dosis: '1 tableta cada 8 horas si hay dolor', duracion: 'Según necesidad' }
        ],
        indicaciones: 'No usar ibuprofeno (alergia documentada). Ejercicios de fortalecimiento de cuádriceps. Usar calzado con suela amortiguada.'
      }
    ],
    estudios: [
      { d: 26,  nombre: 'Perfil tiroideo (TSH, T4 libre)', tipo: 'Laboratorio', estado: 'pendiente', resultado: '' },
      { d: 84,  nombre: 'Perfil tiroideo (TSH, T4 libre)', tipo: 'Laboratorio', estado: 'listo', resultado: 'TSH 2.8 mUI/L · T4 libre 1.1 ng/dL' },
      { d: 310, nombre: 'Radiografía de rodillas AP y lateral', tipo: 'Imagen', estado: 'listo', resultado: 'Disminución del espacio articular y osteofitos marginales bilaterales' }
    ]
  },

  /* ------------------------------------------------------------------ */
  {
    id: 'p6',
    exp: 'EXP-0533',
    nombre: 'Diego Fernando Torres Mejía',
    sexo: 'M',
    nacimiento: '1999-05-19',
    telefono: '7248-6601',
    sangre: 'O-',
    ocupacion: 'Repartidor',
    direccion: 'Col. La Cima, calle principal #12',
    estado: 'nuevo',
    motivo: 'Dolor epigástrico de 3 semanas',
    proximaCita: -5,
    alergias: [],
    padecimientos: [
      { nombre: 'Gastritis aguda', desde: '2026', estado: 'en tratamiento' }
    ],
    medicacion: [
      { nombre: 'Omeprazol 20 mg', dosis: '1 cápsula en ayunas', indicacion: 'Protección gástrica' }
    ],
    antecedentes: {
      patologicos: ['Sin enfermedades crónicas conocidas'],
      quirurgicos: ['Ninguno'],
      familiares: ['Padre: gastritis crónica', 'Madre: sin antecedentes de importancia'],
      noPatologicos: ['Fuma 5 cigarros al día', 'Consume café en exceso (4–5 tazas)', 'Horarios de comida irregulares por el trabajo']
    },
    vitales: [
      { d: 2, pas: 118, pad: 74, fc: 76, temp: 36.6, peso: 71.5, glucosa: 92, spo2: 99 }
    ],
    talla: 1.74,
    consultas: [
      {
        d: 2,
        motivo: 'Primera consulta · dolor de estómago',
        subjetivo: 'Refiere ardor en la boca del estómago desde hace 3 semanas, que empeora con el estómago vacío y mejora al comer. Niega vómito con sangre o heces negras.',
        objetivo: 'Buen estado general. Abdomen blando, doloroso a la palpación profunda en epigastrio, sin signos de irritación peritoneal. Ruidos intestinales presentes.',
        diagnostico: 'Gastritis aguda, probablemente asociada a horarios irregulares de alimentación y tabaquismo.',
        plan: 'Omeprazol 20 mg por 4 semanas. Medidas higiénico-dietéticas. Solicitar prueba de Helicobacter pylori en heces. Control en 4 semanas.'
      }
    ],
    recetas: [
      {
        d: 2,
        dx: 'Gastritis aguda',
        medicamentos: [
          { nombre: 'Omeprazol 20 mg', presentacion: 'Caja con 28 cápsulas', dosis: '1 cápsula en ayunas, 30 min antes del desayuno', duracion: '28 días' }
        ],
        indicaciones: 'Comer a horas fijas. Evitar café, picante, alcohol y antiinflamatorios. Reducir o suspender el tabaco.'
      }
    ],
    estudios: [
      { d: 1, nombre: 'Antígeno de Helicobacter pylori en heces', tipo: 'Laboratorio', estado: 'pendiente', resultado: '' }
    ]
  }
];
