import db from '../db.js';
import {  intervalMap } from "../utils.js";

export const generateAnalytics = async (req, res)=>{
    const {shortCode} = req.params;
    const {timeRange="7d"} = req.query;

    if(!shortCode){
        return res.status(400).json({error: "Shortcode is required"})
    }

    // query for urls and analytics
    const [result] = await db.query(`Select u.clickCount, a.browser, a.country, a.device, a.clickedAt from urls as u JOIN analytics as a on u.id = a.urlId where u.shortCode = (?) and a.clickedAt >= UTC_TIMESTAMP() - INTERVAL${intervalMap[timeRange]}`, [shortCode]);

    let analyticsObj = {}
    if(result.length){
        let totalClicks = result[0].clickCount

        analyticsObj['totalClicks'] = totalClicks;
        analyticsObj['browser (%)'] = getDistrubution(totalClicks, result, 'browser');
        analyticsObj['country (%)'] = getDistrubution(totalClicks, result, 'country');
        analyticsObj['device (%)'] = getDistrubution(totalClicks, result, 'device');

    }

    return res.status(200).json(analyticsObj)
}


// % of clicks distribution for browser, country, device
function getDistrubution(count, result, key){

    let analMap = {}
    for(let r of result){
        const value = r[key] || "Unknown";
        analMap[value] = (analMap[value] || 0) + 1;
    }
    for(let anal in analMap){
        analMap[anal] = Number(((analMap[anal] / count) * 100).toFixed(2))
    }

    return analMap
}
