import db from '../db.js'
import redisClient from '../redis.js';
import { expiryMap, redisExpiryMap } from "../utils.js";
import { nanoid } from "nanoid";

export const createShortURL = async (req, res)=>{
    let {longURL, expiresAt} = req.body;

    if(!longURL){
        return res.status(400).json({error: "longURL is required"});
    }
    try{
        new URL(longURL)
    }catch(err){
        return res.status(400).json({error: "longURL is not valid"});
    }
    let expiresAt_;

    if(expiresAt){
        expiresAt_ = new Date(Date.now() + (expiryMap[expiresAt] || process.env.TTL_7_DAYS) * 60 * 1000);
    }
    try{

        const [response] = await db.query("Select * from urls where longURL =(?) and (expiresAt is NULL OR expiresAT < NOW())", [longURL]);

        if(response.length){
            return res.status(200).json({shortUrl: `${process.env.BASE_URL}/${response[0].shortCode}`});
        }

        // generate a unique short code using nanoid
        const shortCode = nanoid(7);

        const [result] = await db.query("Insert into urls (longURL, shortCode, expiresAt) values (?, ?, ?)", [longURL, shortCode, expiresAt_]);

        const value  = JSON.stringify({ id: result.insertId, longURL })

        // update redis cache with the new short code and long URL with expiry time
        const ttl = redisExpiryMap[expiresAt] || process.env.TTL_7_DAYS // expire automiactly after 7 days
        await redisClient.set(`url:${shortCode}`, value, {EX: ttl})

        // console.log(await redisClient.get(`url:${shortCode}`));

        return res.status(201).json({shortUrl: `${process.env.BASE_URL}/${shortCode}`});
    }catch(err){
        console.log(err);
        return res.status(500).json({error: "Internal Server Error"});
    }
}
