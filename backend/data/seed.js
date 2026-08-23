import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';

import Product from '../models/Product.js';

const products = [
  {
    name: "Nike Running Shoes",
    description:
      "Lightweight running shoes designed for everyday training and outdoor running.",
    category: "Running",
    price: 4500,
    stock: 8,
    image: "/products/nike-running-shoes.jpg",
    tags: ["running", "sports", "shoes"]
  },
  {
    name: "Adidas Sweatshirt",
    description:
      "Comfortable sweatshirt suitable for workouts and casual wear.",
    category: "Clothing",
    price: 3500,
    stock: 15,
    image: "/products/adidas-sweatshirt.jpg",
    tags: ["clothing", "sports", "casual"]
  },
  {
    name: "Sports Socks",
    description:
      "Breathable sports socks designed for running and training.",
    category: "Accessories",
    price: 800,
    stock: 25,
    image: "/products/sports-socks.jpg",
    tags: ["running", "sports", "accessories"]
  },
  {
    name: "Running Cap",
    description:
      "Lightweight cap suitable for outdoor running and training.",
    category: "Accessories",
    price: 1200,
    stock: 12,
    image: "/products/running-cap.jpg",
    tags: ["running", "sports", "accessories"]
  }
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("Connected to MongoDB");

    await Product.deleteMany({});

    console.log("Existing products deleted");

    await Product.insertMany(products);

    console.log("Products seeded successfully");

    await mongoose.connection.close();

    console.log("Database connection closed");
  } catch (error) {
    console.error("Error seeding the database:", error);
    process.exit(1);
  }
}

seedDatabase();
