import Database from 'better-sqlite3'
import path from 'path'

const db = new Database(process.env.DATABASE_PATH ?? path.join(process.cwd(), 'database.db'))
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// Cria todas as tabelas na primeira execução
db.exec(`
  CREATE TABLE IF NOT EXISTS clientes (
    id         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    nome       TEXT NOT NULL,
    celular    TEXT,
    indicado_por TEXT,
    criado_em  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS servicos (
    id         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    nome       TEXT NOT NULL,
    preco_base REAL
  );

  CREATE TABLE IF NOT EXISTS agendamentos (
    id           TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    cliente_id   TEXT REFERENCES clientes(id),
    data         TEXT NOT NULL,
    horario      TEXT NOT NULL,
    observacoes  TEXT,
    status       TEXT DEFAULT 'agendado',
    valor_cobrado REAL,
    pago         INTEGER DEFAULT 0,
    criado_em    TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS agendamento_servicos (
    id             TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    agendamento_id TEXT REFERENCES agendamentos(id),
    servico_id     TEXT REFERENCES servicos(id)
  );

  CREATE TABLE IF NOT EXISTS pagamentos (
    id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    cliente_id  TEXT REFERENCES clientes(id),
    valor       REAL NOT NULL,
    data        TEXT NOT NULL,
    observacoes TEXT
  );

  CREATE TABLE IF NOT EXISTS produtos (
    id               TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    nome             TEXT NOT NULL,
    quantidade_atual REAL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS movimentacoes_estoque (
    id         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    produto_id TEXT REFERENCES produtos(id),
    tipo       TEXT NOT NULL,
    quantidade REAL NOT NULL,
    data       TEXT NOT NULL,
    observacao TEXT
  );

  CREATE TABLE IF NOT EXISTS gastos (
    id        TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    descricao TEXT NOT NULL,
    valor     REAL NOT NULL,
    data      TEXT NOT NULL,
    categoria TEXT
  );

  CREATE TABLE IF NOT EXISTS agendamento_produtos (
    id             TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    agendamento_id TEXT REFERENCES agendamentos(id),
    produto_id     TEXT REFERENCES produtos(id),
    quantidade     REAL NOT NULL DEFAULT 1,
    preco_unitario REAL NOT NULL DEFAULT 0
  );
`)

export default db
