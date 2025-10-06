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

quest_bp = Blueprint("quest", __name__)
client = MongoClient(os.getenv("MONGODB_URI"))  
db = client.fincoach  
users_collection = db.users  
quests_collection = db.quests

@quest_bp.route("/quests", methods=["GET"])
def get_quests():
    user_email = request.args.get("email")
    user = users_collection.find_one({"email": user_email})

    all_quests = list(quests_collection.find({}))  # All quests
    available_quests = []
    completed_quests = []

    for quest in all_quests:
        progress_entry = next((q for q in user.get("quest_progress", []) if q["quest_id"] == quest["id"]), None)
        progress = progress_entry["progress"] if progress_entry else 0
        completed = progress_entry["completed"] if progress_entry else False

        quest_data = {
            "id": quest["id"],
            "title": quest["title"],
            "description": quest["description"],
            "icon": quest["icon"],
            "points": quest["points"],
            "progress": progress,
            "max_progress": quest["max_progress"],
            "category": quest["category"],
            "difficulty": quest["difficulty"]
        }

        if completed:
            completed_quests.append({
                "id": quest["id"],
                "title": quest["title"],
                "description": quest["description"],
                "points": quest["points"],
                "completed_date": progress_entry.get("completed_date")
            })
        else:
            available_quests.append(quest_data)

    return jsonify({
        "user_points": user.get("quests", {}).get("points", 0),
        "user_level": (user.get("user_points", 0) // 500) + 1,
        "user_badges" : user.get("quests", {}).get("badges", []),
        "available_quests": available_quests,
        "completed_quests": completed_quests,
        "leaderboard": []  # Can be implemented separately
    })

@quest_bp.route("/update/quests/<int:quest_id>/claim", methods=["POST"])
def claim_quest(quest_id):
    user_email = request.json.get("email")
    user = users_collection.find_one({"email": user_email})
    quest = quests_collection.find_one({"id": quest_id})

    # Find user progress
    progress_entry = next((q for q in user["quest_progress"] if q["quest_id"] == quest_id), None)
    if progress_entry and progress_entry["progress"] >= quest["max_progress"]:
        return jsonify({"error": "Quest already completed"}), 400

    # Update progress
    if not progress_entry:
        progress_entry = {"quest_id": quest_id, "progress": 1, "completed": False}
        user["quest_progress"].append(progress_entry)
    else:
        progress_entry["progress"] += 1

    if progress_entry["progress"] >= quest["max_progress"]:
        progress_entry["completed"] = True
        progress_entry["completed_date"] = datetime.now().isoformat()
        user["quests"]["points"] += quest["points"]

        # Optionally, assign badges
        badge = {
            "name": quest["title"],
            "description": quest["description"],
            "icon": quest["icon"],
            "earned_date": datetime.now().isoformat()
        }
        user["quests"]["badges"].append(badge)


    users_collection.update_one({"email": user_email}, {"$set": user})

    return jsonify({"points": quest["points"]})


@quest_bp.route("/quests/leaderboard", methods=["GET"])
def get_leaderboard():
    # 1 Fetch all users with their email and quest points
    users = list(users_collection.find({}, {"email": 1, "quests.points": 1}))

    # 2️ Sort users by points descending
    users_sorted = sorted(users, key=lambda x: x.get("quests", {}).get("points", 0), reverse=True)

    # 3️ Generate leaderboard entries
    leaderboard = []
    for idx, user in enumerate(users_sorted):
        points = user.get("quests", {}).get("points", 0)
        level = points // 500 + 1
        leaderboard.append({
            "rank": idx + 1,
            "name": user["email"],
            "points": points,
            "level": level
        })


    #  Return the leaderboard
    return jsonify({"leaderboard": leaderboard}), 200

@quest_bp.route("/quests/check/<section>", methods=["POST"])
def check_quest_section(section):
    user_email = request.json.get("email")
    if not user_email:
        return jsonify({"error": "Email required"}), 400

    user = users_collection.find_one({"email": user_email})
    if not user:
        return jsonify({"error": "User not found"}), 404
    quests = user.get("quests", {})
    if isinstance(quests, str):
        import json
        quests = json.loads(quests)  # convert JSON string to dict

    badges = quests.get("badges", [])
    if not isinstance(badges, list):
        badges = []
    # Quest configuration
    QUEST_CONFIG = {
        "accounts": {"points": 100, "badge_name": "Multi-Account Holder", "description": "You earned 100 points for having multiple accounts", "icon": "Building2"},
        "investments": {"points": 150, "badge_name": "Investment Starter", "description": "You earned 150 points for your first investment", "icon": "TrendingUp"},
        "assets": {"points": 200, "badge_name": "Asset Builder", "description": "You earned 200 points for recording assets", "icon": "Building2"},
        "savings": {"points": 120, "badge_name": "Savings Growth", "description": "You earned 120 points for saving more than last month", "icon": "PiggyBank"},
        "credit": {"points": 100, "badge_name": "Credit Score Explorer", "description": "You checked your credit score", "icon": "CreditCard"},
        "tracking": {"points": 80, "badge_name": "Tracking Enthusiast", "description": "You tracked your expenses for a month", "icon": "Activity"},
    }

    quest_cfg = QUEST_CONFIG.get(section)
    if not quest_cfg:
        return jsonify({"error": "Invalid quest section"}), 400

    completed = False

    # Section checks
    if section == "accounts":
        completed = len(user.get("savings_accounts", [])) > 1 or len(user.get("current_accounts", [])) > 1
    elif section == "investments":
        completed = len(user.get("investments", [])) > 0
    elif section == "assets":
        completed = len(user.get("assets", [])) > 0
    elif section == "savings":
        savings = user.get("savings", [])
        if len(savings) >= 2 and savings[-1] > savings[-2]:
            completed = True
    elif section == "credit":
        completed = len(user.get("credit_scores", [])) > 0
    elif section == "tracking":
        completed = user.get("tracking_count", 0) >= 3

    # Check if quest already completed
    if completed:
        existing_badge = next((b for b in user.get("quests", {}).get("badges", []) if b["name"] == quest_cfg["badge_name"]), None)
        if not existing_badge:
            badge = {
                "name": quest_cfg["badge_name"],
                "description": quest_cfg["description"],
                "icon": quest_cfg["icon"],
                "earned_date": datetime.now().isoformat()
            }
            # Update points and badges
            user.setdefault("quests", {}).setdefault("badges", []).append(badge)
            user["quests"]["points"] = user.get("quests", {}).get("points", 0) + quest_cfg["points"]

            users_collection.update_one({"email": user_email}, {"$set": user})

            return jsonify({"message": f"Quest '{section}' completed!", "points_awarded": quest_cfg["points"], "badge": badge}), 200

    return jsonify({"message": f"Quest '{section}' not completed or already earned", "points_awarded": 0}), 200