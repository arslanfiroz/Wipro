import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private cart: CartItem[] = [];
  private cartCountSubject = new BehaviorSubject<number>(0);
  private cartKey: string;

  constructor() {
    this.cartKey = this.resolveCartKey();

    const stored = this.readCartFromStorage();
    this.cart = stored || [];
    this.updateCartCount();
  }

  onUserChanged(): void {
    this.cartKey = this.resolveCartKey();
    const stored = this.readCartFromStorage();
    this.cart = stored || [];
    this.updateCartCount();
  }

  private resolveCartKey(): string {
    try {
      const userRaw = localStorage.getItem('user');
      const user = userRaw ? JSON.parse(userRaw) : null;
      const email: string = (user && user.email) ? String(user.email) : 'guest';
      const safe = email.toLowerCase().replace(/[^a-z0-9@._-]/g, '');
      return `cart:${safe}`;
    } catch {
      return 'cart:guest';
    }
  }

  private readCartFromStorage(): CartItem[] | null {
    try {
      const v = localStorage.getItem(this.cartKey);
      return v ? JSON.parse(v) : null;
    } catch { return null; }
  }

  private saveCart() {
    localStorage.setItem(this.cartKey, JSON.stringify(this.cart));
    this.updateCartCount();
  }

  private updateCartCount() {
    const total = this.cart.reduce((sum, item) => sum + item.quantity, 0);
    this.cartCountSubject.next(total);
  }

  getCartCount(): Observable<number> {
    return this.cartCountSubject.asObservable();
  }

  getItems(): CartItem[] {
    return [...this.cart];
  }

  addItem(item: CartItem) {
    const existing = this.cart.find(p => p.id === item.id);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      this.cart.push(item);
    }
    this.saveCart();
  }

  removeItem(id: string) {
    this.cart = this.cart.filter(p => p.id !== id);
    this.saveCart();
  }

  updateQuantity(id: string, quantity: number) {
    const item = this.cart.find(p => p.id === id);
    if (item) {
      if (quantity <= 0) {
        this.removeItem(id);
      } else {
        item.quantity = quantity;
        this.saveCart();
      }
    }
  }

  replaceCart(items: CartItem[]) {
    this.cart = [...items];
    this.saveCart();
  }

  clearCart() {
    this.cart = [];
    this.saveCart();
  }
}