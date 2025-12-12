import { Router, Request, Response } from 'express';
import { pool } from '../index.js';

const router = Router();

// Get all default categories
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT * FROM categories ORDER BY name
    `);

    if (result.rows.length === 0) {
      // Initialize default categories
      const defaultCategories = [
        { name: 'Food & Dining', keywords: ['restaurant', 'cafe', 'grocery', 'whole foods', 'trader joes', 'diner', 'pizza', 'burger'], color: '#FF6B6B' },
        { name: 'Travel', keywords: ['uber', 'lyft', 'taxi', 'gas', 'shell', 'chevron', 'airlines', 'hotel'], color: '#4ECDC4' },
        { name: 'Utilities', keywords: ['electric', 'gas company', 'water', 'internet', 'phone', 'utility'], color: '#45B7D1' },
        { name: 'Entertainment', keywords: ['movie', 'spotify', 'netflix', 'hulu', 'disney', 'concert', 'tickets'], color: '#FFA07A' },
        { name: 'Shopping', keywords: ['amazon', 'walmart', 'target', 'costco', 'mall', 'store'], color: '#98D8C8' },
        { name: 'Health & Fitness', keywords: ['gym', 'doctor', 'pharmacy', 'cvs', 'walgreens', 'yoga', 'fitness'], color: '#F7DC6F' },
        { name: 'Subscriptions', keywords: ['subscription', 'membership', 'recurring'], color: '#BB8FCE' },
      ];

      for (const cat of defaultCategories) {
        await pool.query(
          `INSERT INTO categories (name, keywords, color) VALUES ($1, $2, $3)`,
          [cat.name, cat.keywords, cat.color]
        );
      }

      const newResult = await pool.query(`SELECT * FROM categories ORDER BY name`);
      return res.json(newResult.rows);
    }

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Create custom category
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, keywords, color } = req.body;

    const result = await pool.query(
      `INSERT INTO categories (name, keywords, color) VALUES ($1, $2, $3) RETURNING *`,
      [name, keywords || [], color || '#808080']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
