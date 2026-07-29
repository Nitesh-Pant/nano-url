import express from "express";
import dotenv from "dotenv";
import {createShortURL} from "./handler/generateShortURL.js";
import {redirectURL} from "./handler/viewShortURL.js";
import {generateAnalytics} from "./handler/generateAnalytics.js";

dotenv.config();
const app = express();

app.use(express.json());

// generate short url
app.post("/api/v1/shorten", createShortURL);

//redirect url
app.get("/:code", redirectURL);

// analytics for short url
app.get("/api/v1/analytics/:shortCode", generateAnalytics);

app.listen(process.env.PORT || 5000, () => {
    console.log(`Server is running on port ${process.env.PORT || 5000}`);
});
