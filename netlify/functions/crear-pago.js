// ============================================================================
//  AGRO ARAUCO — Función de pago Mercado Pago (Checkout Pro dinámico)
// ----------------------------------------------------------------------------
//  Recibe cantidad de sacos, región y comuna desde la página, recalcula el
//  total (producto + despacho) del lado del servidor por seguridad, y crea
//  una "preferencia de pago" en Mercado Pago. Devuelve el link de checkout.
//
//  El Access Token se lee desde la variable de entorno MP_ACCESS_TOKEN
//  configurada en Netlify (Site settings → Environment variables).
// ============================================================================

const PRECIO_SACO = 5250;

const DESPACHO = {
  "Metropolitana": 11000,
  "O'Higgins": 10500,
  "Maule": 10000,
  "Ñuble": 9000,
  "Biobío": 5000,
  "La Araucanía": 9000,
  "Los Ríos": 9500,
  "Los Lagos": 10000,
  "Aysén": 10500,
  "Magallanes": 11000
};

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Método no permitido" }) };
  }

  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    return { statusCode: 500, body: JSON.stringify({ error: "Falta configurar MP_ACCESS_TOKEN en Netlify." }) };
  }

  let datos;
  try {
    datos = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Datos inválidos" }) };
  }

  const cantidad = parseInt(datos.cantidad, 10);
  if (!cantidad || cantidad < 1 || cantidad > 500) {
    return { statusCode: 400, body: JSON.stringify({ error: "Cantidad inválida (debe ser entre 1 y 500 sacos)." }) };
  }

  const region = String(datos.region || "");
  if (!(region in DESPACHO)) {
    return { statusCode: 400, body: JSON.stringify({ error: "Región no disponible para despacho." }) };
  }
  const costoEnvio = DESPACHO[region];

  // Comuna: informativa, no afecta el precio. Se valida que venga informada.
  const comuna = String(datos.comuna || "").trim();
  if (!comuna) {
    return { statusCode: 400, body: JSON.stringify({ error: "Falta indicar la comuna de destino." }) };
  }

  const origin = event.headers.origin || "https://agroarauco.cl";

  const preferencia = {
    items: [
      {
        title: `Pellets de madera 15 kg (${cantidad} ${cantidad === 1 ? "saco" : "sacos"})`,
        quantity: cantidad,
        unit_price: PRECIO_SACO,
        currency_id: "CLP"
      },
      {
        title: `Despacho a ${comuna}, ${region}`,
        quantity: 1,
        unit_price: costoEnvio,
        currency_id: "CLP"
      }
    ],
    back_urls: {
      success: `${origin}/?pago=exitoso`,
      failure: `${origin}/?pago=fallido`,
      pending: `${origin}/?pago=pendiente`
    },
    auto_return: "approved",
    statement_descriptor: "AGRO ARAUCO",
    metadata: {
      region: region,
      comuna: comuna,
      cantidad_sacos: cantidad
    }
  };

  try {
    const respuesta = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(preferencia)
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      return { statusCode: 502, body: JSON.stringify({ error: "Error al crear el pago", detalle: resultado }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        init_point: resultado.init_point,
        total: cantidad * PRECIO_SACO + costoEnvio
      })
    };
  } catch (err) {
    return { statusCode: 502, body: JSON.stringify({ error: "No se pudo conectar con Mercado Pago." }) };
  }
};
