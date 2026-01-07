import { Router, Response } from 'express';
import { pool } from '../index.js';
import { categorizeTransaction } from '../services/categorization.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Upload and parse CSV
router.post('/upload', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user!.id;
    const { csv_data } = req.body;

    if (!csv_data) {
      return res.status(400).json({ error: 'CSV data required' });
    }

    const transactions = [];
    const rows = csv_data.split('\n');

    for (const row of rows) {
      if (!row.trim()) continue;

      const [date, merchant, amount] = row.split(',').map((s: string) => s.trim());

      if (!date || !merchant || !amount) continue;

      const category_id = await categorizeTransaction(merchant);

      transactions.push({
        user_id,
        date,
        amount: parseFloat(amount),
        merchant,
        category_id,
      });
    }

    // Bulk insert
    for (const txn of transactions) {
      await pool.query(
        `INSERT INTO transactions (user_id, date, amount, merchant, category_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [txn.user_id, txn.date, txn.amount, txn.merchant, txn.category_id]
      );
    }

    res.json({ uploaded: transactions.length });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get transactions for user in a month
router.get('/:month', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user!.id;
    const { month } = req.params;

    const result = await pool.query(
      `SELECT t.*, c.name as category_name FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = $1 AND TO_CHAR(t.date, 'YYYY-MM') = $2
       ORDER BY t.date DESC`,
      [user_id, month]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Update transaction categorization
router.patch('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user!.id;
    const { id } = req.params;
    const { category_id, is_one_off, is_recurring } = req.body;

    // Verify transaction belongs to user
    const check = await pool.query(
      'SELECT id FROM transactions WHERE id = $1 AND user_id = $2',
      [id, user_id]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const result = await pool.query(
      `UPDATE transactions
       SET category_id = COALESCE($1, category_id),
           is_one_off = COALESCE($2, is_one_off),
           is_recurring = COALESCE($3, is_recurring)
       WHERE id = $4
       RETURNING *`,
      [category_id, is_one_off, is_recurring, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Delete transaction
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user!.id;
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ deleted: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
