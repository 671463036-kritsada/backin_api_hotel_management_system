const cartModel = require("../models/cart_model");

async function getCart(userId) {
  return { success: true, data: await cartModel.getCartByUserId(userId) };
}

async function addItem(userId, item) {
  return cartModel.addCartItem(userId, item);
}

async function removeItem(userId, id) {
  const removed = await cartModel.removeCartItem(userId, id);
  return removed
    ? { success: true }
    : { success: false, message: "ไม่พบรายการในตะกร้า" };
}

async function clear(userId) {
  const deleted = await cartModel.clearCart(userId);
  return { success: true, deleted };
}

module.exports = { getCart, addItem, removeItem, clear };
