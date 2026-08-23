import Product from "../models/Product.js";
import Cart from "../models/Cart.js";
import Order from "../models/Order.js";

export async function searchProducts(query, maxPrice) {
  try {
    const filter = {};

    // Search by name, description, category or tags
    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
        { category: { $regex: query, $options: "i" } },
        { tags: { $regex: query, $options: "i" } }
      ];
    }

    // Optional price filter
    if (maxPrice) {
      filter.price = { $lte: maxPrice };
    }

    const products = await Product.find(filter);

    return products;

  } catch (error) {
    console.error("searchProducts error:", error);

    return {
      error: "Unable to search products"
    };
  }
}

export async function checkStock(productId) {
  try {
    const product = await Product.findById(productId);

    if (!product) {
      return {
        success: false,
        error: "Product not found"
      };
    }

    return {
      success: true,
      productId: product._id,
      name: product.name,
      stock: product.stock,
    };
  } catch (error) {
    console.error("checkStock error:", error);

    return {
      success: false,
      error: "Unable to check stock"
    };
  }
}

export async function getProductDetails(productId) {
  try {
    const product = await Product.findById(productId);

    if (!product) {
      return {
        success: false,
        error: "Product not found"
      };
    }

    return {
      success: true,
      productId: product._id,
      name: product.name,
      description: product.description,
      image: product.image,
      price: product.price,
      stock: product.stock,
      category: product.category,
      tags: product.tags,
    }
  } catch (error) {
    console.log("getProductDetails error:", error);
    return {
      success: false,
      error: "Unable to retrieve product details"
    };
  }
}

export async function addToCart(userId, productId, quantity) {
  try {
    const product = await Product.findById(productId);

    if (!product) {
      return {
        success: false,
        error: "Product not found"
      };
    }

    if (product.stock < quantity) {
      return {
        success: false,
        error: `only ${product.stock} items in stock`
      };
    }

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    const existingItem = cart.items.find(
      item => item.productId.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        productId,
        quantity
      });
    }

    await cart.save();

    return {
      success: true,
      message: `${quantity} ${product.name} added to cart`,
      productId: product._id,
      productName: product.name,
      quantity
    };

  } catch (error) {
    console.error("addToCart error:", error);

    return {
      success: false,
      error: "Unable to add product to cart"
    };
  }
}

export async function getCart(userId) {
  try {
    const cart = await Cart.findOne({ userId }).populate("items.productId");

    if (!cart) {
      return {
        success: true,
        items: [],
        message: "Your Cart is empty",
      };
    }

    return {
      success: true,
      items: cart.items.map(item => ({
        productId: item.productId._id,
        name: item.productId.name,
        price: item.productId.price,
        quantity: item.quantity,
        image: item.productId.image,
        subtotal: item.productId.price * item.quantity
      }))
    };
  } catch (error) {
    console.log("getCart error:", error);

    return {
      success: false,
      error: "Unable to retrieve Cart",
    };
  }
}

export async function removeFromCart(userId, productId) {
  try {
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return {
        success: false,
        error: "Cart not found"
      };
    }

    const itemIndex = cart.items.findIndex(
      item => item.productId.toString() === productId
    );

    if (itemIndex === -1) {
      return {
        success: false,
        error: "Product is not in the cart"
      };
    }

    cart.items.splice(itemIndex, 1);

    await cart.save();

    return {
      success: true,
      message: "Product removed from cart",
      productId
    };

  } catch (error) {
    console.error("removeFromCart error:", error);

    return {
      success: false,
      error: "Unable to remove product from cart"
    };
  }
}

export async function updateCartQuantity(userId, productId, quantity) {
  try {
    if (quantity <= 0) {
      return {
        success: false,
        error: "Quantity must be greater than 0"
      };
    }

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return {
        success: false,
        error: "Cart not found"
      };
    }

    const item = cart.items.find(
      item => item.productId.toString() === productId
    );

    if (!item) {
      return {
        success: false,
        error: "Product is not in the cart"
      };
    }

    // Check current product stock
    const product = await Product.findById(productId);

    if (!product) {
      return {
        success: false,
        error: "Product not found"
      };
    }

    if (quantity > product.stock) {
      return {
        success: false,
        error: `Only ${product.stock} units are available`
      };
    }

    item.quantity = quantity;

    await cart.save();

    return {
      success: true,
      message: `${product.name} quantity updated`,
      productId: product._id,
      productName: product.name,
      quantity: item.quantity
    };

  } catch (error) {
    console.error("updateCartQuantity error:", error);

    return {
      success: false,
      error: "Unable to update cart quantity"
    };
  }
}

export async function createOrder(userId) {
  try {
    const cart = await Cart.findOne({ userId });

    if (!cart || cart.items.length === 0) {
      return {
        success: false,
        error: "Your cart is empty"
      };
    }

    const orderItems = [];
    let totalAmount = 0;

    for (const item of cart.items) {
      const product = await Product.findById(item.productId);

      if (!product) {
        return {
          success: false,
          error: "One of the products in your cart no longer exists"
        };
      }

      if (product.stock < item.quantity) {
        return {
          success: false,
          error: `${product.name} has only ${product.stock} units available`
        };
      }

      const subtotal = product.price * item.quantity;

      orderItems.push({
        productId: product._id,
        productName: product.name,
        price: product.price,
        quantity: item.quantity,
        subtotal
      });

      totalAmount += subtotal;
    }

    // Deduct stock
    for (const item of cart.items) {
      const product = await Product.findById(item.productId);

      product.stock -= item.quantity;

      await product.save();
    }

    // Create order
    const order = await Order.create({
      userId,
      items: orderItems,
      totalAmount,
      status: "confirmed"
    });

    // Clear cart
    cart.items = [];
    await cart.save();

    return {
      success: true,
      message: "Order created successfully",
      orderId: order._id,
      items: orderItems,
      totalAmount,
      status: order.status
    };

  } catch (error) {
    console.error("createOrder error:", error);

    return {
      success: false,
      error: "Unable to create order"
    };
  }
}

export async function prepareCheckout(userId) {
  try {
    const cart = await Cart.findOne({ userId });

    if (!cart || cart.items.length === 0) {
      return {
        success: false,
        error: "Your cart is empty"
      };
    }

    const items = [];
    let totalAmount = 0;

    for (const item of cart.items) {
      const product = await Product.findById(item.productId);

      if (!product) {
        return {
          success: false,
          error: "A product in your cart no longer exists"
        };
      }

      if (product.stock < item.quantity) {
        return {
          success: false,
          error: `${product.name} only has ${product.stock} units available`
        };
      }

      const subtotal = product.price * item.quantity;

      items.push({
        productId: product._id,
        productName: product.name,
        price: product.price,
        quantity: item.quantity,
        subtotal
      });

      totalAmount += subtotal;
    }

    return {
      success: true,
      items,
      totalAmount,
      currency: "INR",
      message: "Please confirm if you want to place this order."
    };

  } catch (error) {
    console.error("prepareCheckout error:", error);

    return {
      success: false,
      error: "Unable to prepare checkout"
    };
  }
}