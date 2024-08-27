/*
this.registeredPlayers.getPlayerWs(this.A_UID).send(`SERVER_CHAT:${JSON.stringify(chatMessage)}`);
            ws.send(`SERVER_GAME_ALREADY_SET:${JSON.stringify(obj)}`);
                ws.send(`SERVER_GAME_SET:${JSON.stringify(obj)}`);
            ws.send("SERVER_GAME_INIT_INVALID:");
        this.registeredPlayers.getPlayerWs(this.A_UID).send(`SERVER_GAME_PROGRESS:${JSON.stringify(this.gameProgress)}`);
            this.registeredPlayers.getPlayerWs(UID).send(`GAME_INIT:${JSON.stringify(gameInitData)}`);
                            registeredPlayers.getPlayerWs(tempA).send(`GAME_INIT:${JSON.stringify(gameInitData)}`);

*/

class SessionCommands{
    constructor(registeredPlayers){
        this.registeredPlayers=registeredPlayers;
    }

    SERVER_GAME_GOODBYE(UID){
        this.registeredPlayers.getPlayerWs(UID).send(`SERVER_GAME_GOODBYE:`);
    }

    //ask the client to wait for their turn
    SERVER_GAME_WAIT_FOR_TURN(UID){
        this.registeredPlayers.getPlayerWs(UID).send(`SERVER_GAME_WAIT_FOR_TURN:`);
    }

    //tell the client their move was invalid
    SERVER_GAME_INVALID_MOVE(UID){
        this.registeredPlayers.getPlayerWs(UID).send(`SERVER_GAME_INVALID_MOVE:`);
    }

    //sends a chat message
    SERVER_CHAT(UID,chatMessage){
        this.registeredPlayers.getPlayerWs(UID).send(`SERVER_CHAT:${JSON.stringify(chatMessage)}`);
    }

    //message is sent when the user has already completed setup
    SERVER_GAME_ALREADY_SET(UID,obj){
        this.registeredPlayers.getPlayerWs(UID).send(`SERVER_GAME_ALREADY_SET:${JSON.stringify(obj)}`);
    }

    //message is sent to complete initial setup
    SERVER_GAME_SET(UID,obj){
        this.registeredPlayers.getPlayerWs(UID).send(`SERVER_GAME_SET:${JSON.stringify(obj)}`);
    }

    //message is sent when the user sends invalid initial setup
    SERVER_GAME_INIT_INVALID(UID){
        this.registeredPlayers.getPlayerWs(UID).send(`SERVER_GAME_INIT_INVALID:`);
    }

    //game progress update
    SERVER_GAME_PROGRESS(UID,gameProgress){
        this.registeredPlayers.getPlayerWs(UID).send(`SERVER_GAME_PROGRESS:${JSON.stringify(gameProgress)}`);
    }

    //message is sent to initialize setup
    GAME_INIT(UID,gameInitData){
        this.registeredPlayers.getPlayerWs(UID).send(`GAME_INIT:${JSON.stringify(gameInitData)}`);
    }


}

module.exports=SessionCommands;