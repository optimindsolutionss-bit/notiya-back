-- Backend/db/manual/004_paleta_pantalla.sql
-- Aplicar manualmente contra la base Neon (no hay sistema de migraciones en este proyecto).

ALTER TABLE negocios
  ADD COLUMN IF NOT EXISTS paleta_pantalla VARCHAR(20) NOT NULL DEFAULT 'medianoche';
