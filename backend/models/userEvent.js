import mongoose from "mongoose";

const userEventSchema = new mongoose.Schema(
  {
    userId: {
      // type: mongoose.Schema.Types.ObjectId,
      // ref: "User",
      type: String,
      required: false
    },

    sessionId: {
      type: String,
      required: false
    },

    eventType: {
      type: String,
      enum: [
        "product_viewed",
        "product_searched",
        "recommendation_shown",
        "product_added_to_cart",
        "checkout_started",
        "order_created",
        "payment_completed"
      ],
      required: true
    },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: false
    },

    searchQuery: {
      type: String,
      required: false
    },

    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: false
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

const userEvent = mongoose.model(
  "userEvent",
  userEventSchema
);

export default userEvent;