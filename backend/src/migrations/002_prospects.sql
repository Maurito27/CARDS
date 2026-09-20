-- Prospects table: sales pipeline for NFC/QR commercial discovery
CREATE TABLE IF NOT EXISTS prospects (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  negocio               VARCHAR(255) NOT NULL,
  rubro                 VARCHAR(100),
  zona                  VARCHAR(100),
  direccion             TEXT,
  google_maps           TEXT,
  web                   TEXT,
  instagram             TEXT,
  whatsapp_phone        VARCHAR(50),
  source                VARCHAR(100),
  status                VARCHAR(30) NOT NULL DEFAULT 'sin_procesar'
                        CHECK (status IN (
                          'sin_procesar','investigado','calificado',
                          'visita_planificada','visitado','oportunidad',
                          'demo','piloto','propuesta','negociacion',
                          'confirmado','descartado','pausado'
                        )),
  priority              VARCHAR(20) DEFAULT 'media'
                        CHECK (priority IN ('alta','media','baja')),
  current_solution      TEXT,
  observed_problem      TEXT,
  hypothesis            VARCHAR(10),
  decision_maker        VARCHAR(255),
  decision_maker_contact TEXT,
  approx_tables         INTEGER,
  visit_objective       TEXT,
  result                VARCHAR(50),
  commercial_evidence   VARCHAR(20),
  most_valued_feature   VARCHAR(255),
  main_objection        TEXT,
  price_presented       VARCHAR(100),
  next_action           TEXT,
  next_action_date      DATE,
  responsible           VARCHAR(100) DEFAULT 'Mauro',
  payment_status        VARCHAR(20) DEFAULT 'sin_pago'
                        CHECK (payment_status IN (
                          'sin_pago','sena','pago_parcial',
                          'pagado','vencido','no_aplica'
                        )),
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prospects_status   ON prospects(status);
CREATE INDEX IF NOT EXISTS idx_prospects_zona     ON prospects(zona);
CREATE INDEX IF NOT EXISTS idx_prospects_priority ON prospects(priority);

-- Visit logs: "después de salir" quick form results
CREATE TABLE IF NOT EXISTS prospect_visits (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id     UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  visit_date      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  problem_detected TEXT,
  current_solution TEXT,
  last_real_case   TEXT,
  frequency        VARCHAR(100),
  decision_maker   VARCHAR(255),
  interest_level   VARCHAR(50),
  objection        TEXT,
  valued_feature   VARCHAR(255),
  next_step        TEXT,
  next_step_date   DATE,
  evidence_level   VARCHAR(20),
  result           VARCHAR(50),
  notes            TEXT
);

CREATE INDEX IF NOT EXISTS idx_visits_prospect_id ON prospect_visits(prospect_id);
