# Estándar para Modales de Edición

Este documento define el estándar para implementar modales de edición en toda la solución. **TODOS los modales de edición deben seguir este patrón.**

## 📋 Reglas Generales

### 1. Componente `SideModal`
Todos los modales de edición deben usar el componente `SideModal` con las siguientes características:

- **Altura estándar**: `windowHeight - 32px` (16px padding arriba y abajo)
- **Ancho**: 
  - Web: `33.33%` del ancho de la pantalla
  - Móvil: `100%` del ancho de la pantalla
- **Bordes redondeados**: Solo en el lado izquierdo (12px)
- **Estructura**: Header fijo + Contenido scrolleable + Footer fijo

### 2. Estructura del Modal

```tsx
<SideModal
  visible={editModalVisible}
  onClose={handleCloseEditModal}
  title={t.module?.edit || 'Editar Entidad'}
  subtitle="Modifica los datos"
  footer={
    formActions ? (
      <>
        <Button
          title={t.common.cancel}
          onPress={formActions.handleCancel}
          variant="outlined"
          size="md"
          disabled={formActions.isLoading}
        />
        <Button
          title={t.common.save}
          onPress={formActions.handleSubmit}
          variant="primary"
          size="md"
          disabled={formActions.isLoading}
        />
      </>
    ) : null
  }
>
  <EntityEditForm
    entityId={editingEntityId}
    onSuccess={handleEditSuccess}
    onCancel={handleCloseEditModal}
    showHeader={false}
    showFooter={false}
    onFormReady={setFormActions}
  />
</SideModal>
```

### 3. Padding del Modal

- **Header**: `padding: 25px`
- **Contenido scrolleable**: `padding: 0px` (sin padding en el contenedor del scroll)
- **Footer**: `padding: 25px`

### 4. Componente de Formulario

Todos los formularios de edición deben seguir este patrón:

#### Props Requeridas

```typescript
interface EntityEditFormProps {
  entityId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  showHeader?: boolean; // Si false, no muestra el header (útil para modal)
  showFooter?: boolean; // Si false, no muestra los botones (útil para modal con footer fijo)
  onFormReady?: (props: { isLoading: boolean; handleSubmit: () => void; handleCancel: () => void }) => void;
}
```

#### Estructura del Formulario

```tsx
export function EntityEditForm({ entityId, onSuccess, onCancel, showHeader = true, showFooter = true, onFormReady }: EntityEditFormProps) {
  // ... estados y lógica ...

  const handleSubmit = async () => {
    // ... lógica de envío ...
  };

  const handleCancel = () => {
    onCancel?.();
  };

  // Exponer funciones cuando el formulario está listo
  useEffect(() => {
    if (onFormReady && !loadingEntity && !loadingOptions) {
      onFormReady({
        isLoading,
        handleSubmit,
        handleCancel,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onFormReady, loadingEntity, loadingOptions, isLoading]);

  // Renderizar contenido (sin ScrollView si está en modal)
  const formContent = (
    <>
      <Card variant="flat" style={styles.formCard}>
        {/* Campos del formulario */}
        
        {/* Botones solo si showFooter es true */}
        {showFooter && (
          <View style={styles.actions}>
            <Button title={t.common.cancel} onPress={handleCancel} variant="outlined" />
            <Button title={t.common.save} onPress={handleSubmit} variant="primary" />
          </View>
        )}
      </Card>
    </>
  );

  // Si está en modal (showHeader=false), no usar ScrollView propio
  if (!showHeader) {
    return <>{formContent}</>;
  }

  // Si está en página independiente, usar ScrollView propio
  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      {formContent}
    </ScrollView>
  );
}
```

### 5. Card del Formulario

El `Card` que contiene los campos del formulario debe ser:

- **Variant**: `variant="flat"` (transparente y sin bordes)
- **Padding**: `padding: 25px` (en los estilos `formCard`)

### 6. Estados en la Página

La página que contiene el modal debe tener estos estados:

```typescript
const [editModalVisible, setEditModalVisible] = useState(false);
const [editingEntityId, setEditingEntityId] = useState<string | null>(null);
const [formActions, setFormActions] = useState<{ 
  isLoading: boolean; 
  handleSubmit: () => void; 
  handleCancel: () => void 
} | null>(null);
```

### 7. Funciones de Manejo

```typescript
const handleEditEntity = (entity: Entity) => {
  setEditingEntityId(entity.id);
  setEditModalVisible(true);
};

const handleCloseEditModal = () => {
  setEditModalVisible(false);
  setEditingEntityId(null);
  setFormActions(null); // Resetear acciones del formulario
};

const handleEditSuccess = () => {
  loadEntities(); // Recargar lista
  handleCloseEditModal();
};
```

## 🎨 Estilos

### Estilos del Modal (`side-modal.styles.ts`)

- `header`: `padding: 25px`
- `scrollContent`: `padding: 0px`
- `footer`: `padding: 25px`

### Estilos del Formulario (`entity-form.styles.ts`)

- `formCard`: `padding: 25px`

## 🌙 Modo Dark

El modal debe usar un fondo completamente opaco en modo dark:

- **Fondo del modal**: `colors.surfaceVariant` o `colors.background` (no `colors.surface` que tiene transparencia)
- El componente `SideModal` ya maneja esto automáticamente

## ✅ Checklist para Nuevos Modales

Al crear un nuevo modal de edición, verificar:

- [ ] Usa `SideModal` con `footer` prop
- [ ] El formulario tiene `showHeader={false}` y `showFooter={false}` cuando está en modal
- [ ] El formulario expone funciones vía `onFormReady`
- [ ] El estado `formActions` se resetea en `handleCloseEditModal`
- [ ] El `Card` del formulario usa `variant="flat"`
- [ ] Los paddings son: Header 25px, Contenido 0px, Footer 25px, FormCard 25px
- [ ] El formulario no usa ScrollView propio cuando `showHeader={false}`

## 📝 Ejemplo Completo

Ver implementaciones de referencia en:
- `app/security/users/index.tsx` + `src/domains/security/components/user-edit-form.tsx`
- `app/security/roles/index.tsx` + `src/domains/security/components/role-edit-form.tsx`
- `app/security/permissions/index.tsx` + `src/domains/security/components/permission-edit-form.tsx`

## ⚠️ Importante

**ESTE ES UN ESTÁNDAR OBLIGATORIO**. Todos los modales de edición existentes y futuros deben seguir este patrón para mantener consistencia en la UI/UX.

