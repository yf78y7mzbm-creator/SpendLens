import { pool } from '../index.js';

export async function categorizeTransaction(merchant: string): Promise<string | null> {
  try {
    const result = await pool.query(
      `SELECT id FROM categories 
       WHERE keywords && string_to_array($1, ' ')
       LIMIT 1`,
      [merchant.toLowerCase()]
    );

    if (result.rows.length > 0) {
      return result.rows[0].id;
    }

    // Fallback: try simple substring matching
    const keywords = merchant.toLowerCase().split(' ');
    for (const keyword of keywords) {
      const keywordResult = await pool.query(
        `SELECT id FROM categories 
         WHERE keywords @> array[$1]
         LIMIT 1`,
        [keyword]
      );

      if (keywordResult.rows.length > 0) {
        return keywordResult.rows[0].id;
      }
    }

    return null;
  } catch (error) {
    console.error('Categorization error:', error);
    return null;
  }
}
