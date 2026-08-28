// function CustomerPage() {
//   return (
//     <div className="page-placeholder">
//       <h2>AI Shopping Assistant</h2>
//       <p>Your customer experience will appear here.</p>
//     </div>
//   );
// }

// export default CustomerPage;
import { useEffect, useState } from "react";
import ProductCard from "../components/ProductCard";

import {
  Bot,
  Send,
  ShoppingCart,
  Sparkles,
  User,
  Package,
  ArrowRight,
} from "lucide-react";

const initialMessages = [
  {
    id: 1,
    type: "assistant",
    text: "Hello! 👋 I'm your AI shopping assistant. I can help you discover products, compare prices, find recommendations, manage your cart, and complete your purchase.",
  },
  {
    id: 2,
    type: "assistant",
    text: "What are you looking for today?",
  },
];

const quickActions = [
  "Show me all products",
  "Something for travel",
  "Recommend something for fitness",
  "What's popular?",
];


// Moke Product It has to be removed
const demoProducts = [
  {
    _id: "1",
    name: "Wireless Headphones",
    description:
      "Premium wireless headphones with comfortable ear cushions and long battery life.",
    category: "Electronics",
    price: 2999,
    stock: 12,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
    tags: ["wireless", "audio", "headphones"],
  },
  {
    _id: "2",
    name: "Travel Backpack",
    description:
      "Lightweight everyday backpack with dedicated laptop and travel compartments.",
    category: "Travel & Bags",
    price: 1899,
    stock: 8,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62",
    tags: ["travel", "backpack", "laptop"],
  },
];



function CustomerPage() {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  // const [cartCount] = useState(0);

  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState(null);

  const refreshCart = async () => {
    try {
      const response = await fetch("http://localhost:4000/api/products/cart/current");
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to load cart");
      }

      setCart(
        (data.items || []).map((item) => ({
          ...item,
          _id: item.productId,
        }))
      );

      return data.items || [];
    } catch (error) {
      console.error("Cart error:", error);
    }
  };

  useEffect(() => {
    refreshCart();
  }, []);

  const handleCheckout = async (orderId = null) => {
    setPaymentMessage(null);

    try {
      if (!window.Razorpay) {
        throw new Error("Razorpay Checkout could not be loaded.");
      }

      const response = await fetch("http://localhost:4000/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderId ? { orderId } : {}),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to start payment.");
      }

      const razorpay = new window.Razorpay({
        key: data.keyId,
        amount: data.order.amount,
        currency: data.order.currency,
        name: "AI Commerce Agent",
        description: "Test mode purchase",
        order_id: data.order.id,
        handler: async (paymentResponse) => {
          try {
            const verifyResponse = await fetch(
              "http://localhost:4000/api/payment/verify-payment",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  ...paymentResponse,
                  orderId: data.orderId,
                }),
              }
            );
            const verifyData = await verifyResponse.json();

            if (!verifyResponse.ok || !verifyData.success) {
              throw new Error(verifyData.error || "Payment verification failed.");
            }

            const order = verifyData;
            const orderDetails = order.items
              .map(
                (item) =>
                  `• ${item.productName} × ${item.quantity} — ₹${item.subtotal}`
              )
              .join("\n");

            setMessages((previous) => [
              ...previous,
              {
                id: Date.now(),
                type: "assistant",
                text: `Payment successful! 🎉

Your order has been confirmed.

Order ID: ${order.orderId}

Items:
${orderDetails}

Total: ₹${order.amount}

Payment: Successful

Thank you for shopping with ShopAI!`,
                products: [],
              },
            ]);
            await refreshCart();
            setShowCart(false);
          } catch (error) {
            console.error("Payment verification error:", error);
            setPaymentMessage({
              type: "error",
              text: error.message || "Payment verification failed.",
            });
          }
        },
        modal: {
          ondismiss: () => {
            setPaymentMessage({
              type: "error",
              text: "Payment was cancelled.",
            });
          },
        },
        theme: { color: "#0f766e" },
      });

      razorpay.open();
    } catch (error) {
      console.error("Checkout error:", error);
      setPaymentMessage({
        type: "error",
        text: error.message || "Unable to start payment.",
      });
    }
  };


  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  // const sendMessage = async (messageText = input) => {
  //   const message = messageText.trim();

  //   if (!message || isTyping) return;

  //   setMessages((previous) => [
  //     ...previous,
  //     {
  //       id: Date.now(),
  //       type: "user",
  //       text: message,
  //     },
  //   ]);

  //   setInput("");
  //   setIsTyping(true);

  //   // Temporary response.
  //   // We will replace this with your agent.js API next.
  //   setTimeout(() => {
  //     setMessages((previous) => [
  //       ...previous,
  //       {
  //         id: Date.now() + 1,
  //         type: "assistant",
  //         text: "I'm ready to help! We'll connect this chat to your AI agent next.",
  //       },
  //     ]);

  //     setIsTyping(false);
  //   }, 900);
  // };

  const addProductToCart = async (product) => {
    const response = await fetch("http://localhost:4000/api/products/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product._id, quantity: 1 }),
    });
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Unable to add product to cart");
    }
  };

  const handleAddToCart = async (product) => {
    try {
      await addProductToCart(product);
      await refreshCart();
    } catch (error) {
      console.error("Add to cart error:", error);
    }
  };


  const sendMessage = async (messageText = input) => {
    const message = messageText.trim();

    if (!message || isTyping) return;

    // Show user's message immediately
    setMessages((previous) => [
      ...previous,
      {
        id: Date.now(),
        type: "user",
        text: message,
      },
    ]);

    setInput("");
    setIsTyping(true);

    const lastProductMessage = [...messages]
      .reverse()
      .find(
        (previousMessage) =>
          previousMessage.type === "assistant" &&
          previousMessage.products?.length > 0
      );

    const isAddingDisplayedProducts =
      /^add\s+(these|all)\s+products?(?:\s+to\s+(?:my\s+)?cart)?[.!?]?$/i.test(
        message
      );

    if (isAddingDisplayedProducts && lastProductMessage) {
      try {
        for (const product of lastProductMessage.products) {
          await addProductToCart(product);
        }

        const updatedCart = await refreshCart();
        const totalItems = updatedCart.reduce(
          (total, item) => total + item.quantity,
          0
        );
        setMessages((previous) => [
          ...previous,
          {
            id: Date.now() + 1,
            type: "assistant",
            text: `Added ${lastProductMessage.products.length} products to your cart. Your cart now has ${totalItems} items.`,
            products: [],
          },
        ]);
      } catch (error) {
        console.error("Add displayed products error:", error);
        setMessages((previous) => [
          ...previous,
          {
            id: Date.now() + 1,
            type: "assistant",
            text: "I couldn't add all of those products to your cart.",
            products: [],
          },
        ]);
      } finally {
        setIsTyping(false);
      }

      return;
    }

    try {
      const response = await fetch("http://localhost:4000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Something went wrong");
      }

      console.log("Agent response:", data.response);

      const responseData =
        typeof data.response === "string"
          ? {
            message: data.response,
            products: [],
          }
          : data.response;

      const assistantText =
        typeof responseData?.message === "string"
          ? responseData.message
          : "I'm here to help you shop!";

      const products = Array.isArray(responseData?.products)
        ? responseData.products
        : [];

      setMessages((previous) => [
        ...previous,
        {
          id: Date.now() + 1,
          type: "assistant",
          // text: data.response.message,
          text: assistantText,
          // typeof data.response === "string"
          //   ? data.response
          //   : JSON.stringify(data.response),
          // products: data.response.products || [],
          products,
        },
      ]);
      await refreshCart();

      if (responseData.paymentRequired && responseData.orderId) {
        await handleCheckout(responseData.orderId);
      }
    } catch (error) {
      console.error("Chat error:", error);

      setMessages((previous) => [
        ...previous,
        {
          id: Date.now() + 1,
          type: "assistant",
          text: "Sorry, I couldn't connect to the shopping assistant right now.",
          products: [],
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };


  return (
    <div className="customer-page">
      <div className="chat-layout">
        {/* LEFT SIDEBAR */}
        <aside className="chat-sidebar">
          <div className="assistant-profile">
            <div className="assistant-avatar">
              <Bot size={24} />
            </div>

            <div>
              <h2>ShopAI Assistant</h2>
              <div className="online-status">
                <span />
                Online
              </div>
            </div>
          </div>

          <div className="sidebar-divider" />

          <div className="sidebar-section">
            <span className="sidebar-label">QUICK ACTIONS</span>

            <div className="quick-actions">
              {quickActions.map((action) => (
                <button
                  key={action}
                  className="quick-action"
                  onClick={() => sendMessage(action)}
                >
                  <Sparkles size={15} />
                  <span>{action}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="sidebar-bottom">
            <div className="shopping-stat">
              <Package size={18} />
              <div>
                <strong>Smart shopping</strong>
                <span>AI-powered recommendations</span>
              </div>
            </div>
          </div>
        </aside>

        {/* CHAT AREA */}
        <section className="chat-container">
          <div className="chat-header">
            <div className="chat-header-info">
              <div className="mini-avatar">
                <Bot size={18} />
              </div>

              <div>
                <h3>AI Shopping Assistant</h3>
                <span>Find exactly what you're looking for</span>
              </div>
            </div>

            <button className="cart-button"
              onClick={async () => {
                await refreshCart();
                setShowCart(true);
              }}
            >
              <ShoppingCart size={19} />

              {cartCount > 0 && (
                <span className="cart-badge">{cartCount}</span>
              )}

              <span>Cart</span>
            </button>
          </div>

          {/* MESSAGES */}
          <div className="messages-area">
            <div className="messages-content">
              <div className="welcome-banner">
                <div className="welcome-icon">
                  <Sparkles size={18} />
                </div>

                <div>
                  <strong>AI-powered shopping</strong>
                  <p>
                    Ask me anything about products, prices, availability or
                    recommendations.
                  </p>
                </div>
              </div>

              {/* PRODUCT CARDS  */}
              {/* <div className="product-results"> {demoProducts.map((product) => (<ProductCard key={product._id} product={product} onAddToCart={(product) => { console.log("Add to cart:", product); }} />))} </div> */}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`message-row ${message.type === "user" ? "user-row" : "assistant-row"
                    }`}
                >
                  {message.type === "assistant" && (
                    <div className="message-avatar assistant-message-avatar">
                      <Bot size={16} />
                    </div>
                  )}

                  <div className="message-content-wrapper">

                    <div
                      className={`message-bubble ${message.type === "user"
                        ? "user-message"
                        : "assistant-message"
                        }`}
                    >
                      {message.text}
                    </div>

                    {/**PRODUCTS CARDS */}
                    {message.type === "assistant" && message.products?.length > 0 && (<div className="product-results"> {message.products.map((product) => (<ProductCard key={product._id} product={product} onAddToCart={handleAddToCart} />))} </div>
                    )}

                  </div>

                  {message.type === "user" && (
                    <div className="message-avatar user-message-avatar">
                      <User size={16} />
                    </div>
                  )}

                </div>
              ))}

              {isTyping && (
                <div className="message-row assistant-row">
                  <div className="message-avatar assistant-message-avatar">
                    <Bot size={16} />
                  </div>

                  <div className="typing-indicator">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              )}
            </div>
          </div>

          {paymentMessage && (
            <p className={`payment-message ${paymentMessage.type}`}>
              {paymentMessage.text}
            </p>
          )}

          {/* INPUT */}
          <div className="chat-input-area">
            <div className="chat-input-wrapper">
              <input
                type="text"
                value={input}
                placeholder="Ask me about products, prices, recommendations..."
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    sendMessage();
                  }
                }}
              />

              <button
                className="send-button"
                onClick={() => sendMessage()}
                disabled={!input.trim() || isTyping}
                aria-label="Send message"
              >
                <Send size={18} />
              </button>
            </div>

            <div className="input-footer">
              <span>Powered by ShopAI</span>
              <span>AI can make mistakes</span>
            </div>
          </div>
        </section>

        {/* SHOW CART LAYOUT */}

        {showCart && (
          <div className="cart-overlay">
            <div className="cart-panel">

              <div className="cart-panel-header">
                <div>
                  <h2>Your Cart</h2>
                  <span>{cartCount} item{cartCount !== 1 ? "s" : ""}</span>
                </div>

                <button
                  className="cart-close-button"
                  onClick={() => setShowCart(false)}
                >
                  ×
                </button>
              </div>

              <div className="cart-items">
                {cart.length === 0 ? (
                  <div className="empty-cart">
                    <ShoppingCart size={30} />
                    <p>Your cart is empty</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div className="cart-item" key={item._id}>

                      <img
                        src={item.image}
                        alt={item.name}
                        className="cart-item-image"
                      />

                      <div className="cart-item-info">
                        <h3>{item.name}</h3>

                        <span className="cart-item-price">
                          ₹{item.price}
                        </span>

                        <span className="cart-item-quantity">
                          Quantity: {item.quantity}
                        </span>
                      </div>

                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="cart-footer">

                  <div className="cart-total">
                    <span>Total</span>

                    <strong>
                      ₹
                      {cart.reduce(
                        (total, item) =>
                          total + item.price * item.quantity,
                        0
                      )}
                    </strong>
                  </div>

                  <button className="checkout-button" onClick={handleCheckout}>
                    Proceed to Checkout
                    <ArrowRight size={16} />
                  </button>

                </div>
              )}

            </div>
          </div>
        )}


      </div>
    </div>
  );
}

export default CustomerPage;
