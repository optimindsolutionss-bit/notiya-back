const comandosRepo = require("../repositories/comandosIa.repository");
const productosRepo = require("../repositories/productos.repository");
const promocionesRepo = require("../repositories/promociones.repository");
const mensajesRepo = require("../repositories/mensajes.repository");
const mensajesService = require("../services/mensajes.service");
const { interpretarComando } = require("../services/comandoIA.service");

const ACCIONES_INFORMATIVAS = ["crear_aviso", "crear_promocion", "habilitar_producto"];

function calcularFecha(horaEnvio, esManana) {
  const fecha = new Date();
  if (esManana) fecha.setDate(fecha.getDate() + 1);
  if (horaEnvio) {
    const [horas, minutos] = horaEnvio.split(":").map(Number);
    if (!Number.isNaN(horas)) fecha.setHours(horas, minutos || 0, 0, 0);
  }
  return fecha;
}

// Ejecuta las acciones que NO requieren confirmación (informativas).
// Devuelve un objeto { mensajeResultado, mensajeVinculado } para armar la respuesta.
async function ejecutarAccionInformativa(negocioId, usuarioId, interpretacion) {
  const { accionTipo, payload } = interpretacion;

  if (accionTipo === "crear_aviso") {
    const mensaje = await mensajesRepo.crear(negocioId, {
      usuarioId,
      productoId: payload.productoId || null,
      tipo: "aviso",
      contenido: payload.contenido,
      canal: "ambos",
      origen: "manual",
      fechaHoraEnvio: calcularFecha(payload.horaEnvio, payload.esManana),
    });
    await mensajesService.generarEnviosParaMensaje(mensaje.id, negocioId);
    return { mensajeResultado: "Aviso publicado", mensajeVinculado: mensaje };
  }

  if (accionTipo === "crear_promocion") {
    const fechaInicio = calcularFecha(payload.horaEnvio, payload.esManana);
    const fechaFin = new Date(fechaInicio);
    fechaFin.setDate(fechaFin.getDate() + 7);

    const promocion = await promocionesRepo.crear(negocioId, {
      productoId: payload.productoId || null,
      titulo: payload.titulo,
      descripcion: null,
      precioPromocional: payload.precioPromocional || null,
      fechaInicio,
      fechaFin,
      creadoPor: usuarioId,
    });
    return { mensajeResultado: "Promoción creada (activa por 7 días, puedes ajustar la fecha en Promociones)", promocionVinculada: promocion };
  }

  if (accionTipo === "habilitar_producto") {
    if (!payload.productoId) {
      return { mensajeResultado: "No encontré ese producto en tu catálogo para habilitarlo" };
    }
    await productosRepo.actualizar(negocioId, payload.productoId, { disponible: true });
    return { mensajeResultado: "Producto marcado como disponible" };
  }

  return { mensajeResultado: "Acción interpretada, pero no se pudo ejecutar" };
}

// Ejecuta las acciones destructivas, llamado SOLO desde el endpoint de confirmar.
async function ejecutarAccionDestructiva(negocioId, comando) {
  const { accion_tipo: accionTipo, accion_payload: payload } = comando;

  if (accionTipo === "deshabilitar_producto") {
    if (!payload.productoId) throw new Error("Producto no identificado");
    await productosRepo.actualizar(negocioId, payload.productoId, { disponible: false });
    const producto = await productosRepo.buscarPorId(negocioId, payload.productoId);
    await mensajesService.alertaAgotado({ negocioId, producto, usuarioId: comando.usuario_id });
    return { mensaje: "Producto deshabilitado y aviso de agotado publicado" };
  }

  if (accionTipo === "eliminar_producto") {
    if (!payload.productoId) throw new Error("Producto no identificado");
    await productosRepo.eliminar(negocioId, payload.productoId);
    return { mensaje: "Producto eliminado del catálogo" };
  }

  if (accionTipo === "cambiar_precio") {
    if (!payload.productoId) throw new Error("Producto no identificado");
    await productosRepo.actualizar(negocioId, payload.productoId, { precio: payload.precioNuevo });
    return { mensaje: "Precio actualizado" };
  }

  if (accionTipo === "cambiar_imagen") {
    if (!payload.productoId) throw new Error("Producto no identificado");
    await productosRepo.actualizar(negocioId, payload.productoId, { imagen_url: payload.urlImagen });
    return { mensaje: "Imagen actualizada" };
  }

  throw new Error(`Acción destructiva desconocida: ${accionTipo}`);
}

async function crear(req, res) {
  try {
    const { textoOriginal, audioUrl } = req.body;
    if (!textoOriginal) {
      return res.status(400).json({ mensaje: "textoOriginal es obligatorio" });
    }

    const productos = await productosRepo.listarPorNegocio(req.negocioId);
    const interpretacion = await interpretarComando(textoOriginal, productos);

    // Si el modelo no pudo encontrar el producto por nombre exacto, intenta una búsqueda aproximada.
    if (!interpretacion.payload.productoId && interpretacion.payload.nombreProducto) {
      const aproximado = await productosRepo.buscarPorNombreAproximado(
        req.negocioId,
        interpretacion.payload.nombreProducto
      );
      if (aproximado) interpretacion.payload.productoId = aproximado.id;
    }

    const textoConfirmacion = describirResultado(interpretacion);

    const comando = await comandosRepo.crear(req.negocioId, {
      usuarioId: req.usuario.id,
      textoOriginal,
      audioUrl,
      productoDetectadoId: interpretacion.payload.productoId || null,
      horaDetectada: interpretacion.payload.horaEnvio || null,
      accionDetectada: interpretacion.accionTipo,
      confianza: interpretacion.confianza,
      accionTipo: interpretacion.accionTipo,
      accionPayload: interpretacion.payload,
      requiereConfirmacion: interpretacion.requiereConfirmacion,
      respuestaIA: textoConfirmacion,
    });

    // Caso: la IA no entendió nada ejecutable.
    if (interpretacion.accionTipo === "sin_accion") {
      return res.status(201).json({
        mensaje: interpretacion.respuestaIA,
        comando,
        borrador: null,
        requiere_confirmacion: false,
      });
    }

    // Caso: acción destructiva, queda pendiente de confirmar. No se ejecuta nada todavía.
    if (interpretacion.requiereConfirmacion) {
      return res.status(201).json({
        mensaje: "La IA entendió tu comando, pero necesita tu confirmación antes de aplicarlo",
        comando,
        borrador: { contenido: interpretacion.respuestaIA || describirAccionDestructiva(interpretacion) },
        requiere_confirmacion: true,
      });
    }

    // Caso: acción informativa, se ejecuta de una vez.
    const resultado = await ejecutarAccionInformativa(req.negocioId, req.usuario.id, interpretacion);
    if (resultado.mensajeVinculado) {
      await comandosRepo.vincularMensaje(comando.id, resultado.mensajeVinculado.id);
    }
    await comandosRepo.actualizarEstado(comando.id, "confirmado");

    return res.status(201).json({
      mensaje: resultado.mensajeResultado,
      comando,
      borrador: resultado.mensajeVinculado || null,
      requiere_confirmacion: false,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error del servidor" });
  }
}

function describirResultado(interpretacion) {
  const { accionTipo, payload, requiereConfirmacion, respuestaIA } = interpretacion;

  if (accionTipo === "sin_accion") return respuestaIA;
  if (requiereConfirmacion) return respuestaIA || describirAccionDestructiva(interpretacion);

  switch (accionTipo) {
    case "crear_aviso":
      return payload.contenido;
    case "crear_promocion":
      return payload.precioPromocional
        ? `Promoción creada: ${payload.titulo} a ${payload.precioPromocional}`
        : `Falta el precio para crear la promoción "${payload.titulo}", revisa manualmente.`;
    case "habilitar_producto":
      return `"${payload.nombreProducto || "Producto"}" marcado como disponible.`;
    default:
      return respuestaIA || "Comando procesado.";
  }
}

function describirAccionDestructiva(interpretacion) {
  const { accionTipo, payload } = interpretacion;
  const nombre = payload.nombreProducto || "el producto";
  switch (accionTipo) {
    case "deshabilitar_producto":
      return `¿Confirmas marcar "${nombre}" como no disponible?`;
    case "eliminar_producto":
      return `¿Confirmas ELIMINAR "${nombre}" del catálogo? Esta acción no se puede deshacer.`;
    case "cambiar_precio":
      return `¿Confirmas cambiar el precio de "${nombre}" a ${payload.precioNuevo}?`;
    case "cambiar_imagen":
      return `¿Confirmas cambiar la imagen de "${nombre}"?`;
    default:
      return "¿Confirmas esta acción?";
  }
}

async function listar(req, res) {
  try {
    const comandos = await comandosRepo.listarPorNegocio(req.negocioId);
    return res.json({ comandos });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error del servidor" });
  }
}

async function confirmar(req, res) {
  try {
    const comando = await comandosRepo.buscarPorId(req.negocioId, req.params.comandoId);
    if (!comando) {
      return res.status(404).json({ mensaje: "Comando no encontrado" });
    }
    if (comando.estado !== "pendiente") {
      return res.status(409).json({ mensaje: "Este comando ya fue procesado" });
    }

    // Comando con acción destructiva pendiente: ejecútala ahora.
    if (comando.requiere_confirmacion && comando.accion_tipo) {
      const resultado = await ejecutarAccionDestructiva(req.negocioId, comando);
      await comandosRepo.actualizarEstado(comando.id, "confirmado");
      return res.json({ mensaje: resultado.mensaje });
    }

    // Comando viejo (formato anterior), con mensaje_id vinculado directamente.
    if (comando.mensaje_id) {
      await comandosRepo.actualizarEstado(comando.id, "confirmado");
      const resultado = await mensajesService.generarEnviosParaMensaje(comando.mensaje_id, req.negocioId);
      return res.json({ mensaje: "Comando confirmado y publicado", resultado });
    }

    return res.status(409).json({ mensaje: "Este comando no tiene una acción pendiente de confirmar" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error del servidor" });
  }
}

async function descartar(req, res) {
  try {
    const comando = await comandosRepo.buscarPorId(req.negocioId, req.params.comandoId);
    if (!comando) {
      return res.status(404).json({ mensaje: "Comando no encontrado" });
    }
    await comandosRepo.actualizarEstado(comando.id, "descartado");
    if (comando.mensaje_id) {
      const mensajeVinculado = await mensajesRepo.buscarPorId(req.negocioId, comando.mensaje_id);
      if (mensajeVinculado && mensajeVinculado.estado === "pendiente") {
        await mensajesRepo.actualizarEstado(comando.mensaje_id, "cancelado");
      }
    }
    return res.json({ mensaje: "Comando descartado" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error del servidor" });
  }
}

module.exports = { crear, listar, confirmar, descartar };