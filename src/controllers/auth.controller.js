const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { buscarPorCorreo, crearUsuario } = require("../repositories/usuarios.repository");

async function registrar(req, res) {
  try {
    const { nombre, correo, password } = req.body;
    if (!nombre || !correo || !password) {
      return res.status(400).json({ mensaje: "Faltan campos obligatorios" });
    }
    const existente = await buscarPorCorreo(correo);
    if (existente) {
      return res.status(409).json({ mensaje: "Ese correo ya está registrado" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const usuario = await crearUsuario({ nombre, correo, passwordHash });
    return res.status(201).json({ mensaje: "Usuario creado", usuario });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error del servidor" });
  }
}

async function login(req, res) {
  try {
    const { correo, password } = req.body;
    const usuario = await buscarPorCorreo(correo);
    if (!usuario) {
      return res.status(401).json({ mensaje: "Credenciales inválidas" });
    }
    const passwordValida = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValida) {
      return res.status(401).json({ mensaje: "Credenciales inválidas" });
    }
    const token = jwt.sign(
      { id: usuario.id, correo: usuario.correo },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );
    return res.json({
      mensaje: "Login exitoso",
      token,
      usuario: { id: usuario.id, nombre: usuario.nombre, correo: usuario.correo },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error del servidor" });
  }
}

module.exports = { registrar, login };