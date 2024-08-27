const http = require("http");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");
const SessionsManager = require("./sessionsManager");
const RegisteredPlayers = require("./registeredPlayers");


const server = http.createServer((req, res) => {
    if (req.method === 'GET') {
        let filePath = './client' + req.url;
        if (filePath === './client/') {
            filePath = './client/game_client.html';
        }
        const extname = String(path.extname(filePath)).toLowerCase();
        const mimeTypes = {
            '.html': 'text/html',
            '.css': 'text/css',
        };
        const contentType = mimeTypes[extname];
        fs.readFile(filePath, (err, content) => {
            if (err) {
                res.end("something went wrong");
            } else {
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content, 'utf-8');
            }
        });
    }
});
server.listen(8080, () => {
    console.log("active on port 8080");
});

const wss = new WebSocket.Server({ server });


const regPlayersMgr= new RegisteredPlayers();

const gameSessionsManager= new SessionsManager(regPlayersMgr);



const validCommands={
    "ACK":true,
    "NEW_PLAYER":true,
    "AUTH":true,
    "PONG":true,
    "GAME":true
};

//a command is valid if:
//it is in the valid commands list, and
//the UID is valid OR the command is 'NEW_PLAYER'
//this is because brand new players do not have a UID
function isValidCommand(command){
    if(validCommands[command[0]] === true){

        //if the command is 'NEW_PLAYER' or 'AUTH' we return true
        //because we cannot confirm UID before auth.
        if(command[0]=="NEW_PLAYER" || command[0]=="AUTH" || command[0]=="PONG"){
            if(command[0]!="PONG"){
            console.log("Command "+command[0]+". Skip auth check. Since user may not have UID in this phase.");
            }
            return true;
        }else{
            var UID=command[1];
            //if the UID is found return true else false
            if((UID&&regPlayersMgr.playerExists(UID))){
                return true;
            }else{
                return false;
            }
        }
    }else{
        return false;
    }
}
//player enters the game, they get a player ID, this player ID + other person's player ID= session ID
//session ID is used to identify sessions and individual game states


wss.on('connection', function connection(ws,req) {
    const ip = req.socket.remoteAddress;
    const port = req.socket.remotePort;
    
    
    //these variables are maintained per connection
    //ie they are unique for every connection
    //they cease to exist when the connection terminates
    
    //unique id to identify a player
    var UID="";
    var inGame=false;
    var gameSession="";
    var lastServerCommand="";
    var lastServerCommandContent="";
    var lastServerCommandAck=false;
    var retryAttempts=0;
    var hasAuth=false;
    var pingsMissed=0;
    var pingCount=0;
    var pongCount=0;

    //we ask the player for credentials
    //if the user does not have UID they send a NEW_PLAYER request

    //we start sending ping messages every 100ms
    const pingRoutineInterval= setInterval(()=>{
        //if it takes more that 4 seconds to reply. We can set lastPing of the registered player to false
        //we should also terminate connection. set ws to null explicitly
        if(regPlayersMgr.getPlayerWs(UID)&&ws==regPlayersMgr.getPlayerWs(UID)){
        if(pingCount-pongCount>40){
            console.log(`${UID} failed to reply. Terminating connection.`);
            ws.removeAllListeners();
            ws.terminate();
            ws=null;
            regPlayersMgr.setPlayerLastPing(UID,false);
            regPlayersMgr.setPlayerWs(UID,null);
            clearInterval(pingRoutineInterval);
            return;
        }else{
          
            regPlayersMgr.setPlayerLastPing(UID,true);
        }
        }else{
            //clear the interval since the user joined via a different connection
            console.log(`User ${UID} Joined Via New Connection`);
            clearInterval(pingRoutineInterval);
            ws.removeAllListeners();
            ws.terminate();
            ws=null;
            return;
        }
        ws.send("SERVER_PING:");
        pingCount+=1;
    },100);

    ws.send("SERVER_SEND_UID:");

   ws.on('message', (data) => {

    data=data.toString();
    

    //string recieved should abide by the format given below. Wrong format will lead to a termination of the connection
    //COMMAD:CMD_DATA
    //this is an array which stores the command
    //if the command is not NEW_PLAYER then command[2]
    //should be the UID of the player. If not. Terminate.
    const command=data.split(":");
    //check command validity, if not terminate
    if(!isValidCommand(command)){
        console.log("Invalid command. Closing Connection."+command[0]);
        ws.close();
        return;
    }
    //we dont want to log pong messages. It will make a clutter.
    if(command[0]!="PONG"){
    console.log(`Command from player: ${data}`);
    }

    //acknowledgement handling
    //if the message is not acknowledged under a second
    //we would want to resend the message
    //so if the command is not ACK, create a 1 sec interval
    //that will check if the message was acknowledged, if not
    //we resend the message


    function checkAck(lastCommand,lastCommandContent){
        lastServerCommand=lastCommand;
        lastServerCommandContent=lastCommandContent;
        lastServerCommandAck=false;
        const intervalId=setInterval(()=>{
            if(!lastServerCommandAck){
                if(retryAttempts==2){
                    console.log(`${UID} failed to acknowledge. Terminating.`); 
                    regPlayersMgr.setPlayerWs(UID,null);
                    regPlayersMgr.setPlayerLastPing(UID,false);
                    ws.removeAllListeners();
                    ws.terminate();
                    ws=null;
                    clearInterval(intervalId);
                    return;
                }
                console.log(`Last command by ${UID} was not acknowledged`);
                ws.send(`${lastServerCommand}:${lastServerCommandContent}`);
                retryAttempts+=1;
            }else{
                console.log(`Last command was acknowledged by ${UID}`);
                clearInterval(intervalId);
            }
        },5000);
    }

    

    switch(command[0]){
        
        //to authentiate user
        case "AUTH":
            if(regPlayersMgr.playerExists(command[1])){
                ws.send(`SERVER_AUTH:PASSED`);
                UID=command[1];
                console.log(`Recognized ${UID} as a registered user.`);
                hasAuth=true;
                regPlayersMgr.setPlayerWs(UID,ws);
            }else{
                console.log(`Failed to recognize ${command[1]}`);
                ws.send(`SERVER_AUTH:FAIL`); 
            }
        break;
        
        //this is a brand new user, add them to the game pool and give them their UID
        case "NEW_PLAYER":
            //once the UID is set, it cannot be reset
            //so if the client attempts to send this command again
            //close the connection- since this isn't how the client should behave
            if(UID.length!=0){
                console.log("bad behaviour detected");
                ws.close();
                return;
            }
            
            UID=Math.floor(Math.random() * 0xFFFFFFFFF).toString(16);
            ws.send(`SERVER_NEW_PLAYER_UID:${UID}`);
            checkAck("SERVER_NEW_PLAYER_UID",UID);
            //register the player (mock DB)
            regPlayersMgr.registerPlayer(UID);
            break;
        
        //game events are handled by the sessionsManager
        //it also handles messaging the individual clients about the gamestate
        case "GAME":
            gameSessionsManager.handleGameCommand(command,data);
            break;

        //Acknowledgement for 
        case "ACK":
            if(lastServerCommand==command[2]){
                lastServerCommandAck=true;
                lastServerCommandContent="";
            }
            break;
        case "PONG":
            pongCount=pingCount;
            break;
        default:
            //the client sent an invalid command
            //incorrect behaviour
            console.log(`Command was not recognized: ${command[0]}`);
            ws.close();
            return;
            break;
    }
    
    
    // console.log("recieved message from player");

    //     console.log(players[this].UID);
    //   this.send("HELLO MOTHER FUCKER");
   });


   ws.on('close',()=>{
    ws.terminate();
   });
   ws.on('error',()=>{
    ws.terminate();
   });
});

wss.on('listening',()=>{
   console.log('listening on 8080')
});