import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import { createOrder } from "../tools/productTools.js";
import { trackEvent } from "../utils/trackEvent.js";
import { createAuditLog } from "../utils/createAuditLog.js";

const router = express.Router();
const demoUserId = "demo-user";

const getRazorpay = () => new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

router.post("/create-order", async (req, res) => {
  try {
    const localOrder = req.body.orderId
      ? await Order.findOne({
        _id: req.body.orderId,
        userId: demoUserId,
        status: "confirmed",
      })
      : await createOrder(demoUserId);

    if (localOrder && localOrder.success === false) {
      return res.status(400).json(localOrder);
    }

    if (!localOrder) {
      return res.status(404).json({
        success: false,
        error: "Order not found for payment.",
      });
    }

    const localOrderId = localOrder.orderId || localOrder._id;
    const localOrderAmount = localOrder.totalAmount;

    if (!localOrderId) {
      return res.status(404).json({
        success: false,
        error: "Order not found for payment.",
      });
    }

    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount: Math.round(localOrderAmount * 100),
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1,
    });

    await Order.findByIdAndUpdate(localOrderId, {
      razorpayOrderId: order.id,
    });

    res.json({
      success: true,
      order,
      orderId: localOrderId,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Razorpay order error:", error);

    res.status(500).json({
      success: false,
      error: "Unable to create payment order",
    });
  }
});

router.post("/verify-payment", async (req, res) => {
  try {
    const {
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
      orderId,
    } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !orderId) {
      return res.status(400).json({
        success: false,
        error: "Payment details are required.",
      });
    }

    const existingOrder = await Order.findOne({
      _id: orderId,
      userId: demoUserId,
      razorpayOrderId,
    });

    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        error: "Order not found for this payment.",
      });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    const signaturesMatch = expectedSignature.length === razorpaySignature.length
      && crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(razorpaySignature)
      );

    if (!signaturesMatch) {
      return res.status(400).json({
        success: false,
        error: "Invalid payment signature.",
      });
    }

    if (existingOrder.status !== "paid") {
      existingOrder.status = "paid";
      existingOrder.razorpayPaymentId = razorpayPaymentId;
      await existingOrder.save();

      const cart = await Cart.findOne({ userId: demoUserId });
      if (cart) {
        cart.items = [];
        await cart.save();
      }

      await trackEvent({
        userId: demoUserId,
        eventType: "payment_completed",
        orderId: existingOrder._id,
        metadata: {
          amount: existingOrder.totalAmount,
          currency: "INR",
          razorpayPaymentId,
          productIds: existingOrder.items.map((item) => item.productId),
        },
      });

      await createAuditLog({
        userId: demoUserId,
        action: "PAYMENT_COMPLETED",
        entityType: "Order",
        entityId: existingOrder._id,
        details: {
          amount: existingOrder.totalAmount,
          currency: "INR",
          razorpayPaymentId,
        },
      });
    }

    return res.json({
      success: true,
      message: "Payment verified successfully.",
      orderId: existingOrder._id,
      amount: existingOrder.totalAmount,
      items: existingOrder.items,
      status: existingOrder.status,
    });
  } catch (error) {
    console.error("Razorpay payment verification error:", error);

    return res.status(500).json({
      success: false,
      error: "Unable to verify payment.",
    });
  }
});

export default router;
