// ════════════════════════════════════════════════════════════════════
//  AGRO ARAUCO — Función de pago Mercado Pago (Checkout Pro dinámico)
// ────────────────────────────────────────────────────────────────────
//  Esta función corre en el servidor de Netlify, NO en el navegador.
//  El Access Token se lee desde una variable de entorno segura
//  (MP_ACCESS_TOKEN), configurada en el panel de Netlify.
//  NUNCA escribas el token aquí dentro.
// ════════════════════════════════════════════════════════════════════

// --- PRECIOS OFICIALES (fuente de verdad, lado servidor) ---
// Se recalcula aquí para que nadie pueda manipular el monto desde el navegador.
const PRECIO_SACO = 5250; // CLP por saco de 15 kg

const DESPACHO = {
  "Metropolitana": 11000,
  "O'Higgins":     10500,
  "Maule":         10000,
  "Ñuble":          9000,
  "Biobío":         5000,
  "La Araucanía":   9000,
  "Los Ríos":       9500,
  "Los Lagos":     10000,
  "Aysén":         10500,
  "Magallanes":    11000
};

exports.handler = async (event) => {
  // Solo aceptar POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Método no permitido" }) };
  }

  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) {
    return { statusCode: 500, body: JSON.stringify({ error: "Falta configurar MP_ACCESS_TOKEN en Netlify" }) };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const cantidad = parseInt(body.cantidad, 10);
    const region = (body.region || "").trim();

    // --- Validaciones ---
    if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 500) {
      return { statusCode: 400, body: JSON.stringify({ error: "Cantidad inválida (1 a 500 sacos)" }) };
    }
    if (!(region in DESPACHO)) {
      return { statusCode: 400, body: JSON.stringify({ error: "Región no disponible para despacho" }) };
    }

    // --- Cálculo de montos (lado servidor) ---
    const costoProductos = PRECIO_SACO * cantidad;
    const costoDespacho = DESPACHO[region];

    // --- URL base del sitio (para redirecciones de retorno) ---
    const origin = event.headers.origin || "https://agroarauco.cl";

    // --- Crear la preferencia en Mercado Pago ---
    const preferencia = {
      items: [
        {
          title: `Pellets de madera 15 kg — ${cantidad} saco(s)`,
          description: "Combustible ecológico de biomasa forestal · Agro Arauco SPA",
          quantity: 1,
          currency_id: "CLP",
          unit_price: costoProductos
        },
        {
          title: `Despacho a ${region}`,
          quantity: 1,
          currency_id: "CLP",
          unit_price: costoDespacho
        }
      ],
      back_urls: {
        success: `${origin}/?pago=exito`,
        failure: `${origin}/?pago=error`,
        pending: `${origin}/?pago=pendiente`
      },
      auto_return: "approved",
      statement_descriptor: "AGRO ARAUCO",
      external_reference: `pellets-${cantidad}-${region}-${Date.now()}`
    };

    const resp = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(preferencia)
    });

    const data = await resp.json();

    if (!resp.ok) {
      return { statusCode: 502, body: JSON.stringify({ error: "Mercado Pago rechazó la solicitud", detalle: data }) };
    }

    // init_point = URL del checkout donde paga el cliente
    return {
      statusCode: 200,
      body: JSON.stringify({
        init_point: data.init_point,
        resumen: {
          cantidad,
          region,
          costoProductos,
          costoDespacho,
          total: costoProductos + costoDespacho
        }
      })
    };

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: "Error interno", detalle: String(err) }) };
  }
};
