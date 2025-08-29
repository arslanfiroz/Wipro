import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
export interface Product { id:number; name:string; brand?:string; category?:string; price:number; stock:number; unit?:string; image?:string; }
export interface Sale { id:number; total:number; items:any[]; created_at:string; }
export interface User { email:string; role:string; }

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient,
    @Inject('API_AUTH') private authApi: string,
    @Inject('API_INVENTORY') private inventoryApi: string,
    @Inject('API_SALES') private salesApi: string){}

  products(): Observable<Product[]> { return this.http.get<Product[]>(`${this.inventoryApi}/products`); }
  addProduct(p:any, token?:string){ return this.http.post(`${this.inventoryApi}/products`, p, { headers: token?{Authorization:`Bearer ${token}`}:{} }); }
  updateProduct(id:number,p:any, token?:string){ return this.http.put(`${this.inventoryApi}/products/${id}`, p, { headers: token?{Authorization:`Bearer ${token}`}:{} }); }
  deleteProduct(id:number, token?:string){ return this.http.delete(`${this.inventoryApi}/products/${id}`, { headers: token?{Authorization:`Bearer ${token}`}:{} }); }
  checkout(items:{product_id:number,quantity:number}[]){
    const token = localStorage.getItem('token') || '';
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    return this.http.post<{ok:boolean,sale_id:number,total:number}>(`${this.salesApi}/checkout`, {items}, headers ? { headers } : {});
  }
  history(): Observable<Sale[]> { return this.http.get<Sale[]>(`${this.salesApi}/sales`); }
  updateSale(id:number, sale:any, token?:string){ return this.http.put(`${this.salesApi}/sales/${id}`, sale, { headers: token?{Authorization:`Bearer ${token}`}:{} }); }
  deleteSale(id:number, token?:string){ return this.http.delete(`${this.salesApi}/sales/${id}`, { headers: token?{Authorization:`Bearer ${token}`}:{} }); }

  register(email:string,password:string){ return this.http.post<{ok:boolean,user:User}>(`${this.authApi}/register`, {email,password}); }
  login(email:string,password:string){ return this.http.post<{ok:boolean,token:string,user:User}>(`${this.authApi}/login`, {email,password}); }
  verify(token:string){ return this.http.post<{ok:boolean,user:User}>(`${this.authApi}/verify`, {token}); }
}