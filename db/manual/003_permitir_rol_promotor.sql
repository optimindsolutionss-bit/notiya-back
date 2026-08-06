-- Backend/db/manual/003_permitir_rol_promotor.sql
-- Agrega 'promotor' a los roles permitidos en negocio_usuarios.rol
--
-- El CHECK constraint existente limita rol a ('dueño', 'editor'),
-- pero el sistema necesita soportar 'promotor' como nuevo rol.
-- Esta migración extiende la lista de valores permitidos.

ALTER TABLE negocio_usuarios
  DROP CONSTRAINT negocio_usuarios_rol_check;

ALTER TABLE negocio_usuarios
  ADD CONSTRAINT negocio_usuarios_rol_check CHECK (rol IN ('dueño', 'editor', 'promotor'));
