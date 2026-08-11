require("dotenv").config();
const { interpretarComando } = require("./src/services/comandoIA.service");

const productosDePrueba = [
  { id: 1, nombre: "Pan integral", precio: 3500, disponible: true },
  { id: 2, nombre: "Café americano", precio: 5000, disponible: true },
  { id: 3, nombre: "Alitas BBQ", precio: 18000, disponible: true },
];

async function main() {
  const casos = [
    "avisa que se acabó el pan integral",
    "promo de alitas mañana a las 5pm",
    "el cafe ahora vale 6000",
    "quita el pan integral del catalogo",
  ];

  for (const texto of casos) {
    console.log("\n--- Comando:", texto);
    const resultado = await interpretarComando(texto, productosDePrueba);
    console.log(JSON.stringify(resultado, null, 2));
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});