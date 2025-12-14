const { getDb } = require('../db');

const reportsController = {
  async getMonthly(req, res) {
    try {
      const db = getDb();
      const rows = await db.all(`
        SELECT 
          strftime('%Y-%m', date) as month,
          type,
          SUM(amount) as total
        FROM transactions 
        GROUP BY strftime('%Y-%m', date), type
        ORDER BY month DESC
      `);
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getCategories(req, res) {
    try {
      const db = getDb();
      const rows = await db.all(`
        SELECT 
          category,
          type,
          SUM(amount) as total,
          COUNT(*) as count
        FROM transactions 
        GROUP BY category, type
        ORDER BY total DESC
      `);
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getPredict(req, res) {
    try {
      const db = getDb();
      const transactions = await db.all('SELECT * FROM transactions WHERE type = "expense" ORDER BY date');
      
      if (transactions.length === 0) {
        return res.json({
          predictions: {
            next_month_expense: 0,
            trend: 'no_data'
          }
        });
      }
      
      const monthlyTotals = {};
      transactions.forEach(t => {
        const month = t.date.substring(0, 7);
        monthlyTotals[month] = (monthlyTotals[month] || 0) + parseFloat(t.amount);
      });
      
      const months = Object.keys(monthlyTotals).sort();
      const avgExpense = Object.values(monthlyTotals).reduce((a, b) => a + b, 0) / months.length;
      
      let trend = 'stable';
      if (months.length >= 2) {
        const recent = monthlyTotals[months[months.length - 1]];
        const previous = monthlyTotals[months[months.length - 2]];
        if (recent > previous * 1.1) trend = 'increasing';
        else if (recent < previous * 0.9) trend = 'decreasing';
      }
      
      res.json({
        predictions: {
          next_month_expense: Math.round(avgExpense * 100) / 100,
          trend: trend
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = reportsController;