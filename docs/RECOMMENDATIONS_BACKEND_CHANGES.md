# Cambios en Backend de Recommendations - Análisis y Plan de Implementación

## Cambios Solicitados al Backend

### 1. Eliminar Campos
- `company_id` - Eliminar de la entidad
- `is_active` - Eliminar de la entidad  
- `branch_id` - Eliminar de la entidad

### 2. Renombrar Campo
- `priority` → `order` (mantener el mismo tipo de dato: number, rango 1-100)

## Cambios Necesarios en Frontend (Pendiente de Backend)

### Archivos a Modificar

#### 1. `src/domains/commercial/types.ts`
**Cambios en `Recommendation` interface:**
```typescript
export interface Recommendation {
  id: string;
  // ELIMINAR: companyId: string;
  // ELIMINAR: branchId?: string | null;
  offeringId?: string | null;
  type: RecommendationType;
  message: string;
  order: number; // CAMBIAR: priority → order
  // ELIMINAR: isActive: boolean;
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
}
```

**Cambios en `RecommendationPayload` interface:**
```typescript
export interface RecommendationPayload {
  // ELIMINAR: companyId: string;
  // ELIMINAR: branchId?: string | null;
  offeringId?: string | null;
  type: RecommendationType;
  message: string;
  order?: number; // CAMBIAR: priority → order
  // ELIMINAR: isActive?: boolean;
}
```

#### 2. `src/features/commercial/setup/components/recommendations-layer/recommendations-layer.tsx`

**Cambios en el estado del formulario:**
```typescript
const [formData, setFormData] = useState({
  type: (allowedTypes && allowedTypes.length > 0 ? allowedTypes[0] : 'informational') as RecommendationType,
  message: '',
  offeringId: '',
  order: 10, // CAMBIAR: priority → order
  // ELIMINAR: isActive: true,
});
```

**Cambios en `handleCreateRecommendation`:**
- Eliminar `companyId` del payload
- Eliminar `branchId` del payload
- Cambiar `priority` por `order`
- Eliminar `isActive` del payload

**Cambios en `handleUpdateRecommendation`:**
- Eliminar `companyId` del payload
- Eliminar `branchId` del payload
- Cambiar `priority` por `order`
- Eliminar `isActive` del payload

**Cambios en la UI:**
- Ya cambiado: Label "Prioridad (1-100)" → "Orden (1-100)" ✅
- Cambiar todas las referencias de `formData.priority` por `formData.order`
- Eliminar el switch "Recomendación activa" (ya no existe `isActive`)
- Cambiar la visualización de `recommendation.priority` por `recommendation.order`
- Eliminar la visualización del badge "Activa/Inactiva" (ya no existe `isActive`)

#### 3. `src/domains/commercial/commercial.service.ts`

**Cambios en `getRecommendations`:**
- Verificar que el endpoint no requiera `companyId` como parámetro
- Verificar que la respuesta no incluya `companyId`, `branchId`, `isActive`
- Verificar que el campo sea `order` en lugar de `priority`

**Cambios en `createRecommendation`:**
- Eliminar `companyId` del payload
- Eliminar `branchId` del payload
- Cambiar `priority` por `order` en el payload
- Eliminar `isActive` del payload

**Cambios en `updateRecommendation`:**
- Eliminar `companyId` del payload (si existe)
- Eliminar `branchId` del payload (si existe)
- Cambiar `priority` por `order` en el payload
- Eliminar `isActive` del payload

**Cambios en `deleteRecommendation`:**
- Verificar que no requiera `companyId` como parámetro

#### 4. Funcionalidad de "Relacionar con una oferta"

**Análisis de la sección actual:**
La sección "¿Relacionar con una oferta? (opcional)" actualmente funciona de forma básica:
- Muestra "Recomendación general (sin oferta)" como opción por defecto
- Permite seleccionar una oferta de la lista
- Guarda el `offeringId` seleccionado

**Funcionalidad deseada (similar a "Cuenta asociada" en Pagos):**
1. **Label**: Cambiar de "¿Relacionar con una oferta? (opcional)" a "¿Relacionar con una oferta?" (sin "(opcional)")
2. **Margin-bottom**: El texto descriptivo debe tener `marginBottom: 0` en lugar de `marginBottom: 8`
3. **Texto dinámico**: La opción "Recomendación general (sin oferta)" debe cambiar según el tipo de recomendación:
   - Si el tipo es "informational" → "Recomendación Informativa General"
   - Si el tipo es "orientation" → "Recomendación de Orientación General"
   - Si el tipo es "suggestion" → "Recomendación de Sugerencia General"
   - Si el tipo es "upsell" → "Recomendación de Upsell General"
4. **Selección automática**: Si se selecciona una oferta específica, internamente el tipo de recomendación debe mantenerse (no cambiar automáticamente)
5. **Restaurar tipo**: Si después de seleccionar una oferta, se vuelve a seleccionar "Recomendación general", debe restaurar el tipo de recomendación anterior

**Implementación necesaria:**
- Agregar estado `previousRecommendationType` para guardar el tipo anterior
- Modificar el `onPress` de la opción "Recomendación general" para restaurar el tipo
- Modificar el `onPress` de las ofertas para guardar el tipo actual antes de seleccionar
- Actualizar el texto dinámico basado en el tipo de recomendación

## Checklist de Implementación

### Fase 1: Cambios Inmediatos (Ya Realizados)
- [x] Cambiar label "Prioridad (1-100)" por "Orden (1-100)" en el formulario
- [x] Cambiar visualización "Prioridad: X" por "Orden: X" en la lista

### Fase 2: Cambios Pendientes (Esperar Backend)

#### Tipos y Interfaces
- [ ] Actualizar `Recommendation` interface en `types.ts`
- [ ] Actualizar `RecommendationPayload` interface en `types.ts`

#### Componente RecommendationsLayer
- [ ] Cambiar `priority` por `order` en el estado del formulario
- [ ] Eliminar `isActive` del estado del formulario
- [ ] Actualizar todas las referencias de `formData.priority` por `formData.order`
- [ ] Actualizar todas las referencias de `recommendation.priority` por `recommendation.order`
- [ ] Eliminar el switch "Recomendación activa"
- [ ] Eliminar la visualización del badge "Activa/Inactiva"
- [ ] Eliminar `companyId` del payload en `handleCreateRecommendation`
- [ ] Eliminar `branchId` del payload en `handleCreateRecommendation`
- [ ] Eliminar `isActive` del payload en `handleCreateRecommendation`
- [ ] Eliminar `companyId` del payload en `handleUpdateRecommendation`
- [ ] Eliminar `branchId` del payload en `handleUpdateRecommendation`
- [ ] Eliminar `isActive` del payload en `handleUpdateRecommendation`

#### Servicio CommercialService
- [ ] Verificar y actualizar `getRecommendations` (eliminar parámetros `companyId`, `branchId` si existen)
- [ ] Actualizar `createRecommendation` (eliminar campos, cambiar `priority` por `order`)
- [ ] Actualizar `updateRecommendation` (eliminar campos, cambiar `priority` por `order`)
- [ ] Verificar `deleteRecommendation` (eliminar parámetros si existen)

#### Funcionalidad "Relacionar con una oferta"
- [ ] Cambiar label de "¿Relacionar con una oferta? (opcional)" a "¿Relacionar con una oferta?"
- [ ] Cambiar `marginBottom: 8` a `marginBottom: 0` en el texto descriptivo
- [ ] Agregar estado `previousRecommendationType` para guardar el tipo anterior
- [ ] Implementar texto dinámico según el tipo de recomendación
- [ ] Implementar lógica para restaurar el tipo al seleccionar "Recomendación general"
- [ ] Implementar lógica para guardar el tipo al seleccionar una oferta específica

## Notas Importantes

1. **No implementar cambios hasta que el backend esté listo**: Los cambios en tipos, servicios y payloads deben esperar a que el backend actualice la entidad y los endpoints.

2. **Mapeo de datos**: Si el backend aún devuelve los campos antiguos durante la transición, puede ser necesario hacer un mapeo temporal en el servicio.

3. **Validación**: Verificar que el backend valide correctamente el rango de `order` (1-100) y que no requiera los campos eliminados.

4. **Migración de datos**: El backend debe manejar la migración de `priority` a `order` y la eliminación de los campos obsoletos.

5. **Testing**: Después de implementar, verificar:
   - Crear recomendación sin oferta
   - Crear recomendación con oferta
   - Actualizar recomendación
   - Eliminar recomendación
   - Cambiar entre "Recomendación general" y ofertas específicas
   - Verificar que el tipo se restaura correctamente

