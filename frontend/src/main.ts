import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { importProvidersFrom } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, Routes } from '@angular/router';
import { AppComponent } from './app/app.component';
import { ProductsComponent } from './app/products.component';
import { CheckoutComponent } from './app/checkout.component';
import { SalesHistoryComponent } from './app/sales-history.component';
import { LoginComponent } from './app/login.component';
import { RegisterComponent } from './app/register.component';
import { UserInfoComponent } from './app/user-info.component';
import { AdminCrudComponent } from './app/admin-crud.component';
import { env } from './environments/environment';
import { authInterceptor } from './app/auth.interceptor';   


const routes: Routes = [
  { path: '', component: ProductsComponent },
  { path: 'checkout', component: CheckoutComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'admin', component: AdminCrudComponent },
  { path: 'sales-history', component: SalesHistoryComponent },
  { path: 'me', component: UserInfoComponent },
];

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(FormsModule),
    provideHttpClient(
      withInterceptors([authInterceptor])   
    ),
    provideRouter(routes),
    { provide: 'API_INVENTORY', useValue: env.inventoryApi },
    { provide: 'API_SALES', useValue: env.salesApi },
    { provide: 'API_AUTH', useValue: env.authApi },
  ]
}).catch(err => console.error(err));