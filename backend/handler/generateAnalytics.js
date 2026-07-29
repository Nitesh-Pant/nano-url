import db from '../db.js';
import {  intervalMap } from "../utils.js";

export const generateAnalytics = async (req, res)=>{
    const {shortCode} = req.params;
    const {timeRange} = req.query;

    if(!shortCode){
        return res.status(400).json({error: "Shortcode is required"})
    }

    // query for urls and analytics
    const [result] = await db.query(`Select u.clickCount, a.browser, a.country, a.device, a.clickedAt from urls as u JOIN analytics as a on u.id = a.urlId where u.shortCode = (?) and u.createdAt >= NOW() - INTERVAL${intervalMap[timeRange]}`, [shortCode]);

    let analyticsObj = {}
    let browserMap = {}
    if(result.length){
        let totalClicks = result[0].clickCount
        analyticsObj['totalClicks'] = totalClicks;
        for(let r of result){
            const browser = r.browser || "Unknown";
            browserMap[browser] = (browserMap[browser] || 0) + 1;
        }
        for(let browser in browserMap){
            browserMap[browser] = Number(((browserMap[browser] / totalClicks) * 100).toFixed(2))
        }
        analyticsObj['browser (%)'] = browserMap
    }

    return res.status(200).json(analyticsObj)
}
