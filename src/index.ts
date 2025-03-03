import express from 'express';
import tasksRouter from './routes/tasks';

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Use the tasks routes
app.use('/tasks', tasksRouter);

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
