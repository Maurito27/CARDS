-- Cards table: each physical card's digital identity
CREATE TABLE IF NOT EXISTS cards (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id       VARCHAR(32) UNIQUE NOT NULL,
  name            VARCHAR(255) NOT NULL,
  destination_url TEXT NOT NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'disabled')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cards_public_id ON cards(public_id);

-- Destination change history (SHOULD)
CREATE TABLE IF NOT EXISTS card_destination_history (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id      UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  previous_url TEXT,
  new_url      TEXT NOT NULL,
  changed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_history_card_id ON card_destination_history(card_id);

-- Access counter (SHOULD) — minimal data, no PII
CREATE TABLE IF NOT EXISTS card_accesses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id     UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_accesses_card_id ON card_accesses(card_id);
