const expiryMap = {
        "10s": 0.1667,
        "1m": 1,
        "5m": 5,
        "30m": 30,
        "1h": 60,
        "1d": 1440,
        "7d": 10080,
};

const redisExpiryMap = {
    "10s": 10,
    "1m": 60,
    "5m": 300,
    "30m": 1800,
    "1h": 3600,
    "1d": 86400,
    "7d": 604800,
};

export { expiryMap, redisExpiryMap };
