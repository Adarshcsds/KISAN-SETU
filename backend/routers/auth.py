import json
import uuid
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from backend.auth import create_access_token, get_current_user, hash_password, verify_password
from backend.database import get_connection

router = APIRouter(prefix="/auth", tags=["Authentication"])
Role = Literal["farmer", "buyer", "logistics"]


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=8, max_length=20)
    email: Optional[str] = None
    password: str = Field(min_length=8, max_length=128)
    role: Role
    profile: dict = Field(default_factory=dict)


class LoginRequest(BaseModel):
    identifier: str = Field(min_length=3, max_length=160)
    password: str = Field(min_length=1, max_length=128)


def find_user(cur, identifier: str):
    cur.execute(
        "SELECT id, name, phone, email, role, created_at, is_active, profile, password_hash "
        "FROM users WHERE phone = %s OR lower(email) = lower(%s) OR lower(name) = lower(%s)",
        (identifier, identifier, identifier),
    )
    return cur.fetchone()


def public_user(row):
    return {
        "id": str(row[0]), "name": row[1], "phone": row[2], "email": row[3],
        "role": row[4], "createdAt": row[5].isoformat(), "isActive": row[6], "profile": row[7] or {},
    }


def validate_profile(role: Role, profile: dict) -> dict:
    required = {
        "farmer": ("location", "district", "state", "pinCode"),
        "buyer": ("firmName", "businessType", "address", "district", "state", "pinCode"),
        "logistics": ("firmName", "address", "district", "state", "pinCode"),
    }[role]
    missing = [field for field in required if not str(profile.get(field, "")).strip()]
    if missing:
        raise HTTPException(status_code=422, detail=f"Missing required profile fields: {', '.join(missing)}")
    if role == "farmer":
        categories = {"Vegetable", "Grain", "Pulse", "Oilseed", "Fruit", "Other"}
        crops = profile.get("crops", [])
        if not isinstance(crops, list) or not crops:
            raise HTTPException(status_code=422, detail="Farmers must provide at least one crop")
        for crop in crops:
            if not isinstance(crop, dict) or not str(crop.get("name", "")).strip() or crop.get("category") not in categories:
                raise HTTPException(status_code=422, detail="Each farmer crop needs a name and supported category")
    return profile


def create_profile(cur, user_id: str, role: Role, profile: dict) -> None:
    if role == "farmer":
        crops = profile["crops"]
        cur.execute(
            "INSERT INTO farmer_profiles (user_id, location, district, state, pin_code, farm_size_acres, primary_crop, crops) VALUES (%s,%s,%s,%s,%s,%s,%s,%s::jsonb)",
            (user_id, profile["location"], profile["district"], profile["state"], profile["pinCode"], profile.get("farmSizeAcres"), profile.get("primaryCrop"), json.dumps(crops)),
        )
        for crop in crops:
            cur.execute("INSERT INTO farmer_crops (farmer_id, crop_name, crop_category, is_primary) VALUES (%s,%s,%s,%s)", (user_id, crop["name"], crop["category"], bool(crop.get("isPrimary"))))
    elif role == "buyer":
        cur.execute("INSERT INTO buyer_profiles (user_id, firm_name, business_type, address, district, state, pin_code) VALUES (%s,%s,%s,%s,%s,%s,%s)", (user_id, profile["firmName"], profile["businessType"], profile["address"], profile["district"], profile["state"], profile["pinCode"]))
    else:
        cur.execute("INSERT INTO logistics_profiles (user_id, firm_name, address, district, state, pin_code, warehouse_available, warehouse_address, cold_storage_available, cold_storage_address, vehicle_types, vehicle_capacity, service_areas) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s::jsonb,%s,%s::jsonb)", (user_id, profile["firmName"], profile["address"], profile["district"], profile["state"], profile["pinCode"], bool(profile.get("warehouseAvailable")), profile.get("warehouseAddress"), bool(profile.get("coldStorageAvailable")), profile.get("coldStorageAddress"), json.dumps(profile.get("vehicleTypes", [])), profile.get("vehicleCapacity"), json.dumps(profile.get("serviceAreas", []))))


@router.post("/register", status_code=201)
def register(request: RegisterRequest):
    profile = validate_profile(request.role, request.profile)
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            if find_user(cur, request.phone) or (request.email and find_user(cur, request.email)):
                raise HTTPException(status_code=409, detail="An account with this phone or email already exists")
            cur.execute(
                "INSERT INTO users (id, name, phone, email, password_hash, role, profile) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s::jsonb) "
                "RETURNING id, name, phone, email, role, created_at, is_active, profile",
                (str(user_id := uuid.uuid4()), request.name.strip(), request.phone.strip(), request.email,
                 hash_password(request.password), request.role, json.dumps(profile)),
            )
            row = cur.fetchone()
            create_profile(cur, str(user_id), request.role, profile)
        conn.commit()
    except HTTPException:
        conn.rollback()
        raise
    finally:
        conn.close()
    user = public_user(row)
    return {"user": user, "accessToken": create_access_token(user["id"], user["role"]), "tokenType": "bearer"}


@router.post("/login")
def login(request: LoginRequest):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            row = find_user(cur, request.identifier.strip())
    finally:
        conn.close()
    if not row or not row[6] or not verify_password(request.password, row[8]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    user = public_user(row)
    return {"user": user, "accessToken": create_access_token(user["id"], user["role"]), "tokenType": "bearer"}


@router.get("/me")
def me(user=Depends(get_current_user)):
    return user


@router.get("/role/{required_role}")
def role_check(required_role: Role, user=Depends(get_current_user)):
    """Role-protected endpoint used by role-specific clients to verify access."""
    if user["role"] != required_role:
        raise HTTPException(status_code=403, detail="Insufficient role permissions")
    return {"user": user, "role": required_role}
