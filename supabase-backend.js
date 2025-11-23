/*
  supabase-backend.js
  Client-side integration between your static site and Supabase.
  - Add this file to your repo and include it AFTER your existing main <script>
  - Replace SUPABASE_URL and SUPABASE_ANON_KEY with values from Supabase project.
  - Optionally set EDGE_FUNC_PAYPAL_URL to your deployed Edge Function create-paypal-order URL.

  Usage:
   <script src="supabase-backend.js"></script>
*/

const SUPABASE_URL = 'https://bjgfqzudzykgiievdbbp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqZ2ZxenVkenlrZ2lpZXZkYmJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4NjM4NDAsImV4cCI6MjA3OTQzOTg0MH0.ch0AbvLN9daDeD7NONuEFJvMjsfOaFnOA4BioF-Hm-0';
const EDGE_FUNC_PAYPAL_URL = null; // e.g. 'https://<project>.functions.supabase.co/create-paypal-order' OR full URL

(async function () {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('supabase-backend: SUPABASE URL/KEY not set — running in local-only fallback mode.');
    return;
  }

  // load supabase client (ESM) using a tiny loader that uses the official ESM build
  if (!window.__supabase_createClient) {
    const loader = document.createElement('script');
    loader.type = 'module';
    loader.textContent = `
      import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
      window.__supabase_createClient = createClient;
    `;
    document.head.appendChild(loader);
    // wait up to ~3s for loader
    let tries = 0;
    while (!window.__supabase_createClient && tries < 30) {
      await new Promise((r) => setTimeout(r, 100));
      tries++;
    }
    if (!window.__supabase_createClient) { console.error('supabase-backend: failed to load supabase client'); return; }
  }

  const supabase = window.supabase = window.__supabase_createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true }
  });

  // Keys used by the original frontend (keeps behavior)
  const SESSION_KEY = 'neo_session_v1';
  const CART_KEY = 'neo_cart_v1';
  const DELIVERY_COUNTRY_KEY = 'neo_delivery_country_v1';

  // Helper to update the same session object shape your UI expects
  async function setLocalSessionFromSupa(user, full_name) {
    if (!user) {
      localStorage.removeItem(SESSION_KEY);
      renderUserUISafe();
      return;
    }
    const payload = { email: user.email, name: full_name || user.user_metadata?.full_name || user.email, loggedAt: Date.now() };
    localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
    // ensure profile row exists
    try {
      await supabase.from('users_profile').upsert({ id: user.id, full_name: payload.name });
    } catch (e) { console.warn('profile upsert failed', e); }
    renderUserUISafe();
  }

  function renderUserUISafe() {
    if (typeof renderUserUI === 'function') return renderUserUI();
    try {
      const u = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
      const t = document.getElementById('user-text-mini');
      if (t) t.textContent = u ? u.name : 'Sign in';
    } catch (e) {}
  }

  // Supabase wrappers
  async function supaCurrentUser() { const { data } = await supabase.auth.getUser(); return data?.user ?? null; }
  async function supaSignup(name, email, password) {
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
    if (error) throw error;
    const user = data?.user;
    if (user) await setLocalSessionFromSupa(user, name);
    return user;
  }
  async function supaLogin(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const user = data?.user;
    // get profile if exists
    const { data: profile } = await supabase.from('users_profile').select('full_name').eq('id', user.id).single().maybeSingle();
    const full_name = profile?.full_name || user.user_metadata?.full_name || email;
    await setLocalSessionFromSupa(user, full_name);
    return user;
  }
  async function supaLogout() {
    await supabase.auth.signOut();
    localStorage.removeItem(SESSION_KEY);
    renderUserUISafe();
  }

  // Expose supaAuth for debugging or custom code
  window.supaAuth = { signup: supaSignup, login: supaLogin, logout: supaLogout, currentUser: supaCurrentUser };

  // Replace original global auth functions if present (wraps them so local fallback is preserved)
  try {
    if (typeof signup === 'function') {
      window._orig_signup = signup;
      window.signup = async function (name, email, password) {
        try { await supaSignup(name, email, password); } catch (err) { throw err; }
        try { window._orig_signup(name, email, password); } catch (e) { /* ignore */ }
      };
    }
    if (typeof login === 'function') {
      window._orig_login = login;
      window.login = async function (email, password) {
        try { await supaLogin(email, password); } catch (err) { throw err; }
        try { window._orig_login(email, password); } catch (e) { /* ignore */ }
      };
    }
    if (typeof logout === 'function') {
      window._orig_logout = logout;
      window.logout = async function () {
        try { await supaLogout(); } catch (err) { /* ignore */ }
        try { window._orig_logout(); } catch (e) { /* ignore */ }
      };
    }
    if (typeof currentUser === 'function') {
      window._orig_currentUser = currentUser;
      window.currentUser = function () {
        const local = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
        if (local) return local;
        return null;
      };
    }
  } catch (e) { console.warn('supabase-backend: failed to wrap existing auth functions', e); }

  // CART SYNC: load/save cart from Supabase 'carts' table (one row per user)
  async function supaLoadCart() {
    const { data: supaUser } = await supabase.auth.getUser();
    const user = supaUser?.user ?? null;
    if (!user) return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    const { data, error } = await supabase.from('carts').select('cart, delivery_country').eq('user_id', user.id).single().maybeSingle();
    if (error) { console.warn('supaLoadCart error', error); return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
    if (!data) return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(data.cart || []));
      if (data.delivery_country) localStorage.setItem(DELIVERY_COUNTRY_KEY, data.delivery_country);
    } catch (e) {}
    return data.cart || [];
  }

  async function supaSaveCart(cart) {
    const { data: supaUser } = await supabase.auth.getUser();
    const user = supaUser?.user ?? null;
    const delivery_country = localStorage.getItem(DELIVERY_COUNTRY_KEY) || null;
    if (!user) {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
      return;
    }
    const payload = { user_id: user.id, cart: cart, delivery_country: delivery_country };
    const { error } = await supabase.from('carts').upsert(payload, { onConflict: 'user_id' });
    if (error) console.warn('supaSaveCart error', error);
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  // Wrap getCart/saveCart/addToCart if they exist so supabase sync is automatic
  try {
    if (typeof getCart === 'function') {
      window._orig_getCart = getCart;
      window.getCart = function () {
        const local = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
        // background fetch from server and update if different
        supaLoadCart().then(serverCart => {
          if (JSON.stringify(serverCart) !== JSON.stringify(local)) {
            try { localStorage.setItem(CART_KEY, JSON.stringify(serverCart)); if (typeof renderMiniCart === 'function') renderMiniCart(); } catch (e) {}
          }
        }).catch(() => {});
        return local;
      };
    } else {
      window.getCart = function () { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); };
    }

    if (typeof saveCart === 'function') {
      window._orig_saveCart = saveCart;
      window.saveCart = function (cart) {
        try { window._orig_saveCart(cart); } catch (e) { localStorage.setItem(CART_KEY, JSON.stringify(cart)); }
        supaSaveCart(cart).catch(e => console.warn(e));
      };
    } else {
      window.saveCart = function (cart) { localStorage.setItem(CART_KEY, JSON.stringify(cart)); supaSaveCart(cart).catch(() => {}); };
    }
  } catch (e) { console.warn('supabase-backend cart wrappers failed', e); }

  try {
    if (typeof addToCart === 'function') {
      window._orig_addToCart = addToCart;
      window.addToCart = function (item) {
        window._orig_addToCart(item);
        const cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
        supaSaveCart(cart).catch(e => console.warn(e));
      };
    }
  } catch (e) { console.warn(e); }

  // Listen for Supabase auth state changes to update local UI and cart
  supabase.auth.onAuthStateChange(async (event, session) => {
    const user = session?.user ?? null;
    if (user) {
      const { data: profile } = await supabase.from('users_profile').select('full_name').eq('id', user.id).single().maybeSingle();
      await setLocalSessionFromSupa(user, profile?.full_name || user.user_metadata?.full_name);
      const serverCart = await supaLoadCart();
      if (serverCart && serverCart.length) {
        localStorage.setItem(CART_KEY, JSON.stringify(serverCart));
        if (typeof renderMiniCart === 'function') renderMiniCart();
      }
    } else {
      // signed out
      try { localStorage.removeItem(SESSION_KEY); renderUserUISafe(); } catch (e) {}
    }
  });

  // createPayPalOrder helper (calls Edge Function). You can call window.createPayPalOrder({subtotal, deliveryFee, total, items})
  window.createPayPalOrder = async function (orderPayload) {
    if (!EDGE_FUNC_PAYPAL_URL) throw new Error('EDGE_FUNC_PAYPAL_URL not configured');
    const res = await fetch(EDGE_FUNC_PAYPAL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error('Edge function failed: ' + txt);
    }
    return res.json();
  };

  // initial sync
  try { await supaLoadCart(); if (typeof renderMiniCart === 'function') renderMiniCart(); } catch (e) {}

  console.log('supabase-backend initialized');
})();
