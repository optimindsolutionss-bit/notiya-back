-- Backend/db/manual/002_roles_y_permisos.sql
-- Aplicar manualmente contra la base Neon (no hay sistema de migraciones en este proyecto).

-- negocio_usuarios.rol ya es una columna de texto libre sin CHECK/ENUM que
-- enumere los valores permitidos (confirmado leyendo negocioUsuarios.repository.js
-- y negocios.controller.js: el único lugar donde se valida el rol es en
-- código de aplicación, con arrays literales ["dueño", "editor"]). El nuevo
-- valor "promotor" no requiere ALTER TABLE.
--
-- Si al aplicar esto en Neon el ALTER de abajo falla por un CHECK/ENUM que
-- no está reflejado en el código del repo, revisar el esquema real con
-- \d negocio_usuarios y agregar aquí el ALTER TYPE / DROP+ADD CONSTRAINT
-- necesario para permitir 'promotor' antes de seguir.

ALTER TABLE promociones
  ADD COLUMN IF NOT EXISTS creado_por INTEGER REFERENCES usuarios(id);
