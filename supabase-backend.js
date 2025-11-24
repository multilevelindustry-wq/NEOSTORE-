// Import Supabase library
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https:                                    
const supabaseKey = '//gnjtwkbzjvvadonlsadr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduanR3a2J6anZ2YWRvbmxzYWRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MzM2NjAsImV4cCI6MjA3OTUwOTY2MH0.thX_phpkFsvw3BBWsVZs48NU1_kWcy9s2AcgSSG6dkI';
const supabase = createClient(supabaseUrl, supabaseKey);

                                 
async function signUp(name, email, password) {
  const { user, error } = await supabase.auth.signUp({
    email,
    password,
  });
  if (error) {
    console.error(error);
    return null;
  }
                                      
  const { data, error: insertError } = await supabase
    .from('// Function to sign up a new user
async function signUp(name, email, password) {
  const { user, error } = await supabase.auth.signUp({
    email,
    password,
  });
  if (error) {
    console.error(error);
    return null;
  }
  // Insert user data into users table
  const { data, error: insertError } = await supabase
    .from('users')
    .insert([{ name, email }]);
  if (insertError) {
    console.error(insertError);
    return null;
  }
  return user;
}

                            
async function logIn(email, password) {
  const { user, error } = await supabase.auth.signIn({
    email,
    password,
  });
  if (error) {
    console.error(error);
    return null;
  }
  return user;
}

                           
async function getProducts() {
  const { data, error } = await supabase
    .from('// Function to log in a user
async function logIn(email, password) {
  const { user, error } = await supabase.auth.signIn({
    email,
    password,
  });
  if (error) {
    console.error(error);
    return null;
  }
  return user;
}

// Function to get products
async function getProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*');
  if (error) {
    console.error(error);
    return [];
  }
  return data;
}

                        
async function addOrder(userId, total) {
  const { data, error } = await supabase
    .from('// Function to add order
async function addOrder(userId, total) {
  const { data, error } = await supabase
    .from('orders')
    .insert([{ user_id: userId, total }]);
  if (error) {
    console.error(error);
    return null;
  }
  return data[0];
}

                             
async function addOrderItem(orderId, productId, quantity, price) {
  const { data, error } = await supabase
    .from('// Function to add order item
async function addOrderItem(orderId, productId, quantity, price) {
  const { data, error } = await supabase
    .from('order_items')
    .insert([{ order_id: orderId, product_id: productId, quantity, price }]);
  if (error) {
    console.error(error);
    return null;
  }
  return data[0];
}

                
async function main() {
                       
  const user = await signUp('// Example usage
async function main() {
  // Sign up a new user
  const user = await signUp('John Doe', 'john@example.com', 'password');
  console.log(user);

                  
  const loggedInUser = await logIn('// Log in a user
  const loggedInUser = await logIn('john@example.com', 'password');
  console.log(loggedInUser);

  // Get products
  const products = await getProducts();
  console.log(products);

  // Add order
  const order = await addOrder(loggedInUser.id, 100);
  console.log(order);

  // Add order item
  const orderItem = await addOrderItem(order.id, 1, 2, 19.99);
  console.log(orderItem);
}

main();
