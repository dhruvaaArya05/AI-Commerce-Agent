import dotenv from "dotenv";
import mongoose from "mongoose";

import { searchProducts, checkStock, getProductDetails, addToCart, getCart, removeFromCart, updateCartQuantity, createOrder, prepareCheckout } from "../tools/productTools.js";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY,
});

const pendingCheckouts = new Map();

// Define tools for Gemini
const searchProductsTool = {
  name: "searchProducts",
  description: "Search for products in the database based on a query and optimal max price.",

  parameters: {
    type: Type.OBJECT,

    properties: {
      query: {
        type: Type.STRING,
        description: "The search query to find products.",
      },
      maxPrice: {
        type: Type.NUMBER,
        description: "The maximum price for the products to be returned.",
      }
    },

    required: ["query"],
  },
}

const checkStockTool = {
  name: "checkStock",
  description: "Check the stock level of a product by its ID.",

  parameters: {
    type: Type.OBJECT,

    properties: {
      productId: {
        type: Type.STRING,
        description: "The ID of the product to check stock for.",
      }
    },

    required: ["productId"],
  },
}

const getProductDetailsTool = {
  name: "getProductDetails",
  description: "Get detailed information about a product by its ID.",

  parameters: {
    type: Type.OBJECT,

    properties: {
      productId: {
        type: Type.STRING,
        description: "The ID of the product to get details for.",
      }
    },

    required: ["productId"],
  }
}

const addToCartTool = {
  name: "addToCart",
  description: "Add a product to the customer's shopping cart after checking that enough stock is available.",

  parameters: {
    type: Type.OBJECT,

    properties: {
      productId: {
        type: Type.STRING,
        description: "MongoDB ID of the product",
      },

      quantity: {
        type: Type.NUMBER,
        description: "Number of units the customer wants to add",
      }
    },

    required: ["productId", "quantity"]
  }
}

const getCartTool = {
  name: "getCart",
  description: "Get all products currently in the customer's shopping cart",

  parameters: {
    type: Type.OBJECT,

    properties: {},

    required: [],
  }
}

const removeFromCartTool = {
  name: "removeFromCart",
  description: "Remove a specific product completely from the customer's shopping cart.",

  parameters: {
    type: Type.OBJECT,

    properties: {
      productId: {
        type: Type.STRING,
        description: "Mongo DB ID of the product to remove",
      }
    },

    required: ["productId"]
  }
}

const updateCartQuantityTool = {
  name: "updateCartQuantity",
  description: "Update the quantity of an existing product in the customer's shopping cart.",

  parameters: {
    type: Type.OBJECT,

    properties: {
      productId: {
        type: Type.STRING,
        description: "MongoDB ID of the product",
      },

      quantity: {
        type: Type.NUMBER,
        description: "The new quantity the customer wants",
      }
    },

    required: ["productId", "quantity"]
  }

}

const prepareCheckoutTool = {
  name: "prepareCheckout",
  description: "Prepare the customer's cart for checkout. Verify product availability, check stock, and calculate the final total. Do not create an order.",

  parameters: {
    type: Type.OBJECT,

    properties: {},
    required: [],
  }
}

const createOrderTool = {
  name: "createOrder",
  description: "Create an order from the customer's current cart. Use this only when the customer has confirmed that they want to place the order.",

  parameters: {
    type: Type.OBJECT,

    properties: {},
    required: [],
  }
}

async function runAgent(userMessage) {

  //
  const userId = "demo-user";

  const lowerMessage = userMessage.toLowerCase().trim();

  const pendingCheckout = pendingCheckouts.get(userId);

  if (pendingCheckout) {

    const confirmed =
      lowerMessage === "yes" ||
      lowerMessage === "yes, place the order" ||
      lowerMessage === "confirm" ||
      lowerMessage.includes("place the order");

    const cancelled =
      lowerMessage === "no" ||
      lowerMessage === "cancel" ||
      lowerMessage.includes("dont place") ||
      lowerMessage.includes("do not place");

    if (confirmed) {

      const result = await createOrder(userId);

      pendingCheckouts.delete(userId);

      return result.success
        ? `Order placed successfully! Your order ID is ${result.orderId}. Total amount: ₹${result.totalAmount}.`
        : `I couldn't place the order: ${result.error}`;
    }

    if (cancelled) {
      pendingCheckouts.delete(userId);

      return "No Problem. I havent placed the order";
    }
  }

  let response = await ai.models.generateContent({
    model: "gemini-3.6-flash",

    contents: userMessage,

    config: {
      tools: [
        {
          functionDeclarations: [
            searchProductsTool,
            checkStockTool,
            getProductDetailsTool,
            addToCartTool,
            getCartTool,
            removeFromCartTool,
            updateCartQuantityTool,
            createOrderTool,
            prepareCheckoutTool,
          ]
        }
      ],

      toolConfig: {
        functionCallingConfig: {
          mode: "AUTO",
          // allowedFunctionNames: [
          //   "searchProducts",
          //   "checkStock",
          //   "getProductDetails",
          //   "addToCart",
          //   "getCart",
          // ]
        }
      }
    }
  });


  // Agent loop
  while (response.functionCalls?.length > 0) {

    console.log("\nGemini wants to call:");
    console.log(response.functionCalls);


    const functionResponses = [];


    // Execute every tool Gemini requested
    for (const functionCall of response.functionCalls) {

      let toolResult;


      if (functionCall.name === "searchProducts") {

        const query = functionCall.args.query;
        const maxPrice = functionCall.args.maxPrice;

        toolResult = await searchProducts(
          query,
          maxPrice
        );
      }

      else if (functionCall.name === "checkStock") {

        const productId =
          functionCall.args.productId;

        toolResult =
          await checkStock(productId);
      }


      else if (functionCall.name === "getProductDetails") {

        const productId =
          functionCall.args.productId;

        toolResult =
          await getProductDetails(productId);
      }


      else if (functionCall.name === "addToCart") {

        const productId =
          functionCall.args.productId;

        const quantity =
          functionCall.args.quantity;

        toolResult = await addToCart(
          "demo-user",
          productId,
          quantity
        );
      }

      else if (functionCall.name === "getCart") {
        toolResult = await getCart("demo-user");
      }

      else if (functionCall.name === "removeFromCart") {

        const productId =
          functionCall.args.productId;

        toolResult = await removeFromCart(
          "demo-user",
          productId
        );
      }

      else if (functionCall.name === "updateCartQuantity") {

        const productId = functionCall.args.productId;
        const quantity = functionCall.args.quantity;

        toolResult = await updateCartQuantity(
          "demo-user",
          productId,
          quantity
        );
      }

      else if (functionCall.name === "prepareCheckout") {
        toolResult = await prepareCheckout("demo-user");
        //
        if (toolResult.success) {
          pendingCheckouts.set("demo-user", toolResult);
        }
      }

      else if (functionCall.name === "createOrder") {
        toolResult = await createOrder("demo-user");
      }

      console.log("\nTool result:");
      console.log(toolResult);


      // Send this tool's result back to Gemini
      functionResponses.push({
        functionResponse: {
          name: functionCall.name,
          id: functionCall.id,

          response: {
            result: toolResult
          }
        }
      });
    }


    // IMPORTANT:
    // Preserve Gemini's COMPLETE model response.
    // This keeps the functionCall/thought signature.

    const modelParts =
      response.candidates[0].content.parts;


    // Send Gemini's function call + tool results
    // back to Gemini

    response = await ai.models.generateContent({

      model: "gemini-3.6-flash",

      contents: [

        {
          role: "user",

          parts: [
            {
              text: userMessage
            }
          ]
        },

        {
          role: "model",

          parts: modelParts
        },

        {
          role: "user",

          parts: functionResponses
        }

      ],

      config: {

        tools: [
          {
            functionDeclarations: [
              searchProductsTool,
              checkStockTool,
              getProductDetailsTool,
              addToCartTool,
              getCartTool,
              removeFromCartTool,
              updateCartQuantityTool,
              createOrderTool,
              prepareCheckoutTool,
            ]
          }
        ],

        toolConfig: {
          functionCallingConfig: {
            mode: "AUTO"
          }
        }
      }
    });
  }


  // Gemini has stopped calling tools
  // so now we should have a text response

  return response.text;
}


// Connect MongoDB first

await mongoose.connect(process.env.MONGO_URI);

console.log("MongoDB connected");


const userMessage =
  "I want to CheckOut.";


const result = await runAgent(userMessage);

console.log("\nFinal response:");
console.log(result);
