import express from "express";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import AuditLog from "../models/auditLog.js";
import { getMerchantInsights } from "../tools/productTools.js";
import { getCampaignOpportunities } from "../tools/merchantTools.js";

const router = express.Router();

router.get("/audit-logs", async (_req, res) => {
  try {
    const auditLogs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.json({ success: true, auditLogs });
  } catch (error) {
    console.error("Audit log fetch error:", error);
    res.status(500).json({
      success: false,
      error: "Unable to load audit trail.",
    });
  }
});

router.get("/dashboard", async (_req, res) => {
  try {
    const [products, orders, insights, campaigns] = await Promise.all([
      Product.find().sort({ createdAt: -1 }).lean(),
      Order.find().sort({ createdAt: -1 }).lean(),
      getMerchantInsights(),
      getCampaignOpportunities(),
    ]);

    if (!insights.success || !campaigns.success) {
      return res.status(500).json({
        success: false,
        error: insights.error || campaigns.error,
      });
    }

    const paidOrders = orders.filter((order) => order.status === "paid");

    res.json({
      success: true,
      stats: {
        totalProducts: products.length,
        totalOrders: orders.length,
        revenue: paidOrders.reduce(
          (total, order) => total + (order.totalAmount || 0),
          0
        ),
        lowStock: products.filter((product) => product.stock <= 5).length,
      },
      insights,
      campaigns: campaigns.opportunities,
      inventory: products,
      recentOrders: orders.slice(0, 5),
    });
  } catch (error) {
    console.error("Merchant dashboard error:", error);
    res.status(500).json({
      success: false,
      error: "Unable to load merchant dashboard.",
    });
  }
});

export default router;