import express, {response} from "express";
import dotenv from "dotenv";
import db from './db.js';
import { nanoid } from "nanoid";
import {UAParser} from "ua-parser-js";
import redisClient from './redis.js';
import { expiryMap, redisExpiryMap } from "./utils.js";

dotenv.config();
const app = express();

app.use(express.json());


app.post("/api/v1/shorten", async (req, res)=>{
    let {longURL, expiresAt} = req.body;

    if(!longURL){
        return res.status(400).json({error: "longURL is required"});
    }
    let expiresAt_;

    if(expiresAt){
        expiresAt_ = new Date(Date.now() + expiryMap[expiresAt] * 60 * 1000);
    }
    try{

        const [response] = await db.query("Select * from urls where longURL =(?) and (expiresAt is NULL OR expiresAT < NOW())", [longURL]);

        if(response.length){
            return res.status(200).json({shortUrl: `${process.env.BASE_URL}/${response[0].shortCode}`});
        }

        // generate a unique short code using nanoid
        const shortCode = nanoid(7);

        const [result] = await db.query("Insert into urls (longURL, shortCode, expiresAt) values (?, ?, ?)", [longURL, shortCode, expiresAt_]);

        let value  = JSON.stringify({ id: result.insertId, longURL })

        // update redis cache with the new short code and long URL with expiry time
        let ttl = redisExpiryMap[expiresAt] || 604800 // expire automiactly after 7 days
        await redisClient.set(`url:${shortCode}`, value, {EX: ttl})

        // console.log(await redisClient.get(`url:${shortCode}`));

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
        // get browser, os, device from user-agent
        const {browser, os, device} = UAParser(req.headers['user-agent'])

        // check if the short code exists in redis cache
        const cache = await redisClient.get(`url:${code}`)
        let rowId = null;
        let url;

        if(cache){
            // if short code exists in cache then redirect
            rowId = JSON.parse(cache)?.id;
            url = JSON.parse(cache)?.longURL;
            res.redirect(url)
        }else{
            // if short code does not exist in cache then check in database
            const [rows] = await connection.query("Select id, longURL from urls where shortCode = (?) and (expiresAt is NULL OR expiresAT > NOW())", [code]);
            if(!rows.length){
                return res.status(404).json({error: "Short URL not found"});
            }
            rowId = rows[0].id;
        }

        // increment click count and insert analytics data in a transaction
        await connection.beginTransaction()
        const result = await connection.query(`Update urls set clickCount = clickCount + 1 where shortCode = ?`, [code]);


        const data = await connection.query(`Insert into analytics (urlId, ipAddress, browser, country, device, clickedAt) values (?, ?, ?, ?, ?, ?)`, [rowId, req.ip, browser?.name, 'India', 'Desktop', new Date()]);

        await connection.commit()

        if(!cache){
            return res.redirect(url)
        }
        // res.status(200).json({longURL: rows[0].longURL});
    }catch(err){
        await connection.rollback()
        console.log(err);
        return res.status(500).json({error: "Internal Server Error"});
    }finally{
        connection.release();
    }
});

app.listen(process.env.PORT || 5000, () => {
    console.log(`Server is running on port ${process.env.PORT || 5000}`);
});
