# Technical Backlog

## Pendiente de validación

- **Dominio definitivo**: No emitir tarjetas comerciales hasta congelar el dominio. Cambiar el dominio invalida las tarjetas físicas.
- **Backup y restauración**: Necesaria estrategia de backup + prueba de restauración antes de producción. La pérdida de la asociación `public_id → destination_url` inutiliza tarjetas emitidas.
- **Rendimiento real**: Medir latencia del redirect bajo carga.
- **Comportamiento real de QR y NFC físicos**: Validar con tarjetas físicas reales.

## SHOULD (no implementado aún en PoC)

- **Cliente/comercio**: Modelar `Organization` + `OrganizationMembership` cuando exista requerimiento real.
- **Multi-tenant**: Aislamiento entre propietarios/organizaciones.

## FUTURE

- Rutas separadas `/q/{public_id}` y `/n/{public_id}` para medir origen de acceso.
- Analytics avanzado (IP, ubicación, dispositivo) — evaluar privacidad y necesidad primero.
- Integración Mercado Pago API (actualmente solo URL genérica).
- Programación física de NFC desde navegador.
- Dashboard analítico.

## DECISIÓN PM / NEGOCIO PENDIENTE

- Planes Basic/Pro, pricing, límites de tarjetas.
- Modelo de suscripción / billing.
- Multi-sucursal.
- Roles empresariales avanzados.
