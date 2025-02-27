import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import dotenv from 'dotenv';

const router = Router();
dotenv.config();

// Set up PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT as string),
  ssl: { rejectUnauthorized: false },
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM tasks');
    res.json(result.rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Failed to fetch tasks.' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  const { title, is_completed } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO tasks (title, is_completed) VALUES ($1, $2) RETURNING *',
      [title, is_completed],
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add task.' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, is_completed } = req.body;
  try {
    const result = await pool.query(
      'UPDATE tasks SET title = $1, is_completed = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [title, is_completed, id],
    );
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Task not found.' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Failed to update task.' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM tasks WHERE id = $1 RETURNING *',
      [id],
    );
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Task not found.' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task.' });
  }
});

export default router;
