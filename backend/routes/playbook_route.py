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

GEMINI_KEY = os.getenv('GEMINI_API_KEY')
clientai = genai.Client(api_key=GEMINI_KEY)
client = MongoClient(os.getenv("MONGODB_URI"))  
db = client.fincoach  
users_collection = db.users  
quests_collection = db.quests
playbook_bp = Blueprint("playbook", __name__)

@playbook_bp.route("/playbook", methods=["POST"])
def financial_playbook():
    try:
        
        data = request.get_json()
        email = data.get("email")

        if not email:
            return jsonify({"error": "Email required"}), 400

        
        user = users_collection.find_one({"email": email}, {"password_hash": 0})
        if not user:
            return jsonify({"error": "User not found"}), 404

        
        user_summary = {
            "salary": user.get("job", {}).get("salary", 0),
            "savings": sum(user.get("savings", [])),
            "expenditure": sum(user.get("expenditure", [])),
            "loans": user.get("loans", []),
            "savings_accounts": user.get("savings_accounts", []),
            "current_accounts": user.get("current_accounts", []),
            "assets": user.get("assets", []),
            "investments": user.get("investments", []),
        }

        
        user_query = data.get("query", "How can I retire in 15 years?")
        prompt = f"""
        You are a certified financial advisor helping clients create personalized financial plans.

        Here’s the user’s financial profile:
        - Monthly Salary: ₹{user_summary["salary"]}
        - Total Savings: ₹{user_summary["savings"]}
        - Monthly Expenditure: ₹{user_summary["expenditure"]}
        - Loans: {user_summary["loans"]}
        - Assets: {user_summary["assets"]}
        - Investments: {user_summary["investments"]}
        - Savings Accounts: {user_summary["savings_accounts"]}
        - Current Accounts: {user_summary["current_accounts"]}

        The user is asking: "{user_query}"

        Please give a clear, actionable financial strategy — including saving targets, investment diversification,
        and long-term planning steps specific to Indian markets (mutual funds, PPF, NPS, SIPs, etc.).
        Format it nicely in bullet points. Help the user in Investment strategies tailored to your income
        Savings optimization techniques , 
        Debt management and loan planning,
        Financial goal setting and tracking and 
        Market insights and recommendations
        """

        
        response = clientai.models.generate_content(
            model='gemini-2.5-flash',
            contents=[prompt],
        )
        return jsonify({
            "advice": response.text.strip(),
            "user_summary": user_summary
        }), 200

    except Exception as e:
        print("Error:", e)
        return jsonify({"error": str(e)}), 500