import dotenv from 'dotenv';
dotenv.config();

// const http = require('http');
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

//Routers
import productRoutes from './routers/productRouters.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/products', productRoutes);

app.get('/', (req, res) => {
  res.json({
    message: "AI Commerce Agent backend is running!"
  })
});

const PORT = process.env.PORT;

mongoose.connect(process.env.MONGO_URI).then(() => {
  app.listen(PORT, () => {
    console.log('Connected to MongoDB');
    console.log(`Server is running on port http://localhost:${PORT}`);
  });
}).catch((error) => {
  console.log('Error connecting to MongoDB:', error);
});