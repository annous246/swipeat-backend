# 🍽️ Swipeat Backend

Backend service for **Swipeat**, a meal tracking app.  
This server provides authentication, meal logging, database persistence, and **AI-powered nutrition analysis** using OpenAI.  

![Node.js](https://img.shields.io/badge/Node.js-18.x-green?logo=node.js)
![Express](https://img.shields.io/badge/Express.js-Backend-black?logo=express)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?logo=postgresql)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4.1-412991?logo=openai)

---

## 📑 Table of Contents
- [About](#-about)
- [Tech Stack](#-tech-stack)
- [Setup & Installation](#-setup--installation)
- [Environment Variables](#-environment-variables)
- [API Endpoints](#-api-endpoints)
- [Database Schema](#-database-schema)
- [AI Features](#-ai-features)
- [License](#-license)

---

## 📖 About
The **Swipeat Backend** powers the mobile app by:
- Handling **authentication & user management**.  
- Managing meals and nutritional data in a **PostgreSQL** database.  
- Using **OpenAI GPT-4.1 Vision API** to analyze food images and extract nutrition facts.  

---

## 🛠 Tech Stack
- **Node.js** + **Express.js** (API & server)  
- **PostgreSQL** (relational database)  
- **Prisma / Sequelize / Knex** (ORM – specify which you use)  
- **OpenAI API** (AI food analysis)  
- **JWT** (authentication)  

---

## ⚡ Setup & Installation

### 1. Clone repo
```bash
git clone https://github.com/yourname/swipeat-backend.git
cd swipeat-backend
2. Install dependencies
bash
Copy code
npm install
3. Configure environment variables
Create a .env file in the project root:

bash
Copy code
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/swipeat
OPENAI_API_KEY=your_openai_api_key
JWT_SECRET=your_jwt_secret
4. Run migrations (if using Prisma/Knex)
bash
Copy code
npx prisma migrate dev
5. Start dev server
bash
Copy code
npm run dev
```
## 🔑 Environment Variables
Variable	Description
PORT	Server port (default: 5000)
DATABASE_URL	PostgreSQL connection string
OPENAI_API_KEY	API key for OpenAI
JWT_SECRET	Secret for JWT auth

## 🤖 AI Features
The backend integrates OpenAI GPT-4.1 Vision API to:

Analyze uploaded food images.

Identify food name (≤20 chars).

Estimate portion size (grams).

Return protein, carbs, and calories.

📜 License
This project is licensed under the MIT License.
See LICENSE for details.

