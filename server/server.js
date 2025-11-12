import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './configs/db.js';

const app = express();
const port = 3000;
await connectDB();

// Middleware
app.use(express.json());
app.use(cors());
// API routes would go here
// Sample route
app.get('/', (req, res) => {
  res.send('server is running');
});
app.listen(port, () => 
  console.log(`Server is running on http://localhost:${port}`));