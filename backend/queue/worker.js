import {Worker} from 'bullmq';

import {queueConnection} from './queue.js';
import db from '../db.js';
import geopip from 'geoip-lite';

console.log("Worker started", queueConnection);
const worker = new Worker('analyticsQueue', async (job)=>{

    const {ip, browser, device, code, rowId} = job.data;

    const connection  = await db.getConnection();

    try{
         // 182.79.100.178
        const geo = geopip.lookup(ip)
        const browserName = browser?.name || "Unknown"
        const countryName = geo?.country || "Unknown"
        const deviceName = device?.type || "desktop"

        // increment click count and insert analytics data in a transaction
        await connection.beginTransaction()
        const result = await connection.query(`Update urls set clickCount = clickCount + 1 where shortCode = ?`, [code]);


        const data = await connection.query(`Insert into analytics (urlId, ipAddress, browser, country, device, clickedAt) values (?, ?, ?, ?, ?, ?)`, [rowId, ip, browserName, countryName, deviceName, new Date()]);

        await connection.commit()
    }catch(err){
        await connection.rollback();
        console.log(err);
    }
}, {connection: queueConnection})


worker.on('completed', (job=>{
    console.log('job completed:', job.id);
}))

worker.on('failed', (job, err)=>{
    console.log('job failed:', job.id, 'with data:', job.data, 'error:', err);
})
