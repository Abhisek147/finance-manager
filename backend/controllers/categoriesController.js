const { getDb } = require('../db');

const categoriesController = {
  async getAll(req, res) {
    try {
      const db = getDb();
      const rows = await db.all('SELECT * FROM categories ORDER BY name');
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async create(req, res) {
    try {
      const { name } = req.body;
      const db = getDb();
      const result = await db.run(
        'INSERT INTO categories (name) VALUES (?)',
        [name]
      );
      res.status(201).json({ id: result.lastID, name });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = categoriesController;