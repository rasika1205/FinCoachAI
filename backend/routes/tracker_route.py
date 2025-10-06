from flask import Flask, jsonify,request, Blueprint
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

tracker_bp = Blueprint("tracker", __name__)
client = MongoClient(os.getenv("MONGODB_URI"))  
db = client.fincoach  
users_collection = db.users  
quests_collection = db.quests

@tracker_bp.route('/tracker/update', methods=['POST'])
def update_tracker():
    data = request.get_json()

    email = data.get("email")
    savings = data.get("savings")
    expenditure = data.get("expenditure")

    
    if not email:
        return jsonify({"error": "Email is required"}), 400
    if savings is None or expenditure is None:
        return jsonify({"error": "Savings and expenditure are required"}), 400
    if not isinstance(savings, (int, float)) or not isinstance(expenditure, (int, float)):
        return jsonify({"error": "Savings and expenditure must be numeric"}), 400

    
    user = db.users.find_one({"email": email})
    if not user:
        return jsonify({"error": "User not found"}), 404

    
    db.users.update_one(
        {"email": email},
        {
            "$push": {
                "savings": float(savings),
                "expenditure": float(expenditure)
            }
        }
    )

    
    updated_user = db.users.find_one(
        {"email": email},
        {"savings": 1, "expenditure": 1, "_id": 0}
    )

    return jsonify({
        "message": "Tracker updated successfully",
        "updated_data": updated_user
    }), 200

@tracker_bp.route("/tracker/recent", methods=["POST"])
def get_recent_entries():
    data = request.get_json()
    email = data.get("email")

    if not email:
        return jsonify({"error": "Missing email"}), 400

    user = users_collection.find_one({"email": email}, {"savings": 1, "expenditure": 1, "_id": 0})
    if not user:
        return jsonify({"error": "User not found"}), 404

    savings = user.get("savings", [])
    expenditure = user.get("expenditure", [])

    
    from datetime import datetime
    now = datetime.now()
    months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ]

    entries = []
    for i in range(1, len(savings) + 1):
        index = -i
        entries.append({
            "month": months[(now.month - i) % 12],
            "year": now.year if now.month - i >= 0 else now.year - 1,
            "savings": savings[index],
            "expenditure": expenditure[index]
        })

    entries = entries[:3]  

    return jsonify({"entries": entries}), 200
