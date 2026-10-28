INNOVA AFILIACIONES v2 — ACTUALIZACIÓN
======================================

Incluye
- Logo INNOVA OBRAS K.M. en la cabecera.
- Panel resumen mensual: recaudado, costo de caja, comisiones y ganancia estimada.
- Gestión de afiliados y reclutadoras.
- Bloqueo/desbloqueo MANUAL de afiliados por el administrador, con motivo opcional.
- Registro de pago por mes: ingreso recibido, costo de caja, comisión, marcas de pago realizado y foto del comprobante.
- Reportes mensuales con gráfico de barras, detalle por reclutadora y afiliado, exportación CSV.
- Copia completa JSON que incluye afiliados, reclutadoras, pagos y comprobantes.
- Compatible con los registros locales de la versión inicial.

IMPORTANTE: CÓMO ACTUALIZAR SIN PERDER LOS DATOS EXISTENTES
1. No pulses “Eliminar todos los datos”, no borres los datos del sitio en Chrome y no desinstales la app.
2. Mantén el mismo repositorio y la misma dirección GitHub Pages.
3. En GitHub, abre el repositorio y usa Add file > Upload files.
4. Sube los archivos de esta carpeta a la raíz del repositorio, sobrescribiendo los archivos que ya existen. Incluye logo-innova.png, que es nuevo.
5. Pulsa Commit changes.
6. Espera a que GitHub Pages publique la actualización.
7. Abre la app en la misma dirección. Recarga con Ctrl+F5 en computador. En Android, cierra y vuelve a abrir la app y recarga cuando tenga internet. El service worker se actualizó a innova-afiliaciones-v2.
8. Antes de modificar, si la app tiene datos importantes, abre Copias y exporta la copia JSON como precaución.

POR QUÉ SE CONSERVAN LOS DATOS
La aplicación conserva el mismo nombre de base local IndexedDB: innova-afiliaciones-db. La nueva versión incrementa la versión de base de datos de 1 a 2 y añade el almacén “recruiters” sin borrar los almacenes existentes “people” y “payments”. Al actualizar el código en el mismo origen/dominio y usar el mismo navegador/perfil, los registros locales existentes deberían conservarse. Los datos no se sincronizan entre dispositivos y una copia exportada desde un dispositivo se puede importar en otro.

FUNCIONAMIENTO FINANCIERO
- Ganancia estimada = valor recibido - costo registrado para caja - comisión registrada para reclutadora.
- “Pago a caja realizado” y “Comisión pagada” registran si esos costos ya se desembolsaron; el reporte de ganancia usa los costos configurados aunque todavía estén pendientes de pago.
- Para un cálculo correcto, al registrar cada pago mensual introduce los importes reales de ese periodo. La comisión predeterminada de la reclutadora se puede ajustar por afiliado.
- Los pagos históricos de la versión anterior se conservan, pero no tenían los campos de costo de caja ni comisión. Para esos registros antiguos esos conceptos aparecerán en cero y no se deben interpretar como una contabilidad histórica completa. No los borres; utiliza la copia de seguridad antes de actualizar.

BLOQUEO MANUAL
El bloqueo es una marca administrativa dentro de INNOVA, no bloquea el acceso a la caja de compensación ni impide por sí mismo que una persona realice trámites externos. El administrador puede bloquear/desbloquear desde la ficha/lista del afiliado.

PRIVACIDAD
- GitHub Pages publica el código de forma pública; no subas archivos con datos personales, comprobantes ni copias JSON al repositorio.
- Los datos y las fotos están en el almacenamiento local del navegador, no cifrados por esta aplicación. Protege el teléfono y las copias.
- Esta aplicación es una herramienta local inicial, no un sistema contable certificado. La ganancia estimada no contempla gastos generales, impuestos, devoluciones ni otros ajustes.
