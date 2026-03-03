import { WebSocket, WebSocketServer } from "ws";
import { wsArcjet } from "../arcjet.js";

function sendJson(socket,payload){
    if(socket.readyState !== WebSocket.OPEN) return;

    socket.send(JSON.stringify(payload));
}

function broadCast(wss,payload){
    for(const client of wss.clients){   
        if(client.readyState !== WebSocket.OPEN) continue;
        client.send(JSON.stringify(payload));
    }
}

export function attachWebSocketServer(server){

    server.on('upgrade',async(req,socket,head)=>{
        if(wsArcjet){
            try {
                const decision = await wsArcjet.protect(req);

                if(decision.isDenied()){
                    if(decision.reason.isRateLimit()){
                        socket.wirte('HTTP/1.1 429 Too many Request\r\n\r\n');
                    }else{
                        socket.wirte('HTTP/1.1 403 Forbidden\r\n\r\n');
                    }
                    socket.destroy();
                    return;
                }
                
            } catch (e) {
                console.log('WS connection error',e);
                socket.wirte('HTTP/1.1 500 Internal Server Error\r\n\r\n');
                socket.destroy();
                return;
            }
        }

        wss.handleUpgrade(req,socket,head, (ws)=>{
            wss.emit('connection', ws, req);
        });
    });



    const wss = new WebSocketServer({server,path: '/ws',maxPayload: 1024 * 1024})

    wss.on('connection',async(socket,req)=>{

        socket.isAlive = true;

        socket.on('pong',()=>{socket.isAlive = true;})
        sendJson(socket,{type: "welcome"});

        socket.on('error',console.error);
    })

    const interval = setInterval(()=>{
        wss.clients.forEach((ws)=>{
            if(ws.isAlive === false) ws.terminate();

            ws.isAlive = false;
            ws.ping();
        })
    },30000)


    wss.on('close',()=>{
        clearInterval(interval);
    })

    function broadCastMatchCreated(match){
        broadCast(wss,{type:"match_created",data:match});
    }

    return {broadCastMatchCreated};

}


