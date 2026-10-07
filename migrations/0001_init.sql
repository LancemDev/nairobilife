-- Accounts, cloud saves, presence, messages and player-to-player transfers.
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  pass_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT NOT NULL DEFAULT '',
  look TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  last_seen INTEGER NOT NULL DEFAULT 0,
  area TEXT,
  venue TEXT,
  title TEXT NOT NULL DEFAULT '',
  money INTEGER NOT NULL DEFAULT 0,
  net_worth INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX users_seen ON users (last_seen);
CREATE INDEX users_worth ON users (net_worth DESC);

CREATE TABLE sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);

CREATE TABLE saves (
  user_id TEXT PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  to_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  read_at INTEGER
);
CREATE INDEX messages_pair ON messages (from_id, to_id, id);
CREATE INDEX messages_inbox ON messages (to_id, read_at);

CREATE TABLE transfers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  to_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  claimed_at INTEGER
);
CREATE INDEX transfers_inbox ON transfers (to_id, claimed_at);
CREATE INDEX transfers_sent ON transfers (from_id, created_at);

CREATE TABLE blocks (
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  blocked_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, blocked_id)
);

CREATE TABLE reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reporter_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  message_id INTEGER,
  created_at INTEGER NOT NULL
);
