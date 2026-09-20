-- Add research/enrichment fields to prospects for rich dataset imports
ALTER TABLE prospects ALTER COLUMN source TYPE TEXT;
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS external_id           VARCHAR(50) UNIQUE;
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS hipotesis_comercial    TEXT;
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS que_falta_saber        TEXT;
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS rating_publico         NUMERIC(3,1);
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS cantidad_resenas_publicas INTEGER;
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS rango_precio_publico  VARCHAR(50);
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS research_completeness VARCHAR(20);
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS tipo_fuente           VARCHAR(100);
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS source_ref_auditoria  VARCHAR(100);
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS verificado_el         DATE;
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS contactado            BOOLEAN DEFAULT false;
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS fecha_ultima_interaccion DATE;
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS resultado_ultima_interaccion TEXT;

CREATE INDEX IF NOT EXISTS idx_prospects_external_id ON prospects(external_id);
CREATE INDEX IF NOT EXISTS idx_prospects_research_completeness ON prospects(research_completeness);
CREATE INDEX IF NOT EXISTS idx_prospects_contactado ON prospects(contactado);
