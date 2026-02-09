# Cumplimiento del patrón de componentes (Architecture.md § 2.2)

Cada componente debe seguir:

```
component-name/
├── component-name.tsx          # Lógica y JSX
├── component-name.styles.ts    # Estilos (StyleSheet.create)
└── component-name.types.ts     # Tipos e interfaces
```

## Estado de cumplimiento

### ✅ Ya cumplen (tienen .tsx + .styles.ts + .types.ts)

- `infrastructure/i18n/`: **language-selector** (añadidos .styles.ts y .types.ts)
- `domains/shared/components/`: **access-guard**, **custom-switch**, **date-picker**, **dynamic-icon**, **icon-input**
- `domains/security/components/`: **permission-edit-form** (.styles.ts reexporta create-form), **permissions-management-flow** (.styles.ts reexporta role-permissions-flow)
- `features/security/branches/components/`: **branch-edit-form** (.styles.ts reexporta branch-create-form)
- `features/security/roles/components/`: **role-edit-form** (.styles.ts reexporta role-create-form)

### ❌ Siguen sin cumplir (falta .styles.ts y/o .types.ts)

#### Sin .styles.ts

| Ubicación                                 | Componente                                                                                                                                                  | Nota                                                |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `domains/security/components/`            | permissions-carousel                                                                                                                                        | Falta .types.ts                                     |
| `domains/security/components/shared/`     | menu-item-selector-modal                                                                                                                                    |                                                     |
| `domains/security/components/shared/`     | permission-action-icons                                                                                                                                     |                                                     |
| `domains/security/components/shared/`     | permission-menu-item                                                                                                                                        |                                                     |
| `features/security/companies/components/` | company-edit-form                                                                                                                                           | Revisar si comparte estilos con company-create-form |
| `features/security/users/components/`     | user-edit-form                                                                                                                                              | Revisar si comparte estilos con user-create-form    |
| `features/security/users/components/`     | company-config-carousel                                                                                                                                     | Falta .types.ts                                     |
| `features/commercial/setup/components/`   | company-setup-layer, institutional-layer, interaction-guidelines-layer, operational-layer, payments-layer, recommendations-layer, whatsapp-connection-layer |                                                     |
| `features/commercial/setup/components/`   | wizard-stepper                                                                                                                                              | Estilos inline en .tsx                              |
| `features/interacciones/chat/components/` | image-with-token                                                                                                                                            |                                                     |
| `features/auth/components/`               | register-form, verify-email-form                                                                                                                            | Sin carpeta; archivo suelto                         |

#### Sin .types.ts

| Ubicación                               | Componente                                                              |
| --------------------------------------- | ----------------------------------------------------------------------- |
| `domains/security/components/`          | permissions-carousel                                                    |
| `domains/security/components/shared/`   | menu-item-selector-modal, permission-action-icons, permission-menu-item |
| `features/security/users/components/`   | company-config-carousel                                                 |
| `features/commercial/setup/components/` | (todos los layers)                                                      |
| `features/auth/components/`             | register-form, verify-email-form                                        |

---

**Última actualización**: alinear componentes con el patrón; se irán añadiendo los archivos faltantes.
