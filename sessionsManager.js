const WebSocket= require('ws');
const Transformations= require('./Transformations'); 
const ChessmenHelper= require('./chessmenHelper');
const SessionCommands=require('./SessionCommands');

class SessionObject{
    constructor(A_UID,B_UID,SID,registeredPlayers){
        //board of the game
        //the server sees the game from A's perspective
        //instructions recieved from B's side are transformed to A's coordinate system
        //the moves file provides classes for both A's and B's movements
        //the respective classes should provide a function:
            //input: board, move
            //move will look like so: A-p1
        this.SID=SID;
        this.helper= new ChessmenHelper();
        this.isSetupComplete=false;
        this.ASetup=false;
        this.BSetup=false;
        this.CURRENT_GAME_STATE="SETUP";
        //possible values:
        //      SETUP
        //      START
        //      END
        this.board=
        [
            ['B:p1','B:h1','B:h2','B:p2','B:p3'],
            ['','','','',''],
            ['','','','',''],
            ['','','','',''],
            ['A:p1','A:h1','A:h2','A:p2','A:p3'],
        ];

        //player type A UID
        this.A_UID=A_UID;
        //player type B UID
        this.B_UID=B_UID;

        //sent to the users everytime something happens
        this.gameProgress={
            boardA:[],
            boardB:[],
            turnA:false,
            turnB:false,
            AUID:this.A_UID,
            BUID:this.B_UID,
            message:"",
            gameFinished:false,
            winner:""
        };

        //registered players
        this.registeredPlayers=registeredPlayers;
        //commands
        this.cmd=new SessionCommands(this.registeredPlayers);
        //transformations object to help with coordinate transforms (to facilitate player perspective view)
        this.transformations= new Transformations();
    }

    handleQuit(UID){
        this.registeredPlayers.setPlayerSession(this.A_UID,"TEST");
        this.registeredPlayers.setPlayerSession(this.B_UID,"TEST");
        this.cmd.SERVER_GAME_GOODBYE(this.A_UID);
        this.cmd.SERVER_GAME_GOODBYE(this.B_UID);
        return;
    }

    handleChat(UID,message){
        let playerType=(UID==this.A_UID?"A":(UID==this.B_UID?"B":"X"));
        let chatMessage={
            playerType:playerType,
            message:message
        };
        this.cmd.SERVER_CHAT(this.A_UID,chatMessage);
        this.cmd.SERVER_CHAT(this.B_UID,chatMessage);


    }
    handleGameSetup(UID,jsonObject){
        let playerType=(UID==this.A_UID?"A":(UID==this.B_UID?"B":"X"));

        //if A is already set and they send a setup request
        if(playerType=="A"&&this.ASetup){
            //send the server's version of A to A
            let obj={pieceSetup:this.board[4]};
            this.cmd.SERVER_GAME_ALREADY_SET(UID,obj);
            
            return;
        }
        if(playerType=="B"&&this.BSetup){
            let obj={pieceSetup:this.board[0].reverse()};
            this.cmd.SERVER_GAME_ALREADY_SET(UID,obj);
            return;
        }
        //validates the setup they've sent
        let isValidSetup=this.helper.validateInitial(jsonObject,playerType);
        if(isValidSetup){
            //if its player A
            if(playerType=="A"){
                console.log(`PLAYER A ${this.A_UID} SENT A VALID SETUP`);
                //setBoardA (sets A's pieces on server's board)
                this.helper.setupBoardA(this.board,jsonObject);
                console.log(this.board);
                let obj={pieceSetup:this.board[4]};
                //after setting the board, we send a copy of A's position to A
                this.cmd.SERVER_GAME_SET(UID,obj);
                this.ASetup=true;
                if(this.BSetup==true){
                    this.isSetupComplete=true;
                    //then we can complete the setup and move to the next phase
                    this.handleGameStart();
                }
            }else{
                console.log(`PLAYER B ${this.B_UID} SENT A VALID SETUP`);
                this.helper.setupBoardB(this.board,jsonObject);
                console.log(this.board);
                let obj={pieceSetup:this.board[0].reverse()};
                //after setting the board, we send a copy of B's position to B
                this.cmd.SERVER_GAME_SET(UID,obj);
                //setBoardB (sets B's pieces on server's board)
                this.BSetup=true;
                if(this.ASetup==true){
                this.isSetupComplete=true;
                    //then we can complete the setup and move to the next phase
                    this.handleGameStart();

                }
            }
        }else{
            //tell the client that setup is invalid
            this.cmd.SERVER_GAME_INIT_INVALID(UID);
        }
    
    } 

    handleGameStart(){
        console.log("commencing game for session: "+this.SID);
        //init the game progress
        this.gameProgress.boardA=this.board;
        this.gameProgress.boardB=this.transformations.world_convertAtoB(this.board);
        this.gameProgress.message="New Game";
        this.gameProgress.turnA=true;
        this.gameProgress.turnB=false;

        //SERVER_GAME_PROGRESS
        this.cmd.SERVER_GAME_PROGRESS(this.A_UID,this.gameProgress);
        this.cmd.SERVER_GAME_PROGRESS(this.B_UID,this.gameProgress);
       
        
        console.log(this.gameProgress);
    }
    handleMove(UID,moveMessage){
        
            //piece:selectionState.pieceToBeMoved.innerText,
            //move:event.target.getAttribute(move-cell).toString()
        let pieceBreakdown= moveMessage.piece.split("-");
        let playerType=(UID==this.A_UID?"A":"B");

        if(pieceBreakdown.length!=2){
            this.cmd.SERVER_GAME_INVALID_MOVE(UID);
            return;
        }
        
        
        if(this.gameProgress.turnA && playerType=="B"){
            this.cmd.SERVER_GAME_WAIT_FOR_TURN(UID);
            return;
        }
        if(this.gameProgress.turnB && playerType=="A"){
            this.cmd.SERVER_GAME_WAIT_FOR_TURN(UID);
            return;
        }

        //we know for sure that it is playerType's turn
        if(pieceBreakdown[0]!=playerType){
            this.cmd.SERVER_GAME_INVALID_MOVE(UID);
            return;
        }else{
            //now we need to validate the move
            //internally it checks if the move is valid
            //if move is found to be invalid it returns false
            const result=this.helper.makeMove(playerType,moveMessage.piece,moveMessage.move,(playerType=="A"?this.gameProgress.boardA:this.gameProgress.boardB));
            //if the result is true
            //we take the manipualted board and transform a copy of it to the other board
            if(result){
                if(playerType=="A"){
                    this.gameProgress.boardB=this.transformations.world_convertAtoB(this.gameProgress.boardA);
                }else{
                    this.gameProgress.boardA=this.transformations.world_convertBtoA(this.gameProgress.boardB);
                }
                //flip the player turns
                this.gameProgress.turnA=!(this.gameProgress.turnA);
                this.gameProgress.turnB=!(this.gameProgress.turnB);
                //now the game can make progress
                let gameEvents= result;
                let formulatedMessage="";
                for(let idx=0;idx<gameEvents.length;idx++){
                    formulatedMessage=formulatedMessage+". "+gameEvents[idx];
                }
                this.gameProgress.message=formulatedMessage;
                //check for game over, checking via any board is fine
                let check= this.helper.gameOverCheck(this.gameProgress.boardA);
                if(check){
                    this.gameProgress.gameFinished=true;
                    this.gameProgress.winner=check;
                }
                this.cmd.SERVER_GAME_PROGRESS(this.A_UID,this.gameProgress);
                this.cmd.SERVER_GAME_PROGRESS(this.B_UID,this.gameProgress);
                return;
            }
            else{
                this.cmd.SERVER_GAME_INVALID_MOVE(UID);
                console.log("Invalid Move Command");
                return; 
            }
        }
    }
    handleReconnect(UID){
        let playerType=(UID==this.A_UID?"A":"B");
        //UID is the user id of the user who has reconnected
        if(this.isSetupComplete==true){
            console.log(`Player ${playerType} reconnected. Sending latest progress data.`);
            this.cmd.SERVER_GAME_PROGRESS(UID,this.gameProgress);

        }else{
            //if the setup has not been complete, and UID reconnects, send UID
            const gameInitData={
                playerType:(UID==this.A_UID?"A":"B"),
                SID:this.SID
            };
            this.cmd.GAME_INIT(UID,gameInitData);
        }
        
    }
}


class SessionsManager{
    
    constructor(registeredPlayers){
        //registered players is a Map
        /*
            Format:
                {
                    "THE UID":
                    {
                    wins:0,
                    currentSession:"",
                    }
                }
        */
        this.registeredPlayers=registeredPlayers;
        this.sessions=new Map();
        this.sessions["session_id"]=new SessionObject();
        this.searchPool=[];
        this.cmd=new SessionCommands(registeredPlayers);

        //the session manager employes a 200ms routine that checks for players in the pool
        //if there are more than two players or two players
        //  first validated the players; a player is valid if they responded to the last ping message
        //  take the two valid players;
        //  take their UIDs. Concat them. That is our session ID
        //  inside of activeSessions (a dictionary of SessionObject) add a SessionObject
        //  SessionObject takes the following parameters:
        //      A_UID: UID of player A
        //      B_UID: UID of player B
        //      registeredPlayers dictionary
        //      destructionCallback => this belongs to sessionsManager, it simply destroys the SessionObject
        //      sessionConcludeCallback => this belongs to sessionManager, input: Won_UID (user who wins), Lost_UID (user who loses)
        //      when a SessionObject is first ini

        this.searchPoolInterval= setInterval(()=>{
            if(this.searchPool.length>=2){
                let A_UID="";
                let B_UID="";
                while(this.searchPool.length>1){
                    let tempA=this.searchPool.pop();
                    let tempB=this.searchPool.pop();
                    let isAValid=registeredPlayers.getPlayerLastPing(tempA);
                    let isBValid=registeredPlayers.getPlayerLastPing(tempB);
                    if(isAValid&&isBValid){
                        //if both of them are valid we can break out of the loop
                            let sessionId=tempA+tempB;
                            registeredPlayers.setPlayerSession(tempA,sessionId);
                            registeredPlayers.setPlayerSession(tempB,sessionId);
                            console.log(registeredPlayers);
                            console.log(`Matching:${tempA} and ${tempB}`);
                            this.sessions[sessionId]=new SessionObject(tempA,tempB,sessionId,registeredPlayers);
                            let gameInitData={
                                playerType:"A",
                                SID:sessionId
                            };
                            //registeredPlayers.getPlayerWs(tempA).send(`GAME_INIT:${JSON.stringify(gameInitData)}`);
                            this.cmd.GAME_INIT(tempA,gameInitData);
                            gameInitData.playerType="B";
                            this.cmd.GAME_INIT(tempB,gameInitData);
                            console.log(this.sessions);
                            break;
                    }
                    else if(isAValid && !isBValid){
                        this.searchPool.push(tempA);
                    }else if(!isAValid && isBValid){
                        this.searchPool.push(tempB);
                    }
                }
                //then we want to validate the users first
            }
        },300);
    }

    handleGameCommand(commandArr,commandString){
        let playerUID=commandArr[1];
        let gameCommand=commandArr[2];
        let currentSessionOfPlayer=null;
        let isSessionValid=null;
        let jsonString= ""; 
        let jsonObject={};



        switch(gameCommand){
            //the client wants to join a new game
            //check if client is already in a session
            //if they are they should be able to join that session back
            case "NEW_GAME":
                console.log(this.registeredPlayers);
                let currentSession= this.registeredPlayers.getPlayerSession(playerUID);
                console.log(currentSession);
                if(currentSession==false){
                    console.log("Unxepected behaviour inside of new game. The user does not seem to exist.");
                    //in this case the user does not exist
                    //unexpected behaviour, return an empty string so that the network manager side may close it
                    return "";
                }
                //if empty string is returned, player exists, but has no session so
                if(currentSession==="TEST"){
                    console.log(`Pushing ${playerUID} to the pool`);
                        if(this.searchPool.indexOf(playerUID)==-1){
                        this.searchPool.push(playerUID);
                        }
                    return "";
                }else{

                    let isFound= currentSession in this.sessions;
                    if(isFound){
                        let sessionObj=this.sessions[currentSession];
                        console.log(`found the session: Players are ${sessionObj.A_UID} and ${sessionObj.B_UID}`);
                        //if session was found then let sessionsObject handle it
                        sessionObj.handleReconnect(playerUID);
                    }else{
                        console.log("failed to find session. Setting it back to TEST");
                        this.registeredPlayers.setPlayerSession(playerUID,"TEST");
                    }

                    //the player has a session, but perhaps they disconnected so just return
                    //"SERVER_SESSION_ALREADY_EXISTS"
                    //from there it is the client's responsibility to 
                    return "";
                }
            break;
            case "GAME_SETUP_RESPONSE":
                 jsonString= commandArr.slice(3).join(":"); 
                 jsonObject= JSON.parse(jsonString);
                //proceed only if the UID is linked to a valid SESSION ID
                 currentSessionOfPlayer= this.registeredPlayers.getPlayerSession(playerUID);
                 isSessionValid=currentSessionOfPlayer in this.sessions;
                if(isSessionValid){
                    let sessionObject= this.sessions[currentSessionOfPlayer];
                    sessionObject.handleGameSetup(playerUID,jsonObject);
                }
                return;
            break;
            case "GAME_CHAT":
                jsonString=commandArr.slice(3).join(":");
                 currentSessionOfPlayer= this.registeredPlayers.getPlayerSession(playerUID);
                 isSessionValid=currentSessionOfPlayer in this.sessions;
                if(isSessionValid){
                    let sessionObject= this.sessions[currentSessionOfPlayer];
                    sessionObject.handleChat(playerUID,jsonString);
                }  
            break;
            case "GAME_PROGRESS_MOVE":
                jsonString=commandArr.slice(3).join(":");
                jsonObject=JSON.parse(jsonString);
                currentSessionOfPlayer= this.registeredPlayers.getPlayerSession(playerUID);
                isSessionValid=currentSessionOfPlayer in this.sessions;
               if(isSessionValid){
                   let sessionObject= this.sessions[currentSessionOfPlayer];
                   sessionObject.handleMove(playerUID,jsonObject);
               }                  
                break;

            case "QUIT_GAME":
                currentSessionOfPlayer= this.registeredPlayers.getPlayerSession(playerUID);
                isSessionValid=currentSessionOfPlayer in this.sessions;
               if(isSessionValid){
                   let sessionObject= this.sessions[currentSessionOfPlayer];
                   sessionObject.handleQuit(playerUID);
                   this.sessions.delete(currentSessionOfPlayer);
               }                  
                break;
            //case ""
        }
    }
} 


module.exports=SessionsManager;