from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import User
from schemas import UserCreate, UserLogin , UserResponse , UserUpdate
from auth import hash_password, verify_password
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime



app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {
        "message": "Backend is running"
    }


@app.post("/register")
def register(
    user: UserCreate,
    db: Session = Depends(get_db)
):

    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    hashed_password = hash_password(user.password)

    new_user = User(
        name=user.name,
        email=user.email,
        password=hashed_password
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User registered successfully",
        "user": {
            "id": new_user.id,
            "name": new_user.name,
            "email": new_user.email
        }
    }


@app.post("/login")
def login(
    user: UserLogin,
    db: Session = Depends(get_db)
):

    existing_user = db.query(User).filter(
    User.email == user.email,
    User.is_deleted == False,
    User.deleted_at.is_(None)
    ).first()

    if not existing_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    password_correct = verify_password(
        user.password,
        existing_user.password
    )

    if not password_correct:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    return {
        "message": "Login successful",
        "user": {
            "id": existing_user.id,
            "name": existing_user.name,
            "email": existing_user.email
        }
    }

@app.get("/users", response_model=list[UserResponse])
def get_users(db: Session = Depends(get_db)):

    users = db.query(User).filter(
        User.is_deleted == False,
        User.deleted_at.is_(None)
    ).all()

    return users

@app.get("/users/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):

    user = db.query(User).filter(
        User.id == user_id,
        User.is_deleted == False,
        User.deleted_at.is_(None)
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return user

@app.put("/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db)
):

    # Find the active user
    user = db.query(User).filter(
        User.id == user_id,
        User.is_deleted == False,
        User.deleted_at.is_(None)
    ).first()

    # User does not exist
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # Check whether the new email belongs to another user
    existing_email = db.query(User).filter(
        User.email == user_data.email,
        User.id != user_id
    ).first()

    if existing_email:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # Update user data
    user.name = user_data.name
    user.email = user_data.email

    # Save changes
    db.commit()
    db.refresh(user)

    return user

@app.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db)
):

    # Find only an active user
    user = db.query(User).filter(
        User.id == user_id,
        User.is_deleted == False,
        User.deleted_at.is_(None)
    ).first()

    # User doesn't exist or is already deleted
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found or already deleted"
        )

    # Soft delete
    user.is_deleted = True
    user.deleted_at = datetime.now()

    # Save changes
    db.commit()
    db.refresh(user)

    return {
        "message": "User soft deleted successfully",
        "user_id": user.id,
        "deleted_at": user.deleted_at
    }