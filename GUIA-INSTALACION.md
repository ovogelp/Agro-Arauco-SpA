# 🌿 Agro Arauco — Guía de instalación del pago Mercado Pago

Esta guía te lleva paso a paso para activar el **Checkout dinámico de Mercado Pago**
(cantidad de sacos + despacho por región) en tu sitio https://agroarauco.cl

> ⚠️ **Importante:** El pago dinámico necesita "Netlify Functions". Por eso el sitio
> ya NO se sube arrastrando un ZIP, sino que se conecta a un repositorio en GitHub.
> Es un cambio de método, pero solo se configura **una vez**.

---

## 📋 Resumen de lo que vas a hacer

1. Obtener tu Access Token de Mercado Pago
2. Subir este proyecto a GitHub
3. Conectar Netlify a GitHub
4. Pegar tu Access Token en Netlify (de forma segura)
5. Probar el pago

---

## PASO 1 — Obtener tu Access Token de Mercado Pago

1. Entra a **https://www.mercadopago.cl/developers/panel**
2. Inicia sesión con tu cuenta de Agro Arauco.
3. Crea una aplicación (botón "Crear aplicación"):
   - Nombre: `Agro Arauco Web`
   - Tipo: "Pagos online" / Checkout Pro
4. Una vez creada, entra a la sección **"Credenciales de producción"**.
5. Copia el valor que dice **"Access Token"**. Empieza con `APP_USR-...`

> 🔒 Este token es la llave de tu caja. NO lo pegues en ningún archivo del sitio,
> NO lo compartas por correo ni WhatsApp. Solo lo pegarás en Netlify (paso 4),
> que es un lugar seguro.

> 💡 Mientras pruebas, puedes usar primero las **credenciales de PRUEBA** (sandbox)
> para no mover dinero real. Cuando todo funcione, cambias por las de producción.

---

## PASO 2 — Subir el proyecto a GitHub

### Opción fácil (sin instalar nada, desde el navegador):

1. Entra a **https://github.com** e inicia sesión (o crea una cuenta gratis).
2. Arriba a la derecha: **+ → New repository**.
   - Nombre: `agroarauco-web`
   - Marca **"Private"** (privado).
   - NO marques "Add a README".
   - Clic en **"Create repository"**.
3. En la página del repo nuevo, clic en **"uploading an existing file"**.
4. Arrastra **TODO el contenido** de esta carpeta (index.html, las carpetas
   fotos/, gifs/, netlify/, y los archivos netlify.toml, package.json).
   - ✅ Asegúrate de subir también la carpeta `netlify/functions/crear-pago.js`
5. Abajo, clic en **"Commit changes"**.

---

## PASO 3 — Conectar Netlify a GitHub

1. Entra a **https://app.netlify.com** con tu cuenta (ovogelp@gmail.com).
2. Como ya tienes el proyecto "agroarauco", tienes 2 caminos:

   **Camino A (recomendado, mantiene tu dominio):**
   - Entra a tu proyecto **agroarauco** → **Site configuration** → **Build & deploy**
     → **Continuous deployment** → **Link repository**.
   - Elige GitHub, autoriza, y selecciona `agroarauco-web`.
   - En "Publish directory" deja un punto: `.`
   - Clic en **Deploy**.

   **Camino B (sitio nuevo):**
   - "Add new site" → "Import an existing project" → GitHub → `agroarauco-web`.
   - Luego mueves el dominio agroarauco.cl a este sitio nuevo.

3. Netlify detectará automáticamente el `netlify.toml` y la carpeta de funciones.

---

## PASO 4 — Pegar tu Access Token en Netlify (¡el paso clave!)

1. En tu proyecto de Netlify → **Site configuration** → **Environment variables**.
2. Clic en **"Add a variable"** → **"Add a single variable"**.
3. Completa:
   - **Key:**  `MP_ACCESS_TOKEN`
   - **Value:** (pega aquí tu Access Token que copiaste en el Paso 1)
   - Scopes: deja "All scopes".
4. **Save**.
5. Vuelve a **Deploys** → **Trigger deploy** → **Deploy site** (para que tome la variable).

> ✅ Así el token vive solo en el servidor de Netlify. Nunca aparece en el código
> que ven los clientes. Esto es exactamente como debe ser por seguridad.

---

## PASO 5 — Probar el pago

1. Abre https://agroarauco.cl
2. En la tarjeta de Pellets:
   - Elige una cantidad (ej: 3 sacos)
   - Elige una región (ej: Biobío)
   - Verás el total calculado automáticamente (producto + despacho)
3. Clic en **"Pagar con Mercado Pago"**.
4. Debería abrirse el checkout de Mercado Pago con el monto exacto.

### Para probar SIN dinero real (modo sandbox):
- En el Paso 4, usa el **Access Token de PRUEBA** en vez del de producción.
- Mercado Pago te da **tarjetas de prueba** en su panel de desarrollador
  (números falsos que simulan pagos aprobados/rechazados).
- Cuando confirmes que todo anda, reemplaza por el token de producción.

---

## 💰 Precios configurados actualmente

- **Saco 15 kg:** $5.250
- **Despacho por región:**

| Región         | Despacho |
|----------------|----------|
| Metropolitana  | $11.000  |
| O'Higgins      | $10.500  |
| Maule          | $10.000  |
| Ñuble          | $9.000   |
| Biobío         | $5.000   |
| La Araucanía   | $9.000   |
| Los Ríos       | $9.500   |
| Los Lagos      | $10.000  |
| Aysén          | $10.500  |
| Magallanes     | $11.000  |

> Norte del país (Arica a Valparaíso): no configurado — el cliente coordina por WhatsApp.

### Para cambiar precios más adelante:
Debes editarlos en **DOS lugares** (deben coincidir siempre):
1. `index.html` → busca `const PRECIO_SACO = 5250` y la lista de regiones (`data-costo`).
2. `netlify/functions/crear-pago.js` → busca `const PRECIO_SACO` y el objeto `DESPACHO`.

El precio se recalcula en el servidor (la función) por seguridad, para que nadie
pueda manipular el monto desde el navegador.

---

## ❓ Si algo falla

- **El botón dice "Falta configurar MP_ACCESS_TOKEN"** → revisa el Paso 4 y vuelve a desplegar.
- **El botón no hace nada** → abre la consola del navegador (F12) y revisa errores.
- **Quieres volver al método anterior (ZIP)** → puedes seguir usando el botón de
  WhatsApp "Reservar / consultar", que funciona sin nada de esto.

Cualquier duda, escríbeme y lo revisamos juntos. 🌲
