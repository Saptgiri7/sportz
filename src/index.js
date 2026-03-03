import express from 'express';
import { matchRouter } from './routes/matches.js';
import { db } from './db/db.js';

import http from 'http';
import { attachWebSocketServer } from './ws/server.js';
import { securityMiddleware } from './arcjet.js';


const PORT = Number(process.env.PORT || 8000);
const HOST = process.env.HOST || '0.0.0.0';

const app = express();
const server = http.createServer(app);

app.use(express.json());

app.get('/',(req,res)=>{
    res.send('<h1>Hello from express server</h1>')
})

app.use(securityMiddleware());


app.use('/matches',matchRouter);

const {broadCastMatchCreated} = attachWebSocketServer(server)

app.locals.broadCastMatchCreated = broadCastMatchCreated;

server.listen(PORT, HOST, ()=>{
    const baseUrl = HOST  === '0.0.0.0' ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`;
    console.log(`server is running of ${baseUrl}`);
    console.log(`websocket is running on ${baseUrl.replace('http', 'ws')}/ws`);
})




