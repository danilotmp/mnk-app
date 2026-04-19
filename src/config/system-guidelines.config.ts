/**
 * Nombres fijos del sistema que usa la IA para procesamiento de directrices.
 * Se puede administrar y actualizar sin modificar el código de la pantalla.
 * Ruta: src/config/system-guidelines.config.ts
 */
export const SYSTEM_GUIDELINE_NAMES = [
  // ── 1. Inicio de conversación ──
  {
    order: 1,
    title: "SALUDO",
    usage: "Mensaje de bienvenida (etapa INICIO). Soporta botones interactivos con sintaxis {texto|ETAPA|respuesta}.",
    defaultContent:
      "¡Hola! Te has comunicado con [nombre de la empresa]. ¿En qué podemos ayudarte?\n\n{Servicios|SEARCH|¿Qué servicio te interesa?} {Información|CONSULTA_GENERAL|¿Qué información necesitas?} {Ayuda|RECOMENDACION|¿En qué podemos ayudarte?}",
  },
  {
    order: 2,
    title: "TONO_Y_RESTRICCIONES",
    usage: "Tono, prohibiciones y reglas de disponibilidad (todas las etapas)",
    defaultContent:
      'Tono natural, empático, cercano. PROHIBIDO: "no hay disponibles", "no tenemos", "no disponemos". Ante consultas sin info: informar que puede comunicarse por teléfono o indicar más detalle para ayudarle.',
  },
  {
    order: 3,
    title: "GLOSARIO",
    usage:
      "Equivalencias para búsqueda de productos (formato: clave: valor1, valor2, una por línea). Permite que los clientes busquen con palabras coloquiales y el sistema las traduzca a los términos técnicos del catálogo.",
    defaultContent:
      "habitacion: habitación, habitaciones, room, rooms\ndisponibilidad: disponibilidad, fechas, reservar",
  },
  // ── 2. Precalificación y descubrimiento ──
  {
    order: 4,
    title: "PLACEHOLDER_DATOS_PRECALIFICACION",
    usage:
      "Datos a recopilar antes de la búsqueda (behavior PRE_COLLECT). Se concatenan al searchterm para filtrar resultados.",
    defaultContent:
      "*Fecha de llegada:*\n*Fecha de salida:*\n*Número de huéspedes:*",
  },
  {
    order: 5,
    title: "BUSQUEDA_OFERTA_PRECIOS",
    usage:
      "Comportamiento al ofrecer productos y precios (etapa DESCUBRIMIENTO)",
    defaultContent:
      'Ofrece productos del catálogo configurado. NUNCA digas "no tengo" o "no hay". Si algo no está, solicita más detalle para ayudarle.',
  },
  {
    order: 6,
    title: "PLACEHOLDER_LISTA_PRODUCTOS",
    usage:
      "Formato para mostrar varias opciones (lista sin precios, etapa DESCUBRIMIENTO)",
    defaultContent:
      "*{name}*\n_{description}_",
  },
  // ── 3. Evaluación del producto ──
  {
    order: 7,
    title: "PLACEHOLDER_DETALLE_PRODUCTO",
    usage:
      "Formato para mostrar UN producto seleccionado (con precio, etapa EVALUACION). Soporta {texto|urlImage} para enviar imagen y {texto|url} para botón de enlace.",
    defaultContent:
      "*{name}*\n_{description}_\n\n*Precio:* {prices.basePrice} USD\n\n*Notas:*\n{conditions}",
  },
  // ── 4. Agendamiento y requisitos ──
  {
    order: 8,
    title: "PLACEHOLDER_DATOS_AGENDAMIENTO",
    usage:
      "Datos a solicitar antes de formalizar (behavior COLLECT, etapa REQUISITOS)",
    defaultContent: "*Cédula:*\n*Nombres Completos:*\n*Fecha y horario:*",
  },
  {
    order: 9,
    title: "REQUISITOS_AGENDAMIENTO",
    usage:
      "Política de confirmación: anticipo, comprobante, condiciones (etapa REQUISITOS/VALIDACION)",
    defaultContent:
      "Antes de agendar:\n1. Recopilar datos de {PLACEHOLDER_DATOS_AGENDAMIENTO}\n2. Solicitar selección de sucursal si hay varias\n3. Informar anticipo del 50% por transferencia\n4. Esperar comprobante del anticipo",
  },
  {
    order: 10,
    title: "NOTAS_AGENDAMIENTO",
    usage:
      "(Opcional) Notas de procedimiento para el cierre (llegada, preparación)",
    defaultContent:
      "Recuerda la hora acordada y la dirección del establecimiento. Llegada unos minutos antes si aplica.",
  },
  // ── 5. Pagos y validación ──
  {
    order: 11,
    title: "INFORMACION_VENTA_PAGO",
    usage:
      "Métodos de pago disponibles y condiciones (etapa REQUISITOS/VALIDACION)",
    defaultContent:
      "Efectivo: en el establecimiento. Transferencia: cuentas configuradas, enviar comprobante para confirmar.",
  },
  {
    order: 12,
    title: "POLITICA_PAGO",
    usage: "Política general de pagos y reservas",
    defaultContent:
      "Anticipo del 50% por transferencia para reservar. Resto al momento de la llegada.",
  },
  {
    order: 13,
    title: "DETALLE_VENTA_METODOS",
    usage: "Detalle operativo de cada método de pago",
    defaultContent:
      "Efectivo: en establecimiento. Transferencia: cuentas bancarias configuradas. Tarjeta: en establecimiento si aplica.",
  },
  {
    order: 14,
    title: "PLACEHOLDER_CONFIRMACION_COMPROBANTE",
    usage:
      "Formato del mensaje al validar comprobante de pago (etapa CONFIRMACION)",
    defaultContent:
      "Hemos recibido tu comprobante:\n*Monto:* {monto}\n*Fecha:* {fecha}\n*Referencia:* {referencia}\n\n¿Los datos son correctos?",
  },
  // ── 6. Confirmación y cierre ──
  {
    order: 15,
    title: "PLACEHOLDER_CONFIRMACION_AGENDAMIENTO",
    usage:
      "Formato del mensaje de confirmación de cita/reserva (etapa CONFIRMACION/CIERRE)",
    defaultContent:
      "Tu {tipo_solicitud} ha sido confirmada:\n*Producto:* {nombre_producto}\n*Sucursal:* {sucursal}\n*Fecha:* {fecha}\n*Cliente:* {nombres}",
  },
  // ── 7. Derivación y documentos ──
  {
    order: 16,
    title: "SOLICITUD_ESPECIALISTA",
    usage:
      "Mensaje de derivación a especialista cuando no se encuentra el producto tras 2 intentos de búsqueda. Usa {DATOS_AGENDAMIENTO} para incluir los campos de agendamiento. Desactiva el bot y asigna a un especialista.",
    defaultContent:
      "No hemos encontrado lo que buscas en nuestro catálogo. Vamos a direccionar tu solicitud a uno de nuestros especialistas.\n\nPor favor, compártenos los siguientes datos:\n\n{DATOS_AGENDAMIENTO}\n\n_Un especialista se comunicará contigo a la brevedad._",
  },
  {
    order: 17,
    title: "CONTEXTUALIZADOR_DOCUMENTOS",
    usage:
      'Configuración de análisis de documentos/imágenes por etapa (tipo, obligatorio, validacion, mnsError)',
    defaultContent:
      '{"DESCUBRIMIENTO":{"tipo":"RECETAS","obligatorio":false,"mnsError":"No hemos logrado reconocer el documento. Por favor digita su contenido."},"PAGOS":{"tipo":"TRANSFERENCIA","obligatorio":true,"validacion":true,"mnsError":"No se ha reconocido el comprobante. Un especialista lo revisará."}}',
  },
] as const;



export type SystemGuidelineName = (typeof SYSTEM_GUIDELINE_NAMES)[number];

/**
 * Secciones de ayuda para elementos interactivos en directrices.
 * Cada sección se renderiza como un bloque visual en el modal de ayuda.
 */
export const INTERACTIVE_ELEMENTS_HELP = [
  {
    icon: "information-circle-outline" as const,
    title: "Regla principal",
    items: [
      { syntax: "{campo}", description: "Se reemplaza por el valor real (nombre, precio, etc.)" },
      { syntax: "{texto|acción}", description: "Se convierte en un botón o acción interactiva" },
    ],
  },
  {
    icon: "radio-button-on-outline" as const,
    title: "Botones de respuesta rápida",
    subtitle: "Máximo 3 botones. Si hay más, se convierten en lista automáticamente.",
    items: [
      { syntax: "{Texto visible|ETAPA_DESTINO|Respuesta del bot}", description: "Sintaxis general" },
      { syntax: "{Reservar|SEARCH|¿Qué deseas reservar?}", description: "Ejemplo: botón que lleva a búsqueda de productos" },
    ],
    notes: [
      "Etapas disponibles: SEARCH (productos), CONSULTA_GENERAL (info), RECOMENDACION (ayuda)",
      "Si el cliente escribe texto libre en vez de tocar un botón, el flujo continúa normalmente",
    ],
  },
  {
    icon: "image-outline" as const,
    title: "Imagen del producto",
    items: [
      { syntax: "{Texto|urlImage}", description: "Sintaxis" },
      { syntax: "{Ver imagen|urlImage}", description: "Ejemplo: envía la imagen del producto como adjunto en WhatsApp" },
    ],
  },
  {
    icon: "link-outline" as const,
    title: "Botón de enlace",
    items: [
      { syntax: "{Texto|url}", description: "Sintaxis" },
      { syntax: "{Más detalles|url}", description: "Ejemplo: abre un enlace externo al tocar el botón" },
    ],
  },
  {
    icon: "list-outline" as const,
    title: "Lista desplegable dinámica",
    items: [
      { syntax: "[{campo.display|campo.valor}]", description: "Sintaxis" },
      { syntax: "[{branches.name|branches.code}]", description: "Ejemplo: genera un menú con las sucursales del sistema" },
    ],
  },
] as const;
