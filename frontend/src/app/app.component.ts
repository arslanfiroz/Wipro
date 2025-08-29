import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { CartService } from './cart.service'; 

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet],
  template: `
  <header class="nav">
    <div class="inner">
      <!-- Brand -->
      <div class="brand" routerLink="/">QuickKart</div>

      <!-- Center Nav -->
      <nav class="links">
        <a routerLink="/" class="link">Home</a>
        <a routerLink="/sales-history" class="link" *ngIf="isAdmin()">Sales</a>
        <a routerLink="/checkout" class="link">Checkout</a>
        <a routerLink="/admin" class="link" *ngIf="isAdmin()">Admin Panel</a>
      </nav>

      <div style="flex:1"></div>

      <!-- User Panel -->
      <ng-container *ngIf="user(); else guest">
        <div class="user-menu" (click)="toggleMenu($event)">
          <div class="avatar">{{ userInitials() }}</div>
          <span class="muted">{{ displayName() }}</span>
          <div class="dropdown" *ngIf="menuOpen">
            <div class="dropdown-item"><strong>{{ displayName() }}</strong></div>
            <div class="dropdown-item">Email: {{ user()?.email }}</div>
            <div class="dropdown-item">Role: {{ user()?.role }}</div>
            <a class="dropdown-item" routerLink="/me" (click)="closeMenu()">User Info</a>
            <a class="dropdown-item" routerLink="/admin" *ngIf="isAdmin()" (click)="closeMenu()">Admin Panel</a>
            <hr />
            <button class="dropdown-item" (click)="logout($event)">Logout</button>
          </div>
        </div>
      </ng-container>

      <ng-template #guest>
        <a routerLink="/login" class="link">Login</a>
        <a routerLink="/register" class="link">Register</a>
      </ng-template>
    </div>
  </header>

  <main class="container">
    <router-outlet />
  </main>

  <!-- Floating Cart -->
  <a routerLink="/checkout" class="floating-cart" *ngIf="!isAuthPage()">
    🛒 {{ cartCount }} in cart
  </a>
  `,
  styles: [`
    .nav {
      background: linear-gradient(90deg, #eef2ff 0%, #fefce8 50%, #fff 100%);
      border-bottom: 1px solid #e5e7eb;
      padding: 12px 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .inner { display: flex; align-items: center; width: 100%; max-width: 1200px; }

    /* Brand with gradient text */
    .brand {
      font-size: 24px;
      font-weight: 800;
      background: linear-gradient(90deg, #2563eb, #7c3aed, #ef4444);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      cursor: pointer;
      margin-right: auto;
      letter-spacing: .2px;
    }

    .links { display: flex; gap: 24px; margin: 0 auto; align-items: center; }
    .link {
      text-decoration: none;
      font-size: 16px;
      color: #374151;
      font-weight: 600;
      transition: color .2s ease;
      padding: 4px 2px;
    }
    .link:hover { color: #111827; }

    /* Floating cart button */
    .floating-cart {
      position: fixed; bottom: 20px; right: 20px;
      padding: 12px 18px; border-radius: 30px;
      background: linear-gradient(90deg, #2563eb, #7c3aed);
      color: #fff; font-weight: 700; font-size: 14px; text-decoration: none;
      display: flex; align-items: center; gap: 6px;
      box-shadow: 0 6px 16px rgba(37, 99, 235, 0.35);
      z-index: 1000;
    }
    .floating-cart:hover { filter: brightness(1.05); }

    /* Avatar with soft colorful ring */
    .avatar {
      background: #2563eb;
      color: white; font-weight: 800;
      border-radius: 50%; width: 32px; height: 32px;
      display: flex; align-items: center; justify-content: center; margin-right: 8px; font-size: 14px;
      box-shadow: 0 0 0 3px #fff, 0 0 0 6px rgba(37,99,235,.25);
    }
    .user-menu { position: relative; cursor: pointer; display: flex; align-items: center; }

    .dropdown { position: absolute; top: 40px; right: 0; background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.08); min-width: 220px; z-index: 100; }
    .dropdown-item { padding: 10px 12px; cursor: pointer; border-radius: 8px; }
    .dropdown-item:hover { background: #f3f4f6; }
    hr { border: 0; border-top: 1px solid #e5e7eb; margin: 6px 0; }
  `]
})
export class AppComponent {
  menuOpen = false;
  cartCount = 0; 

  constructor(
    private router: Router,
    private cartService: CartService  
  ){
    this.cartService.getCartCount().subscribe(count => {
      this.cartCount = count;
    });
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: Event){
    const t = e.target as HTMLElement;
    if (!t.closest('.user-menu')) this.menuOpen = false;
  }

  user(): {email:string; role:string} | null {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); }
    catch { return null; }
  }
  isAdmin(){ return this.user()?.role === 'admin'; }

  private profileName(): string {
    try { return localStorage.getItem('profileName') || ''; } catch { return ''; }
  }

  displayName(): string {
    const name = this.profileName().trim();
    if (name) return name;
    return this.user()?.email || '';
  }

  userInitials(){
    const name = this.profileName().trim();
    if (name) {
      const parts = name.split(/\s+/).filter(Boolean);
      const first = parts[0]?.[0] || '';
      const second = (parts[1]?.[0] || (parts[0]?.[1] || ''));
      return (first + second).toUpperCase() || '?';
    }
    const mail = this.user()?.email || '';
    const base = mail.split('@')[0] || '';
    return (base.slice(0,2) || '?').toUpperCase();
  }
  isAuthPage(): boolean {
    const currentRoute = this.router.url;
    return currentRoute === '/login' || currentRoute === '/register' || currentRoute === '/admin' || currentRoute === '/sales-history';
  }

  toggleMenu(event: Event){ event.stopPropagation(); this.menuOpen = !this.menuOpen; }
  closeMenu(){ this.menuOpen = false; }

  logout(event?: Event){
    event?.stopPropagation();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('profileName');
    this.menuOpen = false;
    try { this.cartService.onUserChanged(); } catch {}
    this.router.navigateByUrl('/login');
  }
}