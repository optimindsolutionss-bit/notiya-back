const comandosRepo = require("../repositories/comandosIa.repository");
const productosRepo = require("../repositories/productos.repository");
const mensajesRepo = require("../repositories/mensajes.repository");
const mensajesService = require("../services/mensajes.service");
const { interpretarComando } = require("../services/comandoParser.service");

const UMBRAL_BORRADOR = 0.45;

function calcularFechaEnvio(horaDetectada, esManana) {
  const fecha = new Date();
  if (esManana) fecha.setDate(fecha.getDate() + 1);
  if (horaDetectada) {
    const [horas, minutos] = horaDetectada.split(":").map(Number);
    fecha.setHours(horas, minutos, 0, 0);
  }
  return fecha;
}

function tipoSegunAccion(accionDetectada) {
  if (accionDetectada === "promocion") return "promocion";
  return "aviso";
}

async function crear(req, res) {
  try {
    const { textoOriginal, audioUrl } = req.body;
    if (!textoOriginal) {
      return res.status(400).json({ mensaje: "textoOriginal es obligatorio" });
    }
    const productos = await productosRepo.listarPorNegocio(req.negocioId);
    const interpretacion = interpretarComando(textoOriginal, productos);

    const comando = await comandosRepo.crear(req.negocioId, {
      usuarioId: req.usuario.id,
      textoOriginal,
      audioUrl,
      productoDetectadoId: interpretacion.productoDetectado ? interpretacion.productoDetectado.id : null,
      horaDetectada: interpretacion.horaDetectada,
      accionDetectada: interpretacion.accionDetectada,
      confianza: interpretacion.confianza,
    });

    let mensajeBorrador = null;
    if (interpretacion.confianza >= UMBRAL_BORRADOR) {
      mensajeBorrador = await mensajesRepo.crear(req.negocioId, {
        usuarioId: req.usuario.id,
        productoId: interpretacion.productoDetectado ? interpretacion.productoDetectado.id : null,
        tipo: tipoSegunAccion(interpretacion.accionDetectada),
        contenido: mensajesService.construirContenido({
          accionDetectada: interpretacion.accionDetectada,
          producto: interpretacion.productoDetectado,
          horaDetectada: interpretacion.horaDetectada,
          esManana: interpretacion.esManana,
        }),
        canal: "ambos",
        origen: audioUrl ? "voz" : "texto",
        fechaHoraEnvio: calcularFechaEnvio(interpretacion.horaDetectada, interpretacion.esManana),
      });
      await comandosRepo.vincularMensaje(comando.id, mensajeBorrador.id);
    }

    return res.status(201).json({
      mensaje: mensajeBorrador
        ? "Comando interpretado, revisa el borrador antes de confirmar"
        : "Comando interpretado sin suficiente confianza para generar un aviso automático",
      comando: { ...comando, mensaje_id: mensajeBorrador ? mensajeBorrador.id : null },
      borrador: mensajeBorrador,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error del servidor" });
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
    if (!comando.mensaje_id) {
      return res.status(409).json({ mensaje: "Este comando no generó un borrador de mensaje" });
    }
    await comandosRepo.actualizarEstado(comando.id, "confirmado");
    const resultado = await mensajesService.generarEnviosParaMensaje(comando.mensaje_id, req.negocioId);
    return res.json({ mensaje: "Comando confirmado y publicado", resultado });
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
