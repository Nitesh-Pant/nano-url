# NanoURL 🔗

NanoURL is a lightweight URL shortener built with **Node.js**, **Express.js**, **MySQL**, and **Redis**. It allows users to generate short links, supports optional link expiration, caches redirects with Redis, and tracks basic click analytics.

---

## ✨ Features

- 🔗 Shorten long URLs
- ♻️ Reuse existing short URLs for active links
- ⏳ Optional link expiration
- 🚀 Redis caching for faster redirects
- 📊 Click tracking
- 🌐 Capture basic analytics
    - IP Address
    - Browser
    - Device
    - Click timestamp
- 💾 MySQL for persistent storage

---

## 🛠️ Tech Stack

- Node.js
- Express.js
- MySQL
- Redis
- Docker
- mysql2
- nanoid
- ua-parser-js

---

## 📁 Project Structure

```
backend/
├── index.js
├── db.js
├── redis.js
├── docker-compose.yml
├── package.json
└── .env
```

---

## 🚀 Getting Started

### Clone the repository

```bash
git clone https://github.com/<your-username>/nano-url.git
cd nano-url/backend
```

### Install dependencies

```bash
npm install
```

### Start MySQL & Redis

```bash
docker compose up -d
```

### Configure environment variables

Create a `.env` file:

```env
PORT=5000

BASE_URL=http://localhost:5000

MYSQL_HOST=localhost
MYSQL_PORT=3308
MYSQL_USER=nano_user
MYSQL_PASSWORD=nano_password
MYSQL_DATABASE=nano_url_db

REDIS_HOST=localhost
REDIS_PORT=6379
```

### Start the server

```bash
npm start
```

---

## 📌 API Endpoints

### Create Short URL

**POST**

```
/api/v1/shorten
```

Request

```json
{
	"longURL": "https://www.google.com",
	"expiresAt": "1h"
}
```

Supported expiry values

- 10s
- 1m
- 5m
- 30m
- 1h
- 1d
- 7d

Response

```json
{
	"shortUrl": "http://localhost:5000/abc1234"
}
```

---

### Redirect

**GET**

```
/:shortCode
```

Example

```
GET /abc1234
```

The service:

- Checks Redis cache
- Falls back to MySQL on a cache miss
- Updates click count
- Stores analytics
- Redirects to the original URL

---

## 📊 Current Analytics Captured

- Browser
- IP Address
- Device
- Click Time
