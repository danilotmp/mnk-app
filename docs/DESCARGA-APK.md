# Descarga del APK (Android)

## Opción recomendada: usar la URL de EAS

Al generar el APK con EAS Build, Expo te da un **enlace** (y un QR). Ese enlace ya está configurado en la app para el botón "Descargar" de Android.

1. **Generar el APK**
   ```bash
   npx eas build -p android --profile preview
   ```
2. Al terminar, EAS muestra un enlace y un **código QR**. Ese enlace está en `app.json` → `extra.androidApkUrl`.
3. Los usuarios pueden:
   - Abrir ese enlace en el móvil, o
   - Escanear el QR, o
   - Ir a tu web → página **Descargas** → botón **Descargar** (Android): se abre el mismo enlace de EAS.

Cada vez que hagas un **nuevo build**, actualiza en `app.json` → `extra.androidApkUrl` la nueva URL que te dé EAS (o usa `.env` con `EXPO_PUBLIC_ANDROID_APK_URL`).

---

## Icono de la aplicación en Android

El icono del lanzador usa **`./assets/images/icon.png`** (mismo que la web). Si al instalar ves el icono genérico de Android:

- Comprueba que existe **`assets/images/icon.png`**.
- Vuelve a generar el APK: `npx eas build -p android --profile preview`.
- Desinstala la app anterior en el móvil e instala de nuevo desde el nuevo build.

---

## La app se abre y se cierra al instante (crash)

Si al abrir la app en el celular se cierra sola:

1. **Ver el error en el dispositivo (recomendado)**  
   Conecta el celular por USB con depuración USB activada y ejecuta:
   ```bash
   adb logcat *:E
   ```
   Abre la app y revisa las líneas en rojo; suelen indicar la causa del cierre.

2. **Comprobar assets**  
   Asegúrate de que existan:
   - `assets/images/icon.png`
   - `assets/images/splash-icon.png`  
   Si falta el splash, el plugin de splash puede provocar el crash.

3. **Probar sin New Architecture**  
   En `app.json`, pon `"newArchEnabled": false`, vuelve a hacer el build e instala de nuevo. Si deja de cerrarse, el fallo está relacionado con la Nueva Arquitectura de React Native.

4. **Build de depuración**  
   Prueba un perfil de desarrollo para ver más errores:
   ```bash
   npx eas build -p android --profile development
   ```
   (Ese build puede pedir configurar un cliente de desarrollo.)

Cuando tengas el mensaje de error de `adb logcat`, puedes buscarlo o pegarlo para afinar la solución.
