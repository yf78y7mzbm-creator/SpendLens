import { Router, Request, Response } from 'express';
import { pool } from '../index.js';
import { Budget } from '../models/index.js';

const router = Router();

// Create a budget for a month
router.post('/', async (req: Request, res: Response) => {
  try {
    const { user_id, month, planned_income, planned_fixed_expenses, categories } = req.body;

    const planned_surplus = planned_income - planned_fixed_expenses;

    const result = await pool.query(
      `INSERT INTO budgets (user_id, month, planned_income, planned_fixed_expenses, planned_surplus)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [user_id, month, planned_income, planned_fixed_expenses, planned_surplus]
    );

    const budget = result.rows[0];

    // Add category budgets
    if (categories && Array.isArray(categories)) {
      for (const cat of categories) {
        await pool.query(
          `INSERT INTO budget_categories (budget_id, category_id, planned_amount)
           VALUES ($1, $2, $3)`,
          [budget.id, cat.category_id, cat.planned_amount]
        );
      }
    }

    res.status(201).json(budget);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get budget for a month
router.get('/:user_id/:month', async (req: Request, res: Response) => {
  try {
    const { user_id, month } = req.params;

    const result = await pool.query(
      `SELECT * FROM budgets WHERE user_id = $1 AND month = $2`,
      [user_id, month]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    const budget = result.rows[0];

    const catResult = await pool.query(
      `SELECT bc.*, c.name FROM budget_categories bc
       JOIN categories c ON bc.category_id = c.id
       WHERE bc.budget_id = $1`,
      [budget.id]
    );

    res.json({ ...budget, categories: catResult.rows });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
