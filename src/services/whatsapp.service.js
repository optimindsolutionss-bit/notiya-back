async function enviarWhatsapp(numeroDestino, contenido) {
  if (!process.env.WHATSAPP_API_TOKEN || !process.env.WHATSAPP_API_URL) {
    return { exito: false, motivo: "PROVEEDOR_NO_CONFIGURADO" };
  }
  const respuesta = await fetch(process.env.WHATSAPP_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
    },
    body: JSON.stringify({ to: numeroDestino, text: contenido }),
  });
  if (!respuesta.ok) {
    const textoError = await respuesta.text();
    return { exito: false, motivo: textoError };
  }
  const datos = await respuesta.json();
  return { exito: true, proveedorMensajeId: datos.id || null };
}

module.exports = { enviarWhatsapp };
