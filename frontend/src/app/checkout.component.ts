import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService, Product } from './api.service';
import { CartService, CartItem } from './cart.service';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
  <div class="card" style="padding:16px;">
    <h2>Checkout</h2>

    <!-- CART TABLE -->
    <table *ngIf="items().length && !orderPlaced">
      <thead>
        <tr>
          <th>Product</th>
          <th>Qty</th>
          <th>Price</th>
          <th>Subtotal</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let it of items(); index as i">
          <td>{{it.name}}</td>
          <td>{{it.quantity}}</td>
          <td>₹{{it.price}}</td>
          <td>₹{{(it.price*it.quantity).toFixed(2)}}</td>
          <td><button class="secondary" (click)="remove(it.id)">Remove</button></td>
        </tr>
      </tbody>
    </table>

    <div *ngIf="!items().length && !orderPlaced" class="muted">
      Your cart is empty. <a routerLink="/">Continue shopping</a>
    </div>

    <!-- TOTAL + CHECKOUT -->
    <div class="row" style="justify-content:space-between; margin-top:12px;" *ngIf="!orderPlaced">
      <div style="font-weight:800">Total: ₹{{total()}}</div>
      <button (click)="checkout()" [disabled]="!items().length">Place Order</button>
    </div>

    <!-- ORDER CONFIRMATION -->
    <div *ngIf="orderPlaced" style="margin-top:10px">
      <p style="color:green; font-weight:600">{{message}}</p>

      <h3>Ordered Items:</h3>
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let it of lastOrder">
            <td>{{it.name}}</td>
            <td>{{it.quantity}}</td>
            <td>₹{{it.price}}</td>
            <td>₹{{(it.price * it.quantity).toFixed(2)}}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  `
})
export class CheckoutComponent implements OnInit {
  products = signal<Product[]>([]);
  items = signal<CartItem[]>([]);
  lastOrder: CartItem[] = [];   
  message = '';
  orderPlaced = false;

  constructor(private api: ApiService, private cartService: CartService){}
  
  ngOnInit(){ 
    this.api.products().subscribe(d => this.products.set(d));
    this.loadCartItems();
    
    this.cartService.getCartCount().subscribe(() => {
      this.loadCartItems();
    });
  }

  loadCartItems() {
    this.items.set(this.cartService.getItems());
  }

  total(){ return this.items().reduce((a,b)=>a + (b.price*b.quantity),0).toFixed(2); }

  remove(id: string){ 
    this.cartService.removeItem(id);
    this.loadCartItems();
  }

  checkout(){
    const token = localStorage.getItem('token'); 
    if(!token){ window.location.href = '/login'; return; }

    const orderCopy = [...this.items()]; 
    const orderTotal = this.total();

    const checkoutItems = this.items().map(item => ({
      product_id: parseInt(item.id),
      quantity: item.quantity
    }));

    this.api.checkout(checkoutItems).subscribe({
      next: res => { 
        this.message = `✅ Order placed! Thank You!! Sale #${res.sale_id}. Total ₹${res.total.toFixed(2)}`;
        this.lastOrder = orderCopy; 
        this.cartService.clearCart();
        this.loadCartItems();
        this.orderPlaced = true;
      },
      error: err => { this.message = err?.error?.error ?? 'Checkout failed'; }
    });
  }
}