/**
 * Nombres fijos del sistema que usa la IA para procesamiento de directrices.
 * Se puede administrar y actualizar sin modificar el código de la pantalla.
 * Ruta: src/config/system-guidelines.config.ts
 */
export const SYSTEM_GUIDELINE_NAMES = [
  {
    title: "SALUDO",
    usage: "Mensaje de bienvenida (primer mensaje / RECEPCIONISTA)",
    defaultContent:
      "¡Hola! Te has comunicado con [nombre de la empresa]. ¿En qué podemos ayudarte?",
  },
  {
    title: "INFORMACION_RESERVA",
    usage: "Datos a solicitar antes de validar una reserva",
    defaultContent:
      "Para validar tu reserva necesito: Cédula o pasaporte, Nombres completos, Correo electrónico, Fecha de llegada/salida, Número de personas. ¿Algún dato adicional que debamos conocer?",
  },
  {
    title: "FORMATO_MENSAJE_PRODUCTOS",
    usage: "Estructura al mostrar productos (opción, precio, incluye, notas)",
    defaultContent: `Estructura por producto:
{opcion}. *{name} - {cantidadPersonas} persona/s*
_{descripcion corta del producto}_
[URL del producto o web de la empresa]

*Precio:* {PRECIO_CALCULADO} USD

*Incluye:*
- {items detectados en description del producto}

Si el producto tiene notas o restricciones, mostrarlas al final como:
*Notas:*
- {condiciones relevantes}`,
  },
  {
    title: "INFORMACION_PAGO",
    usage: "Instrucciones al elegir un método de pago",
    defaultContent:
      "Cuando el cliente elija un método de pago, proporciona: Para Efectivo: indicar dónde y cuándo se realiza el pago. Para Transferencia: mostrar cuenta bancaria, titular, número de cuenta, RUC/identificación y banco. Indicar que debe enviar el comprobante.",
  },
] as const;

export type SystemGuidelineName = (typeof SYSTEM_GUIDELINE_NAMES)[number];
