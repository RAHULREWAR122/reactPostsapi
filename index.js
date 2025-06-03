import express from 'express';
import dotenv from 'dotenv';
import db from './src/mongoose/db.js';
import authRoute from './src/Routes/auth.js';
import itemRoute from './src/Routes/item.js';
import cookieParser from 'cookie-parser';
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cookieParser());
db();

app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.send("Welcome to the homepage!");
});
app.use('/api', authRoute);
app.use('/api', itemRoute);

app.listen(port, () => {
  console.log(`Server running successfully on port ${port}`);
});
