# Decision Log

## TECH-001 — URL permanente en la tarjeta física
**DECIDIDO**: La tarjeta física (QR + NFC) contiene únicamente la URL permanente (`/c/{public_id}`). El destino es mutable en backend.

## TECH-002 — public_id separado del ID interno
**DECIDIDO**: `public_id` es un string base62 de 16 caracteres, generado con `crypto.randomBytes` + rejection sampling. El ID interno es un UUID de PostgreSQL. Son independientes.

## TECH-003 — Redirect 302, no 301
**DECIDIDO**: Se usa `302 Found` con `Cache-Control: no-store`. Nunca `301 Moved Permanently` para evitar que el navegador cacheé el destino anterior.

## TECH-004 — QR y NFC usan /c/{public_id}
**DECIDIDO**: Ambos apuntan a la misma URL permanente. No se distingue origen (QR vs NFC) en esta etapa.

## TECH-005 — Distinción /q/ y /n/ queda FUTURE
**DECIDIDO**: No implementar rutas separadas para QR y NFC hasta que exista requerimiento real de medición por origen.

## TECH-006 — Base44 como plataforma principal
**OBSERVADO**: El entorno de desarrollo local usa docker compose con Node.js + Express + PostgreSQL. La plataforma principal de deployment es Base44. El stack local replica la arquitectura aprobada (React + TypeScript + Vite en frontend, TypeScript en backend).

## TECH-007 — TypeScript como lenguaje principal
**DECIDIDO**: Tanto frontend como backend usan TypeScript.

## TECH-008 — No stack Python/Flask/SQLite paralelo
**DECIDIDO**: No se incorpora un stack alternativo.

## TECH-009 — No tarjetas comerciales hasta congelar dominio
**PENDIENTE**: El dominio definitivo no está definido. Las URLs del PoC usan el dominio temporal del preview.

## TECH-010 — Routing /c/{public_id} server-side
**OBSERVADO**: El redirect se implementa en el backend (Express). Vite proxy pasa el 302 sin modificar al navegador. El header `Location` y `Cache-Control: no-store` llegan intactos al cliente. Esto satisface el Caso A del spec (redirect HTTP real server-side).
