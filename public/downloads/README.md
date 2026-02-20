# Descargas (opcional)

Esta carpeta es **opcional**. Por defecto la app usa la **URL de EAS** para el botón de descarga de Android (configurada en `app.json` → `extra.androidApkUrl`).

Si prefieres **servir el APK desde tu propio sitio** (en lugar de EAS):

1. Genera el APK con `npx eas build -p android --profile preview`.
2. Descarga el archivo y colócalo aquí con el nombre **`AIBox.apk`**.
3. Exporta la web (`npx expo export --platform web`) y despliega la carpeta `dist`. La URL será `https://tu-dominio.com/downloads/AIBox.apk`.
4. Define en tu entorno: `EXPO_PUBLIC_ANDROID_APK_URL=https://tu-dominio.com/downloads/AIBox.apk`.
