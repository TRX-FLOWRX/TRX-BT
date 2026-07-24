const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs-extra');

const dbPath = path.join(__dirname, '..', 'database', 'troxzymd.sqlite');
fs.ensureFileSync(dbPath);

const db = new Database(dbPath);

const migrations = [
  `CREATE TABLE IF NOT EXISTS users (
    jid TEXT PRIMARY KEY,
    name TEXT,
    registered INTEGER DEFAULT 0,
    premium INTEGER DEFAULT 0,
    premium_expired INTEGER DEFAULT 0,
    daily_limit INTEGER DEFAULT 0,
    last_limit_reset TEXT,
    balance INTEGER DEFAULT 0,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    banned INTEGER DEFAULT 0,
    ban_reason TEXT,
    warns INTEGER DEFAULT 0,
    ai_persona TEXT,
    channel_verified INTEGER DEFAULT 0,
    channel_verified_at INTEGER DEFAULT 0,
    referred_by TEXT,
    referral_code TEXT,
    referral_count INTEGER DEFAULT 0,
    referral_earnings INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT 0,
    is_verified_18 INTEGER DEFAULT 0,
    age_verified_at INTEGER DEFAULT 0
  );`,
  `CREATE TABLE IF NOT EXISTS groups (
    jid TEXT PRIMARY KEY,
    welcome INTEGER DEFAULT 1,
    goodbye INTEGER DEFAULT 1,
    anti_link INTEGER DEFAULT 0,
    anti_spam INTEGER DEFAULT 0,
    anti_toxic INTEGER DEFAULT 0,
    muted INTEGER DEFAULT 0,
    nsfw INTEGER DEFAULT 0,
    game_enabled INTEGER DEFAULT 1,
    custom_welcome_msg TEXT,
    custom_goodbye_msg TEXT,
    blacklist_words TEXT,
    created_at INTEGER DEFAULT 0,
    autorespond_config TEXT
  );`,
  `CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    buyer_jid TEXT,
    package_name TEXT,
    base_price INTEGER,
    unique_code INTEGER,
    total_price INTEGER,
    status TEXT,
    created_at INTEGER,
    confirmed_at INTEGER,
    confirmed_by TEXT,
    reject_reason TEXT
  );`,
  `CREATE TABLE IF NOT EXISTS schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    target_jid TEXT,
    message TEXT,
    cron_expression TEXT,
    next_run INTEGER,
    active INTEGER DEFAULT 1,
    created_at INTEGER DEFAULT 0
  );`,
  `CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jid TEXT,
    message TEXT,
    remind_at INTEGER,
    created_at INTEGER DEFAULT 0,
    sent INTEGER DEFAULT 0
  );`,
  `CREATE TABLE IF NOT EXISTS match_queue (
    jid TEXT PRIMARY KEY,
    game TEXT DEFAULT 'generic',
    metadata TEXT DEFAULT '{}',
    joined_at INTEGER
  );`,
  `CREATE TABLE IF NOT EXISTS shop_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    description TEXT,
    price INTEGER,
    item_type TEXT,
    metadata TEXT
  );`,
  `CREATE TABLE IF NOT EXISTS vault (
    user_id TEXT PRIMARY KEY,
    balance INTEGER DEFAULT 0
  );`,
  `CREATE TABLE IF NOT EXISTS battle_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    game TEXT,
    status TEXT,
    details TEXT,
    created_at INTEGER DEFAULT 0
  );`,
  `CREATE TABLE IF NOT EXISTS user_stats (
    jid TEXT PRIMARY KEY,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    battles INTEGER DEFAULT 0,
    last_battle INTEGER DEFAULT 0
  );`,
  `CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jid TEXT,
    action TEXT,
    detail TEXT,
    created_at INTEGER DEFAULT 0
  );`,
  `CREATE TABLE IF NOT EXISTS age_verification_requests (
    jid TEXT PRIMARY KEY,
    dob TEXT,
    status TEXT DEFAULT 'pending',
    requested_at INTEGER DEFAULT 0,
    verified_at INTEGER
  );`,
  `CREATE TABLE IF NOT EXISTS polls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jid TEXT,
    question TEXT,
    options TEXT,
    votes TEXT,
    is_group INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT 0
  );`,
  `CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jid TEXT,
    title TEXT,
    description TEXT,
    deadline INTEGER,
    participants TEXT,
    created_at INTEGER DEFAULT 0
  );`,
  `CREATE TABLE IF NOT EXISTS referral_claims (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jid TEXT,
    referral_code TEXT,
    claimed_at INTEGER DEFAULT 0
  );`,
  `CREATE TABLE IF NOT EXISTS investments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jid TEXT,
    amount INTEGER,
    invested_at INTEGER,
    returns_due INTEGER,
    status TEXT DEFAULT 'pending'
  );`,
  `CREATE TABLE IF NOT EXISTS ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    target_jid TEXT,
    rater_jid TEXT,
    score INTEGER,
    comment TEXT,
    created_at INTEGER DEFAULT 0
  );`,
  `CREATE TABLE IF NOT EXISTS poll_votes (
    poll_id INTEGER,
    voter_jid TEXT,
    choice TEXT,
    PRIMARY KEY (poll_id, voter_jid)
  );`,
  `CREATE TABLE IF NOT EXISTS vault_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT,
    label TEXT,
    created_at INTEGER DEFAULT 0
  );`,
  `CREATE TABLE IF NOT EXISTS activity_logs_all (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jid TEXT,
    category TEXT,
    action TEXT,
    details TEXT,
    created_at INTEGER DEFAULT 0
  );`
];

for (const sql of migrations) {
  db.prepare(sql).run();
}

const matchQueueColumns = db.prepare("PRAGMA table_info(match_queue)").all().map(col => col.name);
if (!matchQueueColumns.includes('game')) {
  db.prepare('ALTER TABLE match_queue ADD COLUMN game TEXT DEFAULT "generic"').run();
}
if (!matchQueueColumns.includes('metadata')) {
  db.prepare('ALTER TABLE match_queue ADD COLUMN metadata TEXT DEFAULT "{}"').run();
}

module.exports = db;
