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

update_bp = Blueprint("update", __name__)
client = MongoClient(os.getenv("MONGODB_URI"))  
db = client.fincoach  
users_collection = db.users  
quests_collection = db.quests

@update_bp.route("/update", methods=["PUT"])
def update_user_section():
    try:
        data = request.get_json()
        section = data.get("section")
        user_data = data.get("data")

        if not section or not user_data:
            return jsonify({"error": "Missing section or user data"}), 400

        email = user_data.get("email")
        if not email:
            return jsonify({"error": "User email required"}), 400

        
        update_fields = {}

        if section == "accounts":
            update_fields = {
                "savings_accounts": user_data.get("savings_accounts", []),
                "current_accounts": user_data.get("current_accounts", []),
                "fds": user_data.get("fds", 0),
                "pf": user_data.get("pf", 0),
            }

        elif section == "investments":
            update_fields = {
                "investments": user_data.get("investments", [])
            }

        elif section == "assets":
            update_fields = {
                "assets": user_data.get("assets", []),
                "loans": user_data.get("loans", [])
            }

        elif section == "job":
            update_fields = {
                "job": user_data.get("job", {}),
                "salary": user_data.get("salary", 0)
            }

        else:
            return jsonify({"error": "Invalid section"}), 400

        
        result = users_collection.update_one(
            {"email": email},
            {"$set": update_fields}
        )

        if result.modified_count == 0:
            return jsonify({"message": "No changes made or user not found"}), 200

        
        updated_user = users_collection.find_one({"email": email}, {"_id": 0, "password_hash": 0})

        return jsonify({
            "message": f"{section.capitalize()} updated successfully",
            "updated_user": updated_user
        }), 200

    except Exception as e:
        print("Error in update_user_section:", e)
        return jsonify({"error": "Internal server error"}), 500

@update_bp.route("/api/user/profile", methods=["GET"])
def get_user_profile():
    email = request.args.get("email")
    if not email:
        return jsonify({"error": "Email required"}), 400

    user = users_collection.find_one({"email": email}, {"_id": 0, "password_hash": 0})
    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify(user), 200