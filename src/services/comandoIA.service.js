const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const ACCIONES_DESTRUCTIVAS = ["eliminar_producto", "deshabilitar_producto", "cambiar_precio"];

const HERRAMIENTAS = [
  {
    type: "function",
    function: {
      name: "crear_aviso",
      description:
        "Publica un aviso informativo sobre un producto: que salió, que está disponible, un recordatorio, etc. No es destructivo.",
      parameters: {
        type: "object",
        properties: {
          nombreProducto: { type: "string", description: "Nombre del producto mencionado, tal como lo dijo el dueño" },
          contenido: { type: "string", description: "Texto del aviso, redactado de forma clara y amigable para el cliente" },
          horaEnvio: { type: "string", description: "Hora en formato HH:MM (24h) si se menciona, si no, vacío" },
          esManana: { type: "boolean", description: "true si se refiere a mañana, false si es hoy/ahora" },
        },
        required: ["contenido"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "crear_promocion",
      description: "Crea una promoción u oferta sobre un producto con un precio especial. Solo úsala si el dueño mencionó un precio explícito para la promo.",
      parameters: {
        type: "object",
        properties: {
          nombreProducto: { type: "string" },
          titulo: { type: "string", description: "Título corto de la promoción" },
          precioPromocional: { type: "number" },
          horaEnvio: { type: "string" },
          esManana: { type: "boolean" },
        },
        required: ["titulo"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "deshabilitar_producto",
      description: "Marca un producto como no disponible porque se agotó o no hay más existencias.",
      parameters: {
        type: "object",
        properties: { nombreProducto: { type: "string" } },
        required: ["nombreProducto"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "habilitar_producto",
      description: "Marca un producto como disponible de nuevo. No es destructivo.",
      parameters: {
        type: "object",
        properties: { nombreProducto: { type: "string" } },
        required: ["nombreProducto"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "eliminar_producto",
      description:
        "Elimina un producto por completo del catálogo cuando el dueño lo pide explícitamente (ej: 'quita X', 'borra X', 'elimina X del catálogo').",
      parameters: {
        type: "object",
        properties: { nombreProducto: { type: "string" } },
        required: ["nombreProducto"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "cambiar_precio",
      description:
        "Cambia el precio normal de un producto que ya existe en el catálogo. Úsala siempre que el dueño declare un nuevo precio, por ejemplo 'el café ahora vale 6000', 'sube el pan a 4000', 'el X cuesta Y ahora'.",
      parameters: {
        type: "object",
        properties: {
          nombreProducto: { type: "string" },
          precioNuevo: { type: "number" },
        },
        required: ["nombreProducto", "precioNuevo"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "cambiar_imagen",
      description: "Cambia la imagen de un producto a partir de una URL que el dueño proporciona.",
      parameters: {
        type: "object",
        properties: {
          nombreProducto: { type: "string" },
          urlImagen: { type: "string" },
        },
        required: ["nombreProducto", "urlImagen"],
      },
    },
  },
];

function construirPrompt(productos) {
  const listaProductos = productos.length
    ? productos.map((p) => `- ${p.nombre} (precio actual: ${p.precio}, disponible: ${p.disponible})`).join("\n")
    : "(el negocio todavía no tiene productos registrados)";

  return `Eres el asistente de un dueño de negocio pequeño en Colombia (panadería, restaurante, tienda, etc.).
Te habla en lenguaje natural, informal, a veces con errores o de forma muy directa/coloquial ("cavernícola").
Tu trabajo es entender qué quiere hacer y llamar a la función correcta con los datos correctos.

Productos actuales del negocio:
${listaProductos}

MUY IMPORTANTE: distingue bien entre DESHABILITAR (temporal, se puede reactivar) y ELIMINAR (permanente, no se puede deshacer). Son acciones muy diferentes:

DESHABILITAR_PRODUCTO — usar cuando el dueño dice cosas como:
  "desactiva X", "inhabilita X", "quita X del menú por ahora", "pausa X",
  "no tengo más X hoy", "se acabó X", "X está agotado", "oculta X"
  → Esto NO borra el producto, solo lo esconde temporalmente. Es la opción más común y la más segura cuando hay duda.

ELIMINAR_PRODUCTO — usar SOLO cuando el dueño es explícito sobre que es permanente/definitivo, con frases como:
  "elimina X del catálogo", "borra X para siempre", "ya no voy a vender X nunca más",
  "saca X definitivamente", "quita X del catálogo" (esta frase específica, con "del catálogo", sí cuenta como eliminar)
  → Esto borra el producto por completo, sin poder recuperarlo.

Si el dueño solo dice "quita X" o "saca X" SIN aclarar si es temporal o permanente, y sin decir "del catálogo" o "para siempre" o similar, usa DESHABILITAR_PRODUCTO por defecto (es la opción reversible, más segura).

Otras reglas:
- Si el dueño menciona un NUEVO PRECIO para un producto que ya existe (ej. "el café ahora vale 6000"), SIEMPRE usa cambiar_precio.
- Si pide una promoción SIN precio, usa crear_aviso explicando que falta el precio. Si SÍ da el precio, usa crear_promocion.
- Usa el nombre EXACTO del producto tal como aparece en la lista de arriba (con tildes), aunque el dueño lo escriba distinto.
- Si falta información clave para cualquier acción, usa crear_aviso explicando qué falta.
- Sé breve y natural en el "contenido" del aviso, como un mensaje de WhatsApp.
- SIEMPRE debes llamar a una de las funciones disponibles.`;
}

const ALIAS_ACCION = {
  precio_nuevo: "cambiar_precio",
  actualizar_precio: "cambiar_precio",
  nuevo_precio: "cambiar_precio",
};

const NOMBRES_VALIDOS = [
  "crear_aviso",
  "crear_promocion",
  "deshabilitar_producto",
  "habilitar_producto",
  "eliminar_producto",
  "cambiar_precio",
  "cambiar_imagen",
];

function distanciaEdicion(a, b) {
  const filas = a.length + 1;
  const columnas = b.length + 1;
  const matriz = Array.from({ length: filas }, (_, i) => [i, ...Array(columnas - 1).fill(0)]);
  for (let j = 0; j < columnas; j++) matriz[0][j] = j;
  for (let i = 1; i < filas; i++) {
    for (let j = 1; j < columnas; j++) {
      const costo = a[i - 1] === b[j - 1] ? 0 : 1;
      matriz[i][j] = Math.min(matriz[i - 1][j] + 1, matriz[i][j - 1] + 1, matriz[i - 1][j - 1] + costo);
    }
  }
  return matriz[filas - 1][columnas - 1];
}

// Corrige errores de tipeo del modelo (ej "camibar_precio" -> "cambiar_precio")
// comparando contra la lista de nombres de acción reales conocidos.
function corregirNombreAccion(nombre) {
  if (NOMBRES_VALIDOS.includes(nombre)) return nombre;
  if (ALIAS_ACCION[nombre]) return ALIAS_ACCION[nombre];
  let mejor = nombre;
  let mejorDistancia = 3; // tolera hasta 2 caracteres de diferencia
  for (const valido of NOMBRES_VALIDOS) {
    const distancia = distanciaEdicion(nombre, valido);
    if (distancia < mejorDistancia) {
      mejor = valido;
      mejorDistancia = distancia;
    }
  }
  return mejor;
}

function normalizar(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function construirResultado(nombreAccion, args, productos) {
  const productoMencionado = args.nombreProducto
    ? productos.find((p) => normalizar(p.nombre) === normalizar(args.nombreProducto))
    : null;

  return {
    accionTipo: nombreAccion,
    payload: { ...args, productoId: productoMencionado ? productoMencionado.id : null },
    confianza: 0.85,
    requiereConfirmacion: ACCIONES_DESTRUCTIVAS.includes(nombreAccion),
    respuestaIA: null,
  };
}

// A veces Groq/Llama arma mal el formato de la llamada a función y responde
// con un error 400 en vez de un tool_call normal. En ese caso, el texto que
// intentó generar viene en error.error.failed_generation con un formato tipo
// <function="nombre">{...json...}</function>. Lo rescatamos en vez de fallar.
function intentarRescatarLlamadaFallida(err) {
  const failedGeneration = err?.error?.error?.failed_generation || err?.error?.failed_generation;
  if (!failedGeneration) return null;

  const coincidencia = failedGeneration.match(/<function="?([a-zA-Z_]+)"?>([\s\S]*?)<\/function>/);
  if (!coincidencia) return null;

  try {
    const nombreAccion = corregirNombreAccion(coincidencia[1]);
    const args = JSON.parse(coincidencia[2]);
    return { nombreAccion, args };
  } catch {
    return null;
  }
}

async function interpretarComando(texto, productos) {
  let respuesta;
  try {
    respuesta = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      messages: [
        { role: "system", content: construirPrompt(productos) },
        { role: "user", content: "el pan ahora vale 4500" },
        {
          role: "assistant",
          content: null,
          tool_calls: [
            {
              id: "ejemplo_1",
              type: "function",
              function: {
                name: "cambiar_precio",
                arguments: JSON.stringify({ nombreProducto: "Pan integral", precioNuevo: 4500 }),
              },
            },
          ],
        },
        {
          role: "tool",
          tool_call_id: "ejemplo_1",
          content: "ok",
        },
        { role: "user", content: texto },
      ],
      tools: HERRAMIENTAS,
      tool_choice: "auto",
    });
  } catch (err) {
    const rescatado = intentarRescatarLlamadaFallida(err);
    if (rescatado) {
      return construirResultado(rescatado.nombreAccion, rescatado.args, productos);
    }
    throw err;
  }

  const llamada = respuesta.choices[0]?.message?.tool_calls?.[0];

  if (!llamada) {
    return {
      accionTipo: "sin_accion",
      payload: {},
      confianza: 0.1,
      requiereConfirmacion: false,
      respuestaIA: respuesta.choices[0]?.message?.content || "No entendí bien el comando, intenta ser más específico.",
    };
  }

  const args = JSON.parse(llamada.function.arguments);
  const nombreCorregido = corregirNombreAccion(llamada.function.name);
  return construirResultado(nombreCorregido, args, productos);
}

module.exports = { interpretarComando, ACCIONES_DESTRUCTIVAS };