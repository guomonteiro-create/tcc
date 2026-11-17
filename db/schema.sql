-- Banco de dados: Colheita+
-- Execute com:  psql -U postgres -d colheita -f db/schema.sql
-- (ou use  npm run init-db  para criar tudo automaticamente)

CREATE TABLE IF NOT EXISTS usuarios (
    id          SERIAL PRIMARY KEY,
    nome        VARCHAR(120) NOT NULL,
    email       VARCHAR(160) NOT NULL UNIQUE,
    senha_hash  VARCHAR(255) NOT NULL,
    criado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS propriedades (
    id          SERIAL PRIMARY KEY,
    usuario_id  INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nome        VARCHAR(160) NOT NULL,
    localizacao VARCHAR(200),
    area_ha     NUMERIC(12,2),
    cultura     VARCHAR(160),
    observacoes TEXT,
    criado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_propriedades_usuario ON propriedades(usuario_id);

-- Tabela usada pelo connect-pg-simple para guardar as sessões de login
CREATE TABLE IF NOT EXISTS "session" (
    "sid"    varchar NOT NULL COLLATE "default",
    "sess"   json NOT NULL,
    "expire" timestamp(6) NOT NULL,
    CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
