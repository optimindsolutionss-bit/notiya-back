const negociosRepo = require("../repositories/negocios.repository");
const clientesRepo = require("../repositories/clientes.repository");
const mensajesRepo = require("../repositories/mensajes.repository");
const enviosRepo = require("../repositories/enviosWhatsapp.repository");
const whatsappService = require("./whatsapp.service");

function dentroDeHorarioSilencio(negocio) {
  if (!negocio.hora_silencio_inicio || !negocio.hora_silencio_fin) return false;
  const ahora = new Date();
  const horaActual = `${String(ahora.getHours()).padStart(2, "0")}:${String(ahora.getMinutes()).padStart(2, "0")}:00`;
  const inicio = negocio.hora_silencio_inicio;
  const fin = negocio.hora_silencio_fin;
  if (inicio <= fin) {
    return horaActual >= inicio && horaActual <= fin;
  }
  return horaActual >= inicio || horaActual <= fin;
}

function construirContenido({ accionDetectada, producto, horaDetectada, esManana }) {
  const cuando = esManana ? "mañana" : "hoy";
  const horaTexto = horaDetectada ? ` a las ${horaDetectada.slice(0, 5)}` : "";
  const nombreProducto = producto ? producto.nombre : "una novedad";
  switch (accionDetectada) {
    case "agotado":
      return `Se agotó ${nombreProducto} por hoy.`;
    case "promocion":
      return `Promoción especial en ${nombreProducto}${horaTexto}.`;
    case "disponible":
      return `${cuando === "mañana" ? "Mañana" : "Hoy"} sale ${nombreProducto}${horaTexto}.`;
    default:
      return `Aviso: ${nombreProducto}${horaTexto}.`;
  }
}

async function generarEnviosParaMensaje(mensajeId, negocioId) {
  const negocio = await negociosRepo.buscarPorId(negocioId);
  const mensaje = await mensajesRepo.buscarPorId(negocioId, mensajeId);
  if (!mensaje || mensaje.canal === "pantalla") {
    if (mensaje) await mensajesRepo.actualizarEstado(mensajeId, "enviado");
    return { enviados: 0, pendientesPorSilencio: false };
  }

  if (dentroDeHorarioSilencio(negocio)) {
    return { enviados: 0, pendientesPorSilencio: true };
  }

  const suscritos = await clientesRepo.listarSuscritos(negocioId);
  const envios = await enviosRepo.crearParaClientes(mensajeId, suscritos.map((c) => c.id));

  const enviadosHoy = await mensajesRepo.contarEnviadosHoy(negocioId);
  const limite = negocio.limite_envios_dia;
  let disponiblesHoy = limite ? Math.max(limite - enviadosHoy, 0) : Infinity;

  let enviados = 0;
  for (const envio of envios) {
    const suscrito = suscritos.find((c) => c.id === envio.cliente_id);
    if (disponiblesHoy <= 0) break;
    const resultado = await whatsappService.enviarWhatsapp(suscrito.whatsapp_numero, mensaje.contenido);
    if (resultado.exito) {
      await enviosRepo.actualizarEstado(envio.id, {
        estado: "enviado",
        proveedorMensajeId: resultado.proveedorMensajeId,
        fechaEnvio: new Date(),
      });
      enviados += 1;
      disponiblesHoy -= 1;
    } else {
      await enviosRepo.actualizarEstado(envio.id, {
        estado: resultado.motivo === "PROVEEDOR_NO_CONFIGURADO" ? "pendiente" : "fallido",
        errorDetalle: resultado.motivo,
      });
    }
  }

  await mensajesRepo.actualizarEstado(mensajeId, "enviado");
  return { enviados, pendientesPorSilencio: false };
}

async function alertaAgotado({ negocioId, producto, usuarioId }) {
  const mensaje = await mensajesRepo.crear(negocioId, {
    usuarioId,
    productoId: producto.id,
    tipo: "aviso",
    contenido: construirContenido({ accionDetectada: "agotado", producto }),
    canal: "ambos",
    origen: "manual",
    fechaHoraEnvio: new Date(),
  });
  await generarEnviosParaMensaje(mensaje.id, negocioId);
  return mensaje;
}

module.exports = { construirContenido, generarEnviosParaMensaje, alertaAgotado, dentroDeHorarioSilencio };
