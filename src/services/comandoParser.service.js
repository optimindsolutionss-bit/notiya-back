const PALABRAS_AGOTADO = ["agot", "no hay", "se acab", "sin stock"];
const PALABRAS_PROMOCION = ["promo", "oferta", "descuento", "rebaja"];
const PALABRAS_DISPONIBLE = ["sale", "listo", "disponible", "nuevo", "ya está", "llegó"];

function extraerHora(texto) {
  const coincidencia = texto.match(/(?:a las|alas)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm|de la mañana|de la tarde|de la noche)?/i);
  if (!coincidencia) return null;
  let hora = parseInt(coincidencia[1], 10);
  const minutos = coincidencia[2] ? parseInt(coincidencia[2], 10) : 0;
  const sufijo = (coincidencia[3] || "").toLowerCase();
  if ((sufijo.includes("pm") || sufijo.includes("tarde") || sufijo.includes("noche")) && hora < 12) {
    hora += 12;
  }
  if (hora > 23 || minutos > 59) return null;
  return `${String(hora).padStart(2, "0")}:${String(minutos).padStart(2, "0")}:00`;
}

function detectarEsManana(texto) {
  return /\bmañana\b/i.test(texto);
}

function detectarProducto(texto, productos) {
  const textoNormalizado = texto.toLowerCase();
  let mejor = null;
  for (const producto of productos) {
    const nombre = producto.nombre.toLowerCase();
    if (textoNormalizado.includes(nombre)) {
      if (!mejor || nombre.length > mejor.nombre.length) {
        mejor = producto;
      }
    }
  }
  return mejor;
}

function detectarAccion(texto) {
  const textoNormalizado = texto.toLowerCase();
  if (PALABRAS_AGOTADO.some((p) => textoNormalizado.includes(p))) return "agotado";
  if (PALABRAS_PROMOCION.some((p) => textoNormalizado.includes(p))) return "promocion";
  if (PALABRAS_DISPONIBLE.some((p) => textoNormalizado.includes(p))) return "disponible";
  return "aviso";
}

function interpretarComando(texto, productosNegocio) {
  const producto = detectarProducto(texto, productosNegocio);
  const horaDetectada = extraerHora(texto);
  const esManana = detectarEsManana(texto);
  const accionDetectada = detectarAccion(texto);

  let confianza = 0.15;
  if (producto) confianza += 0.4;
  if (horaDetectada) confianza += 0.3;
  if (accionDetectada !== "aviso") confianza += 0.15;
  confianza = Math.min(confianza, 0.95);

  return {
    productoDetectado: producto || null,
    horaDetectada,
    esManana,
    accionDetectada,
    confianza: Number(confianza.toFixed(2)),
  };
}

module.exports = { interpretarComando };
