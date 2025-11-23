// Supabase init
const supabase = supabase.createClient(
  "https://YOUR_URL.supabase.co",
  "YOUR_ANON_KEY"
);


async function signUpUser(email, password, fullName, phone) {
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
    options: {
      data: { full_name: fullName, phone: phone }
    }
  });

  if (error) {
    alert("Sign up error: " + error.message);
    return;
  }

  alert("Account created successfully! Please verify your email.");
}


async function loginUser(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    alert("Login failed: " + error.message);
    return;
  }

  alert("Logged in!");
}


async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}


async function logout() {
  await supabase.auth.signOut();
  alert("Logged out!");
}


async function addToCart(productId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    alert("Please log in first.");
    return;
  }

  const { error } = await supabase
    .from("cart")
    .insert({ user_id: user.id, product_id: productId });

  if (error) {
    alert("Error adding to cart: " + error.message);
    return;
  }

  alert("Added to cart!");
}


async function getCart() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("cart")
    .select("id, quantity, products (*)")
    .eq("user_id", user.id);

  if (error) {
    console.log(error);
    return [];
  }

  return data;
}



async function removeFromCart(cartId) {
  const { error } = await supabase
    .from("cart")
    .delete()
    .eq("id", cartId);

  if (error) {
    alert("Error removing item.");
  } else {
    alert("Removed!");
  }
}



