import {Queue} from 'bullmq'

const queueConnection = {
    host: "localhost",
    port: 6380
}

const queue = new Queue('analyticsQueue', {connection: queueConnection})

export {queue, queueConnection}
