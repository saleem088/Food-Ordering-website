# Tasty Bites project guide

## Project flow

1. Guests browse the public menu and add available items to a browser-stored cart.
2. Customers register or sign in. The API issues a short-lived JWT for protected actions.
3. Checkout sends item IDs and quantities, plus delivery details. The API checks availability and reloads all prices from SQLite before creating the order.
4. Customers track or cancel eligible orders. Administrators manage menu items, categories, users, and order status through protected API routes.

The browser cart is only a convenience: the server is authoritative for stock availability, prices, totals, validation, and permissions.

## Local setup

Requirements: Node.js 20 or newer and npm.

1. In `server`, install dependencies with `npm install`.
2. Create `server/.env` from `server/.env.example` if it does not already exist. Preserve existing local settings, set a unique `JWT_SECRET` and `ADMIN_PASSWORD`, and never commit `.env`.
3. Start the application with `npm run dev`. The API is available at `http://localhost:5000/api`, and its health endpoint is `/api/health`.
4. Open `http://localhost:5000/` to use the website. The server serves the client and API from the same origin.
5. To run backend tests, run `npm test` from `server`.

If you serve the client separately instead, the configured `CLIENT_ORIGINS` must exactly include its browser origin (scheme, hostname, and port). For a different client port or host, update that setting before starting the API.

## Repository map

- `client/`: static HTML, CSS, and browser modules.
- `server/routes/`: URL-to-handler wiring and route-level validation.
- `server/controllers/`: authentication, menu, order, and admin business logic.
- `server/middleware/`: authentication, request validation, and error handling.
- `server/database/`: SQLite schema and first-run sample menu seed.
- `server/tests/`: API-level checks for authentication and ordering.

## Operational notes

- Card payment is a demonstration option only; no card information is processed or stored.
- Menu food photos are loaded and cached by the API from TheMealDB; the drinks category uses an Unsplash photo. If photo services are unavailable, menu cards fall back to their food icons. TheMealDB's public test key is intended for educational use; obtain a production key before distributing through an app store.
- The default development admin credentials are intentionally not suitable for deployment. Set `ADMIN_EMAIL` and a strong `ADMIN_PASSWORD` before the database is initialized.
- Back up the SQLite database file before upgrades or operational changes.
- Production deployments should serve the client and API over HTTPS, restrict CORS to the real client origin, use a unique secret, and store environment variables in the deployment platform's secret manager.
