
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, Product } from './api.service';

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="card" style="padding:16px;">
    <h2>Admin Panel</h2>
    <p>Only accessible with admin credentials. You can use the existing Inventory endpoints to add/update/delete products and upload images via the backend.</p>
    <div *ngIf="!isAdmin()" style="color:red">You are not an admin.</div>
    <div *ngIf="isAdmin()">
      <p>Sales are visible in Sales tab. Manage products via API or curl. (This demo wires backend services; you can extend UI further.)</p>
    </div>
  </div>
  `
})
export class AdminComponent implements OnInit {
  constructor(){}
  isAdmin(){ try{ const u = JSON.parse(localStorage.getItem('user')||'null'); return u && u.role==='admin'; }catch(e){return false;} }
  ngOnInit(){}
}
