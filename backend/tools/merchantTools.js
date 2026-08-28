import userEvent from "../models/userEvent.js";
import Product from "../models/Product.js";
import { createAuditLog } from "../utils/createAuditLog.js";

export async function getCampaignOpportunities() {
  try {
    const events = await userEvent.find().lean();

    const opportunities = [];

    // High INTEREST / Low Conversion
    const searchCounts = {};

    events.filter(event => event.eventType === "product_searched").forEach(event => {
      if (!event.productId) return;

      const productId = event.productId.toString();

      searchCounts[productId] =
        (searchCounts[productId] || 0) + 1;
    });

    const purchaseCounts = {};

    events
      .filter(event => event.eventType === "payment_completed")
      .forEach(event => {
        const productIds = event.metadata?.productIds || [];

        productIds.forEach(productId => {
          const id = productId.toString();

          purchaseCounts[id] = (purchaseCounts[id] || 0) + 1;
        });
      });

    for (const [productId, searches] of Object.entries(searchCounts)) {
      const purchases = purchaseCounts[productId] || 0;

      if (searches < 3) continue;

      const conversionRate =
        (purchases / searches) * 100;

      if (conversionRate < 10) {
        const product =
          await Product.findById(productId).lean();

        if (!product) continue;

        opportunities.push({
          type: "promotion",
          priority: "high",

          productId: product._id,
          productName: product.name,

          reason:
            `${searches} searches but only ${purchases} purchases (${conversionRate.toFixed(1)}% conversion).`,

          suggestedAction:
            "Consider a limited-time discount or promotional offer.",
        });
      }
    }


    // Strong CROSS SELL OPPORTUNITY

    const recommendationCounts = {};
    const recommendationCartCounts = {};

    events.filter(
      event => event.eventType === "recommendation_shown"
    )
      .forEach(event => {
        if (!event.productId) return;

        const productId =
          event.productId.toString();

        recommendationCounts[productId] =
          (recommendationCounts[productId] || 0) + 1;
      });

    events.filter(event =>
      event.eventType === "product_added_to_cart"
    )
      .forEach(event => {
        if (!event.productId) return;

        const productId = event.productId.toString();

        recommendationCartCounts[productId] =
          (recommendationCartCounts[productId] || 0) + 1;
      });

    for (const [productId, shown] of Object.entries(recommendationCounts)) { const addedToCart = recommendationCartCounts[productId] || 0; if (shown < 3 || addedToCart < 2) { continue; } const cartRate = (addedToCart / shown) * 100; if (cartRate >= 20) { const product = await Product.findById(productId).lean(); if (!product) continue; opportunities.push({ type: "cross_sell", priority: "medium", productId: product._id, productName: product.name, reason: `${product.name} was recommended ${shown} times and added to carts ${addedToCart} times (${cartRate.toFixed(1)}% cart rate).`, suggestedAction: "Promote this product more frequently as a complementary recommendation." }); } }


    // LOW STOCK + HIGH INTEREST
    for (const [productId, searches] of Object.entries(searchCounts)) { const product = await Product.findById(productId).lean(); if (!product) continue; if (product.stock > 0 && product.stock <= 5 && searches >= 3) { opportunities.push({ type: "inventory_alert", priority: "high", productId: product._id, productName: product.name, reason: `${product.name} has only ${product.stock} units remaining while receiving ${searches} searches.`, suggestedAction: "Consider replenishing inventory before launching a promotion." }); } }

    //REMOVE Duplicates
    const uniqueOpportunities = []; const seen = new Set(); for (const opportunity of opportunities) { const key = `${opportunity.type}-${opportunity.productId}`; if (seen.has(key)) continue; seen.add(key); uniqueOpportunities.push(opportunity); }

    // Priority Order
    const priorityScore = { high: 3, medium: 2, low: 1 }; uniqueOpportunities.sort((a, b) => priorityScore[b.priority] - priorityScore[a.priority]);

    const finalOpportunities =
      uniqueOpportunities.slice(0, 10);

    // Audit Trail

    await createAuditLog({
      action: "CAMPAIGN_OPPORTUNITIES_GENERATED",
      entityType: "Campaign",
      details: {
        opportunityCount: finalOpportunities.length,
        highPriority: finalOpportunities.filter(
          opportunity => opportunity.priority === "high"
        ).length,
        mediumPriority: finalOpportunities.filter(
          opportunity => opportunity.priority === "medium"
        ).length
      }
    });

    // RETURN RESULT
    return { success: true, opportunityCount: uniqueOpportunities.length, opportunities: uniqueOpportunities.slice(0, 10) };
  } catch (error) {
    console.error("getCampaignOpportunities error:", error); return { success: false, opportunityCount: 0, opportunities: [], error: "Unable to generate campaign opportunities." };
  }
}