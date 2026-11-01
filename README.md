# Technofy

## Run locally

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and set `STRIPE_SECRET_KEY` to a test secret from your Stripe Dashboard.
3. Run `npm run dev` and open [http://localhost:4242](http://localhost:4242).

The checkout uses Stripe-hosted Checkout in payment mode. Product names and prices are validated on the server. Use Stripe test mode and a test card such as `4242 4242 4242 4242`; never put a Stripe secret key in browser code or commit `.env`.