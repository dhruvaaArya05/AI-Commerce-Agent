import dotenv from "dotenv";
import mongoose from "mongoose";

import {
  searchProducts, checkStock, getProductDetails, addToCart, getCart, removeFromCart, updateCartQuantity, createOrder, prepareCheckout, getOrders, processPayment,
  recommendProducts, getAllProducts, getMerchantInsights
} from "../tools/productTools.js";

import { getCampaignOpportunities } from "../tools/merchantTools.js";

// import ollama from "ollama";
import OpenAI from "openai";
// import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

// const ai = new GoogleGenAI({
//   apiKey: process.env.GOOGLE_GENAI_API_KEY,
// });

const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const pendingCheckouts = new Map();

//store conversations history...
const conversations = new Map();

// Define tools for Gemini
// const searchProductsTool = {
//   type: "function",
//   function: {
//     name: "searchProducts",
//     description: "Search for products in the database based on a query and optimal max price.",

//     parameters: {
//       type: "object",

//       properties: {
//         query: {
//           type: "string",
//           description: "The search query to find products.",
//         },
//         maxPrice: {
//           type: "number",
//           description: "The maximum price for the products to be returned.",
//         }
//       },

//       required: ["query"],
//     },
//   }
// }

const searchProductsTool = {
  type: "function",

  function: {
    name: "searchProducts",

    description:
      "Search the store catalog for products. ALWAYS use this tool when the customer asks to find, search for, show, or recommend products based on a name, category, keyword, or price. For price requests, put the maximum price in maxPrice. Examples: 'products under 5000', 'shoes below 3000', 'Nike products under 5000'.",

    parameters: {
      type: "object",

      properties: {
        query: {
          type: "string",
          description:
            "Product name, category, or keyword. If the user only specifies a price limit, use a broad query such as 'all'.",
        },

        maxPrice: {
          type: "number",
          description:
            "Maximum product price. Use this when the customer says under, below, less than, or up to a specific price.",
        }
      },

      required: ["query"],
    },
  }
};

const getAllProductsTool = {
  type: "function",

  function: {
    name: "getAllProducts",

    description:
      "Get the complete product catalog from the database. ALWAYS use this tool when the customer asks for all products, every product, the entire catalog, the complete product list, or wants to see everything available.",

    parameters: {
      type: "object",
      properties: {},
    }
  }
};

const checkStockTool = {
  type: "function",
  function: {
    name: "checkStock",
    description: "Check the stock level of a product by its ID.",

    parameters: {
      type: "object",

      properties: {
        productId: {
          type: "string",
          description: "The ID of the product to check stock for.",
        }
      },

      required: ["productId"],
    },
  }
}

const getProductDetailsTool = {
  type: "function",
  function: {
    name: "getProductDetails",
    description: "Get detailed information about a product by its ID.",

    parameters: {
      type: "object",

      properties: {
        productId: {
          type: "string",
          description: "The ID of the product to get details for.",
        }
      },

      required: ["productId"],
    }
  }
}

const addToCartTool = {
  type: "function",
  function: {
    name: "addToCart",
    description: "Add a product to the customer's shopping cart after checking that enough stock is available.",

    parameters: {
      type: "object",

      properties: {
        productId: {
          type: "string",
          description: "MongoDB ID of the product",
        },

        quantity: {
          type: "number",
          description: "Number of units the customer wants to add",
        }
      },

      required: ["productId", "quantity"]
    }
  }
}

const getCartTool = {
  type: "function",
  function: {
    name: "getCart",
    description: "Get the customer's current cart including product names, MongoDB product IDs, quantities, prices, and subtotals. Use this whenever the customer refers to a product in their cart by name, nickname, partial name, or natural language and the product ID is not known.",

    parameters: {
      type: "object",

      properties: {},

      required: [],
    }
  }
}

const removeFromCartTool = {
  type: "function",
  function: {
    name: "removeFromCart",
    description: "Remove a specific product completely from the customer's shopping cart.",

    parameters: {
      type: "object",

      properties: {
        productId: {
          type: "string",
          description: "Mongo DB ID of the product to remove",
        }
      },

      required: ["productId"]
    }
  }
}

const updateCartQuantityTool = {
  type: "function",
  function: {
    name: "updateCartQuantity",
    description: "Set the final quantity of a product in the customer's cart. The productId must always be the actual MongoDB product ID. Never use a product name as productId. If the user says 'remove one', first call getCart, find the matching product, calculate current quantity minus one, then call this tool with the resulting quantity.",

    parameters: {
      type: "object",

      properties: {
        productId: {
          type: "string",
          description: "MongoDB ID of the product",
        },

        quantity: {
          type: "number",
          description: "The new quantity the customer wants",
        }
      },

      required: ["productId", "quantity"]
    }
  }

}

const prepareCheckoutTool = {
  type: "function",
  function: {
    name: "prepareCheckout",
    description: "Prepare the customer's cart for checkout. Verify product availability, check stock, and calculate the final total. Do not create an order.",

    parameters: {
      type: "object",

      properties: {},
      required: [],
    }
  }
}

const createOrderTool = {
  type: "function",
  function: {
    name: "createOrder",
    description: "Create an order from the customer's current cart. Use this only when the customer has confirmed that they want to place the order.",

    parameters: {
      type: "object",

      properties: {},
      required: [],
    }
  }
}

const getOrdersTool = {
  type: "function",
  function: {
    name: "getOrders",

    description: "Get the customer's previous orders. Use this when the customer asks about order history, previous orders, past purchases, or their orders.",

    parameters: {
      type: "object",

      properties: {},
    }
  }
}

const processPaymentTool = {
  type: "function",

  function: {
    name: "processPayment",

    description:
      "Process payment for an existing order. Only call this when the customer explicitly confirms that they want to pay for the order.",

    parameters: {
      type: "object",

      properties: {
        orderId: {
          type: "string",
          description: "MongoDB ID of the order to pay for"
        }
      },

      required: ["orderId"]
    }
  }
};

const recommendProductsTool = {
  type: "function",

  function: {
    name: "recommendProducts",

    description:
      "Recommend relevant complementary products when the user asks what goes well with a product, what else they need, what they should buy with a product, what would complement a product, what accessories go with a product, or asks for recommendations. The product may be referred to using a natural-language name such as 'headphones', 'running shoes', 'the backpack', or 'the cheaper one'. Use conversation context to resolve references such as 'it', 'this', 'that', or 'the one I bought'. Do not ask for a brand or model if the product can reasonably be identified from the store catalog.",

    parameters: {
      type: "object",

      properties: {
        productQuery: {
          type: "string",
          description:
            "The product name or natural-language product reference to use as the recommendation context. Examples: 'headphones', 'running shoes', 'travel backpack' etc",
        }
      },

      required: ["productQuery"]
    }
  }
};

const getMerchantInsightsTool = {
  type: "function",
  function: {
    name: "getMerchantInsights",
    description: "Get merchant analytics including sales funnel, revenue, searches, recommendations, and conversion performance. Use this for merchant/business performance questions.",
    parameters: {
      type: "object",
      properties: {},
      required: []
    }
  }
}

const getCampaignOpportunitiesTool = {
  type: "function",
  function: {
    name: "getCampaignOpportunities",
    description:
      "Analyze customer behavior and store performance to identify actionable marketing, promotion, cross-selling, and inventory opportunities for the merchant.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    }
  }
}

// const getAllProductsTool = {
//   type: "function",

//   function: {
//     name: "getAllProducts",

//     description:
//       "Get all products currently available in the store. Use this when the customer asks to see all products, every product, the complete product catalog, or the full list of products.",

//     parameters: {
//       type: "object",
//       properties: {}
//     }
//   }
// };

// async function runAgent(userMessage) {

//   //
//   const userId = "demo-user";

//   const lowerMessage = userMessage.toLowerCase().trim();

//   const pendingCheckout = pendingCheckouts.get(userId);

//   if (pendingCheckout) {

//     const confirmed =
//       lowerMessage === "yes" ||
//       lowerMessage === "yes, place the order" ||
//       lowerMessage === "confirm" ||
//       lowerMessage.includes("place the order");

//     const cancelled =
//       lowerMessage === "no" ||
//       lowerMessage === "cancel" ||
//       lowerMessage.includes("dont place") ||
//       lowerMessage.includes("do not place");

//     if (confirmed) {

//       const result = await createOrder(userId);

//       pendingCheckouts.delete(userId);

//       return result.success
//         ? `Order placed successfully! Your order ID is ${result.orderId}. Total amount: ₹${result.totalAmount}.`
//         : `I couldn't place the order: ${result.error}`;
//     }

//     if (cancelled) {
//       pendingCheckouts.delete(userId);

//       return "No Problem. I havent placed the order";
//     }
//   }

//   let response = await ai.models.generateContent({
//     model: "gemini-3.6-flash",

//     contents: userMessage,

//     config: {
//       tools: [
//         {
//           functionDeclarations: [
//             searchProductsTool,
//             checkStockTool,
//             getProductDetailsTool,
//             addToCartTool,
//             getCartTool,
//             removeFromCartTool,
//             updateCartQuantityTool,
//             createOrderTool,
//             prepareCheckoutTool,
//           ]
//         }
//       ],

//       toolConfig: {
//         functionCallingConfig: {
//           mode: "AUTO",
//           // allowedFunctionNames: [
//           //   "searchProducts",
//           //   "checkStock",
//           //   "getProductDetails",
//           //   "addToCart",
//           //   "getCart",
//           // ]
//         }
//       }
//     }
//   });


//   // Agent loop
//   while (response.functionCalls?.length > 0) {

//     console.log("\nGemini wants to call:");
//     console.log(response.functionCalls);


//     const functionResponses = [];


//     // Execute every tool Gemini requested
//     for (const functionCall of response.functionCalls) {

//       let toolResult;


//       if (functionCall.name === "searchProducts") {

//         const query = functionCall.args.query;
//         const maxPrice = functionCall.args.maxPrice;

//         toolResult = await searchProducts(
//           query,
//           maxPrice
//         );
//       }

//       else if (functionCall.name === "checkStock") {

//         const productId =
//           functionCall.args.productId;

//         toolResult =
//           await checkStock(productId);
//       }


//       else if (functionCall.name === "getProductDetails") {

//         const productId =
//           functionCall.args.productId;

//         toolResult =
//           await getProductDetails(productId);
//       }


//       else if (functionCall.name === "addToCart") {

//         const productId =
//           functionCall.args.productId;

//         const quantity =
//           functionCall.args.quantity;

//         toolResult = await addToCart(
//           "demo-user",
//           productId,
//           quantity
//         );
//       }

//       else if (functionCall.name === "getCart") {
//         toolResult = await getCart("demo-user");
//       }

//       else if (functionCall.name === "removeFromCart") {

//         const productId =
//           functionCall.args.productId;

//         toolResult = await removeFromCart(
//           "demo-user",
//           productId
//         );
//       }

//       else if (functionCall.name === "updateCartQuantity") {

//         const productId = functionCall.args.productId;
//         const quantity = functionCall.args.quantity;

//         toolResult = await updateCartQuantity(
//           "demo-user",
//           productId,
//           quantity
//         );
//       }

//       else if (functionCall.name === "prepareCheckout") {
//         toolResult = await prepareCheckout("demo-user");
//         //
//         if (toolResult.success) {
//           pendingCheckouts.set("demo-user", toolResult);
//         }
//       }

//       else if (functionCall.name === "createOrder") {
//         toolResult = await createOrder("demo-user");
//       }

//       console.log("\nTool result:");
//       console.log(toolResult);


//       // Send this tool's result back to Gemini
//       functionResponses.push({
//         functionResponse: {
//           name: functionCall.name,
//           id: functionCall.id,

//           response: {
//             result: toolResult
//           }
//         }
//       });
//     }


//     // IMPORTANT:
//     // Preserve Gemini's COMPLETE model response.
//     // This keeps the functionCall/thought signature.

//     const modelParts =
//       response.candidates[0].content.parts;


//     // Send Gemini's function call + tool results
//     // back to Gemini

//     response = await ai.models.generateContent({

//       model: "gemini-3.6-flash",

//       contents: [

//         {
//           role: "user",

//           parts: [
//             {
//               text: userMessage
//             }
//           ]
//         },

//         {
//           role: "model",

//           parts: modelParts
//         },

//         {
//           role: "user",

//           parts: functionResponses
//         }

//       ],

//       config: {

//         tools: [
//           {
//             functionDeclarations: [
//               searchProductsTool,
//               checkStockTool,
//               getProductDetailsTool,
//               addToCartTool,
//               getCartTool,
//               removeFromCartTool,
//               updateCartQuantityTool,
//               createOrderTool,
//               prepareCheckoutTool,
//             ]
//           }
//         ],

//         toolConfig: {
//           functionCallingConfig: {
//             mode: "AUTO"
//           }
//         }
//       }
//     });
//   }


//   // Gemini has stopped calling tools
//   // so now we should have a text response

//   return response.text;
// }

function extractProducts(toolResult) {
  if (!toolResult) return [];

  // Direct array
  if (Array.isArray(toolResult)) {
    return toolResult;
  }

  // Common API/tool response shapes
  if (Array.isArray(toolResult.products)) {
    return toolResult.products;
  }

  if (Array.isArray(toolResult.data)) {
    return toolResult.data;
  }

  if (toolResult.product) {
    return [toolResult.product];
  }

  return [];
}

export async function runAgent(userMessage) {

  const userId = "demo-user";

  let responseProducts = [];

  // ============================================
  // 1. HANDLE PENDING CHECKOUT CONFIRMATION
  // ============================================

  const lowerMessage = userMessage.toLowerCase().trim();

  const pendingCheckout = pendingCheckouts.get(userId);

  if (pendingCheckout) {

    const confirmed =
      lowerMessage === "yes" ||
      lowerMessage === "confirm" ||
      lowerMessage === "yes, place the order" ||
      lowerMessage.includes("place the order") ||
      lowerMessage.includes("i will pay") ||
      lowerMessage.includes("want to pay") ||
      lowerMessage.includes("pay for it");

    const cancelled =
      lowerMessage === "no" ||
      lowerMessage === "cancel" ||
      lowerMessage.includes("don't place") ||
      lowerMessage.includes("dont place") ||
      lowerMessage.includes("do not place");

    if (confirmed) {

      const result = await createOrder(userId);

      pendingCheckouts.delete(userId);

      if (!result.success) {
        return {
          message: `I couldn't place the order: ${result.error}`,
          products: []
        };
      }

      return {
        message: "Your order is ready for secure payment. Opening Razorpay Checkout now.",
        paymentRequired: true,
        orderId: result.orderId,
        amount: result.totalAmount,
        items: result.items,
        products: []
      };
    }

    if (cancelled) {

      pendingCheckouts.delete(userId);

      // return "No problem. I haven't placed the order.";
      return {
        message: "No problem. I haven't placed the order",
        products: []
      }
    }
  }


  // ============================================
  // 2. DEFINE OLLAMA TOOLS
  // ============================================

  const tools = [

    searchProductsTool,

    getAllProductsTool,

    checkStockTool,

    getProductDetailsTool,

    addToCartTool,

    getCartTool,

    removeFromCartTool,

    updateCartQuantityTool,

    prepareCheckoutTool,

    createOrderTool,

    getOrdersTool,

    processPaymentTool,

    recommendProductsTool,

    getMerchantInsightsTool,

    getCampaignOpportunitiesTool,

  ];


  // ============================================
  // 3. INITIAL CONVERSATION
  // ============================================

  const systemMessage = {

    role: "system",

    //     content: `
    // You are an AI shopping assistant for an e-commerce store.

    // Your main responsibilities are:

    // - Help users search for products.
    // - Provide product information.
    // - Check product stock.
    // - Manage the shopping cart.
    // - Recommend relevant products.
    // - Prepare checkout.
    // - Create orders after explicit confirmation.
    // - Process payments after explicit confirmation.
    // - Help users with their previous orders.

    // IMPORTANT BEHAVIOR:

    // 1. Use shopping tools whenever the user's request requires product, cart, order, checkout, payment, or recommendation information.

    // 2. If the user asks something unrelated to shopping, respond naturally and conversationally when possible.

    // 3. When appropriate, create a subtle contextual bridge from the user's message toward shopping, products, deals, product discovery, or recommendations.

    // 4. Do not force a product recommendation when it would feel unnatural. The redirection should be helpful and conversational, not spammy.

    // 5. If the user sends random or meaningless text, do not call shopping tools. Politely acknowledge it and redirect the user toward shopping.

    // 6. Never invent product IDs, prices, stock levels, order IDs, payment results, or other database information.

    // 7. Never invent a MongoDB product ID. Product IDs must always come from tool results.

    // 8. If the user refers to a product using a name, partial name, nickname, or natural-language description, resolve the actual product using the appropriate tool before modifying the cart.

    // 9. If the user wants to add a product to the cart, check the product information and stock when necessary before adding it.

    // 10. Adding products to the cart does not require confirmation.

    // 11. Changing or removing cart quantities does not require confirmation.

    // 12. If the user says "remove one", "remove 1", or similar, determine the current cart quantity first and reduce it by the requested amount.

    // 13. If the user refers to multiple products in one request, handle each product separately.

    // 14. Checkout must show the customer the complete order summary and total amount before creating the order.

    // 15. Creating an order requires explicit confirmation from the customer.

    // 16. Payment requires explicit confirmation from the customer.

    // 17. Never claim that an action was completed unless the corresponding tool successfully returned a successful result.

    // 18. If a shopping request is unclear or ambiguous, ask the user for clarification instead of guessing.

    // 19. When recommending products, prioritize relevance to the user's current product, cart, interests, or shopping intent. Prefer useful complementary products rather than simply recommending the most expensive products.

    // 20. Keep responses concise, friendly, natural, and focused on helping the customer.

    // 21. When possible, use the available product information to make the shopping experience more useful and personalized.

    // 22. Your goal is to help the customer while also creating useful opportunities for product discovery and additional purchases without being pushy.

    // 23. The transition must feel natural and should be connected to the conversation. Never abruptly say that you are a shopping assistant or suddenly advertise products.

    // 24. For jokes, casual conversation, or unexpected questions, you may creatively incorporate shopping, products, deals, or consumer situations into the response when it fits naturally.

    // 25. Do not force a shopping connection when there is no natural connection. In that case, simply respond appropriately without using shopping tools.

    // 26. Remember the previous messages in the conversation. If the user uses phrases such as "that one", "which one", "the cheaper one", "the first one", "add that", "remove it", or similar references, use the previous conversation context to understand what they mean.

    // 27. Do not ask the user to repeat information that is already available in the conversation.

    // 28. When comparing products mentioned in the previous conversation, use those products as the context of the comparison.

    // 29. If the user asks "which one is cheaper?" after products were previously recommended or displayed, compare those previously mentioned products rather than asking the user to specify them again.

    // RECOMMENDATION AND UPSELLING BEHAVIOR:

    // Your goal is to improve the customer's shopping experience by suggesting relevant products when doing so provides genuine value. Recommendations should feel natural and helpful, not like constant advertising.

    // Use recommendations when:
    // - The user explicitly asks for recommendations or suggestions.
    // - The user describes a need, activity, occasion, or goal and is looking for products.
    // - The user is browsing or viewing products and a relevant complementary product would be useful.
    // - The user adds a product to their cart and there is a genuinely useful complementary product.
    // - The user asks what else they might need.
    // - The user's previous conversation provides a clear opportunity for a relevant recommendation.

    // Do NOT recommend products when:
    // - The user asks a simple factual question.
    // - The user asks which product is cheaper or more expensive.
    // - The user asks about stock or availability.
    // - The user asks to remove or update a cart item.
    // - The user is asking about an order.
    // - The user is preparing for checkout.
    // - The user is confirming an order.
    // - The user is making or confirming a payment.
    // - A recommendation would distract from the user's immediate task.
    // - There is no genuinely relevant product to recommend.

    // When making recommendations:
    // - Prioritize relevance over price.
    // - Prefer useful complementary products rather than simply recommending the most expensive products.
    // - Consider the user's current request, previous conversation, viewed products, and cart.
    // - Do not repeatedly recommend the same products.
    // - Keep recommendations concise.
    // - Do not make every response a sales pitch.
    // - Never invent products. Use the available product tools when actual product information is required.
    // `

    content: `
You are an AI shopping assistant for an e-commerce store.

Your responsibilities:
- Search and discover products.
- Provide product details.
- Check stock and availability.
- Manage the shopping cart.
- Recommend relevant products.
- Prepare checkout.
- Create orders after explicit confirmation.
- Process payments after explicit confirmation.
- Help users with previous orders.

GREETING AND INTRODUCTION:

When the user starts the conversation with a greeting such as:
- "Hello"
- "Hi"
- "Hey"
- "Good morning"
- "Good afternoon"
- "Good evening"
- "What's up?"

respond with a short, friendly introduction.

Introduce yourself as an AI shopping assistant and briefly explain what you can help with.

Example:
"Hello! 👋 I'm your AI shopping assistant. I can help you find products, compare prices, check availability, manage your cart, and complete your purchase. What are you looking for today?"

For simple greetings:
- Do not call any shopping tools.
- Do not immediately recommend products.
- Keep the introduction concise.
- After introducing yourself, invite the user to tell you what they are looking for.

If the user has already been introduced earlier in the conversation, do not repeat the full introduction unnecessarily. Respond naturally instead.

GENERAL BEHAVIOR:

1. Use the appropriate shopping tool whenever the request requires product, inventory, cart, order, checkout, payment, or recommendation information.

2. Never invent database information. Product names, IDs, prices, stock, order IDs, payment results, and other factual data must come from tool results.

3. Never invent or guess MongoDB product IDs. Always resolve the actual product ID through available product information before modifying the cart.

4. If a user refers to a product by name, partial name, nickname, description, or natural-language reference, resolve it to the actual product before performing cart operations.

5. If the user refers to previous products using phrases such as "that one", "the cheaper one", "the first one", "add that", "remove it", etc., use conversation context to determine what they mean. Do not ask the user to repeat information that is already available.

6. If the request is ambiguous and cannot be resolved from the conversation or tools, ask for clarification instead of guessing.

7. Never claim that an action succeeded unless the corresponding tool returned a successful result.

8. Keep responses concise, friendly, natural, and focused on the user's request.

CART BEHAVIOR:

9. Adding products does not require confirmation.

10. Changing or removing cart quantities does not require confirmation.

11. Before modifying a product in the cart, resolve the actual product ID.

12. If the user says "remove one", "remove 1", or similar, first determine the current cart quantity and reduce it by the requested amount.

13. If multiple products are mentioned, handle each product separately.

14. When the user asks for a cart summary, provide the products, quantities, prices, subtotals, and total amount.

CHECKOUT, ORDER AND PAYMENT:

15. Checkout must show the complete order summary and total amount before creating an order.

16. Creating an order requires explicit user confirmation.

17. Payment requires explicit user confirmation.

18. Do not create an order or process payment merely because the user requested checkout.

19. Do not recommend products while the user is preparing checkout, confirming an order, or making a payment.

20. Never claim an order or payment was completed unless the corresponding tool succeeded.

CONVERSATION AND UNRELATED REQUESTS:

21. Remember relevant previous messages and maintain conversational context.

22. For unrelated questions, casual conversation, jokes, or unexpected messages, respond naturally.

23. You may create a subtle connection to shopping, products, deals, or product discovery when it fits naturally.

24. Never force a shopping connection or abruptly advertise products.

25. For random or meaningless input, respond gracefully without calling shopping tools unless the user subsequently expresses a shopping need.

RECOMMENDATION AND UPSELLING:

The goal is to improve the customer's shopping experience and create useful opportunities for additional purchases without being pushy.

Recommend products when:
- The user explicitly asks for recommendations.
- The user describes a need, activity, occasion, or goal.
- The user is browsing products and a relevant recommendation would help.
- The user asks what else they might need.
- A product in the conversation or cart has a genuinely useful complementary product.
- The conversation naturally creates an opportunity for relevant product discovery.

Do not recommend products when:
- The user asks a simple factual question.
- The user asks which product is cheaper or more expensive.
- The user asks about stock or availability.
- The user is removing or updating a cart item.
- The user is asking about an order.
- The user is preparing for checkout.
- The user is confirming an order.
- The user is making or confirming a payment.
- A recommendation would distract from the immediate task.
- No genuinely relevant product exists.

RECOMMENDATION QUALITY:

- Prioritize relevance over price.
- Prefer complementary products over substitutes.
- Consider the user's current request, previous conversation, viewed products, and cart.
- Avoid repeatedly recommending the same products.
- Keep recommendations concise.
- Never invent products; use product tools when actual catalog information is required.
- Do not recommend the most expensive product simply to increase revenue.

RECOMMENDATION INTENT:

When the user asks:
- "What goes well with this?"
- "What goes well with it?"
- "What should I buy with this?"
- "What else do I need?"
- "What would complement this?"
- "What can I pair this with?"
- "What accessories go with this?"
- "What do you recommend with this?"

RESPONSE FORMAT:

Do not use Markdown headings such as ## or ###.

Do not use tables.

Use short bullet points only when listing multiple products.

For product lists, use this format:

Product Name — ₹Price
Product Name — ₹Price

For cart summaries, use:

Cart:
- Product — quantity × ₹price = ₹subtotal

Total: ₹amount

For successful cart actions:
"Added X × Product Name to your cart. Your cart now has Y items."
Use the addToCart result's cartItemCount for Y; never infer Y from the number of products added in the current request.

Never output JSON to the customer.
Never mention tool calls.
Never mention internal IDs.


treat the request as a product recommendation request.

If the user mentions a product or refers to a product using natural language, call recommendProducts.

Use the product name or natural-language description as productQuery.

Use previous conversation context to resolve:
- "it"
- "this"
- "that"
- "the one I bought"
- "the cheaper one"
- "the first one"
- "that product"

Do not ask for the brand, model, or additional product details if the product can reasonably be identified from the store catalog.

Do not invent recommendations. Use the recommendation tool to obtain actual products from the database.

Distinguish between:

Complementary products:
Products that can genuinely be used together.
Example: running shoes + sports socks.

Alternative products:
Products that serve a similar purpose but are substitutes.
Example: headphones + wireless earbuds.

Related but weakly complementary products:
Products that are related but do not necessarily work together.
Example: headphones + Bluetooth speaker.

When the user asks "What goes well with this?", prioritize genuinely complementary products.

If no strong complementary product exists in the catalog:
- Do not force a recommendation.
- Explain that there is no strong complementary option currently available.
- You may offer a related alternative if it is genuinely useful, and clearly identify it as an alternative.

NATURAL LANGUAGE PRODUCT COMPARISON:

If the user asks "Which one is cheaper?", "Which is more expensive?", or similar after products were previously displayed or recommended:
- Use those previously mentioned products as the comparison context.
- Do not ask the user to repeat the product names.
- Compare actual prices from the conversation or tool results.
- Do not recommend additional products unless explicitly requested.

FINAL PRINCIPLE:

Help the customer complete their shopping goal efficiently while creating useful opportunities for product discovery and additional purchases.

Be helpful, relevant, natural, and non-pushy.
`

  };

  //   let messages = [

  //     {
  //       role: "system",

  //       content: `
  // You are an AI shopping assistant for an e-commerce store.

  // Your main responsibilities are:
  // - Help users search for products.
  // - Provide product information.
  // - Check product stock.
  // - Manage the shopping cart.
  // - Recommend relevant products.
  // - Prepare checkout.
  // - Create orders after explicit confirmation.
  // - Process payments after explicit confirmation.
  // - Help users with their previous orders.

  // IMPORTANT BEHAVIOR:

  // 1. Use shopping tools whenever the user's request requires product, cart, order, checkout, payment, or recommendation information.

  // 2. If the user asks something unrelated to shopping, respond naturally and conversationally when possible.

  // 3. When appropriate, create a subtle contextual bridge from the user's message toward shopping, products, deals, product discovery, or recommendations.

  // 4. Do not force a product recommendation when it would feel unnatural. The redirection should be helpful and conversational, not spammy.

  // 5. If the user sends random or meaningless text, do not call shopping tools. Politely acknowledge it and redirect the user toward shopping.

  // 6. Never invent product IDs, prices, stock levels, order IDs, payment results, or other database information.

  // 7. Never invent a MongoDB product ID. Product IDs must always come from tool results.

  // 8. If the user refers to a product using a name, partial name, nickname, or natural-language description, resolve the actual product using the appropriate tool before modifying the cart.

  // 9. If the user wants to add a product to the cart, check the product information and stock when necessary before adding it.

  // 10. Adding products to the cart does not require confirmation.

  // 11. Changing or removing cart quantities does not require confirmation.

  // 12. If the user says "remove one", "remove 1", or similar, determine the current cart quantity first and reduce it by the requested amount.

  // 13. If the user refers to multiple products in one request, handle each product separately.

  // 14. Checkout must show the customer the complete order summary and total amount before creating the order.

  // 15. Creating an order requires explicit confirmation from the customer.

  // 16. Payment requires explicit confirmation from the customer.

  // 17. Never claim that an action was completed unless the corresponding tool successfully returned a successful result.

  // 18. If a shopping request is unclear or ambiguous, ask the user for clarification instead of guessing.

  // 19. When recommending products, prioritize relevance to the user's current product, cart, interests, or shopping intent. Prefer useful complementary products rather than simply recommending the most expensive products.

  // 20. Keep responses concise, friendly, natural, and focused on helping the customer.

  // 21. When possible, use the available product information to make the shopping experience more useful and personalized.

  // 22. Your goal is to help the customer while also creating useful opportunities for product discovery and additional purchases without being pushy.

  // 23. The transition must feel natural and should be connected to the conversation. Never abruptly say that you are a shopping assistant or suddenly advertise products.

  // 24. For jokes, casual conversation, or unexpected questions, you may creatively incorporate shopping, products, deals, or consumer situations into the response when it fits naturally.

  // 25. Do not force a shopping connection when there is no natural connection. In that case, simply respond appropriately without using shopping tools.
  // `

  //     },

  //     {
  //       role: "user",
  //       content: userMessage
  //     }

  //   ];

  let messages = conversations.get(userId);

  if (!messages) {

    messages = [
      systemMessage
    ];
  }

  messages.push({

    role: "user",

    content: userMessage

  });


  // ============================================
  // 4. AGENT LOOP
  // ============================================

  // while (true) {

  //   const response = await ollama.chat({

  //     model: "qwen3:8b",

  //     messages,

  //     tools

  //   });


  //   // ============================================
  //   // 5. CHECK FOR TOOL CALLS
  //   // ============================================

  //   const toolCalls = response.message.tool_calls;


  //   // No tool call = final answer
  //   if (!toolCalls || toolCalls.length === 0) {

  //     messages.push(response.message);

  //     conversations.set(
  //       userId,
  //       messages
  //     );

  //     return response.message.content;
  //   }


  //   console.log("\nOllama wants to call:");

  //   console.log(
  //     JSON.stringify(toolCalls, null, 2)
  //   );


  //   // ============================================
  //   // 6. PRESERVE OLLAMA'S RESPONSE
  //   // ============================================

  //   messages.push(response.message);


  //   // ============================================
  //   // 7. EXECUTE EVERY TOOL
  //   // ============================================

  //   for (const toolCall of toolCalls) {

  //     const functionName =
  //       toolCall.function.name;

  //     const args =
  //       toolCall.function.arguments;


  //     console.log("\nTool:", functionName);

  //     console.log("Arguments:");

  //     console.log(
  //       JSON.stringify(args, null, 2)
  //     );


  //     let toolResult;


  //     // ========================================
  //     // SEARCH PRODUCTS
  //     // ========================================

  //     if (functionName === "searchProducts") {

  //       const query = args.query;

  //       const maxPrice = args.maxPrice;

  //       toolResult = await searchProducts(
  //         query,
  //         maxPrice
  //       );
  //     }

  //     // GET ALL PRODUCTS
  //     else if (functionName === "getAllProducts") {
  //       toolResult = await getAllProducts();
  //     }


  //     // ========================================
  //     // CHECK STOCK
  //     // ========================================

  //     else if (functionName === "checkStock") {

  //       const productId =
  //         args.productId;

  //       toolResult = await checkStock(
  //         productId
  //       );
  //     }


  //     // ========================================
  //     // PRODUCT DETAILS
  //     // ========================================

  //     else if (functionName === "getProductDetails") {

  //       const productId =
  //         args.productId;

  //       toolResult = await getProductDetails(
  //         productId
  //       );
  //     }


  //     // ========================================
  //     // ADD TO CART
  //     // ========================================

  //     else if (functionName === "addToCart") {

  //       const productId =
  //         args.productId;

  //       const quantity =
  //         args.quantity;

  //       toolResult = await addToCart(
  //         userId,
  //         productId,
  //         quantity
  //       );
  //     }


  //     // ========================================
  //     // GET CART
  //     // ========================================

  //     else if (functionName === "getCart") {

  //       toolResult = await getCart(
  //         userId
  //       );
  //     }


  //     // ========================================
  //     // REMOVE FROM CART
  //     // ========================================

  //     else if (functionName === "removeFromCart") {

  //       const productId =
  //         args.productId;

  //       toolResult = await removeFromCart(
  //         userId,
  //         productId
  //       );
  //     }


  //     // ========================================
  //     // UPDATE CART QUANTITY
  //     // ========================================

  //     else if (functionName === "updateCartQuantity") {

  //       const productId =
  //         args.productId;

  //       const quantity =
  //         args.quantity;

  //       toolResult = await updateCartQuantity(
  //         userId,
  //         productId,
  //         quantity
  //       );
  //     }


  //     // ========================================
  //     // PREPARE CHECKOUT
  //     // ========================================

  //     else if (functionName === "prepareCheckout") {

  //       toolResult =
  //         await prepareCheckout(userId);


  //       // Save checkout state
  //       if (toolResult.success) {

  //         pendingCheckouts.set(
  //           userId,
  //           toolResult
  //         );
  //       }
  //     }


  //     // ========================================
  //     // CREATE ORDER
  //     // ========================================

  //     else if (functionName === "createOrder") {

  //       toolResult =
  //         await createOrder(userId);
  //     }

  //     // get orders
  //     else if (functionName === "getOrders") {
  //       toolResult = await getOrders(userId);
  //     }

  //     //process payment
  //     else if (functionName === "processPayment") {
  //       toolResult = await processPayment(userId, args.orderId);
  //     }

  //     //recommendation
  //     else if (functionName === "recommendProducts") {
  //       toolResult = await recommendProducts(
  //         userId,
  //         args.productId || null
  //       );
  //     }


  //     // ========================================
  //     // UNKNOWN TOOL
  //     // ========================================

  //     else {

  //       toolResult = {

  //         success: false,

  //         error:
  //           `Unknown tool: ${functionName}`

  //       };
  //     }


  //     // ========================================
  //     // LOG TOOL RESULT
  //     // ========================================

  //     console.log("\nTool result:");

  //     console.log(toolResult);


  //     // ========================================
  //     // SEND TOOL RESULT BACK TO OLLAMA
  //     // ========================================

  //     messages.push({

  //       role: "tool",

  //       content: JSON.stringify(toolResult)

  //     });
  //   }

  // }

  while (true) {
    const response = await openrouter.chat.completions.create({
      model: "nvidia/nemotron-3-super-120b-a12b:free",
      messages,
      tools,
      tool_choice: "auto",
    });

    const assistantMessage = response.choices[0].message;

    // No tool call → final response
    if (!assistantMessage.tool_calls?.length) {
      messages.push(assistantMessage);

      conversations.set(userId, messages);

      const uniqueProducts = Array.from(
        new Map(
          responseProducts.map(product => [
            product._id,
            product
          ])
        ).values()
      );

      return {
        message: assistantMessage.content,
        products: uniqueProducts
      };
    }

    console.log("\nOpenRouter wants to call:");
    console.log(
      JSON.stringify(assistantMessage.tool_calls, null, 2)
    );

    // IMPORTANT:
    // Preserve the assistant message containing the tool calls.
    messages.push(assistantMessage);

    for (const toolCall of assistantMessage.tool_calls) {
      const functionName = toolCall.function.name;

      const args = JSON.parse(
        toolCall.function.arguments || "{}"
      );

      console.log("\nTool:", functionName);
      console.log("Arguments:");
      console.log(JSON.stringify(args, null, 2));

      let toolResult;

      if (functionName === "searchProducts") {
        toolResult = await searchProducts(
          args.query,
          args.maxPrice
        );

        responseProducts.push(
          ...extractProducts(toolResult)
        );

      } else if (functionName === "getAllProducts") {
        toolResult = await getAllProducts();

        responseProducts.push(
          ...extractProducts(toolResult)
        );

      } else if (functionName === "checkStock") {
        toolResult = await checkStock(
          args.productId
        );

      } else if (functionName === "getProductDetails") {
        toolResult = await getProductDetails(
          args.productId
        );

        responseProducts.push(
          ...extractProducts(toolResult)
        );

      } else if (functionName === "addToCart") {
        toolResult = await addToCart(
          userId,
          args.productId,
          args.quantity
        );

      } else if (functionName === "getCart") {
        toolResult = await getCart(userId);

      } else if (functionName === "removeFromCart") {
        toolResult = await removeFromCart(
          userId,
          args.productId
        );

      } else if (functionName === "updateCartQuantity") {
        toolResult = await updateCartQuantity(
          userId,
          args.productId,
          args.quantity
        );

      } else if (functionName === "prepareCheckout") {
        toolResult = await prepareCheckout(userId);

        if (toolResult.success) {
          pendingCheckouts.set(
            userId,
            toolResult
          );
        }

      } else if (functionName === "createOrder") {
        toolResult = await createOrder(userId);

      } else if (functionName === "getOrders") {
        toolResult = await getOrders(userId);

      } else if (functionName === "processPayment") {
        toolResult = await processPayment(
          userId,
          args.orderId
        );

      } else if (functionName === "recommendProducts") {
        const result = await recommendProducts(
          userId,
          args.productQuery
        );

        toolResult = result;

        responseProducts.push(
          ...extractProducts(toolResult)
        );
      } else if (functionName === "getMerchantInsights") {

        // return await getMerchantInsights();
        toolResult = await getMerchantInsights();

      } else if (functionName === "getCampaignOpportunities") {

        // return await getCampaignOpportunities();
        toolResult = await getCampaignOpportunities();

      }
      else {
        toolResult = {
          success: false,
          error: `Unknown tool: ${functionName}`
        };
      }

      console.log("\nTool result:");
      console.log(toolResult);

      // OpenRouter requires the tool_call_id
      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(toolResult)
      });
    }
  }
}

// Connect MongoDB first

await mongoose.connect(process.env.MONGO_URI);

console.log("MongoDB connected");

// const userMessage =
//   "What would you recommend with my Nike Running Shoes?";

// const result = await runAgent(userMessage);

// console.log("\nFinal response:");
// console.log(result);
