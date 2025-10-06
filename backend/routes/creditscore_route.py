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

rf = joblib.load("rf_model.pkl")
gb = joblib.load("gb_model.pkl")
meta_model = joblib.load("meta_model.pkl")
client = MongoClient(os.getenv("MONGODB_URI"))  
db = client.fincoach  
users_collection = db.users  
quests_collection = db.quests

credit_bp = Blueprint("credit", __name__)

FEATURES = [
    "total_savings", "total_expenditure", "savings_rate", "num_savings_accounts", "num_current_accounts", "total_account_balance",
    "num_investments", "total_investment", "num_loans", "total_loan_amount","total_loan_emi",
    "total_asset_value", "salary"
]

@credit_bp.route("/credit-score", methods=["POST"])
def credit_score():
    data = request.json
    email = data.get("email")
    sample_user = users_collection.find_one({"email": email})
    
    df = pd.DataFrame([{
        "total_savings": sum(sample_user["savings"]),
        "total_expenditure": sum(sample_user["expenditure"]),
        "savings_rate": sum(sample_user["savings"]) / sum(sample_user["expenditure"]),
        "num_savings_accounts": len(sample_user["savings_accounts"]),
        "num_current_accounts": len(sample_user["current_accounts"]),
        "total_account_balance": sum(float(acc["balance"]) for acc in sample_user["savings_accounts"] + sample_user["current_accounts"]),
        "num_investments": len(sample_user["investments"]),
        "total_investment": sum(float(inv["value"]) for inv in sample_user["investments"]),
        "num_loans": len(sample_user["loans"]),
        "total_loan_amount": sum(float(loan["amount"]) for loan in sample_user["loans"]),
        "total_loan_emi": sum(float(loan["emi"]) for loan in sample_user["loans"]),
        "num_assets": len(sample_user["assets"]),
        "total_asset_value": sum(float(asset["value"]) for asset in sample_user["assets"]),
        "salary": float(sample_user["job"]["salary"])
    }])
    
    
    pred_rf = rf.predict(df)[0]
    pred_gb = gb.predict(df)[0]
    
    
    stack_input = pd.DataFrame([{"rf": pred_rf, "gb": pred_gb}])
    credit_score_pred = meta_model.predict(stack_input)[0]
    credit_score_pred = int(round(credit_score_pred))
    
    explainer_rf = shap.TreeExplainer(rf)
    explainer_gb = shap.TreeExplainer(gb)
    
    shap_values_rf = explainer_rf.shap_values(df)
    shap_values_gb = explainer_gb.shap_values(df)
    
    
    shap_values_avg = (shap_values_rf + shap_values_gb) / 2
    
    
    shap_importance = np.abs(shap_values_avg).mean(axis=0)
    shap_data = []
    for i, feature in enumerate(FEATURES):
        shap_data.append({
            "feature": feature,
            "shap_value": int(round(shap_values_avg[0][i])),
            "importance": int(round((shap_importance[i] / shap_importance.sum())))
        })
    
    
    base_preds = np.array([pred_rf, pred_gb])
    confidence = float(100 - np.std(base_preds))  # simple heuristic
    confidence = int(round(confidence))
    
    factors_positive = [{"factor": f["feature"], "impact": max(f["shap_value"],0), "description": f"Positive impact of {f['feature']}"} for f in shap_data if f["shap_value"] > 0]
    factors_negative = [{"factor": f["feature"], "impact": min(f["shap_value"],0), "description": f"Negative impact of {f['feature']}"} for f in shap_data if f["shap_value"] < 0]

    users_collection.update_one(
        {"email": email},
        {"$push": {"credit_scores": {"score": credit_score_pred, "timestamp": pd.Timestamp.now().isoformat()}}}
    )
    if credit_score_pred < 650:
        score_range = "Poor"
    elif credit_score_pred < 700:
        score_range = "Fair"
    elif credit_score_pred < 750:
        score_range = "Good"
    else:
        score_range = "Excellent"

    historical_trend = [
        {"month": cs["timestamp"][:7], "score": cs["score"]}  # Using YYYY-MM for x-axis
        for cs in sample_user.get("credit_scores", [])
    ]
    response = {
        "predicted_score": float(credit_score_pred),
        "score_range": score_range,
        "confidence": confidence,
        "factors": {
            "positive": factors_positive,
            "negative": factors_negative
        },
        "shap_explanation": shap_data,
        "historical_trend": historical_trend,
        "score_breakdown": [
      {"category": "Payment History", "score": 95, "weight": 35},
        {"category": "Credit Utilization", "score": 78, "weight": 30},
        {"category": "Credit Mix", "score": 75, "weight": 10},
    ],  "recommendations": [
        {
            "category": "Short-term Actions",
            "items": [
                "Pay bills on time to improve payment history.",
                "Reduce credit card balances to improve credit utilization."
            ]
        },
        {
            "category": "Long-term Strategy",
            "items": [
                "Diversify credit accounts to improve credit mix.",
                "Maintain stable income growth."
            ]
        }
    ]
    }

    return jsonify(response)