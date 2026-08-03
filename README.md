# NanoURL 🔗

NanoURL is a lightweight URL shortener built with **Node.js**, **Express.js**, **MySQL**, **Redis** and **BullMQ**.

NanoURL allows users to generate short URLs, optionally expire them, redirect users efficiently using Redis caching, and collect basic click analytics.

## ✨ Features

- 🔗 Generate unique short URLs
- ♻️ Reuse existing short URLs for active links
- ⏳ Optional link expiration
- 🚀 Redis caching for faster redirects
- ⚡ Background analytics processing using BullMQ
- 🐳 Docker support
- 📊 Click tracking
- 🌐 Capture basic analytics
    - IP Address
    - Browser
    - Country
    - Device
    - Click timestamp
- 🔒 URL validation
- 💾 MySQL for persistent storage

---

# 🏗️ Architecture

```
                 POST /shorten
                       │
                       ▼
                Validate URL
                       │
                       ▼
                  MySQL Database
                       │
                       ▼
               Generate Short Code
                       │
                       ▼
              Cache in Redis (TTL)
                       │
                       ▼
                 Return Short URL


                 GET /:shortCode
                       │
                       ▼
               Check Redis Cache
                │             │
             Hit             Miss
              │               │
              ▼               ▼
         Redirect       Fetch from MySQL
                              │
                              ▼
                    Cache in Redis (TTL)
                              │
                              ▼
                    Push Analytics Job (BullMQ)
                              │
                              ▼
                         BullMQ Worker
                              │
                              ▼
                    Update Analytics (MySQL)
                              │
                              ▼
                         Redirect User
```

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
- BullMQ
- geoip-lite
- ioredis

---

# 📂 Project Structure

```
backend
│
├── handler
│   ├── generateShortURL.js
│   ├── viewShortURL.js
│   └── generateAnalytics.js
│
├── queue
│   ├── queue.js
│   └── worker.js
│
├── db.js
├── redis.js
├── utils.js
├── index.js
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
# Terminal 1
npm run dev

# Terminal 2
npm run worker
```

---

# 🐳 Docker Services

The project uses Docker Compose to run:

- MySQL 8.4
- Redis 7

Start services

```bash
docker compose up -d
```

Stop services

```bash
docker compose down
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

### Supported Expiry Values

| Value | Duration   |
| ----- | ---------- |
| 10s   | 10 Seconds |
| 1m    | 1 Minute   |
| 5m    | 5 Minutes  |
| 30m   | 30 Minutes |
| 1h    | 1 Hour     |
| 1d    | 1 Day      |
| 7d    | 7 Days     |

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

## Analytics

**GET**

```
/api/v1/analytics/:shortCode
```

Example

```
GET /api/v1/analytics/abc1234?timeRange=1d
```

### Supported Time Ranges

| Value | Duration   |
| ----- | ---------- |
| 10s   | 10 Seconds |
| 1m    | 1 Minute   |
| 30m   | 30 Minute  |
| 1h    | 1 Hour     |
| 1d    | 1 Day      |
| 7d    | 7 Days     |

### Response

```json
{
	"totalClicks": 15,
	"browser (%)": {
		"Chrome": 80,
		"Firefox": 20
	},
	"country (%)": {
		"IN": 100
	},
	"device (%)": {
		"desktop": 100
	}
}
```

Browser values represent the percentage of total clicks.

# ⚡ Redis Caching

Redis stores

```
url:<shortCode>
```

Example

```
url:AbCd123
```

Value

```json
{
	"id": 15,
	"longURL": "https://www.google.com"
}
```

Keys expire automatically based on the configured TTL.

---

# 🗄️ Database

## urls

Stores

- Long URL
- Short Code
- Click Count
- Expiration Time
- Created Time

## analytics

Stores

- URL ID
- Browser
- Device
- Country
- IP Address
- Click Timestamp

---

# ⚙️ Background Jobs

BullMQ is used to process analytics asynchronously.

When a user visits a short URL:

1. The application immediately redirects the user.
2. An analytics job is pushed to BullMQ.
3. The worker processes the job in the background.
4. Click count and analytics are stored in MySQL.

This keeps redirects fast and prevents database operations from blocking user requests.

### Retry Strategy

To improve reliability, failed jobs are retried automatically.

- **Attempts:** 3
- **Backoff:** Exponential
- **Initial Delay:** 5 seconds

If a job succeeds on any retry, it is removed from the queue. Failed jobs are also removed after all retry attempts are exhausted.
