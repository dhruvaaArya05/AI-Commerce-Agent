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
    image: "/products/nike-running-shoes.jpg",
    tags: ["running", "sports", "shoes", "nike"]
  },
  {
    name: "Adidas Training Shoes",
    description: "Comfortable training shoes suitable for running, gym workouts, and daily exercise.",
    category: "Running",
    price: 3800,
    stock: 10,
    image: "/products/adidas-training-shoes.jpg",
    tags: ["running", "sports", "shoes", "adidas"]
  },
  {
    name: "Puma Sports Shoes",
    description: "Durable sports shoes designed for running and outdoor activities.",
    category: "Running",
    price: 3200,
    stock: 12,
    image: "/products/puma-sports-shoes.jpg",
    tags: ["running", "sports", "shoes", "puma"]
  },
  {
    name: "Running Cap",
    description: "Lightweight cap suitable for outdoor running and training.",
    category: "Running",
    price: 1200,
    stock: 12,
    image: "/products/running-cap.jpg",
    tags: ["running", "sports", "cap", "accessories"]
  },
  {
    name: "Running Shorts",
    description: "Lightweight and breathable shorts designed for running and workouts.",
    category: "Running",
    price: 1300,
    stock: 18,
    image: "/products/running-shorts.jpg",
    tags: ["running", "sports", "clothing", "shorts"]
  },
  {
    name: "Sports Socks",
    description: "Breathable sports socks designed for running and training.",
    category: "Accessories",
    price: 800,
    stock: 25,
    image: "/products/sports-socks.jpg",
    tags: ["running", "sports", "socks", "accessories"]
  },

  // ==================== FITNESS ====================
  {
    name: "Gym Gloves",
    description: "Grip-enhancing workout gloves designed for weight training and gym workouts.",
    category: "Fitness",
    price: 1100,
    stock: 20,
    image: "/products/gym-gloves.jpg",
    tags: ["fitness", "gym", "workout", "gloves"]
  },
  {
    name: "Yoga Mat",
    description: "Non-slip yoga mat suitable for yoga, stretching, and home workouts.",
    category: "Fitness",
    price: 1500,
    stock: 14,
    image: "/products/yoga-mat.jpg",
    tags: ["fitness", "yoga", "workout", "mat"]
  },
  {
    name: "Resistance Bands",
    description: "Set of resistance bands for strength training and home workouts.",
    category: "Fitness",
    price: 900,
    stock: 30,
    image: "/products/resistance-bands.jpg",
    tags: ["fitness", "gym", "workout", "bands"]
  },
  {
    name: "Dumbbell Set",
    description: "Adjustable dumbbell set suitable for strength training at home or in the gym.",
    category: "Fitness",
    price: 2800,
    stock: 9,
    image: "/products/dumbbell-set.jpg",
    tags: ["fitness", "gym", "weights", "workout"]
  },
  {
    name: "Sports Water Bottle",
    description: "Reusable sports water bottle designed for workouts, running, and outdoor activities.",
    category: "Fitness",
    price: 700,
    stock: 35,
    image: "/products/sports-water-bottle.jpg",
    tags: ["fitness", "running", "sports", "bottle"]
  },

  // ==================== ELECTRONICS ====================
  {
    name: "Wireless Headphones",
    description: "Over-ear wireless headphones with comfortable cushions and long battery life.",
    category: "Audio",
    price: 3500,
    stock: 11,
    image: "/products/wireless-headphones.jpg",
    tags: ["electronics", "audio", "headphones", "wireless"]
  },
  {
    name: "Bluetooth Speaker",
    description: "Portable Bluetooth speaker with clear audio for home and outdoor use.",
    category: "Audio",
    price: 2200,
    stock: 16,
    image: "/products/bluetooth-speaker.jpg",
    tags: ["electronics", "audio", "speaker", "bluetooth"]
  },
  {
    name: "Wireless Earbuds",
    description: "Compact wireless earbuds with charging case and clear sound.",
    category: "Audio",
    price: 2900,
    stock: 13,
    image: "/products/wireless-earbuds.jpg",
    tags: ["electronics", "audio", "earbuds", "wireless"]
  },
  {
    name: "Smart Watch",
    description: "Smart watch with fitness tracking, notifications, and activity monitoring.",
    category: "Wearables",
    price: 4800,
    stock: 7,
    image: "/products/smart-watch.jpg",
    tags: ["electronics", "wearables", "fitness", "smartwatch"]
  },
  {
    name: "USB-C Fast Charger",
    description: "Fast USB-C charger compatible with smartphones, tablets, and other devices.",
    category: "Accessories",
    price: 1300,
    stock: 22,
    image: "/products/usb-c-charger.jpg",
    tags: ["electronics", "charger", "usb-c", "accessories"]
  },
  {
    name: "Mechanical Keyboard",
    description: "Mechanical keyboard designed for comfortable typing and gaming.",
    category: "Accessories",
    price: 3900,
    stock: 8,
    image: "/products/mechanical-keyboard.jpg",
    tags: ["electronics", "keyboard", "gaming", "accessories"]
  },
  {
    name: "Wireless Mouse",
    description: "Ergonomic wireless mouse suitable for work, study, and gaming.",
    category: "Accessories",
    price: 1200,
    stock: 19,
    image: "/products/wireless-mouse.jpg",
    tags: ["electronics", "mouse", "wireless", "accessories"]
  },
  {
    name: "Laptop Stand",
    description: "Adjustable laptop stand designed to improve desk ergonomics and posture.",
    category: "Accessories",
    price: 1700,
    stock: 15,
    image: "/products/laptop-stand.jpg",
    tags: ["electronics", "laptop", "desk", "accessories"]
  },

  // ==================== CLOTHING ====================
  {
    name: "Adidas Sweatshirt",
    description: "Comfortable sweatshirt suitable for workouts and casual wear.",
    category: "Clothing",
    price: 3500,
    stock: 15,
    image: "/products/adidas-sweatshirt.jpg",
    tags: ["clothing", "sports", "casual", "adidas"]
  },
  {
    name: "Cotton T-Shirt",
    description: "Soft and comfortable cotton t-shirt suitable for everyday wear.",
    category: "Clothing",
    price: 900,
    stock: 25,
    image: "/products/cotton-tshirt.jpg",
    tags: ["clothing", "casual", "tshirt", "cotton"]
  },
  {
    name: "Casual Hoodie",
    description: "Warm and comfortable hoodie suitable for casual everyday wear.",
    category: "Clothing",
    price: 2400,
    stock: 12,
    image: "/products/casual-hoodie.jpg",
    tags: ["clothing", "hoodie", "casual"]
  },

  // ==================== TRAVEL ====================
  {
    name: "Travel Backpack",
    description: "Spacious backpack with multiple compartments for travel and everyday use.",
    category: "Travel",
    price: 2500,
    stock: 10,
    image: "/products/travel-backpack.jpg",
    tags: ["travel", "backpack", "bags"]
  },
  {
    name: "Laptop Backpack",
    description: "Padded laptop backpack with compartments for electronics and accessories.",
    category: "Bags",
    price: 3000,
    stock: 9,
    image: "/products/laptop-backpack.jpg",
    tags: ["travel", "laptop", "backpack", "bags"]
  },
  {
    name: "Travel Organizer",
    description: "Compact organizer for keeping travel documents, cables, and accessories organized.",
    category: "Travel",
    price: 750,
    stock: 20,
    image: "/products/travel-organizer.jpg",
    tags: ["travel", "organizer", "accessories"]
  },

  // ==================== FASHION ====================
  {
    name: "Sunglasses",
    description: "Stylish sunglasses suitable for outdoor activities and everyday wear.",
    category: "Fashion",
    price: 1800,
    stock: 17,
    image: "/products/sunglasses.jpg",
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
