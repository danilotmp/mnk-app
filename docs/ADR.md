# Architecture Decision Record (ADR)

Esta sección resume las decisiones clave tomadas durante la evolución del proyecto.  
Para nuevas decisiones, añade una sección con fecha y estado.

---

## ADR-001 · Migración de `isActive` → `status`
* **Fecha**: 2025-11-05
* **Contexto**: El backend eliminó el campo booleano `isActive` y lo reemplazó por `status` (numérico) y `statusDescription`.
* **Decisión**:
  - Actualizar todos los tipos de dominio para reflejar `status`.
  - Formularios usan selectores de estado textual.
  - Las consultas filtran por `status` (ej. `status=1` para activos).
* **Consecuencias**:
  - Eliminación de errores `SQLITE_ERROR: no such column`.
  - Listados muestran badge de estado uniforme.

---

## ADR-002 · Manejo de toasts sobre modales
* **Fecha**: 2025-11-06
* **Contexto**: Las notificaciones se renderizaban detrás de modales (problemas de z-index).
* **Decisión**: Renderizar `ToastContainer` dentro de un `Modal` transparente con `pointerEvents="box-none"` y `StyleSheet.absoluteFillObject`.
* **Consecuencias**:
  - Los mensajes son visibles en todas las circunstancias.
  - Se evita bloquear la interacción con formularios activos.

---

## ADR-003 · Confirmaciones y eliminación de usuarios
* **Fecha**: 2025-11-06
* **Contexto**: El botón de eliminar en modales de usuarios no respondía y carecía de confirmación.
* **Decisión**:
  - Usar `alert.showConfirm` previo a eliminar.
  - Reposicionar el ícono/botones en el footer del modal.
  - Usar el mismo color (`colors.primary`) que las acciones de tabla.
* **Consecuencias**:
  - Experiencia consistente con acciones en tablas.
  - Prevención de eliminaciones accidentales.

---

## ADR-004 · Filtro “Usuarios Eliminados” independiente
* **Fecha**: 2025-11-07
* **Contexto**: El filtro “Eliminados” dentro del selector de estado confundía a usuarios finales.
* **Decisión**:
  - Crear un botón independiente (“Otros”) con estado visual diferenciado.
  - Ajustar estilos responsivos (bordes redondeados moderados, botón centrado).
* **Consecuencias**:
  - Experiencia de filtrado clara (estado ≠ eliminado).
  - Reducido flicker por cargas innecesarias (se sincroniza con `skipNextLoadRef`).

---

## ADR-005 · Patrón de formularios con `useRef`
* **Fecha**: 2025-11-08
* **Contexto**: Formularios enviaban datos desactualizados (closures obsoletas) y generaban errores de validación.
* **Decisión**:
  - Usar referencias (`useRef`) para campos críticos (teléfono, sucursales, rol, estado).
  - Sincronizar `formData` en `useEffect` y leer de `ref.current` en `handleSubmit`.
* **Consecuencias**:
  - Eliminación de inconsistencias en payloads.
  - Evita bucles de renderizado y errores de máximo depth.

---

## ADR-006 · Normalización de estilos de estado
* **Fecha**: 2025-11-09
* **Contexto**: Los selectores de estado usaban estilos inconsistentes entre módulos.
* **Decisión**:
  - Establecer un diseño único (texto, tipografía pequeña, sin iconografía infantil).
  - Reutilizar componentes compartidos (`StatusBadge`, `SearchFilterBar`).
* **Consecuencias**:
  - Mayor coherencia visual.
  - Reducción de estilos duplicados.

---

## Próximas entradas
* Documentar decisiones relacionadas con catálogos, empresas/sucursales u otros módulos cuando finalicen.

