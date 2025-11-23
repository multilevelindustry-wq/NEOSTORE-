NEOSTORE — Supabase Backend + GitHub Pages deployment notes

1) GitHub Pages (frontend)
 - Put your HTML, CSS and JS files in the repo root (or /docs).
 - Add `supabase-backend.js` to the repo.
 - Edit your index.html to include: <script src="supabase-backend.js"></script> after your main script (see below).
 - Push to GitHub. In repo settings -> Pages -> choose branch (main) and root (/) or /docs.

2) Supabase setup (backend)
 - Create an account at https://app.supabase.com and create a new project.
 - In Project → Settings → API get Project URL and anon key. Use anon key in supabase-backend.js.
 - Go to SQL Editor -> paste and run supabase-sql.sql.

3) Supabase Auth
 - In Authentication -> Settings enable Email + Password provider.

4) Optional Edge Function (PayPal)
 - Install supabase CLI: https://supabase.com/docs/guides/cli
 - Create a function folder (edge-create-paypal-order) with index.js content.
 - Deploy via: supabase functions deploy create-paypal-order --project-ref <project-ref>
 - In Supabase UI, set function env vars PAYPAL_CLIENT_ID and PAYPAL_SECRET
 - Copy function URL into supabase-backend.js EDGE_FUNC_PAYPAL_URL.

5) Important config changes
 - Replace SUPABASE_URL and SUPABASE_ANON_KEY in supabase-backend.js
 - Optionally set EDGE_FUNC_PAYPAL_URL for secure PayPal orders.

6) Testing
 - Visit site on GitHub Pages.
 - Click Sign Up -> register. (This will create a Supabase user and local session.)
 - Add product to cart, go to Cart, ensure cart persists.
 - Try login on another device/browser to confirm cart sync.

