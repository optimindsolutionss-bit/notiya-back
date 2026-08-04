-- Aplicar manualmente contra la base Neon (no hay sistema de migraciones en este proyecto).

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS es_superadmin BOOLEAN NOT NULL DEFAULT false;

-- Marcar un usuario existente como super admin (ajustar el correo):
-- UPDATE usuarios SET es_superadmin = true WHERE correo = 'correo@ejemplo.com';
