import userEvent from "../models/userEvent.js";

export async function trackEvent({
  userId = null,
  sessionId = null,
  eventType,
  productId = null,
  searchQuery = null,
  orderId = null,
  metadata = {}
}) {
  try {
    if (!eventType) {
      console.warn("trackEvent: eventType is required");
      return null;
    }

    const event = await userEvent.create({
      userId,
      sessionId,
      eventType,
      productId,
      searchQuery,
      orderId,
      metadata
    });

    return event;

  } catch (error) {
    // IMPORTANT:
    // Tracking should NEVER break the shopping experience.
    console.error("Event tracking error:", error);

    return null;
  }
}