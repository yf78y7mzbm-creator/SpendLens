import { Router, Response } from 'express';
import { pool } from '../index.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET / - Get all debts for user
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user!.id;

    const result = await pool.query(
      `SELECT * FROM debts WHERE user_id = $1 ORDER BY created_at ASC`,
      [user_id]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// POST / - Create new debt
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user!.id;
    const { name, balance, interest_rate, min_payment } = req.body;

    if (!name || balance === undefined || min_payment === undefined) {
      return res.status(400).json({ error: 'Name, balance, and minimum payment are required' });
    }

    const result = await pool.query(
      `INSERT INTO debts (user_id, name, balance, interest_rate, min_payment)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [user_id, name, balance, interest_rate || 0, min_payment]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// PATCH /:id - Update debt
router.patch('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user!.id;
    const { id } = req.params;
    const { name, balance, interest_rate, min_payment } = req.body;

    // Verify ownership
    const check = await pool.query(
      'SELECT id FROM debts WHERE id = $1 AND user_id = $2',
      [id, user_id]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Debt not found' });
    }

    const result = await pool.query(
      `UPDATE debts
       SET name = COALESCE($1, name),
           balance = COALESCE($2, balance),
           interest_rate = COALESCE($3, interest_rate),
           min_payment = COALESCE($4, min_payment),
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [name, balance, interest_rate, min_payment, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// DELETE /:id - Delete debt
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user!.id;
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM debts WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Debt not found' });
    }

    res.json({ deleted: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// GET /plan - Get user's debt repayment plan
router.get('/plan', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user!.id;

    const result = await pool.query(
      'SELECT * FROM debt_plans WHERE user_id = $1',
      [user_id]
    );

    res.json(result.rows[0] || null);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// POST /plan - Create or update debt repayment plan
router.post('/plan', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user!.id;
    const { strategy, monthly_payment } = req.body;

    if (!strategy || monthly_payment === undefined) {
      return res.status(400).json({ error: 'Strategy and monthly payment are required' });
    }

    if (!['avalanche', 'snowball'].includes(strategy)) {
      return res.status(400).json({ error: 'Strategy must be avalanche or snowball' });
    }

    const result = await pool.query(
      `INSERT INTO debt_plans (user_id, strategy, monthly_payment)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE SET
         strategy = EXCLUDED.strategy,
         monthly_payment = EXCLUDED.monthly_payment,
         updated_at = NOW()
       RETURNING *`,
      [user_id, strategy, monthly_payment]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
