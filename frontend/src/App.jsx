// import { useState } from "react";

// function App() {
//   const [message, setMessage] = useState("");
//   const [messages, setMessages] = useState([]);

//   const sendMessage = async () => {
//     if (!message.trim()) return;

//     const userMessage = message;

//     setMessages((prev) => [
//       ...prev,
//       {
//         role: "user",
//         content: userMessage,
//       },
//     ]);

//     setMessage("");

//     try {
//       const response = await fetch("http://localhost:4000/api/chat", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           message: userMessage,
//         }),
//       });

//       const data = await response.json();

//       setMessages((prev) => [
//         ...prev,
//         {
//           role: "assistant",
//           content: data.response,
//         },
//       ]);
//     } catch (error) {
//       console.error("Error:", error);

//       setMessages((prev) => [
//         ...prev,
//         {
//           role: "assistant",
//           content: "Sorry, something went wrong.",
//         },
//       ]);
//     }
//   };

//   const handleKeyDown = (e) => {
//     if (e.key === "Enter") {
//       sendMessage();
//     }
//   };

//   return (
//     <div className="app">

//       <header>
//         <h1>🛍️ ShopAgent</h1>
//         <p>Your AI shopping assistant</p>
//       </header>

//       <main className="chat-container">

//         <div className="messages">

//           {messages.length === 0 && (
//             <div className="welcome">
//               <h2>How can I help you today?</h2>
//               <p>
//                 Search for products, check your cart,
//                 get recommendations, or place an order.
//               </p>
//             </div>
//           )}

//           {messages.map((msg, index) => (
//             <div
//               key={index}
//               className={`message ${msg.role}`}
//             >
//               <div className="message-content">
//                 {msg.content}
//               </div>
//             </div>
//           ))}

//         </div>

//         <div className="input-container">

//           <input
//             type="text"
//             placeholder="Ask me about products..."
//             value={message}
//             onChange={(e) => setMessage(e.target.value)}
//             onKeyDown={handleKeyDown}
//           />

//           <button onClick={sendMessage}>
//             Send
//           </button>

//         </div>

//       </main>

//     </div>
//   );
// }

// export default App;

import { useState } from "react";
import { ShoppingBag, Store } from "lucide-react";
import CustomerPage from "./pages/CustomerPage";
import MerchantPage from "./pages/MerchantPage";
// import "./App.css";

function App() {
  const [view, setView] = useState("customer");

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">
            <ShoppingBag size={20} />
          </div>

          <div>
            <h1>ShopAI</h1>
            <span>Intelligent Commerce</span>
          </div>
        </div>

        <div className="view-switcher">
          <button
            className={view === "customer" ? "active" : ""}
            onClick={() => setView("customer")}
          >
            <ShoppingBag size={16} />
            Shopping
          </button>

          <button
            className={view === "merchant" ? "active" : ""}
            onClick={() => setView("merchant")}
          >
            <Store size={16} />
            Merchant
          </button>
        </div>
      </header>

      <main>
        {view === "customer" ? <CustomerPage /> : <MerchantPage />}
      </main>
    </div>
  );
}

export default App;
