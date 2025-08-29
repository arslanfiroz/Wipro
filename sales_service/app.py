from flask import Flask, request, jsonify
from flask_cors import CORS
from sqlalchemy import create_engine, Column, Integer, Float, String, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime
import os, json, requests


import requests, os
AUTH_URL = os.getenv("AUTH_URL", "http://localhost:5003")


def verify_token_from_auth(token: str):
    try:
        r = requests.post(f"{AUTH_URL}/verify", json={"token": token}, timeout=5)
        if r.status_code != 200:
            return None
        return r.json().get("user")
    except Exception as e:
        return None


def get_token_from_request():
    from flask import request
    auth = request.headers.get("Authorization","")
    if auth.startswith("Bearer "):
        return auth.split(" ",1)[1]
    return None


app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": os.getenv("CORS_ORIGINS", "*")}})

INVENTORY_URL = os.getenv("INVENTORY_URL", "http://localhost:5001")
db_path = os.getenv("DB_PATH", "sales.db")

engine = create_engine(f"sqlite:///{db_path}", echo=False, future=True)
Base = declarative_base()
SessionLocal = sessionmaker(bind=engine)


class Sale(Base):
    __tablename__ = "sales"
    id = Column(Integer, primary_key=True, autoincrement=True)
    items = Column(String(4096), nullable=False)
    total = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


Base.metadata.create_all(bind=engine)


@app.get("/health")
def health(): return {"status":"ok"}


@app.get("/sales")
def history():
    with SessionLocal() as s:
        rows = s.query(Sale).order_by(Sale.created_at.desc()).all()
        return jsonify([{"id": r.id, "total": r.total, "items": json.loads(r.items), "created_at": r.created_at.isoformat()} for r in rows])


@app.put("/sales/<int:sale_id>")
def update_sale(sale_id: int):
    token = get_token_from_request()
    user = verify_token_from_auth(token) if token else None
    if not user:
        return {"error": "authentication required"}, 401
    if user.get("role") != "admin":
        return {"error": "admin only"}, 403

    data = request.json or {}
    with SessionLocal() as s:
        sale: Sale | None = s.get(Sale, sale_id)
        if not sale:
            return {"error": "sale not found"}, 404
            
        if "total" in data:
            try:
                total_value = float(data["total"])
                if total_value < 0:
                    return {"error": "Total amount cannot be negative"}, 400
                if total_value == 0:
                    return {"error": "Total amount must be greater than zero"}, 400
                sale.total = total_value
            except (ValueError, TypeError):
                return {"error": "Invalid total amount format"}, 400
                
        if "items" in data:
            try:
                items = data["items"]
                if not isinstance(items, list):
                    return {"error": "Items must be a list"}, 400
                # Validate each item in the list
                for item in items:
                    if not isinstance(item, dict):
                        return {"error": "Each item must be an object"}, 400
                    if "quantity" in item:
                        qty = int(item["quantity"])
                        if qty <= 0:
                            return {"error": "Item quantity must be positive"}, 400
                sale.items = json.dumps(items)
            except (ValueError, TypeError, json.JSONEncodeError):
                return {"error": "Invalid items format"}, 400
                
        try:
            s.commit()
            return {"ok": True}
        except Exception as e:
            return {"error": "Failed to update sale"}, 500


@app.delete("/sales/<int:sale_id>")
def delete_sale(sale_id: int):
    token = get_token_from_request()
    user = verify_token_from_auth(token) if token else None
    if not user:
        return {"error": "authentication required"}, 401
    if user.get("role") != "admin":
        return {"error": "admin only"}, 403

    with SessionLocal() as s:
        sale: Sale | None = s.get(Sale, sale_id)
        if not sale:
            return {"error": "sale not found"}, 404
        s.delete(sale)
        s.commit()
        return {"ok": True}


@app.post("/checkout")
def checkout():
    token = get_token_from_request()
    user = verify_token_from_auth(token) if token else None
    if not user:
        return {"error":"authentication required"}, 401
    
    data = request.json or {}
    items = data.get("items", [])
    
    # Validate checkout data
    if not items or len(items) == 0:
        return {"error": "No items in cart"}, 400
    
    # Validate each item
    for item in items:
        if not isinstance(item, dict):
            return {"error": "Invalid item format"}, 400
        try:
            qty = int(item.get("quantity", 0))
            if qty <= 0:
                return {"error": "Item quantity must be positive"}, 400
            product_id = int(item.get("product_id", 0))
            if product_id <= 0:
                return {"error": "Invalid product ID"}, 400
        except (ValueError, TypeError):
            return {"error": "Invalid quantity or product ID format"}, 400
    
    try:
        r = requests.post(f"{INVENTORY_URL}/deduct_stock", json={"items": items}, timeout=10)
        if r.status_code != 200:
            return jsonify(r.json()), r.status_code
        
        total = r.json().get("total", 0.0)
        if total <= 0:
            return {"error": "Invalid total amount"}, 400
            
        with SessionLocal() as s:
            sale = Sale(items=json.dumps(items), total=total)
            s.add(sale)
            s.commit()
            return {"ok": True, "sale_id": sale.id, "total": total}
    except requests.RequestException:
        return {"error": "Failed to process checkout"}, 500
    except Exception as e:
        return {"error": "Checkout failed"}, 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5002)))
