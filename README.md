# 💰 Budget Tracking System

A full-stack personal finance management application built with React.js and Spring Boot,
featuring secure authentication, real-time expense tracking, and visual monthly insights.

---

## 🏗️ Architecture Overview

- **Frontend:** React.js (Axios for API calls, modular component structure)
- **Backend:** Spring Boot (RESTful APIs, JWT authentication)
- **Communication:** Axios-based HTTP between frontend and backend

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 JWT Authentication | Secure login/register with token-based access control |
| 💸 Income & Expense Tracking | Add, edit, delete income and expense entries |
| 📂 Category-wise Breakdown | Organise transactions by category for better visibility |
| 📊 Dashboard & Charts | Visual overview of spending patterns and balances |
| 📅 Monthly Summaries | Auto-generated monthly reports with totals and trends |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js, Axios |
| Backend | Java, Spring Boot |
| Auth | JWT (JSON Web Tokens) |
| API Style | REST |

---

## 🚀 Getting Started

### Prerequisites
- Java 17+
- Node.js 18+
- npm or yarn

### Backend
```bash
cd backend
./mvnw spring-boot:run
```

### Frontend
```bash
cd frontend
npm install
npm start
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and receive JWT |
| GET | `/api/transactions` | Get all transactions |
| POST | `/api/transactions` | Add a new transaction |
| PUT | `/api/transactions/{id}` | Update a transaction |
| DELETE | `/api/transactions/{id}` | Delete a transaction |
| GET | `/api/summary/monthly` | Get monthly income/expense summary |
| GET | `/api/categories` | Get category-wise breakdown |

---

## 🔐 Authentication Flow

1. User registers or logs in via `/api/auth`
2. Backend issues a signed JWT token
3. Frontend stores token and sends it in every request header
4. Backend validates token before processing any protected route

---

## 📊 Dashboard Overview

The dashboard provides:
- **Total balance** at a glance
- **Income vs Expense** chart by month
- **Category breakdown** — see where money is going
- **Recent transactions** list with filters

---

## 👨‍💻 Author

**Sivasuriya S** — [LinkedIn](#) | [GitHub](https://github.com/Sivasuriya-skr)
