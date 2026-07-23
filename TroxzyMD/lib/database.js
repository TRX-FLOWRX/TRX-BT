const fs = require('fs-extra');
const path = require('path');

/**
 * Database sederhana berbasis JSON file.
 * Cocok untuk skala kecil-menengah tanpa perlu setup MongoDB/MySQL terpisah.
 * Setiap kategori data (users, groups, premium, transactions) punya file sendiri.
 */
class JSONDatabase {
    constructor(name) {
        this.filePath = path.join(__dirname, '..', 'database', `${name}.json`);
        this.data = {};
        this._load();
        this._writeQueue = Promise.resolve();
    }

    _load() {
        try {
            fs.ensureFileSync(this.filePath);
            const raw = fs.readFileSync(this.filePath, 'utf-8');
            this.data = raw.trim() ? JSON.parse(raw) : {};
        } catch (err) {
            console.error(`[DB ERROR] Gagal load ${this.filePath}:`, err.message);
            this.data = {};
        }
    }

    // Antrian tulis agar tidak race-condition saat banyak write bersamaan
    _save() {
        this._writeQueue = this._writeQueue.then(() => {
            return fs.writeFile(this.filePath, JSON.stringify(this.data, null, 2)).catch(err => {
                console.error(`[DB ERROR] Gagal save ${this.filePath}:`, err.message);
            });
        });
        return this._writeQueue;
    }

    get(key) {
        return this.data[key];
    }

    getAll() {
        return this.data;
    }

    has(key) {
        return Object.prototype.hasOwnProperty.call(this.data, key);
    }

    set(key, value) {
        this.data[key] = value;
        this._save();
        return value;
    }

    update(key, partial) {
        this.data[key] = { ...(this.data[key] || {}), ...partial };
        this._save();
        return this.data[key];
    }

    delete(key) {
        delete this.data[key];
        this._save();
    }

    // Berguna untuk migrasi ke MongoDB nanti jika bot sudah besar
    export() {
        return JSON.parse(JSON.stringify(this.data));
    }
}

// Instance database per kategori
const db = {
    users: new JSONDatabase('users_main'),
    groups: new JSONDatabase('groups_main'),
    premium: new JSONDatabase('premium_main'),
    transactions: new JSONDatabase('transactions_main'),
    settings: new JSONDatabase('settings_main'),
};

module.exports = db;
