class RegisteredPlayer{
    constructor(UID){
        this.UID="";
        this.currentSession="TEST";
        this.wins=0;
        this.currentWs=null;
        this.lastAck=true;
        this.lastPing=true;

    }
}
class RegisteredPlayers{

    constructor(){
        this.playersDict= {};
    }
    playerExists(UID){
        return UID in this.playersDict;
    }
    registerPlayer(UID){
        if(!this.playerExists(UID)){
            this.playersDict[UID]= new RegisteredPlayer(UID);
        }
    }
    setPlayerWs(UID,ws){
        if(this.playerExists(UID)){
            this.playersDict[UID].currentWs=ws;
        }
    }
    setPlayerSession(UID,SID){
        if(this.playerExists(UID)){
            this.playersDict[UID].currentSession=SID;
        }
    }
    setPlayerWins(UID,wins){
        if(this.playerExists(UID)){
            this.playersDict[UID].wins=wins;
        }
    }
    setPlayerLastPing(UID,ping){
        if(this.playerExists(UID)){
            this.playersDict[UID].lastPing=ping;
        }
    }
    setPlayerLastAck(UID,ack){
        if(this.playerExists(UID)){
            this.playersDict[UID].lastAck=ack;
        }
    }
    getPlayerWs(UID){
        if(this.playerExists(UID)){
            return this.playersDict[UID].currentWs;
        }else{
            return false;
        }
    }
    getPlayerSession(UID){
    
        if(this.playerExists(UID)){
            console.log(`Player ${UID} exists`);
            return this.playersDict[UID].currentSession;
        }else{
            return false;
        }
    }
    getPlayerWins(UID){
        if(this.playerExists(UID)){
            return this.playersDict[UID].wins;
        }else{
            return false;
        }
    }
    getPlayerLastPing(UID){
        if(this.playerExists(UID)){
            return this.playersDict[UID].lastPing;
        }else{
            return false;
        }
    }
    getPlayerLastAck(UID){
        if(this.playerExists(UID)){
            return this.playersDict[UID].lastAck;
        }else{
            return false;
        }
    }
    
}

module.exports=RegisteredPlayers;