from flask import Flask, request, jsonify
from flask_cors import CORS
from sqlalchemy import create_engine, Column, Integer, String, Float, Text
from sqlalchemy.orm import declarative_base, sessionmaker
import os, random


import requests
AUTH_URL = os.getenv("AUTH_URL", "http://localhost:5003")

def verify_token_from_auth(token: str):
    try:
        r = requests.post(f"{AUTH_URL}/verify", json={"token": token}, timeout=5)
        if r.status_code != 200:
            return None
        return r.json().get("user")
    except Exception as e:
        return None


def require_admin():
    from flask import request
    auth = request.headers.get("Authorization","")
    if auth.startswith("Bearer "):
        token = auth.split(" ",1)[1]
        user = verify_token_from_auth(token)
        if user and user.get("role") == "admin":
            return user
    return None


app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": os.getenv("CORS_ORIGINS", "*")}})

db_path = os.getenv("DB_PATH", "inventory.db")
engine = create_engine(f"sqlite:///{db_path}", echo=False, future=True)
Base = declarative_base()
SessionLocal = sessionmaker(bind=engine)

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(150), nullable=False, unique=True)
    brand = Column(String(120), nullable=True)
    category = Column(String(80), nullable=True)
    price = Column(Float, nullable=False)
    stock = Column(Integer, nullable=False, default=0)
    unit = Column(String(40), nullable=True)   
    image = Column(Text, nullable=True)       

Base.metadata.create_all(bind=engine)

SEED = [
    ("Amul Taaza Toned Milk", "Amul", "Dairy", 66, 120, "1L", None),
    ("Mother Dairy Full Cream Milk", "Mother Dairy", "Dairy", 74, 90, "1L", None),
    ("Britannia Whole Wheat Bread", "Britannia", "Bakery", 45, 150, "400g", None),
    ("Aashirvaad Atta", "ITC", "Grocery", 315, 60, "5kg", None),
    ("Fortune Sunflower Oil", "Fortune", "Oil", 140, 80, "1L", None),
    ("Tata Salt", "Tata", "Grocery", 28, 200, "1kg", None),
    ("Parle-G Gold Biscuits", "Parle", "Snacks", 35, 300, "250g", None),
    ("Lays Magic Masala", "PepsiCo", "Snacks", 20, 250, "52g", None),
    ("Maggie 2-Minute Noodles", "Nestle", "Noodles", 14, 400, "70g", None),
    ("Colgate Strong Teeth", "Colgate", "Personal Care", 115, 90, "200g", None),
    ("Dove Shampoo", "Dove", "Personal Care", 245, 70, "340ml", None),
    ("Good Day Cashew Cookies", "Britannia", "Snacks", 35, 180, "250g", None),
    ("Kellogg's Corn Flakes", "Kellogg's", "Breakfast", 199, 85, "475g", None),
    ("Nescafe Classic", "Nestle", "Beverages", 335, 60, "100g", None),
    ("Red Label Tea", "Brooke Bond", "Beverages", 160, 80, "500g", None),
    ("Onion", "Fresh", "Vegetables", 40, 500, "1kg", None),
    ("Tomato", "Fresh", "Vegetables", 30, 450, "1kg", None),
    ("Potato", "Fresh", "Vegetables", 25, 600, "1kg", None),
    ("Banana", "Fresh", "Fruits", 60, 220, "1 dozen", None),
    ("Apple", "Fresh", "Fruits", 160, 180, "1kg", None)
]

with SessionLocal() as s:
    if s.query(Product).count() == 0:
        for row in SEED:
            s.add(Product(name=row[0], brand=row[1], category=row[2], price=row[3],
                          stock=row[4], unit=row[5], image=row[6]))
        s.commit()
    else:
        # Update existing products with new image URLs
        for i, row in enumerate(SEED):
            product = s.query(Product).filter_by(name=row[0]).first()
            if product:
                product.image = row[6]
        s.commit()

@app.get("/health")
def health(): return {"status":"ok"}

@app.get("/products")
def list_products():
    with SessionLocal() as s:
        items = s.query(Product).all()
        return jsonify([{
            "id": p.id, "name": p.name, "brand": p.brand, "category": p.category,
            "price": p.price, "stock": p.stock, "unit": p.unit, "image": p.image
        } for p in items])

@app.post("/products")
def add_product():
    data = request.json or {}
    
    # Skip validation for empty data
    if not data:
        return {"error": "No data provided"}, 400
    
    # Comprehensive validation
    try:
        price = float(data.get("price", 0))
        stock = int(data.get("stock", 0))
        
        if price < 0:
            return {"error": "Price cannot be negative"}, 400
        if stock < 0:
            return {"error": "Stock cannot be negative"}, 400
        if price == 0:
            return {"error": "Price must be greater than zero"}, 400
            
        # Ensure data types are correct
        data["price"] = price
        data["stock"] = stock
        
    except (ValueError, TypeError):
        return {"error": "Invalid price or stock format"}, 400
    
    # Validate required fields
    if not str(data.get("name", "")).strip():
        return {"error": "Product name is required"}, 400
    
    # Validate unit field for negative values
    unit = str(data.get("unit", "")) if data.get("unit") is not None else ""
    if unit and "-" in unit and any(c.isdigit() for c in unit):
        return {"error": "Unit cannot contain negative values"}, 400
    
    with SessionLocal() as s:
        try:
            p = Product(**data)
            s.add(p)
            s.commit()
            return {"id": p.id}, 201
        except Exception as e:
            s.rollback()
            return {"error": f"Failed to create product: {str(e)}"}, 500

@app.put("/products/<int:pid>")
def update_product(pid):
    user = require_admin()
    if not user: return {"error":"admin required"}, 403
    data = request.json or {}
    
    # Skip validation for empty data
    if not data:
        return {"error": "No data provided"}, 400
    
    # Comprehensive validation for updates
    if "price" in data:
        try:
            price = float(data["price"])
            if price < 0:
                return {"error": "Price cannot be negative"}, 400
            if price == 0:
                return {"error": "Price must be greater than zero"}, 400
            data["price"] = price
        except (ValueError, TypeError):
            return {"error": "Invalid price format"}, 400
            
    if "stock" in data:
        try:
            stock = int(data["stock"])
            if stock < 0:
                return {"error": "Stock cannot be negative"}, 400
            data["stock"] = stock
        except (ValueError, TypeError):
            return {"error": "Invalid stock format"}, 400
    
    if "name" in data:
        if not str(data["name"]).strip():
            return {"error": "Product name cannot be empty"}, 400
    
    # Validate unit field for negative values in updates
    if "unit" in data:
        unit = str(data["unit"]) if data["unit"] is not None else ""
        if unit and "-" in unit and any(c.isdigit() for c in unit):
            return {"error": "Unit cannot contain negative values"}, 400
    
    with SessionLocal() as s:
        p = s.get(Product, pid)
        if not p: return {"error":"Not found"}, 404
        try:
            # Only update fields that are provided
            for k, v in data.items():
                if hasattr(p, k):
                    setattr(p, k, v)
            s.commit()
            return {"ok": True}
        except Exception as e:
            s.rollback()
            return {"error": f"Failed to update product: {str(e)}"}, 500

@app.delete("/products/<int:pid>")
def delete_product(pid):
    user = require_admin()
    if not user: return {"error":"admin required"}, 403
    with SessionLocal() as s:
        p = s.get(Product, pid)
        if not p: return {"error":"Not found"}, 404
        s.delete(p); s.commit(); return {"ok": True}

@app.post("/deduct_stock")
def deduct_stock():
    data = request.json or {}; items = data.get("items", [])
    with SessionLocal() as s:
        for it in items:
            prod = s.get(Product, int(it["product_id"]))
            qty = int(it["quantity"])
            if not prod: return {"error": f"Product {it['product_id']} not found"}, 404
            if prod.stock < qty: return {"error": f"Insufficient stock for {prod.name}"}, 400
        total = 0.0
        for it in items:
            prod = s.get(Product, int(it["product_id"]))
            qty = int(it["quantity"])
            prod.stock -= qty
            total += prod.price * qty
        s.commit()
        return {"ok": True, "total": round(total, 2)}

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5001)))



