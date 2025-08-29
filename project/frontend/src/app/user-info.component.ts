
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="card" style="padding:16px;">
    <h2>User Info</h2>
    <div *ngIf="user; else guest">
      <p><strong>Name:</strong> {{ profileName || '(not set)' }}</p>
      <p><strong>Email:</strong> {{ user.email }}</p>
      <p><strong>Role:</strong> {{ user.role }}</p>
    </div>
    <ng-template #guest>
      <p>You are not logged in.</p>
    </ng-template>
  </div>
  `
})
export class UserInfoComponent {
  user = (() => { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; } })();
  profileName = (() => { try { return localStorage.getItem('profileName') || ''; } catch { return ''; } })();
}
