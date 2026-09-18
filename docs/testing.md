# Testing

## Unit tests (Vitest)

```bash
cd backend && npm test
```

### Cobertura actual

- **`publicId.test.ts`**: generación, longitud, formato base62, unicidad (10 000 IDs), no secuencialidad.
- **`urlValidation.test.ts`**: HTTPS válida, URL malformada, protocolos prohibidos (http, javascript, data, file), hostname ausente, credenciales embebidas, caracteres de control, string vacío.

### Pendiente

- **Card CRUD**: crear, modificar, activar, desactivar (requiere test DB o mock).
- **Independencia**: crear CARD A y CARD B, modificar A, verificar que B no cambia (y viceversa).
- **Resolver**: verificar status HTTP 302, header `Location`, header `Cache-Control: no-store`. No seguir la redirección automáticamente.

## Prueba física final

Cuando lleguen las dos tarjetas reales:

1. Tarjeta A (QR + NFC) → WhatsApp
2. Tarjeta B (QR + NFC) → Menú
3. Cambiar A → Mercado Pago desde el panel
4. Cambiar B → Página web desde el panel
5. Usar nuevamente ambas tarjetas
6. Verificar: A abre Mercado Pago, B abre página web
7. Sin modificación física de QR/NFC
