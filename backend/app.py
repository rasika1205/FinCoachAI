from flask import Flask, jsonify,request
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

load_dotenv() 
app = Flask(__name__)
CORS(app)

app.secret_key = os.getenv("FLASK_SECRET_KEY") # required for session security
app.permanent_session_lifetime = timedelta(days=7)
client = MongoClient(os.getenv("MONGODB_URI"))  
db = client.fincoach  
users_collection = db.users  
quests_collection = db.quests  
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY") 
jwt = JWTManager(app)
GEMINI_KEY = os.getenv('GEMINI_API_KEY')
rf = joblib.load("rf_model.pkl")
gb = joblib.load("gb_model.pkl")
meta_model = joblib.load("meta_model.pkl")
client = genai.Client(api_key=GEMINI_KEY)

from routes.auth_routes import auth_bp
from routes.creditscore_route import credit_bp
from routes.playbook_route import playbook_bp
from routes.quest_route import quest_bp
from routes.tracker_route import tracker_bp
from routes.update_route import update_bp

app.register_blueprint(auth_bp)
app.register_blueprint(credit_bp)
app.register_blueprint(playbook_bp)
app.register_blueprint(quest_bp)
app.register_blueprint(tracker_bp)
app.register_blueprint(update_bp)

@app.route('/home', methods=['POST'])
def home():
    data = request.get_json()
    email = data.get("email")

    if not email:
        return jsonify({"error": "Email is required"}), 400

    user = users_collection.find_one({"email": email}, {"_id": 0})
    if not user:
        return jsonify({"error": "User not found"}), 404


    return jsonify(user), 200

# @app.route("/login", methods=["POST"])
# def login():
#     data = request.get_json()
#     email = data.get("email")
#     password = data.get("password")

#     if not email or not password:
#         return jsonify({"error": "Missing email or password"}), 400

#     # Find user by email
#     user_doc = users_collection.find_one({"email": email})
#     if not user_doc:
#         return jsonify({"error": "Invalid credentials"}), 401

#     # Check password
#     if not bcrypt.checkpw(password.encode("utf-8"), user_doc["password_hash"].encode("utf-8")):
#         return jsonify({"error": "Invalid credentials"}), 401

#     # Create JWT token
#     access_token = create_access_token(identity=email)

#     session.permanent = True
#     session["user_email"] = email 

#     return jsonify({
#         "access_token": access_token,
#         "email": user_doc["email"],
#         "profile": {
#         "job_details": user_doc.get("job", {
#             "company": "",
#             "designation": "",
#             "salary": 0
#         }),
#         "savings": user_doc.get("savings", []),
#         "expenditure": user_doc.get("expenditure", []),
#         "savings_accounts": user_doc.get("savings_accounts", []),
#         "current_accounts": user_doc.get("current_accounts", []),
#         "investments": user_doc.get("investments", []),
#         "loans": user_doc.get("loans", []),
#         "assets": user_doc.get("assets", [])
#     }
#     }), 200

# @app.route("/signup", methods=["POST"])
# def signup():
#     data = request.get_json()

#     # Extract all user info from request
#     email = data.get("email")
#     password = data.get("password")
#     job = data.get("job", {
#         "company": "",
#         "designation": "",
#         "salary": 0
#     })
#     savings = data.get("savings", [])
#     expenditure = data.get("expenditure", [])
#     savings_accounts = data.get("savings_accounts", [])
#     current_accounts = data.get("current_accounts", [])
#     investments = data.get("investments", [])
#     loans = data.get("loans", [])
#     assets = data.get("assets", [])
#     quests = data.get("quests", {"badges": [], "points": 0})

#     if not email or not password:
#         return jsonify({"error": "Missing email or password"}), 400

#     # Check if user already exists
#     if users_collection.find_one({"email": email}):
#         return jsonify({"error": "User already exists"}), 400

#     # Hash the password
#     hashed_pw = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

#     # Build user document
#     new_user = {
#         "email": email,
#         "password_hash": hashed_pw,
#         "job": job,
#         "savings": savings,
#         "expenditure": expenditure,
#         "savings_accounts": savings_accounts,
#         "current_accounts": current_accounts,
#         "investments": investments,
#         "loans": loans,
#         "assets": assets,
#         "quests_progress": quests
#     }

#     # Insert into DB
#     users_collection.insert_one(new_user)

#     return jsonify({"message": "User created successfully"}), 201

# @app.route("/logout", methods=["POST"])
# def logout():
#     session.pop("user_email", None)
#     return jsonify({"message": "Logged out successfully"}), 200


# @app.route('/tracker/update', methods=['POST'])
# def update_tracker():
#     data = request.get_json()

#     email = data.get("email")
#     savings = data.get("savings")
#     expenditure = data.get("expenditure")

#     # Validate fields
#     if not email:
#         return jsonify({"error": "Email is required"}), 400
#     if savings is None or expenditure is None:
#         return jsonify({"error": "Savings and expenditure are required"}), 400
#     if not isinstance(savings, (int, float)) or not isinstance(expenditure, (int, float)):
#         return jsonify({"error": "Savings and expenditure must be numeric"}), 400

#     #  Check if user exists
#     user = db.users.find_one({"email": email})
#     if not user:
#         return jsonify({"error": "User not found"}), 404

#     #  Append the new month's data
#     db.users.update_one(
#         {"email": email},
#         {
#             "$push": {
#                 "savings": float(savings),
#                 "expenditure": float(expenditure)
#             }
#         }
#     )

#     #  Fetch updated savings and expenditure
#     updated_user = db.users.find_one(
#         {"email": email},
#         {"savings": 1, "expenditure": 1, "_id": 0}
#     )

#     return jsonify({
#         "message": "Tracker updated successfully",
#         "updated_data": updated_user
#     }), 200

# @app.route("/tracker/recent", methods=["POST"])
# def get_recent_entries():
#     data = request.get_json()
#     email = data.get("email")

#     if not email:
#         return jsonify({"error": "Missing email"}), 400

#     user = users_collection.find_one({"email": email}, {"savings": 1, "expenditure": 1, "_id": 0})
#     if not user:
#         return jsonify({"error": "User not found"}), 404

#     savings = user.get("savings", [])
#     expenditure = user.get("expenditure", [])

#     # Create month-year labels for last few months (just for display)
#     from datetime import datetime
#     now = datetime.now()
#     months = [
#         "January", "February", "March", "April", "May", "June",
#         "July", "August", "September", "October", "November", "December"
#     ]

#     entries = []
#     for i in range(1, len(savings) + 1):
#         index = -i
#         entries.append({
#             "month": months[(now.month - i) % 12],
#             "year": now.year if now.month - i >= 0 else now.year - 1,
#             "savings": savings[index],
#             "expenditure": expenditure[index]
#         })

#     entries = entries[:3]  # last 3 entries

#     return jsonify({"entries": entries}), 200

# @app.route("/update", methods=["PUT"])
# def update_user_section():
#     try:
#         data = request.get_json()
#         section = data.get("section")
#         user_data = data.get("data")

#         if not section or not user_data:
#             return jsonify({"error": "Missing section or user data"}), 400

#         email = user_data.get("email")
#         if not email:
#             return jsonify({"error": "User email required"}), 400

#         # Build update fields based on the section
#         update_fields = {}

#         if section == "accounts":
#             update_fields = {
#                 "savings_accounts": user_data.get("savings_accounts", []),
#                 "current_accounts": user_data.get("current_accounts", []),
#                 "fds": user_data.get("fds", 0),
#                 "pf": user_data.get("pf", 0),
#             }

#         elif section == "investments":
#             update_fields = {
#                 "investments": user_data.get("investments", [])
#             }

#         elif section == "assets":
#             update_fields = {
#                 "assets": user_data.get("assets", []),
#                 "loans": user_data.get("loans", [])
#             }

#         elif section == "job":
#             update_fields = {
#                 "job_details": user_data.get("job_details", {}),
#                 "salary": user_data.get("salary", 0)
#             }

#         else:
#             return jsonify({"error": "Invalid section"}), 400

#         # Perform the update in MongoDB
#         result = users_collection.update_one(
#             {"email": email},
#             {"$set": update_fields}
#         )

#         if result.modified_count == 0:
#             return jsonify({"message": "No changes made or user not found"}), 200

#         # Fetch and return the updated document (for confirmation)
#         updated_user = users_collection.find_one({"email": email}, {"_id": 0, "password_hash": 0})

#         return jsonify({
#             "message": f"{section.capitalize()} updated successfully",
#             "updated_user": updated_user
#         }), 200

#     except Exception as e:
#         print("Error in update_user_section:", e)
#         return jsonify({"error": "Internal server error"}), 500

# @app.route("/api/user/profile", methods=["GET"])
# def get_user_profile():
#     email = request.args.get("email")
#     if not email:
#         return jsonify({"error": "Email required"}), 400

#     user = users_collection.find_one({"email": email}, {"_id": 0, "password_hash": 0})
#     if not user:
#         return jsonify({"error": "User not found"}), 404

#     return jsonify(user), 200

# @app.route("/quests", methods=["GET"])
# def get_quests():
#     user_email = request.args.get("email")
#     user = users_collection.find_one({"email": user_email})

#     all_quests = list(quests_collection.find({}))  # All quests
#     available_quests = []
#     completed_quests = []

#     for quest in all_quests:
#         progress_entry = next((q for q in user.get("quest_progress", []) if q["quest_id"] == quest["id"]), None)
#         progress = progress_entry["progress"] if progress_entry else 0
#         completed = progress_entry["completed"] if progress_entry else False

#         quest_data = {
#             "id": quest["id"],
#             "title": quest["title"],
#             "description": quest["description"],
#             "icon": quest["icon"],
#             "points": quest["points"],
#             "progress": progress,
#             "max_progress": quest["max_progress"],
#             "category": quest["category"],
#             "difficulty": quest["difficulty"]
#         }

#         if completed:
#             completed_quests.append({
#                 "id": quest["id"],
#                 "title": quest["title"],
#                 "description": quest["description"],
#                 "points": quest["points"],
#                 "completed_date": progress_entry.get("completed_date")
#             })
#         else:
#             available_quests.append(quest_data)

#     return jsonify({
#         "user_points": user.get("quests", {}).get("points", 0),
#         "user_level": (user.get("user_points", 0) // 500) + 1,
#         "user_badges" : user.get("quests", {}).get("badges", []),
#         "available_quests": available_quests,
#         "completed_quests": completed_quests,
#         "leaderboard": []  # Can be implemented separately
#     })

# @app.route("/update/quests/<int:quest_id>/claim", methods=["POST"])
# def claim_quest(quest_id):
#     user_email = request.json.get("email")
#     user = users_collection.find_one({"email": user_email})
#     quest = quests_collection.find_one({"id": quest_id})

#     # Find user progress
#     progress_entry = next((q for q in user["quest_progress"] if q["quest_id"] == quest_id), None)
#     if progress_entry and progress_entry["progress"] >= quest["max_progress"]:
#         return jsonify({"error": "Quest already completed"}), 400

#     # Update progress
#     if not progress_entry:
#         progress_entry = {"quest_id": quest_id, "progress": 1, "completed": False}
#         user["quest_progress"].append(progress_entry)
#     else:
#         progress_entry["progress"] += 1

#     if progress_entry["progress"] >= quest["max_progress"]:
#         progress_entry["completed"] = True
#         progress_entry["completed_date"] = datetime.now().isoformat()
#         user["quests"]["points"] += quest["points"]

#         # Optionally, assign badges
#         badge = {
#             "name": quest["title"],
#             "description": quest["description"],
#             "icon": quest["icon"],
#             "earned_date": datetime.now().isoformat()
#         }
#         user["quests"]["badges"].append(badge)


#     users_collection.update_one({"email": user_email}, {"$set": user})

#     return jsonify({"points": quest["points"]})


# @app.route("/quests/leaderboard", methods=["GET"])
# def get_leaderboard():
#     # 1 Fetch all users with their email and quest points
#     users = list(users_collection.find({}, {"email": 1, "quests.points": 1}))

#     # 2️ Sort users by points descending
#     users_sorted = sorted(users, key=lambda x: x.get("quests", {}).get("points", 0), reverse=True)

#     # 3️ Generate leaderboard entries
#     leaderboard = []
#     for idx, user in enumerate(users_sorted):
#         points = user.get("quests", {}).get("points", 0)
#         level = points // 500 + 1
#         leaderboard.append({
#             "rank": idx + 1,
#             "name": user["email"],
#             "points": points,
#             "level": level
#         })


#     #  Return the leaderboard
#     return jsonify({"leaderboard": leaderboard}), 200

# @app.route("/quests/check/<section>", methods=["POST"])
# def check_quest_section(section):
#     user_email = request.json.get("email")
#     if not user_email:
#         return jsonify({"error": "Email required"}), 400

#     user = users_collection.find_one({"email": user_email})
#     if not user:
#         return jsonify({"error": "User not found"}), 404
#     quests = user.get("quests", {})
#     if isinstance(quests, str):
#         import json
#         quests = json.loads(quests)  # convert JSON string to dict

#     badges = quests.get("badges", [])
#     if not isinstance(badges, list):
#         badges = []
#     # Quest configuration
#     QUEST_CONFIG = {
#         "accounts": {"points": 100, "badge_name": "Multi-Account Holder", "description": "You earned 100 points for having multiple accounts", "icon": "Building2"},
#         "investments": {"points": 150, "badge_name": "Investment Starter", "description": "You earned 150 points for your first investment", "icon": "TrendingUp"},
#         "assets": {"points": 200, "badge_name": "Asset Builder", "description": "You earned 200 points for recording assets", "icon": "Building2"},
#         "savings": {"points": 120, "badge_name": "Savings Growth", "description": "You earned 120 points for saving more than last month", "icon": "PiggyBank"}
#     }

#     quest_cfg = QUEST_CONFIG.get(section)
#     if not quest_cfg:
#         return jsonify({"error": "Invalid quest section"}), 400

#     completed = False

#     # Section checks
#     if section == "accounts":
#         completed = len(user.get("savings_accounts", [])) > 1 or len(user.get("current_accounts", [])) > 1
#     elif section == "investments":
#         completed = len(user.get("investments", [])) > 0
#     elif section == "assets":
#         completed = len(user.get("assets", [])) > 0
#     elif section == "savings":
#         savings = user.get("savings", [])
#         if len(savings) >= 2 and savings[-1] > savings[-2]:
#             completed = True

#     # Check if quest already completed
#     if completed:
#         existing_badge = next((b for b in user.get("quests", {}).get("badges", []) if b["name"] == quest_cfg["badge_name"]), None)
#         if not existing_badge:
#             badge = {
#                 "name": quest_cfg["badge_name"],
#                 "description": quest_cfg["description"],
#                 "icon": quest_cfg["icon"],
#                 "earned_date": datetime.now().isoformat()
#             }
#             # Update points and badges
#             user.setdefault("quests", {}).setdefault("badges", []).append(badge)
#             user["quests"]["points"] = user.get("quests", {}).get("points", 0) + quest_cfg["points"]

#             users_collection.update_one({"email": user_email}, {"$set": user})

#             return jsonify({"message": f"Quest '{section}' completed!", "points_awarded": quest_cfg["points"], "badge": badge}), 200

#     return jsonify({"message": f"Quest '{section}' not completed or already earned", "points_awarded": 0}), 200

# @app.route("/playbook", methods=["POST"])
# def financial_playbook():
#     try:
#         #  Get the logged-in user's email from request (auth middleware ideally)
#         data = request.get_json()
#         email = data.get("email")

#         if not email:
#             return jsonify({"error": "Email required"}), 400

#         #  Fetch user from DB
#         user = users_collection.find_one({"email": email}, {"password_hash": 0})
#         if not user:
#             return jsonify({"error": "User not found"}), 404

#         #  Prepare the data summary
#         user_summary = {
#             "salary": user.get("job", {}).get("salary", 0),
#             "savings": sum(user.get("savings", [])),
#             "expenditure": sum(user.get("expenditure", [])),
#             "loans": user.get("loans", []),
#             "savings_accounts": user.get("savings_accounts", []),
#             "current_accounts": user.get("current_accounts", []),
#             "assets": user.get("assets", []),
#             "investments": user.get("investments", []),
#         }

#         #  Construct prompt for Gemini
#         user_query = data.get("query", "How can I retire in 15 years?")
#         prompt = f"""
#         You are a certified financial advisor helping clients create personalized financial plans.

#         Here’s the user’s financial profile:
#         - Monthly Salary: ₹{user_summary["salary"]}
#         - Total Savings: ₹{user_summary["savings"]}
#         - Monthly Expenditure: ₹{user_summary["expenditure"]}
#         - Loans: {user_summary["loans"]}
#         - Assets: {user_summary["assets"]}
#         - Investments: {user_summary["investments"]}
#         - Savings Accounts: {user_summary["savings_accounts"]}
#         - Current Accounts: {user_summary["current_accounts"]}

#         The user is asking: "{user_query}"

#         Please give a clear, actionable financial strategy — including saving targets, investment diversification,
#         and long-term planning steps specific to Indian markets (mutual funds, PPF, NPS, SIPs, etc.).
#         Format it nicely in bullet points. Help the user in Investment strategies tailored to your income
#         Savings optimization techniques , 
#         Debt management and loan planning,
#         Financial goal setting and tracking and 
#         Market insights and recommendations
#         """

#         #  Get response from Gemini
#         response = client.models.generate_content(
#             model='gemini-2.5-flash',
#             contents=[prompt],
#         )
#         return jsonify({
#             "advice": response.text.strip(),
#             "user_summary": user_summary
#         }), 200

#     except Exception as e:
#         print("Error:", e)
#         return jsonify({"error": str(e)}), 500

# FEATURES = [
#     "total_savings", "total_expenditure", "savings_rate", "num_savings_accounts", "num_current_accounts", "total_account_balance",
#     "num_investments", "total_investment", "num_loans", "total_loan_amount","total_loan_emi",
#     "total_asset_value", "salary"
# ]

# @app.route("/credit-score", methods=["POST"])
# def credit_score():
#     data = request.json
#     email = data.get("email")
#     sample_user = users_collection.find_one({"email": email})
#     # Prepare features for the model
#     df = pd.DataFrame([{
#         "total_savings": sum(sample_user["savings"]),
#         "total_expenditure": sum(sample_user["expenditure"]),
#         "savings_rate": sum(sample_user["savings"]) / sum(sample_user["expenditure"]),
#         "num_savings_accounts": len(sample_user["savings_accounts"]),
#         "num_current_accounts": len(sample_user["current_accounts"]),
#         "total_account_balance": sum(float(acc["balance"]) for acc in sample_user["savings_accounts"] + sample_user["current_accounts"]),
#         "num_investments": len(sample_user["investments"]),
#         "total_investment": sum(float(inv["value"]) for inv in sample_user["investments"]),
#         "num_loans": len(sample_user["loans"]),
#         "total_loan_amount": sum(float(loan["amount"]) for loan in sample_user["loans"]),
#         "total_loan_emi": sum(float(loan["emi"]) for loan in sample_user["loans"]),
#         "num_assets": len(sample_user["assets"]),
#         "total_asset_value": sum(float(asset["value"]) for asset in sample_user["assets"]),
#         "salary": float(sample_user["job"]["salary"])
#     }])
    
#     # Base model predictions
#     pred_rf = rf.predict(df)[0]
#     pred_gb = gb.predict(df)[0]
    
#     # Stack predictions for meta-model
#     stack_input = pd.DataFrame([{"rf": pred_rf, "gb": pred_gb}])
#     credit_score_pred = meta_model.predict(stack_input)[0]
#     credit_score_pred = int(round(credit_score_pred))
#     # SHAP explanation
#     explainer_rf = shap.TreeExplainer(rf)
#     explainer_gb = shap.TreeExplainer(gb)
    
#     shap_values_rf = explainer_rf.shap_values(df)
#     shap_values_gb = explainer_gb.shap_values(df)
    
#     # Average SHAP values from both models
#     shap_values_avg = (shap_values_rf + shap_values_gb) / 2
    
#     # Prepare SHAP data for frontend
#     shap_importance = np.abs(shap_values_avg).mean(axis=0)
#     shap_data = []
#     for i, feature in enumerate(FEATURES):
#         shap_data.append({
#             "feature": feature,
#             "shap_value": int(round(shap_values_avg[0][i])),
#             "importance": int(round((shap_importance[i] / shap_importance.sum())))
#         })
    
#     # Confidence (can be defined as normalized inverse variance from base models)
#     base_preds = np.array([pred_rf, pred_gb])
#     confidence = float(100 - np.std(base_preds))  # simple heuristic
#     confidence = int(round(confidence))
#     # Mock positive/negative factors for frontend
#     factors_positive = [{"factor": f["feature"], "impact": max(f["shap_value"],0), "description": f"Positive impact of {f['feature']}"} for f in shap_data if f["shap_value"] > 0]
#     factors_negative = [{"factor": f["feature"], "impact": min(f["shap_value"],0), "description": f"Negative impact of {f['feature']}"} for f in shap_data if f["shap_value"] < 0]

#     users_collection.update_one(
#         {"email": email},
#         {"$push": {"credit_scores": {"score": credit_score_pred, "timestamp": pd.Timestamp.now().isoformat()}}}
#     )
#     if credit_score_pred < 650:
#         score_range = "Poor"
#     elif credit_score_pred < 700:
#         score_range = "Fair"
#     elif credit_score_pred < 750:
#         score_range = "Good"
#     else:
#         score_range = "Excellent"

#     historical_trend = [
#         {"month": cs["timestamp"][:7], "score": cs["score"]}  # Using YYYY-MM for x-axis
#         for cs in sample_user.get("credit_scores", [])
#     ]
#     response = {
#         "predicted_score": float(credit_score_pred),
#         "score_range": score_range,
#         "confidence": confidence,
#         "factors": {
#             "positive": factors_positive,
#             "negative": factors_negative
#         },
#         "shap_explanation": shap_data,
#         "historical_trend": historical_trend,
#         "score_breakdown": [
#       {"category": "Payment History", "score": 95, "weight": 35},
#         {"category": "Credit Utilization", "score": 78, "weight": 30},
#         {"category": "Credit Mix", "score": 75, "weight": 10},
#     ],  "recommendations": [
#         {
#             "category": "Short-term Actions",
#             "items": [
#                 "Pay bills on time to improve payment history.",
#                 "Reduce credit card balances to improve credit utilization."
#             ]
#         },
#         {
#             "category": "Long-term Strategy",
#             "items": [
#                 "Diversify credit accounts to improve credit mix.",
#                 "Maintain stable income growth."
#             ]
#         }
#     ]
#     }

#     return jsonify(response)


if __name__ == "__main__":
    app.run(debug=True)
