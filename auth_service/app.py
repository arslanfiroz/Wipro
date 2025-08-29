
from flask import Flask, request, jsonify
from flask_cors import CORS
from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime, timedelta
import os, hashlib, hmac, base64, json

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": os.getenv("CORS_ORIGINS", "*")}})

db_path = os.getenv("DB_PATH", "users.db")
engine = create_engine(f"sqlite:///{db_path}", echo=False, future=True)
Base = declarative_base()
SessionLocal = sessionmaker(bind=engine)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    role = Column(String, default="user")
    created_at = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(engine)

SECRET = os.getenv("AUTH_SECRET", "replace_me_with_strong_secret")

def hash_pw(pw: str) -> str:
    return hashlib.sha256(pw.encode()).hexdigest()

def make_token(payload: dict) -> str:
    header = base64.urlsafe_b64encode(json.dumps({"alg":"HS256"}).encode()).rstrip(b'=')
    body = base64.urlsafe_b64encode(json.dumps(payload).encode()).rstrip(b'=')
    sig = hmac.new(SECRET.encode(), header + b'.' + body, hashlib.sha256).digest()
    sigb = base64.urlsafe_b64encode(sig).rstrip(b'=')
    return header.decode() + "." + body.decode() + "." + sigb.decode()

def verify_token(token: str):
    try:
        header_b, body_b, sig_b = token.split('.')
        payload = json.loads(base64.urlsafe_b64decode(body_b + '==').decode())
        sig_check = hmac.new(SECRET.encode(), (header_b+'.'+body_b).encode(), hashlib.sha256).digest()
        if base64.urlsafe_b64encode(sig_check).rstrip(b'=').decode() != sig_b:
            return None
        if payload.get("exp") and datetime.utcnow().timestamp() > payload["exp"]:
            return None
        return payload
    except Exception as e:
        return None

def seed_admin():
    admin_email = os.getenv("ADMIN_EMAIL", "admin@admin.com")
    admin_pw = os.getenv("ADMIN_PW", "AdminPass123")
    with SessionLocal() as s:
        u = s.query(User).filter_by(email=admin_email).first()
        if not u:
            u = User(email=admin_email, password=hash_pw(admin_pw), role="admin")
            s.add(u); s.commit()

seed_admin()

@app.post("/register")
def register():
    data = request.json or {}
    email = data.get("email","").strip().lower()
    password = data.get("password","")
    if not email or not password:
        return {"error":"email and password required"}, 400
    with SessionLocal() as s:
        if s.query(User).filter_by(email=email).first():
            return {"error":"email already exists"}, 400
        u = User(email=email, password=hash_pw(password), role="user")
        s.add(u); s.commit()
        return {"ok": True, "user": {"email": u.email, "role": u.role}}

@app.post("/login")
def login():
    data = request.json or {}
    email = data.get("email","").strip().lower()
    password = data.get("password","")
    if not email or not password:
        return {"error":"email and password required"}, 400
    with SessionLocal() as s:
        u = s.query(User).filter_by(email=email).first()
        if not u or u.password != hash_pw(password):
            return {"error":"invalid credentials"}, 401
        payload = {"email": u.email, "role": u.role, "iat": int(datetime.utcnow().timestamp()), "exp": int((datetime.utcnow()+timedelta(days=7)).timestamp())}
        token = make_token(payload)
        return {"ok": True, "token": token, "user": {"email": u.email, "role": u.role}}

@app.post("/verify")
def verify():
    data = request.json or {}
    token = data.get("token","")
    p = verify_token(token)
    if not p:
        return {"error":"invalid token"}, 401
    return {"ok": True, "user": p}

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5003)))
