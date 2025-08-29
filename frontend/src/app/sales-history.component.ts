import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Sale } from './api.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="card" style="padding:16px;">
    <h2>Sales History</h2>
    <div *ngIf="!isAdmin()" style="color:#b91c1c; margin-bottom:16px;">Access Denied — Admin Only.</div>
    
    <ng-container *ngIf="isAdmin()">
      <table class="sales-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Total</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let s of sales()">
            <td>{{s.id}}</td>
            <td>₹{{s.total.toFixed(2)}}</td>
            <td>{{ coerceUtc(s.created_at) | date:'dd/MM/yyyy, hh:mm a':'+0530' }}</td>
            <td class="actions">
              <button type="button" class="btn btn-primary" (click)="$event.preventDefault(); $event.stopPropagation(); editSale(s)">Edit</button>
              <button type="button" class="btn btn-danger" (click)="$event.preventDefault(); $event.stopPropagation(); deleteSale(s.id)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Edit Modal -->
      <div class="modal" *ngIf="editingSale" (click)="closeModal($event)">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <h3>Edit Sale #{{editingSale.id}}</h3>
          <div class="form-group">
            <label>Total Amount:</label>
            <input type="number" [(ngModel)]="editingSale.total" step="0.01" min="0" (input)="validateTotal($event)" />
          </div>
          <div class="form-actions">
            <button class="btn btn-primary" (click)="saveSale()">Save</button>
            <button class="btn btn-secondary" (click)="cancelEdit()">Cancel</button>
          </div>
        </div>
      </div>

      <div class="message" *ngIf="message" [class]="messageType">{{message}}</div>
    </ng-container>
  </div>
  `,
  styles: [`
    .sales-table {
      width: 100%;
      border-collapse: collapse;
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    }
    
    .sales-table th, .sales-table td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .sales-table th {
      background: #f7fafc;
      color: #475569;
      font-weight: 600;
    }
    
    .sales-table tbody tr:hover {
      background: #fafcff;
    }
    
    .actions {
      display: flex;
      gap: 8px;
    }
    
    .btn {
      padding: 6px 12px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s ease;
    }
    
    .btn-primary {
      background: #2563eb;
      color: #fff;
    }
    
    .btn-primary:hover {
      background: #1d4ed8;
    }
    
    .btn-danger {
      background: #dc2626;
      color: #fff;
    }
    
    .btn-danger:hover {
      background: #b91c1c;
    }
    
    .btn-secondary {
      background: #6b7280;
      color: #fff;
    }
    
    .btn-secondary:hover {
      background: #4b5563;
    }
    
    .modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    
    .modal-content {
      background: #fff;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
      min-width: 400px;
    }
    
    .modal-content h3 {
      margin: 0 0 16px 0;
      color: #1f2937;
    }
    
    .form-group {
      margin-bottom: 16px;
    }
    
    .form-group label {
      display: block;
      margin-bottom: 6px;
      font-weight: 600;
      color: #374151;
    }
    
    .form-group input {
      width: 100%;
      padding: 8px 12px;
      border: 2px solid #e5e7eb;
      border-radius: 6px;
      font-size: 14px;
    }
    
    .form-group input:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }
    
    .form-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 20px;
    }
    
    .message {
      margin-top: 16px;
      padding: 12px 16px;
      border-radius: 8px;
      font-weight: 500;
    }
    
    .message.success {
      background: #d1fae5;
      color: #065f46;
      border: 1px solid #a7f3d0;
    }
    
    .message.error {
      background: #fee2e2;
      color: #991b1b;
      border: 1px solid #fecaca;
    }
  `]
})
export class SalesHistoryComponent implements OnInit {
  sales = signal<Sale[]>([]);
  editingSale: Sale | null = null;
  message = '';
  messageType = 'success';

  constructor(private api: ApiService){}

  ngOnInit(){ 
    this.loadSales(); 
  }

  isAdmin(): boolean {
    try {
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      return user && user.role === 'admin';
    } catch {
      return false;
    }
  }

  loadSales() {
    this.api.history().subscribe({
      next: (data) => {
        this.sales.set(data);
      },
      error: (err) => {
        this.showMessage('Error loading sales', 'error');
      }
    });
  }

  editSale(sale: Sale) {
    this.editingSale = { ...sale };
  }

  async saveSale() {
    if (!this.editingSale) return;

    // Validate negative values
    if (this.editingSale.total < 0) {
      this.showMessage('Total amount cannot be negative!', 'error');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      this.showMessage('Authentication required', 'error');
      return;
    }

    try {
      await this.api.updateSale(this.editingSale.id, this.editingSale, token).toPromise();
      this.showMessage('Sale updated successfully', 'success');
      this.editingSale = null;
      this.loadSales(); 
    } catch (error: any) {
      this.showMessage(error?.error?.error || 'Failed to update sale', 'error');
    }
  }

  async deleteSale(saleId: number) {
    if (!confirm('Are you sure you want to delete this sale?')) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      this.showMessage('Authentication required', 'error');
      return;
    }

    try {
      await this.api.deleteSale(saleId, token).toPromise();
      this.showMessage('Sale deleted successfully', 'success');
      this.loadSales(); 
    } catch (error: any) {
      this.showMessage(error?.error?.error || 'Failed to delete sale', 'error');
    }
  }

  cancelEdit() {
    this.editingSale = null;
  }

  closeModal(event: Event) {
    if (event.target === event.currentTarget) {
      this.cancelEdit();
    }
  }

  showMessage(text: string, type: 'success' | 'error') {
    this.message = text;
    this.messageType = type;
    setTimeout(() => {
      this.message = '';
    }, 3000);
  }


  validateTotal(event: any) {
    const value = parseFloat(event.target.value);
    if (value < 0) {
      event.target.value = 0;
      if (this.editingSale) {
        this.editingSale.total = 0;
      }
      this.showMessage('Total amount cannot be negative!', 'error');
    } else {
      if (this.editingSale) {
        this.editingSale.total = value;
      }
    }
  }

  coerceUtc(dateStr: string): Date {
    return new Date(dateStr + 'Z');
  }
}
