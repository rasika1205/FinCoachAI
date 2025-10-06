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




if __name__ == "__main__":
    app.run(debug=True)
