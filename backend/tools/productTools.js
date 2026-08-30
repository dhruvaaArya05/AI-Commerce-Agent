import Product from "../models/Product.js";
import Cart from "../models/Cart.js";
import Order from "../models/Order.js";

import { trackEvent } from "../utils/trackEvent.js";
import { createAuditLog } from "../utils/createAuditLog.js";


export async function searchProducts(query, maxPrice) {
  try {
    const filter = {};

    // "all" means search the entire catalog
    if (query && query.toLowerCase() !== "all") {
      filter.$or = [
        { name: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
        { category: { $regex: query, $options: "i" } },
        { tags: { $regex: query, $options: "i" } }
      ];
    }

    // Price filter
    if (maxPrice !== undefined && maxPrice !== null) {
      filter.price = { $lte: maxPrice };
    }

    const products = await Product.find(filter);

    // Track the search
    await trackEvent({
      eventType: "product_searched",
      searchQuery: query || "all",
      metadata: {
        maxPrice: maxPrice ?? null,
        resultCount: products.length
      }
    });

    await createAuditLog({
      action: "PRODUCT_SEARCHED",
      entityType: "Search",
      details: {
        searchQuery: query || "all",
        maxPrice: maxPrice ?? null,
        resultCount: products.length
      }
    });

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

    //Track successful cart addition
    await trackEvent({
      userId,
      eventType: "product_added_to_cart",
      productId: product._id,
      metadata: {
        quantity,
        price: product.price,
        productName: product.name
      }
    });

    await createAuditLog({
      userId,
      action: "PRODUCT_ADDED_TO_CART",
      entityType: "Product",
      entityId: product._id,
      details: {
        productName: product.name,
        quantity,
        price: product.price
      }
    });

    const totalItems = cart.items.reduce(
      (total, item) => total + item.quantity,
      0
    );

    return {
      success: true,
      message: `${quantity} ${product.name} added to cart`,
      productId: product._id,
      productName: product.name,
      quantity,
      cartItemCount: totalItems,
      cartProductCount: cart.items.length
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
      items: cart.items
        .filter(item => item.productId !== null)
        .map(item => ({
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
    const validItems = [];

    // Filter out deleted products and validate stock
    for (const item of cart.items) {
      const product = await Product.findById(item.productId);

      if (!product) {
        // Skip deleted products but don't block order
        continue;
      }

      validItems.push(item);

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

    // Remove deleted products from cart
    if (validItems.length < cart.items.length) {
      cart.items = validItems;
      await cart.save();
    }

    // Check if there are any valid items after filtering
    if (orderItems.length === 0) {
      return {
        success: false,
        error: "Your cart is empty (all products were unavailable)"
      };
    }

    // Deduct stock
    for (const item of validItems) {
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

    // Track successful order creation
    await trackEvent({
      userId,
      eventType: "order_created",
      orderId: order._id,
      metadata: {
        totalAmount,
        itemCount: orderItems.length,
        currency: "INR"
      }
    });

    // Create successful order log
    await createAuditLog({
      userId,
      action: "ORDER_CREATED",
      entityType: "Order",
      entityId: order._id,
      details: {
        totalAmount,
        itemCount: orderItems.length
      }
    });

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

    // Filter out deleted products from cart
    const validItems = [];

    for (const item of cart.items) {
      const product = await Product.findById(item.productId);

      if (!product) {
        // Skip deleted products but don't block checkout
        continue;
      }

      validItems.push(item);

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

    // Remove deleted products from cart
    if (validItems.length < cart.items.length) {
      cart.items = validItems;
      await cart.save();
    }

    // Check if there are any valid items after filtering
    if (items.length === 0) {
      return {
        success: false,
        error: "Your cart is empty (all products were unavailable)"
      };
    }

    // Track successful checkout preparation
    await trackEvent({
      userId,
      eventType: "checkout_started",
      metadata: {
        itemCount: validItems.length,
        totalAmount,
        currency: "INR"
      }
    });

    await createAuditLog({
      userId,
      action: "CHECKOUT_STARTED",
      entityType: "Checkout",
      details: {
        itemCount: validItems.length,
        totalAmount,
        currency: "INR"
      }
    });

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

export async function getOrders(userId) {
  try {
    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    return {
      success: true,
      orders
    };
  } catch (error) {
    console.log("Error fetching orders:", error);

    return {
      success: false,
      error: "Unable to fetch order history"
    };
  }
}

export async function processPayment(userId, orderId) {
  try {
    const order = await Order.findOne({
      _id: orderId,
      userId
    });

    if (!order) {
      return {
        success: false,
        error: "Order not found."
      };
    }

    if (order.status === "paid") {
      return {
        success: true,
        message: "This order has already been paid.",
        orderId: order._id
      };
    }

    if (order.status === "cancelled") {
      return {
        success: false,
        error: "Payment cannot be made for a cancelled order."
      };
    }

    order.status = "paid";

    await order.save();

    const cart = await Cart.findOne({ userId });
    if (cart) {
      cart.items = [];
      await cart.save();
    }

    // Get Purchased Product Ids
    const productIds = order.items.map(
      item => item.productId
    );

    // Track successful payment
    await trackEvent({
      userId,
      eventType: "payment_completed",
      orderId: order._id,
      metadata: {
        amount: order.totalAmount,
        currency: "INR",

        // product purchased in this order
        productIds
      }
    });

    await createAuditLog({
      userId,
      action: "PAYMENT_COMPLETED",
      entityType: "Order",
      entityId: order._id,
      details: {
        amount: order.totalAmount,
        currency: "INR",
        productIds
      }
    });

    return {
      success: true,
      message: "Payment successful.",
      orderId: order._id,
      amount: order.totalAmount,
      status: order.status
    };

  } catch (error) {
    console.error("Payment error:", error);

    return {
      success: false,
      error: "Payment processing failed."
    };
  }
}

// export async function recommendProducts(userId, productId = null) {
//   try {
//     const cart = await Cart.findOne({ userId }).lean();

//     let currentProduct = null;

//     if (productId) {
//       currentProduct = await Product.findById(productId).lean();
//     }

//     // Get products already in the cart
//     const cartProductIds =
//       cart?.items?.map(item => item.productId.toString()) || [];

//     // Build query for relevant products
//     const query = {
//       _id: { $nin: cartProductIds },
//       stock: { $gt: 0 }
//     };

//     if (currentProduct?.category) {
//       query.category = currentProduct.category;
//     }

//     let products = await Product.find(query)
//       .sort({ stock: -1 })
//       .limit(5)
//       .lean();

//     // If no products in the same category,
//     // return other available products.
//     if (products.length === 0) {
//       products = await Product.find({
//         _id: { $nin: cartProductIds },
//         stock: { $gt: 0 }
//       })
//         .sort({ stock: -1 })
//         .limit(5)
//         .lean();
//     }

//     return {
//       success: true,
//       recommendations: products
//     };

//   } catch (error) {

//     console.error("Recommendation error:", error);

//     return {
//       success: false,
//       error: "Unable to generate recommendations."
//     };
//   }
// }

// export async function recommendProducts(userId, productId = null) {
//   try {
//     const cart = await Cart.findOne({ userId }).lean();

//     // Products already in the cart should not be recommended again
//     const cartProductIds =
//       cart?.items?.map(item => item.productId.toString()) || [];

//     let currentProduct = null;

//     if (productId) {
//       currentProduct = await Product.findById(productId).lean();
//     }

//     // If no specific product was provided,
//     // use the first product in the cart as the recommendation context.
//     if (!currentProduct && cart?.items?.length > 0) {
//       currentProduct = await Product.findById(
//         cart.items[0].productId
//       ).lean();
//     }

//     // If we don't have a product context, don't randomly recommend.
//     if (!currentProduct) {
//       return {
//         success: true,
//         recommendations: [],
//         message: "No product context available for recommendations."
//       };
//     }

//     const excludedIds = [
//       ...cartProductIds,
//       currentProduct._id.toString()
//     ];

//     /*
//      * Find available products that are potentially relevant.
//      *
//      * We use category, tags and description as signals.
//      */
//     const candidates = await Product.find({
//       _id: { $nin: excludedIds },
//       stock: { $gt: 0 }
//     }).lean();

//     const currentTags = (currentProduct.tags || []).map(tag =>
//       tag.toLowerCase()
//     );

//     const currentCategory =
//       currentProduct.category?.toLowerCase() || "";

//     const scoredProducts = candidates.map(product => {
//       let score = 0;

//       const productTags = (product.tags || []).map(tag =>
//         tag.toLowerCase()
//       );

//       const productCategory =
//         product.category?.toLowerCase() || "";

//       // Matching tags are a strong relevance signal
//       const matchingTags = productTags.filter(tag =>
//         currentTags.includes(tag)
//       );

//       score += matchingTags.length * 5;

//       // Same category is useful, but weaker than matching tags
//       if (productCategory === currentCategory) {
//         score += 2;
//       }

//       // Description relevance
//       const currentDescription =
//         currentProduct.description?.toLowerCase() || "";

//       const productDescription =
//         product.description?.toLowerCase() || "";

//       const descriptionWords = currentDescription
//         .split(/\s+/)
//         .filter(word => word.length > 4);

//       const matchingDescriptionWords =
//         descriptionWords.filter(word =>
//           productDescription.includes(word)
//         );

//       score += matchingDescriptionWords.length;

//       // Avoid recommending something dramatically more expensive
//       // just because it has a higher price.
//       if (product.price <= currentProduct.price * 1.5) {
//         score += 1;
//       }

//       return {
//         product,
//         score,
//         matchingTags
//       };
//     });

//     // Highest relevance first
//     scoredProducts.sort((a, b) => b.score - a.score);

//     const recommendations = scoredProducts
//       .filter(item => item.score > 0)
//       .slice(0, 5)
//       .map(item => ({
//         ...item.product,
//         recommendationScore: item.score,
//         matchingTags: item.matchingTags
//       }));

//     return {
//       success: true,
//       basedOn: {
//         productId: currentProduct._id,
//         productName: currentProduct.name
//       },
//       recommendations
//     };

//   } catch (error) {
//     console.error("Recommendation error:", error);

//     return {
//       success: false,
//       error: "Unable to generate recommendations."
//     };
//   }
// }

export async function recommendProducts(userId, productQuery = null) {
  try {
    let currentProduct = null;

    // --------------------------------------------------
    // 1. Try to identify the product from user input
    // --------------------------------------------------
    if (productQuery) {
      const query = productQuery.trim();

      currentProduct = await Product.findOne({
        $or: [
          { name: { $regex: query, $options: "i" } },
          { category: { $regex: query, $options: "i" } },
          { tags: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } }
        ]
      }).lean();
    }

    // --------------------------------------------------
    // 2. If no product was mentioned, use cart context
    // --------------------------------------------------
    let cart = null;

    if (userId) {
      cart = await Cart.findOne({ userId }).lean();
    }

    if (!currentProduct && cart?.items?.length > 0) {
      const lastCartItem =
        cart.items[cart.items.length - 1];

      currentProduct = await Product.findById(
        lastCartItem.productId
      ).lean();
    }

    // --------------------------------------------------
    // 3. No product context
    // --------------------------------------------------
    if (!currentProduct) {
      return {
        success: false,
        recommendations: [],
        message:
          "I could not identify a product to base the recommendation on."
      };
    }

    // --------------------------------------------------
    // 4. Products already in cart should not be recommended
    // --------------------------------------------------
    const cartProductIds =
      cart?.items?.map(item =>
        item.productId.toString()
      ) || [];

    const excludedIds = [
      currentProduct._id.toString(),
      ...cartProductIds
    ];

    // --------------------------------------------------
    // 5. Get available products
    // --------------------------------------------------
    const candidates = await Product.find({
      _id: { $nin: excludedIds },
      stock: { $gt: 0 }
    }).lean();

    const currentTags =
      (currentProduct.tags || []).map(tag =>
        tag.toLowerCase()
      );

    const currentCategory =
      currentProduct.category?.toLowerCase() || "";

    const currentDescription =
      currentProduct.description?.toLowerCase() || "";

    // --------------------------------------------------
    // 6. Score candidate products
    // --------------------------------------------------
    const scoredProducts = candidates.map(product => {
      let score = 0;

      const productTags =
        (product.tags || []).map(tag =>
          tag.toLowerCase()
        );

      const productCategory =
        product.category?.toLowerCase() || "";

      const productDescription =
        product.description?.toLowerCase() || "";

      // Matching tags
      const matchingTags = productTags.filter(tag =>
        currentTags.includes(tag)
      );

      score += matchingTags.length * 5;

      // Same category
      if (productCategory === currentCategory) {
        score += 2;
      }

      // Matching meaningful words in description
      const words = currentDescription
        .split(/\s+/)
        .map(word =>
          word.replace(/[^a-z0-9]/g, "")
        )
        .filter(word => word.length > 4);

      const matchingWords = words.filter(word =>
        productDescription.includes(word)
      );

      score += matchingWords.length;

      // Avoid recommending something dramatically more expensive
      if (
        product.price <=
        currentProduct.price * 1.5
      ) {
        score += 1;
      }

      return {
        product,
        score,
        matchingTags
      };
    });

    // --------------------------------------------------
    // 7. Highest relevance first
    // --------------------------------------------------
    scoredProducts.sort(
      (a, b) => b.score - a.score
    );

    // --------------------------------------------------
    // 8. Return only useful recommendations
    // --------------------------------------------------
    const recommendations = scoredProducts
      .filter(item => item.score > 0)
      .slice(0, 5)
      .map(item => ({
        _id: item.product._id,
        name: item.product.name,
        description: item.product.description,
        category: item.product.category,
        price: item.product.price,
        stock: item.product.stock,
        image: item.product.image,
        tags: item.product.tags,
        recommendationScore: item.score,
        matchingTags: item.matchingTags
      }));

    // --------------------------------------------------
    // 9. Track recommendations shown
    // --------------------------------------------------

    for (const recommendation of recommendations) {
      await trackEvent({
        userId: userId || null,
        eventType: "recommendation_shown",
        productId: recommendation._id,
        metadata: {
          basedOnProductId: currentProduct._id,
          basedOnProductName: currentProduct.name,
          recommendationScore:
            recommendation.recommendationScore,
          matchingTags:
            recommendation.matchingTags
        }
      });
    }

    // 10. Audit Trail
    await createAuditLog({
      userId: userId || null,
      action: "RECOMMENDATION_GENERATED",
      entityType: "Product",
      entityId: currentProduct._id,
      details: {
        basedOnProduct: currentProduct.name,
        recommendationCount: recommendations.length,
        recommendedProducts: recommendations.map(
          recommendation => ({
            productId: recommendation._id,
            productName: recommendation.name,
            score: recommendation.recommendationScore
          })
        )
      }
    });

    return {
      success: true,

      basedOn: {
        _id: currentProduct._id,
        name: currentProduct.name,
        category: currentProduct.category,
        tags: currentProduct.tags
      },

      recommendations
    };

  } catch (error) {
    console.error(
      "recommendProducts error:",
      error
    );

    return {
      success: false,
      recommendations: [],
      error:
        "Unable to generate product recommendations."
    };
  }
}

export async function getAllProducts() {
  try {
    const products = await Product.find();

    return {
      success: true,
      products,
    };
  } catch (error) {
    console.log("Get all products error:", error);

    return {
      success: false,
      error: "Unable to retrive all products",
    };
  }
}

// import userEvent from "../models/userEvent.js";

// export async function getMerchantInsights() {
//   try {
//     // Get all tracked events
//     const events = await userEvent.find().lean();

//     // ---------------------------------------------
//     // 1. Basic funnel metrics
//     // ---------------------------------------------

//     const totalSearches = events.filter(
//       event => event.eventType === "product_searched"
//     ).length;

//     const recommendationsShown = events.filter(
//       event => event.eventType === "recommendation_shown"
//     ).length;

//     const cartAdditions = events.filter(
//       event => event.eventType === "product_added_to_cart"
//     ).length;

//     const checkoutsStarted = events.filter(
//       event => event.eventType === "checkout_started"
//     ).length;

//     const ordersCreated = events.filter(
//       event => event.eventType === "order_created"
//     ).length;

//     const paymentsCompleted = events.filter(
//       event => event.eventType === "payment_completed"
//     ).length;

//     // ---------------------------------------------
//     // 2. Revenue
//     // ---------------------------------------------

//     const revenue = events
//       .filter(event => event.eventType === "payment_completed")
//       .reduce((total, event) => {
//         return total + (event.metadata?.amount || 0);
//       }, 0);

//     // ---------------------------------------------
//     // 3. Top searches
//     // ---------------------------------------------

//     const searchCounts = {};

//     events
//       .filter(event => event.eventType === "product_searched")
//       .forEach(event => {
//         const query = event.searchQuery?.trim();

//         if (!query) return;

//         searchCounts[query] =
//           (searchCounts[query] || 0) + 1;
//       });

//     const topSearches = Object.entries(searchCounts)
//       .sort((a, b) => b[1] - a[1])
//       .slice(0, 5)
//       .map(([query, count]) => ({
//         query,
//         count
//       }));

//     // ---------------------------------------------
//     // 4. Top recommended products
//     // ---------------------------------------------

//     const recommendationCounts = {};

//     events
//       .filter(
//         event =>
//           event.eventType === "recommendation_shown"
//       )
//       .forEach(event => {
//         if (!event.productId) return;

//         const productId =
//           event.productId.toString();

//         recommendationCounts[productId] =
//           (recommendationCounts[productId] || 0) + 1;
//       });

//     const topRecommendedProducts =
//       Object.entries(recommendationCounts)
//         .sort((a, b) => b[1] - a[1])
//         .slice(0, 5)
//         .map(([productId, count]) => ({
//           productId,
//           count
//         }));

//     // ---------------------------------------------
//     // 5. Conversion rates
//     // ---------------------------------------------

//     const recommendationToCartRate =
//       recommendationsShown > 0
//         ? (
//           (cartAdditions /
//             recommendationsShown) *
//           100
//         ).toFixed(2)
//         : 0;

//     const checkoutToOrderRate =
//       checkoutsStarted > 0
//         ? (
//           (ordersCreated /
//             checkoutsStarted) *
//           100
//         ).toFixed(2)
//         : 0;

//     const orderToPaymentRate =
//       ordersCreated > 0
//         ? (
//           (paymentsCompleted /
//             ordersCreated) *
//           100
//         ).toFixed(2)
//         : 0;

//     // ---------------------------------------------
//     // 6. Return insights
//     // ---------------------------------------------

//     return {
//       success: true,

//       funnel: {
//         totalSearches,
//         recommendationsShown,
//         cartAdditions,
//         checkoutsStarted,
//         ordersCreated,
//         paymentsCompleted
//       },

//       revenue,

//       conversionRates: {
//         recommendationToCartRate:
//           `${recommendationToCartRate}%`,

//         checkoutToOrderRate:
//           `${checkoutToOrderRate}%`,

//         orderToPaymentRate:
//           `${orderToPaymentRate}%`
//       },

//       topSearches,

//       topRecommendedProducts
//     };

//   } catch (error) {
//     console.error(
//       "getMerchantInsights error:",
//       error
//     );

//     return {
//       success: false,
//       error: "Unable to generate merchant insights."
//     };
//   }
// }


import userEvent from "../models/userEvent.js";

export async function getMerchantInsights() {
  try {
    const events = await userEvent.find().lean();

    // --------------------------------------------------
    // 1. Basic funnel metrics
    // --------------------------------------------------

    const totalSearches = events.filter(
      event => event.eventType === "product_searched"
    ).length;

    const recommendationsShown = events.filter(
      event => event.eventType === "recommendation_shown"
    ).length;

    const cartAdditions = events.filter(
      event => event.eventType === "product_added_to_cart"
    ).length;

    const checkoutsStarted = events.filter(
      event => event.eventType === "checkout_started"
    ).length;

    const ordersCreated = events.filter(
      event => event.eventType === "order_created"
    ).length;

    const paymentsCompleted = events.filter(
      event => event.eventType === "payment_completed"
    ).length;

    // --------------------------------------------------
    // 2. Revenue
    // --------------------------------------------------

    const revenue = events
      .filter(
        event => event.eventType === "payment_completed"
      )
      .reduce(
        (total, event) =>
          total + (event.metadata?.amount || 0),
        0
      );

    // --------------------------------------------------
    // 3. Top searches
    // --------------------------------------------------

    const searchCounts = {};

    events
      .filter(
        event => event.eventType === "product_searched"
      )
      .forEach(event => {
        const query = event.searchQuery?.trim();

        if (!query) return;

        searchCounts[query] =
          (searchCounts[query] || 0) + 1;
      });

    const topSearches = Object.entries(searchCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([query, count]) => ({
        query,
        count
      }));

    // --------------------------------------------------
    // 4. Recommendation counts
    // --------------------------------------------------

    const recommendationCounts = {};

    events
      .filter(
        event =>
          event.eventType === "recommendation_shown"
      )
      .forEach(event => {
        if (!event.productId) return;

        const productId =
          event.productId.toString();

        recommendationCounts[productId] =
          (recommendationCounts[productId] || 0) + 1;
      });

    // --------------------------------------------------
    // 5. Cart additions by product
    // --------------------------------------------------

    const cartAdditionCounts = {};

    events
      .filter(
        event =>
          event.eventType === "product_added_to_cart"
      )
      .forEach(event => {
        if (!event.productId) return;

        const productId =
          event.productId.toString();

        cartAdditionCounts[productId] =
          (cartAdditionCounts[productId] || 0) + 1;
      });

    // --------------------------------------------------
    // 6. Payments by product
    // --------------------------------------------------

    const purchasedProductCounts = {};

    events
      .filter(
        event =>
          event.eventType === "payment_completed"
      )
      .forEach(event => {
        const productIds =
          event.metadata?.productIds || [];

        productIds.forEach(productId => {
          const id = productId.toString();

          purchasedProductCounts[id] =
            (purchasedProductCounts[id] || 0) + 1;
        });
      });

    // --------------------------------------------------
    // 7. Get product details
    // --------------------------------------------------

    const allTrackedProductIds = [
      ...new Set([
        ...Object.keys(recommendationCounts),
        ...Object.keys(cartAdditionCounts),
        ...Object.keys(purchasedProductCounts)
      ])
    ];

    const products = await Product.find({
      _id: { $in: allTrackedProductIds }
    }).lean();

    const productMap = {};

    products.forEach(product => {
      productMap[product._id.toString()] = product;
    });

    // --------------------------------------------------
    // 8. Build recommendation performance
    // --------------------------------------------------

    const recommendationPerformance =
      Object.entries(recommendationCounts)
        .map(([productId, shown]) => {
          const product = productMap[productId];

          const addedToCart =
            cartAdditionCounts[productId] || 0;

          const purchased =
            purchasedProductCounts[productId] || 0;

          const conversionRate =
            shown > 0
              ? Number(
                ((purchased / shown) * 100).toFixed(2)
              )
              : 0;

          return {
            productId,
            productName:
              product?.name || "Unknown Product",
            category:
              product?.category || "Unknown",
            price:
              product?.price || 0,
            recommendationsShown: shown,
            addedToCart,
            purchased,
            conversionRate
          };
        })
        .sort(
          (a, b) =>
            b.purchased - a.purchased ||
            b.recommendationsShown -
            a.recommendationsShown
        )
        .slice(0, 10);

    // --------------------------------------------------
    // 9. Conversion rates
    // --------------------------------------------------

    const recommendationToCartRate =
      recommendationsShown > 0
        ? Number(
          (
            (cartAdditions /
              recommendationsShown) *
            100
          ).toFixed(2)
        )
        : 0;

    const checkoutToOrderRate =
      checkoutsStarted > 0
        ? Number(
          (
            (ordersCreated /
              checkoutsStarted) *
            100
          ).toFixed(2)
        )
        : 0;

    const orderToPaymentRate =
      ordersCreated > 0
        ? Number(
          (
            (paymentsCompleted /
              ordersCreated) *
            100
          ).toFixed(2)
        )
        : 0;

    // --------------------------------------------------
    // 10. Return merchant insights
    // --------------------------------------------------

    return {
      success: true,

      funnel: {
        totalSearches,
        recommendationsShown,
        cartAdditions,
        checkoutsStarted,
        ordersCreated,
        paymentsCompleted
      },

      revenue,

      conversionRates: {
        recommendationToCartRate:
          `${recommendationToCartRate}%`,

        checkoutToOrderRate:
          `${checkoutToOrderRate}%`,

        orderToPaymentRate:
          `${orderToPaymentRate}%`
      },

      topSearches,

      recommendationPerformance
    };

  } catch (error) {
    console.error(
      "getMerchantInsights error:",
      error
    );

    return {
      success: false,
      error:
        "Unable to generate merchant insights."
    };
  }
}

