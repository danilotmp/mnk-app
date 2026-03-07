# Referencia de iconos

Para buscar y elegir iconos válidos en el proyecto (menús, permisos, botones de acción, etc.) usa el navegador oficial de **Expo**:

## Página de iconos

**https://icons.expo.fyi/**

Ahí puedes:
- Buscar por nombre (ej. "link", "reconnect", "plug", "refresh")
- Filtrar por familia: **Ionicons**, FontAwesome, MaterialIcons, AntDesign, MaterialCommunityIcons, Feather, Entypo
- Ver el nombre exacto del icono para usarlo en código (ej. `name="link"`, `name="refresh-outline"`)

En el proyecto se usan sobre todo **Ionicons** (`import { Ionicons } from "@expo/vector-icons"`). El control de edición de iconos (permisos, menú) usa el componente `IconInput` con formato `Familia:Nombre` (ej. `Ionicons:link`).

Si un icono se renderiza como interrogación, comprueba en la página que el nombre exista en la familia que estás usando.
