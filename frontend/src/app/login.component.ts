import { FormsModule } from '@angular/forms';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from './api.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <h1>Welcome Back</h1>
          <p>Sign in to your account to continue</p>
        </div>
        
        <form (ngSubmit)="doLogin()" #loginForm="ngForm" class="auth-form">
          <div class="form-group">
            <label for="email">Email Address</label>
            <input 
              type="email" 
              id="email"
              name="email"
              [(ngModel)]="email" 
              required
              email
              [class.error]="emailError"
              placeholder="Enter your email"
              [disabled]="isLoading"
            />
            <div class="error-message" *ngIf="emailError">{{ emailError }}</div>
          </div>
          
          <div class="form-group">
            <label for="password">Password</label>
            <input 
              type="password"
              id="password"
              name="password"
              [(ngModel)]="password" 
              required
              minlength="6"
              [class.error]="passwordError"
              placeholder="Enter your password"
              [disabled]="isLoading"
            />
            <div class="error-message" *ngIf="passwordError">{{ passwordError }}</div>
          </div>
          
          <div class="alert" *ngIf="message" [class]="messageType">
            <span>{{ message }}</span>
            <button type="button" class="alert-close" (click)="clearMessage()">×</button>
          </div>
          
          <button 
            type="submit" 
            class="auth-button"
            [disabled]="isLoading || !loginForm.valid"
          >
            <span *ngIf="!isLoading">Sign In</span>
            <span *ngIf="isLoading" class="loading-spinner">Signing in...</span>
          </button>
        </form>
        
        <div class="auth-footer">
          <p>Don't have an account? <a routerLink="/register" class="auth-link">Sign up</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      padding: 20px;
    }
    
    .auth-card {
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.08);
      padding: 32px;
      width: 100%;
      max-width: 420px;
      position: relative;
      border: 1px solid #e5e7eb;
      border-top: 6px solid #2563eb;
    }
    
    .auth-header {
      text-align: center;
      margin-bottom: 24px;
    }
    
    .auth-header h1 {
      margin: 0 0 8px 0;
      color: #1f2937;
      font-size: 28px;
      font-weight: 700;
    }
    
    .auth-header p {
      margin: 0;
      color: #6b7280;
      font-size: 16px;
    }
    
    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .form-group label {
      font-weight: 600;
      color: #374151;
      font-size: 14px;
    }
    
    .form-group input {
      padding: 12px 16px;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      font-size: 16px;
      transition: all 0.2s ease;
      background: #f9fafb;
    }
    
    .form-group input:focus {
      outline: none;
      border-color: #667eea;
      background: white;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
    
    .form-group input.error {
      border-color: #ef4444;
      background: #fef2f2;
    }
    
    .form-group input:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .error-message {
      color: #ef4444;
      font-size: 14px;
      margin-top: 4px;
    }
    
    .auth-button {
      background: #2563eb;
      color: white;
      border: none;
      padding: 12px 20px;
      border-radius: 10px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      margin-top: 6px;
    }
    
    .auth-button:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 8px 20px rgba(37, 99, 235, 0.25);
    }
    
    .auth-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }
    
    .loading-spinner {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    
    .loading-spinner::before {
      content: '';
      width: 16px;
      height: 16px;
      border: 2px solid transparent;
      border-top: 2px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .auth-footer {
      text-align: center;
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
    }
    
    .auth-footer p {
      margin: 0;
      color: #6b7280;
      font-size: 14px;
    }
    
    .auth-link {
      color: #2563eb;
      text-decoration: none;
      font-weight: 600;
      transition: color 0.2s ease;
    }
    
    .auth-link:hover {
      color: #1d4ed8;
      text-decoration: underline;
    }
    
    .alert {
      position: static;
      padding: 10px 12px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 14px;
      animation: slideIn 0.3s ease;
    }
    
    .alert-error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #dc2626;
    }
    
    .alert-success {
      background: #d1fae5;
      border: 1px solid #a7f3d0;
      color: #065f46;
    }
    
    .alert-close {
      background: none;
      border: none;
      color: inherit;
      cursor: pointer;
      font-size: 18px;
      padding: 0;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: background-color 0.2s ease;
    }
    
    .alert-close:hover {
      background: rgba(220, 38, 38, 0.1);
    }
    
    @keyframes slideIn {
      from { opacity: 0; transform: translateY(-6px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class LoginComponent {
  email = '';
  password = '';
  message = '';
  messageType = 'alert-error';
  isLoading = false;
  emailError = '';
  passwordError = '';

  constructor(private api: ApiService, private router: Router) {}

  validateForm(): boolean {
    this.emailError = '';
    this.passwordError = '';
    
    if (!this.email) {
      this.emailError = 'Email is required';
      return false;
    }
    
    if (!this.isValidEmail(this.email)) {
      this.emailError = 'Please enter a valid email address';
      return false;
    }
    
    if (!this.password) {
      this.passwordError = 'Password is required';
      return false;
    }
    
    if (this.password.length < 6) {
      this.passwordError = 'Password must be at least 6 characters long';
      return false;
    }
    
    return true;
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  clearMessage() { this.message = ''; }

  doLogin() {
    if (!this.validateForm()) return;

    this.isLoading = true;
    this.message = '';

    this.api.login(this.email, this.password).subscribe({
      next: (res: any) => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        this.message = 'Login successful! Redirecting...';
        this.messageType = 'alert-success';
        setTimeout(() => {
          if (res.user.role === 'admin') {
            window.location.href = '/admin';
          } else {
            window.location.href = '/';
          }
        }, 1000);
      },
      error: (err: any) => {
        this.isLoading = false;
        this.message = err?.error?.error || 'Login failed. Please check your credentials.';
        this.messageType = 'alert-error';
      }
    });
  }
}