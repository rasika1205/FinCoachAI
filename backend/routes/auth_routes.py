from flask import Flask, jsonify,request, Blueprint, session
from flask_jwt_extended import JWTManager, create_access_token
from pymongo import MongoClient
from flask_cors import CORS
import bcrypt
from datetime import datetime
from google import genai
import os 
from dotenv import load_dotenv
import joblib
import pandas as pd
import numpy as np
import shap
from datetime import timedelta

auth_bp = Blueprint("auth", __name__)
client = MongoClient(os.getenv("MONGODB_URI"))  
db = client.fincoach  
users_collection = db.users  
quests_collection = db.quests

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Missing email or password"}), 400

    # Find user by email
    user_doc = users_collection.find_one({"email": email})
    if not user_doc:
        return jsonify({"error": "Invalid credentials"}), 401

    # Check password
    if not bcrypt.checkpw(password.encode("utf-8"), user_doc["password_hash"].encode("utf-8")):
        return jsonify({"error": "Invalid credentials"}), 401

    # Create JWT token
    access_token = create_access_token(identity=email)

    session.permanent = True
    session["user_email"] = email 

    return jsonify({
        "access_token": access_token,
        "email": user_doc["email"],
        "profile": {
        "job_details": user_doc.get("job", {
            "company": "",
            "designation": "",
            "salary": 0
        }),
        "savings": user_doc.get("savings", []),
        "expenditure": user_doc.get("expenditure", []),
        "savings_accounts": user_doc.get("savings_accounts", []),
        "current_accounts": user_doc.get("current_accounts", []),
        "investments": user_doc.get("investments", []),
        "loans": user_doc.get("loans", []),
        "assets": user_doc.get("assets", [])
    }
    }), 200

@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.get_json()

    # Extract all user info from request
    email = data.get("email")
    password = data.get("password")
    job = data.get("job", {
        "company": "",
        "designation": "",
        "salary": 0
    })
    savings = data.get("savings", [])
    expenditure = data.get("expenditure", [])
    savings_accounts = data.get("savings_accounts", [])
    current_accounts = data.get("current_accounts", [])
    investments = data.get("investments", [])
    loans = data.get("loans", [])
    assets = data.get("assets", [])
    quests = data.get("quests", {"badges": [], "points": 0})

    if not email or not password:
        return jsonify({"error": "Missing email or password"}), 400

    # Check if user already exists
    if users_collection.find_one({"email": email}):
        return jsonify({"error": "User already exists"}), 400

    # Hash the password
    hashed_pw = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    # Build user document
    new_user = {
        "email": email,
        "password_hash": hashed_pw,
        "job": job,
        "savings": savings,
        "expenditure": expenditure,
        "savings_accounts": savings_accounts,
        "current_accounts": current_accounts,
        "investments": investments,
        "loans": loans,
        "assets": assets,
        "quests_progress": quests
    }

    # Insert into DB
    users_collection.insert_one(new_user)

    return jsonify({"message": "User created successfully"}), 201

@auth_bp.route("/logout", methods=["POST"])
def logout():
    session.pop("user_email", None)
    return jsonify({"message": "Logged out successfully"}), 200