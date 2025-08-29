# SMIM - Supply Management & Inventory Management

A microservices-based e-commerce application with Angular frontend and Flask backend services.

## Architecture

- **Frontend**: Angular 20 (Port 8081)
- **Auth Service**: JWT authentication (Port 5003)
- **Inventory Service**: Product management (Port 5001)
- **Sales Service**: Order processing (Port 5002)

## Quick Start

```bash
docker compose up --build
```

**Access Points:**
- Frontend: http://localhost:8081
- Inventory API: http://localhost:5001
- Sales API: http://localhost:5002
- Auth API: http://localhost:5003

**Default Admin Login:**
- Email: `admin@admin.com`
- Password: `AdminPass123`

## Features

- 🛒 Product catalog with search/filter
- 🛍️ Shopping cart functionality
- 🔐 JWT-based authentication
- 👨‍💼 Admin panel for product management
- 📊 Sales history and analytics
- 📱 Responsive modern UI

## Development

### Frontend Only
```bash
cd frontend
npm install
ng serve
```

### Backend Services
Each service can be run individually:
```bash
cd auth_service
pip install -r requirements.txt
python app.py
```
