const { getDb } = require('../db');

const transactionsController = {
  async getAll(req, res) {
    try {
      const db = getDb();
      const rows = await db.all(
        'SELECT * FROM transactions ORDER BY date DESC, created_at DESC'
      );
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async create(req, res) {
    try {
      const { type, amount, category, note, date } = req.body;
      const db = getDb();
      const result = await db.run(
        'INSERT INTO transactions (type, amount, category, note, date) VALUES (?, ?, ?, ?, ?)',
        [type, amount, category, note, date]
      );
      res.status(201).json({ id: result.lastID, ...req.body });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const { type, amount, category, note, date } = req.body;
      const db = getDb();
      await db.run(
        'UPDATE transactions SET type = ?, amount = ?, category = ?, note = ?, date = ? WHERE id = ?',
        [type, amount, category, note, date, id]
      );
      res.json({ id, ...req.body });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;
      const db = getDb();
      await db.run('DELETE FROM transactions WHERE id = ?', [id]);
      res.json({ message: 'Transaction deleted' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = transactionsController;