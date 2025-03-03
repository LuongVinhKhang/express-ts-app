import { Router, Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import dotenv from 'dotenv';

const router = Router();
dotenv.config();

// Middleware function to log request details
const logRequestDetails = (req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.url}`);
  next();
};

// Middleware function to validate request data
const validateTaskData = (req: Request, res: Response, next: NextFunction) => {
  const { title, is_completed } = req.body;
  if (title == null || typeof title !== 'string' || title.trim() === '') {
    res.status(400).json({ error: 'Invalid task title.' });
  } else if (is_completed != null && typeof is_completed !== 'boolean') {
    res.status(400).json({ error: 'Invalid task completion status.' });
  } else {
    next();
  }
};

// Set up PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT as string),
  ssl: { rejectUnauthorized: false },
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Use the middleware for all routes
router.use(logRequestDetails);

router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM tasks');
    res.json(result.rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Failed to fetch tasks.' });
  }
});

router.post('/', validateTaskData, async (req: Request, res: Response) => {
  const { title, is_completed } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO tasks (title, is_completed) VALUES ($1, $2) RETURNING *',
      [title, is_completed],
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Failed to add task.' });
  }
});

router.put('/:id', validateTaskData, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, is_completed } = req.body;
  try {
    const result = await pool.query(
      'UPDATE tasks SET title = $1, is_completed = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [title, is_completed, id],
    );
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Task not found.' });
    } else {
      res.json(result.rows[0]);
    }
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
    } else {
      res.status(204).send();
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Failed to delete task.' });
  }
});

export default router;
