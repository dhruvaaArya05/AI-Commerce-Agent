# 🤖 ShopAI — AI-Powered Agentic Commerce

An AI shopping agent that makes merchants directly transactable by AI buyers — from product discovery to cart, checkout, payment, order completion, and merchant intelligence.

# 🏆 Razorpay Track 01 — AI Growth & Agentic Commerce

ShopAI is an AI-powered commerce agent that connects the customer and merchant sides of commerce through a single intelligent workflow.

A customer can interact with the store conversationally, discover products, receive recommendations, manage their cart, proceed to checkout, and complete a payment through Razorpay Test Mode.

On the merchant side, the platform provides commerce intelligence, revenue information, campaign opportunities, and an audit trail for money-related actions.

The goal is simple:

Make a merchant transactable by an AI buyer end-to-end while keeping every money action explainable, bounded, and gated.

# 🎯 Problem

Traditional e-commerce requires customers to manually:

- Browse products
- Search and filter
- Compare products
- Add products to cart
- Navigate to checkout
- Complete payment

This creates friction between customer intent and transaction.

At the same time, merchants need better ways to understand customer activity and turn commerce data into actionable growth opportunities.

ShopAI addresses both sides through an agentic commerce architecture.

# 💡 What ShopAI Does
Customer / AI Buyer

The customer can simply talk to the AI:

"What products do you have?"

"I need something for fitness."

"Recommend something under ₹3000."

"Add the Resistance Bands to my cart."

"What's in my cart?"

"Proceed to checkout."

The agent interacts with the backend and performs real commerce operations rather than only generating text.

Merchant

The merchant receives:

- Revenue information
- Order information
- Product/stock intelligence
- Campaign opportunities
- Commerce activity
- Payment/order events
- Audit trail for money-related actions

# 🚀 Core Features
## 1. 🤖 Agent-Readable Product Catalog

The AI can query the merchant's product catalog and understand:

- Product name
- Description
- Category
- Price
- Stock availability
- Product ID
- Tags

Example:

User:
"What all products do you have?"

AI:
"Here's our complete product catalog with 23 items..."

The catalog is backed by the application's product database rather than being a static response.

## 2. 🛍️ AI Product Discovery

Customers can discover products using natural language.

Examples:

"Show me all products."

"Something for travel."

"What do you recommend for fitness?"

"I need something under ₹3000."

The agent interprets the customer's intent and uses available product information to provide relevant results.

## 3. ✨ AI Recommendations

The agent can recommend products based on:

- Customer intent
- Product category
- Price
- Availability
- Product characteristics

It can also suggest complementary products where appropriate.

Example:

User:
"I want something for strength training."

AI:
"Based on your requirement, I recommend the Dumbbell Set..."
## 4. 🛒 Conversational Cart

Customers can manage their cart directly through conversation.

Example:

User:
"Add the Resistance Bands to my cart."

AI:
"1 Resistance Bands added to your cart."

The operation invokes the backend cart functionality and persists the cart state.

Customers can then ask:

"What's in my cart?"

The AI retrieves the current cart state.

UI + AI Synchronization

The cart is synchronized between:
```
AI Agent
    ↓
Backend Cart API
    ↓
Database
    ↓
Customer UI
```

So adding a product through the AI or through the Add to Cart button updates the same underlying cart.

## 💳 Conversational Checkout

The customer can initiate checkout directly through the AI.

Example:

User:
"Proceed to checkout."

The application then moves from:
```
Conversation
      ↓
Cart
      ↓
Checkout
      ↓
Payment
      ↓
Order
```
This creates an in-app conversational commerce experience rather than requiring the customer to manually navigate through multiple pages.

# 💰 Razorpay Test Mode Integration

ShopAI integrates Razorpay Test Mode for the payment flow.

Razorpay provides separate Test and Live modes, with Test Mode using separate API keys and simulated transactions.

Our payment flow is:
```
Customer
   ↓
AI initiates checkout
   ↓
Backend validates cart
   ↓
Backend creates Order
   ↓
Razorpay Test Checkout
   ↓
Customer completes test payment
   ↓
Razorpay returns payment details
   ↓
Backend verifies Razorpay signature
   ↓
Payment verified?
   ├── ❌ No → Payment failed → Cart remains
   │
   └── ✅ Yes
          ↓
      Mark Order as Paid
          ↓
      Record Audit Event
          ↓
      Clear Cart
          ↓
      AI confirms order to Customer
```
The backend creates the Razorpay order before checkout, following Razorpay's recommended order flow.

After checkout, the returned payment information is verified server-side using the Razorpay signature before the application treats the payment as successful.

No real money is involved. The project uses Razorpay Test Mode for demonstration and development.

# 🔐 Payment Security

The payment flow does not trust the frontend alone.

The backend verifies:

- razorpay_order_id
- razorpay_payment_id
- razorpay_signature

The signature is verified server-side using the Razorpay secret.

Only after successful verification does the application:

- Mark the payment/order as successful
- Confirm the order
- Clear the cart
- Record the successful payment event

Razorpay specifically recommends server-side signature verification before fulfilling an order.

# 🧾 Explainable Money Actions

Money-related operations are treated differently from normal conversational responses.

For example:
```
AI requests checkout
        ↓
Backend validates cart
        ↓
Order created
        ↓
Razorpay processes payment
        ↓
Backend verifies payment
        ↓
Order confirmed
        ↓
Audit event recorded
```
This means the AI cannot simply say:

"Payment successful"

and cause the system to trust that statement.

The actual payment state comes from the backend/payment verification flow.

# 📋 Audit Trail

ShopAI maintains an audit trail for important commerce and money-related events.

Example:

Action:
Payment

Order:
ORD-XXXX

Amount:
₹3700

Status:
Successful

Timestamp:
2026-XX-XX

User:
Customer

This makes the system more transparent and helps answer:

- What action happened?
- Who triggered it?
- Which order was affected?
- What amount was involved?
- Was it successful or failed?
- When did it happen?

This addresses the requirement that money actions should be explainable and traceable rather than hidden inside the AI agent.

# 🛡️ Bounded & Gated Agent Actions

The AI is not given unrestricted access to the database.

Commerce actions go through backend functions/tools such as:

- searchProducts
- checkStock
- getProductDetails
- addToCart

Payment-related actions are additionally protected by backend validation and Razorpay verification.

For example, adding a product to the cart checks:
```
Product exists?
       ↓
Enough stock?
       ↓
Update cart
       ↓
Track event
```
Similarly, payment completion requires successful verification before the order is finalized.

# ❌ Failure Handling

The system also handles failure paths.

For example:
```
Payment initiated
      ↓
Payment cancelled / failed
      ↓
Order NOT treated as successfully paid
      ↓
Customer receives failure state
      ↓
Cart remains available
```
This prevents a failed payment from accidentally becoming a successful order.

# 📈 Merchant Intelligence Dashboard

The merchant dashboard provides a second perspective of the same commerce system.

The merchant can view information such as:

- Revenue
- Orders
- Product performance
- Products requiring attention
- Commerce activity
- Campaign opportunities
- Audit events

The objective is to move from:

"Here are my transactions."

to:

"Here is what my commerce data is telling me to do next."

# ✨ Campaign Opportunities

The merchant dashboard provides an area for AI-generated campaign opportunities.

These can be used to identify potential growth actions such as:
```
Product promotion
        ↓
Cross-selling
        ↓
Customer targeting
        ↓
Campaign opportunity
```
This connects the transaction layer with the merchant revenue-growth side of the problem statement.

# 🏗️ Architecture

                    ┌──────────────────────┐
                    │      Customer        │
                    │   AI Shopping UI     │
                    └──────────┬───────────┘
                               │
                               │ Chat
                               ▼
                    ┌──────────────────────┐
                    │      AI Agent        │
                    │  Tool Calling Layer  │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
       Product Tools      Cart Tools      Checkout Tools
              │                │                │
              └────────────────┼────────────────┘
                               ▼
                    ┌──────────────────────┐
                    │     Node / Express   │
                    │       Backend        │
                    └──────────┬───────────┘
                               │
                 ┌─────────────┼─────────────┐
                 ▼             ▼             ▼
             MongoDB       Razorpay      Audit/Event
                           Test Mode        Tracking
                 │             │             │
                 └─────────────┼─────────────┘
                               ▼
                    ┌──────────────────────┐
                    │ Merchant Dashboard   │
                    │ Revenue + Intelligence│
                    │ + Audit Trail         │
                    └──────────────────────┘
# 🧰 Tech Stack
Frontend

- React.js
- JavaScript
- CSS
- Lucide React

Backend

- Node.js
- Express.js

Database
- MongoDB
- Mongoose

AI

- LLM-powered agent
- Function/tool calling
- Product and commerce tools

Payments
- Razorpay Test Mode
- Razorpay Orders API
- Razorpay Checkout
- Server-side payment signature verification

Development
- Git
- GitHub
- VS Code

🔧 Agent Tools

The agent can interact with the commerce backend through dedicated tools.
```
Tool	            Purpose
searchProducts	    Search the product catalog
checkStock	        Check product availability
getProductDetails   Retrieve product information
addToCart	        Add products to the customer's cart
```
These tools allow the AI to perform actions rather than simply respond with generated text.

🛒 Example End-to-End Flow
```
Step 1 — Discover
User:
"What all products do you have?"
Step 2 — Recommend
User:
"Recommend something for fitness."
Step 3 — Add
User:
"Add the Resistance Bands to my cart."
Step 4 — Verify Cart
User:
"What's in my cart?"
Step 5 — Checkout
User:
"Proceed to checkout."
Step 6 — Payment
Razorpay Test Mode
        ↓
Test Payment
        ↓
Server Verification
Step 7 — Confirmation
AI:
"Payment successful.
Your order has been confirmed.

Order: ORD-XXXX
Items: ...
Total: ₹XXXX"
Step 8 — Merchant
Merchant Dashboard
        ↓
Revenue
Orders
Product Intelligence
Campaign Opportunities
Audit Trail
```
# 🧪 Running the Project Locally
```
1. Clone the repository
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd <PROJECT_FOLDER>

2. Install frontend dependencies
cd frontend
npm install

3. Install backend dependencies
cd ../backend
npm install

4. Configure environment variables

Create a .env file in the backend:

MONGO_URI=your_mongodb_connection_string

RAZORPAY_KEY_ID=rzp_test_xxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx

Use Razorpay Test Mode keys, not Live Mode keys. Razorpay maintains separate credentials for Test and Live modes.

Never commit your .env file or Razorpay secret to GitHub.

5. Start backend
cd backend
node app.js

Backend:

http://localhost:4000
6. Start frontend
cd frontend
npm run dev
```
# 🔑 Environment Variables
```
Variable            Description
MONGO_URI	        MongoDB connection string
RAZORPAY_KEY_ID	    Razorpay Test Mode Key ID
RAZORPAY_KEY_SECRET	Razorpay Test Mode secret
PORT	            Backend server port
```
# 🧪 Testing

The complete application can be tested using the following flow:

- ✓ Product discovery
- ✓ AI recommendations
- ✓ Product details
- ✓ Stock checking
- ✓ Add to cart through UI
- ✓ Add to cart through AI
- ✓ Cart synchronization
- ✓ Conversational checkout
- ✓ Razorpay Test Mode
- ✓ Payment verification
- ✓ Successful order creation
- ✓ Cart clearing
- ✓ Payment failure handling
- ✓ Merchant dashboard
- ✓ Revenue/order information
- ✓ Audit trail

Razorpay Test Mode provides simulated transactions and does not involve real money.

# 🔒 Security Notes
- Razorpay secrets are stored server-side.
- Test keys are used for development/demo.
- Payment signatures are verified on the backend.
- Stock is validated before adding products.
- Payment success is not trusted from the frontend alone.
- Failed payments do not automatically become successful orders.
- .env files should never be committed.

# 🎥 Demo Flow

The recommended demonstration is:
```
Customer
   ↓
"What all products do you have?"
   ↓
AI Product Discovery
   ↓
"Recommend something for fitness."
   ↓
AI Recommendation
   ↓
"Add this to my cart."
   ↓
Cart Synchronization
   ↓
"What's in my cart?"
   ↓
"Proceed to checkout."
   ↓
Razorpay Test Mode
   ↓
Successful Payment
   ↓
AI Order Confirmation
   ↓
Merchant Dashboard
   ↓
Revenue / Orders
   ↓
Audit Trail
```
The demo demonstrates the complete AI buyer → merchant transaction loop rather than isolated features.

# 🔮 Future Improvements

Potential extensions include:

- More advanced personalized recommendations
- Automated campaign execution
- Agent-to-agent commerce
- Customer preference memory
- Advanced merchant analytics
- Webhook-driven payment reconciliation
- Automated upsell/cross-sell campaigns
- More payment methods

## 👨‍💻 Built by:
Dhruva Keshav Arya
dhruvaa866@gmail.com

Built for Razorpay Hackathon — Track 01: AI Growth & Agentic Commerce

“An end-to-end agentic commerce prototype where the AI can discover products, take bounded commerce actions, complete a verified Razorpay Test Mode transaction, and expose the resulting merchant activity through an intelligence dashboard and audit trail.”
