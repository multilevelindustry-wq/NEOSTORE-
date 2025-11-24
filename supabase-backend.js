// ======================================
// 🔥 SUPABASE CONFIG
// ======================================
const SUPABASE_URL = "https://cdexhafusqreigjzjgsa.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkZXhoYWZ1c3FyZWlnanpqZ3NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4ODE5NTYsImV4cCI6MjA3OTQ1Nzk1Nn0.ugmBTZeEXOcAPPFXPeA_-Akbnwjfjz9Efl4EcTXy_sY"



const supabase = supabase.createClient(https://cdexhafusqreigjzjgsa.supabase.co, eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkZXhoYWZ1c3FyZWlnanpqZ3NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4ODE5NTYsImV4cCI6MjA3OTQ1Nzk1Nn0.ugmBTZeEXOcAPPFXPeA_-Akbnwjfjz9Efl4EcTXy_sY"
);

// ======================================
// 🔥 AUTH — SIGN UP / LOGIN
// ======================================

async function signUp(email, password) {
  let { data, error } = await supabase.auth.signUp({
    email: email,
    password: password
  });

  if (error) {
    alert("Signup Error: " + error.message);
    return;
  }

  alert("Signup successful! Check your email.");
}

async function login(email, password) {
  let { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password
  });

  if (error) {
    alert("Login Error: " + error.message);
    return;
  }

  alert("Login Successful!");
  loadCart();
}

// Check if logged-in
async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data?.user || null;
}

// ======================================
// 🔥 CART FUNCTIONS
// ======================================

// Add Cart Item
async function addToCart(product) {
  const user = await getCurrentUser();
  if (!user) {
    alert("Please login first!");
    return;
  }

  let { error } = await supabase
    .from("cart")
    .insert({
      user_id: user.id,
      product_id: product.id,
      title: product.title,
      price: product.price,
      image: product.image,
      quantity: 1
    });

  if (error) {
    alert("Failed to add to cart");
  } else {
    alert("Added to cart");
    loadCart();
  }
}

// Load Cart
async function loadCart() {
  const user = await getCurrentUser();
  if (!user) return;

  let { data, error } = await supabase
    .from("cart")
    .select("*")
    .eq("user_id", user.id);

  if (error) return;

  document.getElementById("cart-count").textContent = data.length;
}

// Remove from Cart
async function removeCart(id) {
  let { error } = await supabase.from("cart").delete().eq("id", id);

  if (!error) {
    loadCart();
  }
}

// ======================================
// 🔥 PAYPAL ORDER SAVE
// ======================================

async function saveOrder(cartItems, amount) {
  const user = await getCurrentUser();
  if (!user) return;

  let { error } = await supabase.from("orders").insert({
    user_id: user.id,
    cart_items: cartItems,
    amount: amount,
  });

  if (!error) {
    supabase.from("cart").delete().eq("user_id", user.id);
    loadCart();
    alert("Order saved successfully!");
  }
}

// ======================================
// 🔥 LINK TO YOUR HTML BUTTONS
// ======================================
document.getElementById("add-to-cart").addEventListener("click", () => {
  addToCart({
    id: "001",
    title: document.getElementById("product-title").textContent,
    price: parseFloat(document.getElementById("product-price").textContent.replace("$", "")),
    image: document.getElementById("product-image").src
  });
});

// Buy Now Button
document.getElementById("buy-now").addEventListener("click", () => {
  alert("Proceeding to PayPal checkout...");
});

// Load cart automatically on page load
loadCart();
