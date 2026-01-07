# Serial Subscription Backend

This is the backend API for the Serial Subscriptions Tracking System.  
It is built using Node.js and Express.

---

## Requirements
- Node.js (v18+ recommended)
- npm

---

## Install Dependencies
From the `backend` folder, run:

```bash
npm install

md
---
## Run
From the `backend` folder, start the server:

```bash
node server.js
http://localhost:5001

---
### 🔹 2️⃣ Add the **API Endpoints** section  
Add this **below the Run section**:

md
---
## API Endpoints

### Get all subscriptions
```bash
GET /api/subscriptions

### Create a new subscription

```bash
POST /api/subscriptions

### Request Body (JSON)

{
  "name": "Journal Subscription",
  "serialNumber": "JRN-101",
  "price": 1500
}

### Response

{
  "id": 2,
  "name": "Journal Subscription",
  "serialNumber": "JRN-101",
  "price": 1500
}

