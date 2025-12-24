PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS campaigns (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  message_template TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY,
  campaign_id INTEGER NOT NULL,
  phone TEXT NOT NULL,
  first_name TEXT,
  UNIQUE (campaign_id, phone),
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS deliveries (
  id INTEGER PRIMARY KEY,
  campaign_id INTEGER NOT NULL,
  contact_id INTEGER NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('sent','failed')),
  error TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
);
