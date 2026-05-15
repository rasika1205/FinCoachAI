
---

# 🧠 FinCoachAI — Intelligent Financial Coaching Platform 💰

FinCoachAI is a next-generation **AI-powered financial coaching system** that helps users analyze, track, and improve their financial well-being.
It combines **machine learning**, **explainable AI**, and **Gemini-powered financial insights** to deliver personalized financial recommendations and growth strategies.

The platform provides **secure authentication**, **credit score prediction**, **gamified financial quests**, and a **personalized AI financial playbook** — all backed by a robust **Flask + MongoDB** backend architecture.

---

## 📑 Table of Contents

1. [✨ Key Features](#-key-features)
2. [🧠 Tech Stack](#-tech-stack)
3. [📂 Project Structure](#-project-structure)
4. [⚙️ Setup Instructions](#️-setup-instructions)
5. [🌐 API Endpoints](#-api-endpoints)
6. [🔐 Environment Variables](#-environment-variables)
7. [🚀 Future Enhancements](#-future-enhancements)
8. [🧑‍💻 Author](#-author)
9. [📜 License](#-license)
10. [🙏 Acknowledgements](#-acknowledgements)

---

## ✨ Key Features

| Category                                | Description                                                                                                             |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 🧾 **Secure Authentication**            | User registration and login powered by **JWT tokens** and **bcrypt** password hashing for end-to-end security.          |
| 📊 **Credit Score Prediction**          | Predicts and explains your credit score using **ensemble ML models** (Random Forest, Gradient Boosting, Meta Model).    |
| 💬 **AI-Powered Financial Playbook**    | Integrates **Google Gemini API** to provide personalized financial coaching. Example: *“How can I retire in 15 years?”* |
| 🎯 **Quest System (Gamified Learning)** | A unique **gamification layer** that rewards users for completing financial tasks and improving habits.                 |
| 📈 **Progress & Goal Tracking**         | Tracks your financial growth, spending habits, and savings trajectory over time.                                        |
| 🤖 **Explainable AI (XAI)**             | Uses **SHAP** to explain how each financial factor impacts your credit score and overall financial health.              |
| 🌍 **CORS-Enabled APIs**                | Seamless integration with React or any frontend client.                                                                 |

---
## Demo

<img width="1883" height="917" alt="Screenshot 2025-10-07 001818" src="https://github.com/user-attachments/assets/014f3c56-de86-4380-bdc2-21a4d1e2a582" />
<img width="1769" height="889" alt="Screenshot 2025-10-07 001859" src="https://github.com/user-attachments/assets/6f1b46d6-6bb8-46c0-b34b-88abda9689e7" />
<img width="1784" height="896" alt="Screenshot 2025-10-07 001919" src="https://github.com/user-attachments/assets/49499b6d-e6c6-4ced-8d40-707e6969d5a4" />
<img width="1746" height="900" alt="Screenshot 2025-10-07 001942" src="https://github.com/user-attachments/assets/7cad7e1e-dedd-467c-a388-2eab84c5531e" />
<img width="1608" height="758" alt="Screenshot 2025-10-07 002335" src="https://github.com/user-attachments/assets/87523eea-6509-45f3-9904-afea00cc5686" />
<img width="1461" height="571" alt="Screenshot 2025-10-07 002356" src="https://github.com/user-attachments/assets/9ebc9b44-4961-4593-9aa2-39d134399dd8" />
<img width="1448" height="505" alt="Screenshot 2025-10-07 002416" src="https://github.com/user-attachments/assets/014384cc-9fef-4da1-8093-6865fe9d41e4" />

## 🧠 Tech Stack

| Layer                      | Technologies                              |
| -------------------------- | ----------------------------------------- |
| **Backend**                | Flask (Python), Flask-CORS                |
| **Database**               | MongoDB                                   |
| **Machine Learning**       | scikit-learn, joblib                      |
| **AI Integration**         | Google Gemini API (`google-generativeai`) |
| **Authentication**         | JWT, bcrypt                               |
| **Data Analysis**          | pandas, numpy                             |
| **Explainability**         | SHAP                                      |
| **Environment Management** | python-dotenv                             |

---

## 📂 Project Structure

```
backend/
├── app.py                     # Main Flask app entrypoint
├── routes/                    # API endpoints as Flask Blueprints
│   ├── auth_routes.py         # Authentication (Signup/Login)
│   ├── creditscore_route.py   # ML-based credit score prediction
│   ├── playbook_route.py      # AI-powered financial recommendations
│   ├── quest_route.py         # Gamified quest system
│   ├── tracker_route.py       # Progress & financial goal tracking
│   └── update_route.py        # Profile updates
├── rf_model.pkl               # Random Forest model
├── gb_model.pkl               # Gradient Boosting model
├── meta_model.pkl             # Meta ensemble model
├── requirements.txt           # Python dependencies
└── .env                       # Environment variables
```

---

## ⚙️ Setup Instructions

### **1️⃣ Prerequisites**

Ensure you have:

* Python **3.8+**
* MongoDB (local or Atlas)
* API key for **Google Gemini**
* Virtual environment setup (recommended)

---

### **2️⃣ Installation**

Clone the repository:

```bash
git clone https://github.com/rasika1205/FinCoachAI.git
cd FinCoachAI/backend
```

Install dependencies:

```bash
pip install -r requirements.txt
```

---

### **3️⃣ Environment Configuration**

Create a `.env` file in `/backend`:

```bash
FLASK_SECRET_KEY=your_flask_secret
MONGODB_URI=your_mongodb_uri
GEMINI_API_KEY=your_gemini_api_key
```

---

### **4️⃣ Add Machine Learning Models**

Place the following model files inside `/backend`:

```
rf_model.pkl
gb_model.pkl
meta_model.pkl
```

---

### **5️⃣ Run the Backend**

Start the Flask server:

```bash
python app.py
```

Server will run at:

```
http://localhost:5000
```

---
### 💻 Frontend Setup (React + Tailwind + Vite)

1. **Go to the frontend folder**

   ```bash
   cd ../frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Run the development server**

   ```bash
   npm run dev
   ```

   The frontend will start at 👉 `http://localhost:5173`

4. **Connect to backend**
   Make sure the Flask backend is running at `http://127.0.0.1:5000`.
   The frontend uses Axios to communicate with the Flask APIs.

---

## 🌐 API Endpoints

| Endpoint       | Method     | Description                                                     |
| -------------- | ---------- | --------------------------------------------------------------- |
| `/home`        | `POST`     | Fetch user profile by email                                     |
| `/signup`      | `POST`     | Register new users                                              |
| `/login`       | `POST`     | Authenticate users and return JWT token                         |
| `/creditscore` | `POST`     | Predict credit score using ML models                            |
| `/playbook`    | `POST`     | Get AI-generated personalized financial advice (via Gemini API) |
| `/quest`       | `GET/POST` | Access and update gamified quest progress                       |
| `/tracker`     | `GET`      | Track financial performance and progress                        |
| `/update`      | `POST`     | Update user data (salary, assets, etc.)                         |

---

## 🔐 Environment Variables

| Variable           | Description                               |
| ------------------ | ----------------------------------------- |
| `FLASK_SECRET_KEY` | Secret key for Flask session handling     |
| `MONGODB_URI`      | MongoDB connection string                 |
| `GEMINI_API_KEY`   | Google Gemini API key for AI integration  |

---

## 🚀 Future Enhancements

✨ **Planned Upgrades & Improvements:**

* 🧩 Frontend Integration (React + TypeScript dashboard)
* 📊 Advanced Financial Visualization with Recharts
* 🧠 Fine-tuned Gemini prompts for smarter recommendations
* 🔒 OAuth2 + Refresh Token authentication
* 🪙 Budget prediction and expense categorization using AI
* 📈 Predictive analytics for long-term wealth forecasting
* 💬 AI Chatbot with conversation memory and streaming responses
* 🏦 Integration with real-time finance APIs (e.g., Zerodha, Yodlee)
* Improve Database structure 

---



## 🧑‍💻 Author

**Rasika Gautam**
*Data Science & AI Enthusiast* | B.Tech MAC, NSUT
[GitHub](https://github.com/rasika1205)

---

## 📜 License

This project is **proprietary** and protected by copyright © 2025 Rasika Gautam.

You are welcome to view the code for educational or evaluation purposes (e.g., portfolio review by recruiters).  
However, you may **not copy, modify, redistribute, or claim this project as your own** under any circumstances — including in interviews or job applications — without written permission.

---

## 🙏 Acknowledgements

* [Flask](https://flask.palletsprojects.com/)
* [MongoDB](https://www.mongodb.com/)
* [Google Gemini](https://ai.google.dev/)
* [scikit-learn](https://scikit-learn.org/)
* [SHAP](https://shap.readthedocs.io/en/latest/)

---



