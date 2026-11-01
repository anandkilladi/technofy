require("dotenv").config();

const express = require("express");
const Stripe = require("stripe");
const path = require("path");

const app = express();
const port = Number(process.env.PORT) || 4242;
const appUrl = process.env.APP_URL || `http://localhost:${port}`;
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

const products = new Map([
  [1, { name: "Studio Headphones", price: 12900 }],
  [2, { name: "Arc Desk Lamp", price: 8900 }],
  [3, { name: "Pocket Speaker", price: 6800 }],
  [4, { name: "Everyday Keyboard", price: 9900 }],
  [5, { name: "Quiet ANC Earbuds", price: 11900 }],
  [6, { name: "Magnetic Charger", price: 4500 }],
  [7, { name: "Field Notes Tablet", price: 17900 }],
  [8, { name: "Braided USB-C Set", price: 2400 }]
]);

app.use(express.json({ limit: "10kb" }));

app.post("/api/create-checkout-session", async (req, res) => {
  if (!stripe) return res.status(503).json({ error: "Checkout is not configured. Add your Stripe test key to .env." });

  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0 || items.length > products.size) {
    return res.status(400).json({ error: "Your bag is empty or invalid." });
  }

  const quantities = new Map();
  for (const item of items) {
    const id = Number(item?.id);
    const quantity = Number(item?.quantity);
    if (!products.has(id) || !Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
      return res.status(400).json({ error: "One or more items in your bag are invalid." });
    }
    quantities.set(id, (quantities.get(id) || 0) + quantity);
    if (quantities.get(id) > 10) return res.status(400).json({ error: "Maximum quantity per product is 10." });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [...quantities].map(([id, quantity]) => {
        const product = products.get(id);
        return {
          quantity,
          price_data: {
            currency: "usd",
            unit_amount: product.price,
            product_data: { name: product.name }
          }
        };
      }),
      success_url: `${appUrl}/?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/?checkout=cancelled`
    });
    res.json({ url: session.url });
  } catch (error) {
    console.error("Stripe Checkout session creation failed:", error.message);
    res.status(502).json({ error: "Unable to start checkout. Please try again." });
  }
});

app.get("/api/checkout-session", async (req, res) => {
  if (!stripe) return res.status(503).json({ error: "Checkout is not configured." });
  const sessionId = req.query.session_id;
  if (typeof sessionId !== "string" || !sessionId.startsWith("cs_")) {
    return res.status(400).json({ error: "Invalid checkout session." });
  }
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    res.json({ payment_status: session.payment_status });
  } catch (error) {
    console.error("Stripe Checkout session lookup failed:", error.message);
    res.status(404).json({ error: "Checkout session not found." });
  }
});

app.use(express.static(path.join(__dirname)));

app.listen(port, () => {
  console.log(`Technofy is running at ${appUrl}`);
});