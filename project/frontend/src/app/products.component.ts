import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Product } from './api.service';
import { CartService } from './cart.service'; 

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <!-- Header -->
  <div class="toolbar">
    <input
      placeholder="Search products..."
      [ngModel]="q()" (ngModelChange)="q.set($event)" />

    <select [ngModel]="cat()" (ngModelChange)="cat.set($event)">
      <option value="">All categories</option>
      <option *ngFor="let c of categories()" [value]="c">{{c}}</option>
    </select>
  </div>

  <!-- Product Grid -->
  <div class="grid">
    <div class="card" *ngFor="let p of filtered()">
      <div class="product-image">
        <img [src]="getCurrentImage(p)" [alt]="p.name" (error)="onImageError($event)" />
      </div>
      <div class="info">
        <div class="title">{{p.name}}</div>
        <div class="subtitle">{{p.brand}} · {{p.unit}}</div>
        <div class="bottom">
          <div class="price">₹{{p.price}} <span class="stock">Stock {{p.stock}}</span></div>
          <button (click)="add(p)" [disabled]="p.stock<=0">ADD</button>
        </div>
      </div>
    </div>
  </div>
  `,
  styles: [`
    /* Toolbar */
    .toolbar { display: flex; gap: 12px; margin: 16px 0 20px; padding: 12px; background: #fff; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.08); }
    .toolbar input, .toolbar select { padding: 8px 12px; font-size: 15px; border: 1px solid #ccc; border-radius: 6px; outline: none; flex: 1; }
    .toolbar input:focus, .toolbar select:focus { border-color: #2563eb; }

    /* Grid */
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px; }

    /* Card */
    .card { background: #fff; border-radius: 12px; box-shadow: 0 2px 6px rgba(0,0,0,0.08); overflow: hidden; display: flex; flex-direction: column; transition: transform 0.2s ease, box-shadow 0.2s ease; }
    .card:hover { transform: translateY(-3px); box-shadow: 0 4px 12px rgba(0,0,0,0.12); }

    /* Product Image */
    .product-image { height: 200px; background: #f8f9fa; display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative; border-radius: 12px 12px 0 0; }
    .image-carousel { width: 100%; height: 100%; position: relative; display: flex; align-items: center; justify-content: center; }
    .product-image img { width: 100%; height: 100%; object-fit: contain; transition: transform 0.3s ease; padding: 10px; }
    .product-image img:hover { transform: scale(1.02); }
    
    /* Carousel Controls */
    .carousel-controls { position: absolute; top: 50%; transform: translateY(-50%); width: 100%; display: flex; justify-content: space-between; pointer-events: none; }
    .carousel-btn { background: rgba(0,0,0,0.6); color: white; border: none; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; pointer-events: all; transition: background 0.2s; }
    .carousel-btn:hover { background: rgba(0,0,0,0.8); }
    .carousel-btn.prev { margin-left: 5px; }
    .carousel-btn.next { margin-right: 5px; }
    
    /* Carousel Dots */
    .carousel-dots { position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%); display: flex; gap: 4px; }
    .dot { width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,0.5); cursor: pointer; transition: background 0.2s; }
    .dot.active { background: #2563eb; }

    /* Info section */
    .info { padding: 14px; flex: 1; display: flex; flex-direction: column; }
    .title { font-size: 16px; font-weight: 600; margin-bottom: 4px; }
    .subtitle { font-size: 13px; color: #777; margin-bottom: 10px; }
    .bottom { margin-top: auto; display: flex; align-items: center; justify-content: space-between; }
    .price { font-size: 14px; font-weight: 600; color: #2563eb; }
    .stock { font-size: 12px; color: #999; margin-left: 6px; }

    /* Button */
    button { padding: 6px 14px; background: #2563eb; color: white; border: none; border-radius: 20px; font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
    button:hover { background: #1d4ed8; }
    button:disabled { background: #ccc; cursor: not-allowed; }
  `]
})
export class ProductsComponent implements OnInit {
  q = signal<string>(''); 
  cat = signal<string>('');

  list = signal<Product[]>([]);
  cart = signal<{product_id:number, quantity:number}[]>(JSON.parse(localStorage.getItem('cart')||'[]'));
  currentImageIndex = signal<{[productId: number]: number}>({});

  constructor(private api: ApiService, private cartService: CartService){} 

  ngOnInit(){ 
    this.api.products().subscribe(d => this.list.set(d)); 
  }

  categories = computed(() => {
    return Array.from(new Set(this.list().map(x=>x.category).filter(Boolean))) as string[];
  });

  filtered = computed(() => {
    const q = this.q().trim().toLowerCase();
    const cat = this.cat();
    return this.list().filter(p => {
      const inCat = cat ? p.category === cat : true;
      const hay = (p.name + ' ' + (p.brand||'')).toLowerCase();
      const matches = q ? hay.includes(q) : true;
      return inCat && matches;
    });
  });

  add(p: Product){ 
    this.cartService.addItem({ id: p.id.toString(), name: p.name, price: p.price, quantity: 1 });
    const c=[...this.cart()]; 
    const idx=c.findIndex(x=>x.product_id===p.id);
    if(idx>-1) c[idx].quantity++; else c.push({product_id:p.id, quantity:1});
    this.cart.set(c); 
    localStorage.setItem('cart', JSON.stringify(c));
  }

  cartCount(){ 
    return this.cart().reduce((a,b)=>a+b.quantity,0); 
  }

  onImageError(event: any) {
    // Fallback to a placeholder or default image when image fails to load
    event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjJGNEY4Ii8+CjxwYXRoIGQ9Ik0xMDAgNzBMMTMwIDEzMEg3MEwxMDAgNzBaIiBmaWxsPSIjOTQ5NEE0Ii8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iNDAiIHN0cm9rZT0iIzk0OTRBNCIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTYwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTQ5NEE0IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4K';
  }

  // Product image mapping - using local Blinkit images
  private productImages: {[key: string]: string[]} = {
    'Amul Taaza Toned Milk': ['assets/images/amul-milk.png'],
    'Mother Dairy Full Cream Milk': ['assets/images/mother-dairy-milk.png'],
    'Britannia Whole Wheat Bread': ['assets/images/britannia-bread.png'],
    'Aashirvaad Atta': ['assets/images/aashirvaad-atta.png'],
    'Fortune Sunflower Oil': ['assets/images/fortune-oil.png'],
    'Tata Salt': ['assets/images/tata-salt.png'],
    'Parle-G Gold Biscuits': ['assets/images/parle-g-biscuits.png'],
    'Lays Magic Masala': ['assets/images/lays-chips.png'],
    'Maggie 2-Minute Noodles': ['assets/images/maggie-noodles.png'],
    'Colgate Strong Teeth': ['assets/images/colgate-toothpaste.png'],
    'Dove Shampoo': ['assets/images/dove-shampoo.png'],
    'Good Day Cashew Cookies': ['assets/images/good-day-cookies.png'],
    'Kellogg\'s Corn Flakes': ['assets/images/kelloggs-cornflakes.png'],
    'Nescafe Classic': ['assets/images/nescafe-coffee.png'],
    'Red Label Tea': ['assets/images/red-label-tea.png'],
    'Onion': ['assets/images/onion.png'],
    'Tomato': ['assets/images/tomato.png'],
    'Potato': ['assets/images/potato.png'],
    'Banana': ['assets/images/banana.png'],
    'Apple': ['assets/images/apple.png']
  };

  // Image carousel methods
  getImageArray(product: Product): string[] {
    const images = this.productImages[product.name];
    return images || [];
  }

  getCurrentImage(product: Product): string {
    const images = this.getImageArray(product);
    if (images.length === 0) return this.getDefaultImage();
    const index = this.currentImageIndex()[product.id] || 0;
    return images[index] || images[0];
  }

  private getDefaultImage(): string {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjJGNEY4Ii8+CjxwYXRoIGQ9Ik0xNTAgMTAwTDE5MCAyMDBIMTEwTDE1MCAxMDBaIiBmaWxsPSIjOTQ5NEE0Ii8+CjxjaXJjbGUgY3g9IjE1MCIgY3k9IjE1MCIgcj0iNjAiIHN0cm9rZT0iIzk0OTRBNCIgc3Ryb2tlLXdpZHRoPSIzIiBmaWxsPSJub25lIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMjQwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTQ5NEE0IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4K';
  }

  getCurrentImageIndex(productId: number): number {
    return this.currentImageIndex()[productId] || 0;
  }

  nextImage(productId: number) {
    const product = this.list().find(p => p.id === productId);
    if (!product) return;
    
    const images = this.getImageArray(product);
    if (images.length <= 1) return;
    
    const currentIndex = this.getCurrentImageIndex(productId);
    const nextIndex = (currentIndex + 1) % images.length;
    
    this.currentImageIndex.update(indices => ({
      ...indices,
      [productId]: nextIndex
    }));
  }

  previousImage(productId: number) {
    const product = this.list().find(p => p.id === productId);
    if (!product) return;
    
    const images = this.getImageArray(product);
    if (images.length <= 1) return;
    
    const currentIndex = this.getCurrentImageIndex(productId);
    const prevIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
    
    this.currentImageIndex.update(indices => ({
      ...indices,
      [productId]: prevIndex
    }));
  }

  setCurrentImage(productId: number, index: number) {
    this.currentImageIndex.update(indices => ({
      ...indices,
      [productId]: index
    }));
  }

}