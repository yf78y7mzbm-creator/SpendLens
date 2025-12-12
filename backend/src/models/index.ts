import { pool } from '../index.js';

export interface User {
  id: string;
  email: string;
  created_at: Date;
}

export interface Budget {
  id: string;
  user_id: string;
  month: string;
  planned_income: number;
  planned_fixed_expenses: number;
  planned_surplus: number;
  created_at: Date;
  updated_at: Date;
}

export interface BudgetCategory {
  id: string;
  budget_id: string;
  category_id: string;
  planned_amount: number;
}

export interface Category {
  id: string;
  name: string;
  keywords: string[];
  color: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  date: Date;
  amount: number;
  merchant: string;
  category_id?: string;
  is_one_off: boolean;
  is_recurring: boolean;
  notes?: string;
  created_at: Date;
}
