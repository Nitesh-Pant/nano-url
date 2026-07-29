import db from '../db.js';
import redisClient from '../redis.js';
import {UAParser} from "ua-parser-js";
import axios from 'axios';

export const redirectURL = async(req, res) => {
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
            url = rows[0].longURL;

            const value  = JSON.stringify({ id: rowId, longURL: url })
            await redisClient.set(`url:${code}`, value, {EX: redisExpiryMap["1d"]})
        }

        // 3rd party for getting country from ip
        const ipInfo = await axios.get(`http://ip-api.com/json/${req.ip}`); // 182.79.100.178
        const browserName = browser?.name || null
        const countryName = ipInfo?.data?.country || null
        const deviceName = device?.type || null

        // increment click count and insert analytics data in a transaction
        await connection.beginTransaction()
        const result = await connection.query(`Update urls set clickCount = clickCount + 1 where shortCode = ?`, [code]);


        const data = await connection.query(`Insert into analytics (urlId, ipAddress, browser, country, device, clickedAt) values (?, ?, ?, ?, ?, ?)`, [rowId, req.ip, browserName, countryName, deviceName, new Date()]);

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
}
