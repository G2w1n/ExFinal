# Pruebas de la API en Postman

1. En Postman: **Import** → arrastra los dos archivos de esta carpeta.
2. Arriba a la derecha elige el environment **Grupo15 · Render**.
3. Clic derecho en la colección → **Run collection** → **Run**.

El login guarda los tokens (cliente, admin del Aeropuerto, admin de TransAndino y empleado) y cada petición
guarda los ids que crea, así que deben ejecutarse **en orden**. La fecha, el asiento y la placa se eligen al azar:
la colección se puede ejecutar varias veces.

| Carpeta | Qué prueba |
|---|---|
| 1. Login y sesión | Login de los 4 roles, clave incorrecta (401), mi cuenta |
| 2. TransAndino · pasajes | Rutas, cotizar, comprar (201), mismo asiento (409), pagar, pagar dos veces (409), historial |
| 3. Integraciones F1 · F2 · F3 | Prellenado, reserva enlazada, saltarse un estado (409), pagar, preparar, Mis viajes, espacio para bus, llegadas |
| 4. Caja y CRM | Abrir caja, cobrar en efectivo con vuelto, cobrar dos veces (409), arqueo y cierre, clientes, indicadores |
| 5. Seguridad y errores | Sin token y token falso (401), cliente en CRM, panel y buses (403), placa inválida (400), ruta inexistente (404) |

Resultado de referencia: 39 peticiones · 85 pruebas · 0 fallas.
Si es la primera petición del día, Render puede tardar ~60 s en despertar: vuelve a ejecutar.
