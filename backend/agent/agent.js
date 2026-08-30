import dotenv from "dotenv";
import mongoose from "mongoose";

import {
  searchProducts, checkStock, getProductDetails, addToCart, getCart, removeFromCart, updateCartQuantity, createOrder, prepareCheckout, getOrders, processPayment,
  recommendProducts, getAllProducts, getMerchantInsights
} from "../tools/productTools.js";

import { getCampaignOpportunities } from "../tools/merchantTools.js";

import OpenAI from "openai";

dotenv.config();

const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const pendingCheckouts = new Map();

//store conversations history...
const conversations = new Map();

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

  while (true) {
    const response = await openrouter.chat.completions.create({
      model: "nvidia/nemotron-3-super-120b-a12b:free",
      // model: "nvidia/nemotron-3.5-lightning:free",
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
