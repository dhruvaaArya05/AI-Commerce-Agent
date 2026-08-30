import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';

import Product from '../models/Product.js';

// const products = [
//   {
//     name: "Nike Running Shoes",
//     description:
//       "Lightweight running shoes designed for everyday training and outdoor running.",
//     category: "Running",
//     price: 4500,
//     stock: 8,
//     image: "/products/nike-running-shoes.jpg",
//     tags: ["running", "sports", "shoes"]
//   },
//   {
//     name: "Adidas Sweatshirt",
//     description:
//       "Comfortable sweatshirt suitable for workouts and casual wear.",
//     category: "Clothing",
//     price: 3500,
//     stock: 15,
//     image: "/products/adidas-sweatshirt.jpg",
//     tags: ["clothing", "sports", "casual"]
//   },
//   {
//     name: "Sports Socks",
//     description:
//       "Breathable sports socks designed for running and training.",
//     category: "Accessories",
//     price: 800,
//     stock: 25,
//     image: "/products/sports-socks.jpg",
//     tags: ["running", "sports", "accessories"]
//   },
//   {
//     name: "Running Cap",
//     description:
//       "Lightweight cap suitable for outdoor running and training.",
//     category: "Accessories",
//     price: 1200,
//     stock: 12,
//     image: "/products/running-cap.jpg",
//     tags: ["running", "sports", "accessories"]
//   }
// ];


const products = [
  // ==================== RUNNING & SPORTS ====================
  {
    name: "Nike Running Shoes",
    description: "Lightweight running shoes designed for everyday training and outdoor running.",
    category: "Running",
    price: 4500,
    stock: 8,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
    tags: ["running", "sports", "shoes", "nike"]
  },
  {
    name: "Adidas Training Shoes",
    description: "Comfortable training shoes suitable for running, gym workouts, and daily exercise.",
    category: "Running",
    price: 3800,
    stock: 10,
    image: "https://images.unsplash.com/photo-1556908534-3ae38017e4e4?w=400",
    tags: ["running", "sports", "shoes", "adidas"]
  },
  {
    name: "Puma Sports Shoes",
    description: "Durable sports shoes designed for running and outdoor activities.",
    category: "Running",
    price: 3200,
    stock: 12,
    image: "https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=400",
    tags: ["running", "sports", "shoes", "puma"]
  },
  {
    name: "Running Cap",
    description: "Lightweight cap suitable for outdoor running and training.",
    category: "Running",
    price: 1200,
    stock: 12,
    image: "https://images.unsplash.com/photo-1588668214407-6ea3a6e8d0c6?w=400",
    tags: ["running", "sports", "cap", "accessories"]
  },
  {
    name: "Running Shorts",
    description: "Lightweight and breathable shorts designed for running and workouts.",
    category: "Running",
    price: 1300,
    stock: 18,
    image: "https://images.unsplash.com/photo-1618359747347-1d0bea48bb4a?w=400",
    tags: ["running", "sports", "clothing", "shorts"]
  },
  {
    name: "Sports Socks",
    description: "Breathable sports socks designed for running and training.",
    category: "Accessories",
    price: 800,
    stock: 25,
    image: "https://images.unsplash.com/photo-1556995522-3644ae57fff3?w=400",
    tags: ["running", "sports", "socks", "accessories"]
  },

  // ==================== FITNESS ====================
  {
    name: "Gym Gloves",
    description: "Grip-enhancing workout gloves designed for weight training and gym workouts.",
    category: "Fitness",
    price: 1100,
    stock: 20,
    image: "https://images.unsplash.com/photo-1611672585731-fa32aeb490c5?w=400",
    tags: ["fitness", "gym", "workout", "gloves"]
  },
  {
    name: "Yoga Mat",
    description: "Non-slip yoga mat suitable for yoga, stretching, and home workouts.",
    category: "Fitness",
    price: 1500,
    stock: 14,
    image: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400",
    tags: ["fitness", "yoga", "workout", "mat"]
  },
  {
    name: "Resistance Bands",
    description: "Set of resistance bands for strength training and home workouts.",
    category: "Fitness",
    price: 900,
    stock: 30,
    image: "https://images.unsplash.com/photo-1535438480872-f3be94776144?w=400",
    tags: ["fitness", "gym", "workout", "bands"]
  },
  {
    name: "Dumbbell Set",
    description: "Adjustable dumbbell set suitable for strength training at home or in the gym.",
    category: "Fitness",
    price: 2800,
    stock: 9,
    image: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=400",
    tags: ["fitness", "gym", "weights", "workout"]
  },
  {
    name: "Sports Water Bottle",
    description: "Reusable sports water bottle designed for workouts, running, and outdoor activities.",
    category: "Fitness",
    price: 700,
    stock: 35,
    image: "https://images.unsplash.com/photo-1602143407151-7e406b6b45b1?w=400",
    tags: ["fitness", "running", "sports", "bottle"]
  },

  // ==================== ELECTRONICS ====================
  {
    name: "Wireless Headphones",
    description: "Over-ear wireless headphones with comfortable cushions and long battery life.",
    category: "Audio",
    price: 3500,
    stock: 11,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
    tags: ["electronics", "audio", "headphones", "wireless"]
  },
  {
    name: "Bluetooth Speaker",
    description: "Portable Bluetooth speaker with clear audio for home and outdoor use.",
    category: "Audio",
    price: 2200,
    stock: 16,
    image: "https://images.unsplash.com/photo-1589003077984-894e133814c9?w=400",
    tags: ["electronics", "audio", "speaker", "bluetooth"]
  },
  {
    name: "Wireless Earbuds",
    description: "Compact wireless earbuds with charging case and clear sound.",
    category: "Audio",
    price: 2900,
    stock: 13,
    image: "https://images.unsplash.com/photo-1590658268537-643a2f11d38f?w=400",
    tags: ["electronics", "audio", "earbuds", "wireless"]
  },
  {
    name: "Smart Watch",
    description: "Smart watch with fitness tracking, notifications, and activity monitoring.",
    category: "Wearables",
    price: 4800,
    stock: 7,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
    tags: ["electronics", "wearables", "fitness", "smartwatch"]
  },
  {
    name: "USB-C Fast Charger",
    description: "Fast USB-C charger compatible with smartphones, tablets, and other devices.",
    category: "Accessories",
    price: 1300,
    stock: 22,
    image: "https://images.unsplash.com/photo-1625948515291-69613efd103f?w=400",
    tags: ["electronics", "charger", "usb-c", "accessories"]
  },
  {
    name: "Mechanical Keyboard",
    description: "Mechanical keyboard designed for comfortable typing and gaming.",
    category: "Accessories",
    price: 3900,
    stock: 8,
    image: "https://images.unsplash.com/photo-1587829191301-7609c8f2b5fe?w=400",
    tags: ["electronics", "keyboard", "gaming", "accessories"]
  },
  {
    name: "Wireless Mouse",
    description: "Ergonomic wireless mouse suitable for work, study, and gaming.",
    category: "Accessories",
    price: 1200,
    stock: 19,
    image: "https://images.unsplash.com/photo-1527814050087-3793815479db?w=400",
    tags: ["electronics", "mouse", "wireless", "accessories"]
  },
  {
    name: "Laptop Stand",
    description: "Adjustable laptop stand designed to improve desk ergonomics and posture.",
    category: "Accessories",
    price: 1700,
    stock: 15,
    image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400",
    tags: ["electronics", "laptop", "desk", "accessories"]
  },

  // ==================== CLOTHING ====================
  {
    name: "Adidas Sweatshirt",
    description: "Comfortable sweatshirt suitable for workouts and casual wear.",
    category: "Clothing",
    price: 3500,
    stock: 15,
    image: "https://images.unsplash.com/photo-1556821552-107d7cb8593d?w=400",
    tags: ["clothing", "sports", "casual", "adidas"]
  },
  {
    name: "Cotton T-Shirt",
    description: "Soft and comfortable cotton t-shirt suitable for everyday wear.",
    category: "Clothing",
    price: 900,
    stock: 25,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400",
    tags: ["clothing", "casual", "tshirt", "cotton"]
  },
  {
    name: "Casual Hoodie",
    description: "Warm and comfortable hoodie suitable for casual everyday wear.",
    category: "Clothing",
    price: 2400,
    stock: 12,
    image: "https://images.unsplash.com/photo-1556821552-107d7cb8593d?w=400",
    tags: ["clothing", "hoodie", "casual"]
  },

  // ==================== TRAVEL ====================
  {
    name: "Travel Backpack",
    description: "Spacious backpack with multiple compartments for travel and everyday use.",
    category: "Travel",
    price: 2500,
    stock: 10,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400",
    tags: ["travel", "backpack", "bags"]
  },
  {
    name: "Laptop Backpack",
    description: "Padded laptop backpack with compartments for electronics and accessories.",
    category: "Bags",
    price: 3000,
    stock: 9,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400",
    tags: ["travel", "laptop", "backpack", "bags"]
  },
  {
    name: "Travel Organizer",
    description: "Compact organizer for keeping travel documents, cables, and accessories organized.",
    category: "Travel",
    price: 750,
    stock: 20,
    image: "https://images.unsplash.com/photo-1491637639811-60b2b8b81b3d?w=400",
    tags: ["travel", "organizer", "accessories"]
  },

  // ==================== FASHION ====================
  {
    name: "Sunglasses",
    description: "Stylish sunglasses suitable for outdoor activities and everyday wear.",
    category: "Fashion",
    price: 1800,
    stock: 17,
    image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400",
    tags: ["fashion", "sunglasses", "outdoor"]
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
