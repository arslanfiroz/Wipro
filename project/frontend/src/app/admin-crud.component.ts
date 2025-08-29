import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Product } from './api.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  selector: 'app-admin-crud',
  template: `
<div class="card" style="padding:16px;">
  <h2 style="margin-bottom:10px;">Admin Panel</h2>
  <div *ngIf="!isAdmin()" style="color:#b91c1c">Access Denied — Admin Only.</div>

  <ng-container *ngIf="isAdmin()">
    <div style="display:flex;flex-wrap:wrap;gap:16px;margin:12px 0 18px;">
      <div class="metric gradient-blue">
        <div class="metric-value">📦 {{ products().length }}</div>
        <div>Total Products</div>
      </div>
      <div class="metric gradient-purple">
        <div class="metric-value">🛒 {{ sales().length }}</div>
        <div>Total Sales</div>
      </div>
      <div class="metric gradient-green">
        <div class="metric-value">💰 ₹{{ totalRevenue() }}</div>
        <div>Revenue</div>
      </div>
      <div class="metric gradient-pink">
        <div class="metric-value">📊 ₹{{ totalStockValue() }}</div>
        <div>Total Stock Value</div>
      </div>
      <div class="metric gradient-yellow">
        <div class="metric-value">⚠️ {{ lowStock().length }}</div>
        <div>Low Stock Items</div>
      </div>
    </div>

    <div style="display:flex;flex-wrap:wrap;gap:16px;align-items:flex-start;margin-bottom:18px;">
      <div class="card panel">
        <h3 style="margin-bottom:8px;">Recent Sales</h3>
        <ul class="list">
          <li *ngFor="let s of sales() | slice:0:6" class="list-item">
            <span style="color:#6b7280;">Sale #{{ s.id }}</span>
            <span><strong>₹{{ s.total }}</strong></span>
          </li>
          <li *ngIf="!sales().length" style="color:#6b7280;">No sales yet.</li>
        </ul>
      </div>
      <div class="card panel">
        <h3 style="margin-bottom:8px;">Alert! Low Stock</h3>
        <ul class="list">
          <li *ngFor="let p of lowStock()" class="list-item">
            <span>⚠️ {{ p.name }}</span>
            <span class="low-stock">Only {{ p.stock }} left</span>
          </li>
          <li *ngIf="!lowStock().length" style="color:#6b7280;">No Items With Low Stock</li>
        </ul>
      </div>
    </div>

    <h3 style="margin:12px 0;">Products</h3>
    <div class="card table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>ID</th><th>Name</th><th>Price</th><th>Stock</th><th>Total Value</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let p of products()">
            <td>{{ p.id }}</td>
            <td>{{ p.name }}</td>
            <td>₹{{ p.price }}</td>
            <td [style.color]="p.stock < 5 ? '#dc2626':'inherit'">{{ p.stock }}</td>
            <td><strong style="color:#059669">₹{{ p.price * p.stock }}</strong></td>
            <td>
              <button class="btn btn-primary" (click)="edit(p)">Edit</button>
              <button class="btn btn-danger" (click)="del(p.id)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="card editor">
      <h3>{{ editing ? 'Edit' : 'Add' }} Product</h3>
      <div class="form">
        <input placeholder="Name" [(ngModel)]="form.name" />
        <input placeholder="Brand" [(ngModel)]="form.brand" />
        <input placeholder="Category" [(ngModel)]="form.category" />
        <input placeholder="Unit (ex. 1L)" [(ngModel)]="form.unit" (input)="validateUnit($event)" />
        <input type="number" placeholder="Price" [(ngModel)]="form.price" min="0" step="0.01" (input)="validatePrice($event)" />
        <input type="number" placeholder="Stock" [(ngModel)]="form.stock" min="0" step="1" (input)="validateStock($event)" />
        <input placeholder="Image URL (https://...)" [(ngModel)]="form.image" />
        <div *ngIf="form.image" class="image-preview">
          <img [src]="form.image" alt="Preview" (error)="onImageError($event)" />
        </div>
        <div class="form-actions">
          <button class="btn btn-primary" (click)="save()">{{ editing ? 'Update' : 'Add' }}</button>
          <button class="btn btn-secondary" (click)="clear()">Clear</button>
        </div>
      </div>
      <div class="msg" *ngIf="message">{{ message }}</div>
    </div>
  </ng-container>
</div>
`,
  styles: [`
    .metric { flex:1; min-width:160px; color:#fff; padding:16px; border-radius:14px; box-shadow:0 4px 12px rgba(0,0,0,0.15); }
    .metric-value { font-size:1.6rem; font-weight:bold; }
    .gradient-blue { background:linear-gradient(135deg,#3b82f6,#1d4ed8); }
    .gradient-purple { background:linear-gradient(135deg,#a855f7,#6d28d9); }
    .gradient-yellow { background:linear-gradient(135deg,#f59e0b,#b45309); }
    .gradient-green { background:linear-gradient(135deg,#34d399,#059669); }
    .gradient-pink { background:linear-gradient(135deg,#ec4899,#be185d); }
    .panel { flex:1; min-width:280px; background:#fff; padding:16px; border-radius:12px; box-shadow:0 4px 10px rgba(0,0,0,0.1); }
    .list { list-style:none; padding:0; margin:0; }
    .list-item { display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #eee; font-size:0.9rem; }
    .low-stock { background:#fef3c7; color:#b45309; font-size:0.8rem; padding:2px 6px; border-radius:6px; }
    .table-wrap { overflow-x:auto; background:#fff; padding:12px; border-radius:12px; box-shadow:0 4px 10px rgba(0,0,0,0.1); }
    .table { width:100%; border-collapse:collapse; font-size:0.9rem; }
    .table th, .table td { padding:8px 12px; text-align:left; border-bottom:1px solid #ddd; }
    .editor { margin-top:16px; background:#fff; padding:16px; border-radius:12px; box-shadow:0 4px 10px rgba(0,0,0,0.1); }
    .form { display:flex; flex-direction:column; gap:10px; }
    .form input { padding:8px 12px; border:1px solid #d1d5db; border-radius:6px; font-size:14px; }
    .form input:focus { outline:none; border-color:#2563eb; box-shadow:0 0 0 3px rgba(37,99,235,0.1); }
    .form-actions { display:flex; gap:10px; margin-top:10px; }
    .btn { padding:6px 12px; border:none; border-radius:6px; cursor:pointer; margin-right:6px; }
    .btn-primary { background:#2563eb; color:#fff; }
    .btn-danger { background:#dc2626; color:#fff; }
    .btn-secondary { background:#f59e0b; color:#fff; }
    .btn-secondary:hover { background:#d97706; }
    .msg { color:#6b7280; margin-top:8px; }
    .image-preview { margin:10px 0; text-align:center; }
    .image-preview img { max-width:120px; max-height:120px; border-radius:8px; border:2px solid #e5e7eb; object-fit:cover; }
  `]
})
export class AdminCrudComponent implements OnInit {
  products = signal<Product[]>([]);
  sales = signal<any[]>([]);
  form: any = {name:'',brand:'',category:'',price:0,stock:0,unit:'',image:''};
  editing = false; editId: number|null = null;
  message = '';

  constructor(private api: ApiService){}

  isAdmin(){ 
    try{ 
      const u = JSON.parse(localStorage.getItem('user')||'null'); 
      return u && u.role==='admin'; 
    }catch(e){return false;} 
  }

  ngOnInit(){ 
    this.load(); 
    this.loadSales(); 
  }

  load(){ this.api.products().subscribe(d=> this.products.set(d)); }

  loadSales(){ 
    this.api.history().subscribe({
      next: (res:any[]) => this.sales.set(res),
      error: (err) => { console.error('Error loading sales', err); this.sales.set([]); }
    });
  }

  lowStock(){ return this.products().filter(p => p.stock < 5); }

  totalRevenue(){ return this.sales().reduce((sum, s) => sum + (s.total || 0), 0); }

  totalStockValue(){ return this.products().reduce((sum, p) => sum + (p.price * (p.stock || 0)), 0); }

  async save(){
    const token = localStorage.getItem('token')||'';
    
    // Validate negative values
    if(this.form.price < 0){
      this.message = 'Price cannot be negative!';
      return;
    }
    if(this.form.stock < 0){
      this.message = 'Stock cannot be negative!';
      return;
    }
    
    // Validate unit field for negative values
    const unitValue = this.form.unit?.toString() || '';
    if(unitValue.includes('-') && /\d/.test(unitValue)){
      this.message = 'Unit cannot contain negative values!';
      return;
    }
    
    try{
      const payload: any = { ...this.form };
      if(this.editing && this.editId){
        await this.api.updateProduct(this.editId, payload, token).toPromise();
        this.message = 'Product updated successfully!';
      }else{
        await this.api.addProduct(payload, token).toPromise();
        this.message = 'Product added successfully!';
      }
      this.clear(); this.load();
    }catch(err:any){ this.message = err?.error?.error || 'Operation failed'; }
  }

  edit(p: Product){
    this.editing = true;
    this.editId = p.id;
    this.form = { ...p };
  }

  async del(id:number){
    const token = localStorage.getItem('token')||'';
    if(!confirm('Delete product?')) return;
    try{ await this.api.deleteProduct(id, token).toPromise(); this.load(); }catch(e:any){ alert('Delete failed'); }
  }

  validatePrice(event: any) {
    const value = parseFloat(event.target.value);
    if (value < 0) {
      event.target.value = 0;
      this.form.price = 0;
      this.message = 'Price cannot be negative!';
    } else {
      this.form.price = value;
      this.message = '';
    }
  }

  validateStock(event: any) {
    const value = parseInt(event.target.value);
    if (value < 0) {
      event.target.value = 0;
      this.form.stock = 0;
      this.message = 'Stock cannot be negative!';
    } else {
      this.form.stock = value;
      this.message = '';
    }
  }

  validateUnit(event: any) {
    const value = event.target.value;
    // Check if unit contains negative numbers
    if (value.includes('-') && /\d/.test(value)) {
      // Remove negative signs from the unit
      event.target.value = value.replace(/-/g, '');
      this.form.unit = event.target.value;
      this.message = 'Unit cannot contain negative values!';
    } else {
      this.form.unit = value;
      this.message = '';
    }
  }

  clear(){ 
    this.editing=false; 
    this.editId=null; 
    this.form={name:'',brand:'',category:'',price:0,stock:0,unit:'',image:''}; 
    this.message=''; 
  }

  onImageError(event: any) {
    // Fallback to a placeholder when image fails to load
    event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iMTIwIiBmaWxsPSIjRjJGNEY4Ii8+CjxwYXRoIGQ9Ik02MCA0MEw3NSA3MEg0NUw2MCA0MFoiIGZpbGw9IiM5NDk0QTQiLz4KPGNpcmNsZSBjeD0iNjAiIGN5PSI2MCIgcj0iMjQiIHN0cm9rZT0iIzk0OTRBNCIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIi8+Cjx0ZXh0IHg9IjYwIiB5PSI5NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk0OTRBNCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIj5JbnZhbGlkIFVSTDwvdGV4dD4KPHN2Zz4K';
  }
}