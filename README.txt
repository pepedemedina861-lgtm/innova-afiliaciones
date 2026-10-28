INNOVA AFILIACIONES — PRIMERA VERSIÓN
====================================

Qué incluye
- Registro y edición de afiliados.
- Documento único, teléfono, caja de compensación, fecha de afiliación, valor mensual, estado y notas.
- Registro de pagos por mes, fecha, valor y observaciones.
- Foto de comprobante guardada localmente (máximo 5 MB por foto).
- Indicadores básicos y búsqueda.
- Exportar/restaurar copia JSON (incluye fotos) y exportar afiliados a CSV.
- PWA instalable y caché offline tras abrirla una primera vez.

IMPORTANTE SOBRE LA INSTALACIÓN
No abras index.html directamente desde el explorador de archivos si quieres instalarla como PWA y usar el modo offline. Los service workers y la instalación PWA requieren HTTPS o localhost.
Para probar en un computador:
1. Instala Python 3 si ya está disponible (no es obligatorio para el usuario final).
2. Abre una terminal en esta carpeta y ejecuta:
   python -m http.server 8000
3. Abre http://localhost:8000 en Chrome.
4. Para probar en un teléfono conectado a la misma red, usa la IP local del PC, por ejemplo http://192.168.1.10:8000; la instalación PWA normalmente requiere HTTPS en el teléfono, salvo localhost. Para uso real, publica los archivos estáticos en un hosting HTTPS gratuito (por ejemplo GitHub Pages) y abre esa URL desde Chrome en Android. La aplicación no necesita backend y los registros permanecen en el navegador del teléfono.

PASOS RECOMENDADOS
1. Descomprime innova_afiliaciones.zip.
2. Publica la carpeta completa en un hosting estático HTTPS gratuito, o pruébala con localhost.
3. En Android, abre la URL en Google Chrome.
4. Usa el menú ⋮ > Instalar aplicación / Añadir a pantalla de inicio.
5. Abre la app y registra afiliados.
6. Registra pagos en la pestaña Pagos y añade la foto del comprobante.
7. En Copias y datos, exporta copias JSON con regularidad y guárdalas de forma segura fuera del teléfono.

LÍMITES Y PRIVACIDAD
- Todos los datos están en el almacenamiento del navegador de ese dispositivo. No hay sincronización ni recuperación automática.
- No uses el modo incógnito. No borres almacenamiento del sitio ni desinstales sin exportar primero una copia.
- Las fotos y los registros ocupan espacio local. Mantén fotos comprimidas.
- La copia JSON contiene datos personales y fotos: protégela con cuidado.
- Esta es una primera versión, no auditada ni cifrada por la app. No almacenes datos sensibles adicionales y evalúa los requisitos legales colombianos de protección de datos personales antes de usarla con datos reales.
- El icono y el manifiesto están incluidos. Si cambias archivos de la app, puede ser necesario incrementar el nombre de caché en sw.js.
