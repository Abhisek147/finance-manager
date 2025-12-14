const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
require('dotenv').config();

let db;

async function initDatabase() {
  try {
    db = await open({
      filename: path.join(__dirname, '../finance_tracker.db'),
      driver: sqlite3.Database
    });

    await db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
        amount REAL NOT NULL,
        category TEXT NOT NULL,
        note TEXT,
        date TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const defaultCategories = ['Food', 'Transportation', 'Entertainment', 'Utilities', 'Healthcare', 'Shopping', 'Salary', 'Freelance', 'Investment'];
    for (const category of defaultCategories) {
      await db.run('INSERT OR IGNORE INTO categories (name) VALUES (?)', [category]);
    }

    console.log('Database ready');
  } catch (error) {
    console.error('Database error:', error);
  }
}

function getDb() {
  return db;
}

module.exports = { initDatabase, getDb };