import AsyncStorage from "@react-native-async-storage/async-storage";
import { MarketplaceProduct } from "@/lib/marketplace-catalog";

const CART_STORAGE_KEY = "@marketplace_cart";

export type CartItem = {
  productId: string;
  quantity: number;
  product: MarketplaceProduct;
};

export type CartSummary = {
  subtotal: number;
  delivery: number;
  total: number;
};

export async function getCartItems(): Promise<CartItem[]> {
  const raw = await AsyncStorage.getItem(CART_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveCartItems(items: CartItem[]) {
  await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}

export async function addToCart(product: MarketplaceProduct, quantity = 1) {
  const items = await getCartItems();
  const current = items.find((item) => item.productId === product.id);

  if (current) {
    current.quantity += quantity;
  } else {
    items.push({ productId: product.id, quantity, product });
  }

  await saveCartItems(items);
  return items;
}

export async function updateCartQuantity(productId: string, quantity: number) {
  const items = await getCartItems();
  const next = items
    .map((item) =>
      item.productId === productId ? { ...item, quantity: Math.max(0, quantity) } : item
    )
    .filter((item) => item.quantity > 0);

  await saveCartItems(next);
  return next;
}

export async function removeFromCart(productId: string) {
  const items = await getCartItems();
  const next = items.filter((item) => item.productId !== productId);
  await saveCartItems(next);
  return next;
}

export async function clearCart() {
  await AsyncStorage.removeItem(CART_STORAGE_KEY);
}

export function summarizeCart(items: CartItem[]): CartSummary {
  const subtotal = items.reduce(
    (acc, item) => acc + Number(item.product.price || 0) * Number(item.quantity || 0),
    0
  );
  const delivery = subtotal >= 299 ? 0 : subtotal > 0 ? 19.9 : 0;
  const total = subtotal + delivery;
  return { subtotal, delivery, total };
}

export function formatMoney(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatCurrencyInputBR(input: string) {
  const digits = String(input || "").replace(/\D/g, "");
  if (!digits) return "";

  const cents = Number(digits) / 100;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents);
}

export function parseCurrencyInputBR(input: string) {
  const normalized = String(input || "")
    .replace(/[R$\s]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}
