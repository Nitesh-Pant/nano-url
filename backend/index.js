import express from "express";
import dotenv from "dotenv";
import db from './db.js';
import { nanoid } from "nanoid";

dotenv.config();
const app = express();

app.use(express.json())

app.post("/api/v1/shorten", async (req, res)=>{
    const {longURL, expireAt} = req.body;

    if(!longURL){
        return res.status(400).json({error: "longURL is required"});
    }
    try{
        const shortCode = nanoid(7);

        console.log(shortCode);

        const [result] = await db.query("Insert into urls (longURL, shortCode, expiresAt) values (?, ?, ?)", [longURL, shortCode, expireAt]);

        return res.status(201).json({shortUrl: `${process.env.BASE_URL}/${shortCode}`});
    }catch(err){
        console.log(err);
        return res.status(500).json({error: "Internal Server Error"});
    }
});
app.get("/:code", async(req, res) => {
    const {code} = req.params
    const connection  = await db.getConnection()
    try{
        const [rows] = await db.query("Select id, longURL from urls where shortCode = (?) and (expiresAt is NULL OR expiresAT > NOW())", [code]);
        if(!rows.length){
            return res.status(404).json({error: "Short URL not found"});
        }

        await connection.beginTransaction()
        const result = await connection.query(`Update urls set clickCount = clickCount + 1 where shortCode = ?`, [code]);


        const data = await connection.query(`Insert into analytics (urlId, ipAddress, browser, country, device, clickedAt) values (?, ?, ?, ?, ?, ?)`, [rows[0].id, req.ip, req.headers['user-agent'], 'India', 'Desktop', new Date()]);

        await connection.commit()

        res.redirect(rows[0].longURL)

        // res.status(200).json({longURL: rows[0].longURL});
    }catch(err){
        await connection.rollback()
        console.log(err);
        return res.status(500).json({error: "Internal Server Error"});
    }
});

app.listen(process.env.PORT || 5000, () => {
    console.log(`Server is running on port ${process.env.PORT || 5000}`);
});
