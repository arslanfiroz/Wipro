import { FormsModule } from '@angular/forms';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from './api.service';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <h1>Create Account</h1>
          <p>Join us and start shopping today</p>
        </div>
        
        <form (ngSubmit)="doRegister()" #registerForm="ngForm" class="auth-form">
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
            <label for="name">Full Name</label>
            <input 
              type="text"
              id="name"
              name="name"
              [(ngModel)]="name" 
              required
              [class.error]="nameError"
              placeholder="Enter your full name"
              [disabled]="isLoading"
            />
            <div class="error-message" *ngIf="nameError">{{ nameError }}</div>
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
              placeholder="Create a password"
              [disabled]="isLoading"
            />
            <div class="error-message" *ngIf="passwordError">{{ passwordError }}</div>
          </div>
          
          <div class="form-group">
            <label for="confirmPassword">Confirm Password</label>
            <input 
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              [(ngModel)]="confirmPassword" 
              required
              [class.error]="confirmPasswordError"
              placeholder="Confirm your password"
              [disabled]="isLoading"
            />
            <div class="error-message" *ngIf="confirmPasswordError">{{ confirmPasswordError }}</div>
          </div>
          
          <button 
            type="submit" 
            class="auth-button"
            [disabled]="isLoading || !registerForm.valid"
          >
            <span *ngIf="!isLoading">Create Account</span>
            <span *ngIf="isLoading" class="loading-spinner">Creating account...</span>
          </button>
        </form>
        
        <div class="auth-footer">
          <p>Already have an account? <a routerLink="/login" class="auth-link">Sign in</a></p>
        </div>
        
        <div class="alert alert-error" *ngIf="message">
          <span>{{ message }}</span>
          <button type="button" class="alert-close" (click)="clearMessage()">×</button>
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
    
    .auth-header { text-align: center; margin-bottom: 24px; }
    .auth-header h1 { margin: 0 0 8px 0; color: #1f2937; font-size: 28px; font-weight: 700; }
    .auth-header p { margin: 0; color: #6b7280; font-size: 16px; }
    .auth-form { display: flex; flex-direction: column; gap: 20px; }
    .form-group { display: flex; flex-direction: column; gap: 8px; }
    .form-group label { font-weight: 600; color: #374151; font-size: 14px; }
    .form-group input { padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 12px; font-size: 16px; transition: all 0.2s ease; background: #f9fafb; }
    .form-group input:focus { outline: none; border-color: #667eea; background: white; box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1); }
    .form-group input.error { border-color: #ef4444; background: #fef2f2; }
    .form-group input:disabled { opacity: 0.6; cursor: not-allowed; }
    .error-message { color: #ef4444; font-size: 14px; margin-top: 4px; }
    .auth-button { background: #2563eb; color: white; border: none; padding: 12px 20px; border-radius: 10px; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; margin-top: 6px; }
    .auth-button:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(37, 99, 235, 0.25); }
    .auth-button:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
    .loading-spinner { display: flex; align-items: center; justify-content: center; gap: 8px; }
    .loading-spinner::before { content: ''; width: 16px; height: 16px; border: 2px solid transparent; border-top: 2px solid white; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .auth-footer { text-align: center; margin-top: 20px; padding-top: 16px; border-top: 1px solid #e5e7eb; }
    .auth-footer p { margin: 0; color: #6b7280; font-size: 14px; }
    .auth-link { color: #2563eb; text-decoration: none; font-weight: 600; transition: color 0.2s ease; }
    .auth-link:hover { color: #1d4ed8; text-decoration: underline; }
    .alert { position: absolute; top: 20px; left: 20px; right: 20px; padding: 12px 16px; border-radius: 8px; display: flex; align-items: center; justify-content: space-between; font-size: 14px; animation: slideIn 0.3s ease; }
    .alert-error { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; }
    .alert-close { background: none; border: none; color: inherit; cursor: pointer; font-size: 18px; padding: 0; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; border-radius: 4px; transition: background-color 0.2s ease; }
    .alert-close:hover { background: rgba(220, 38, 38, 0.1); }
    @keyframes slideIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class RegisterComponent {
  email = '';
  name = '';
  password = '';
  confirmPassword = '';
  message = '';
  isLoading = false;
  emailError = '';
  nameError = '';
  passwordError = '';
  confirmPasswordError = '';

  constructor(private api: ApiService, private router: Router) {}

  validateForm(): boolean {
    this.emailError = '';
    this.nameError = '';
    this.passwordError = '';
    this.confirmPasswordError = '';
    if (!this.email) { this.emailError = 'Email is required'; return false; }
    if (!this.isValidEmail(this.email)) { this.emailError = 'Please enter a valid email address'; return false; }
    if (!this.name.trim()) { this.nameError = 'Full name is required'; return false; }
    if (!this.password) { this.passwordError = 'Password is required'; return false; }
    if (this.password.length < 6) { this.passwordError = 'Password must be at least 6 characters long'; return false; }
    if (!this.confirmPassword) { this.confirmPasswordError = 'Please confirm your password'; return false; }
    if (this.password !== this.confirmPassword) { this.confirmPasswordError = 'Passwords do not match'; return false; }
    return true;
  }

  isValidEmail(email: string): boolean { const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; return emailRegex.test(email); }
  clearMessage() { this.message = ''; }

  doRegister() {
    if (!this.validateForm()) return;
    this.isLoading = true;
    this.message = '';
    this.api.register(this.email, this.password).subscribe({
      next: (res: any) => {
        try { localStorage.setItem('profileName', this.name.trim()); } catch {}
        this.message = 'Account created successfully! Redirecting to login...';
        setTimeout(() => { window.location.href = '/login'; }, 1500);
      },
      error: (err: any) => {
        this.isLoading = false;
        this.message = err?.error?.error || 'Registration failed. Please try again.';
      }
    });
  }
}