

class ChessmenHelper{

    
        constructor(){

        }

        gameOverCheck(board){
            let Acount=0;
            let Bcount=0;
            for(let i=0;i<5;i++){
                for(let j=0;j<5;j++){
                    let text= board[i][j];
                    if(text.split("-")[0]=="A"){
                        Acount+=1;
                    }
                    if(text.split("-")[0]=="B"){
                        Bcount+=1;
                    }
                }
            }
            if(Acount==0){
                return "A";
            }
            if(Bcount==0){
                return "B";
            }
            return false;
        }

        validateInitial(jsonObject,playerType){
            let pieceArray= jsonObject.pieceSetup;
            let validNames={
                "A-P1":0,
                "A-P2":0,
                "A-H1":0,
                "A-H2":0,
                "A-H3":0,
                "B-P1":0,
                "B-P2":0,
                "B-H1":0,
                "B-H2":0,
                "B-H3":0,
            };
            //let pieceArray=[];
            if(pieceArray!==null&&pieceArray!==undefined&&(typeof pieceArray=='object')&&pieceArray.length!==undefined){
            let pieceCount=0;
            for(let i=0;i<pieceArray.length;i++){
                let tempType=(pieceArray[i].split("-"))[0];
                if(!(pieceArray[i] in validNames) && !(tempType==playerType)){

                    return false;
                }else{
                    if(validNames[pieceArray[i]]==1){
                        return false;
                    }
                    validNames[pieceArray[i]]=1;
                    pieceCount+=1;
                }
            }
            if(pieceCount==5){
                return true;
            }
            return false;
        }else{

            return false;
        }
        }

        setupBoardA(board,jsonObject){
            let pieceArray= jsonObject.pieceSetup;
            for(let i=0;i<5;i++){
                board[4][i]=pieceArray[i];
            }
        }
        setupBoardB(board,jsonObject){
            let pieceArray= jsonObject.pieceSetup.reverse();
            for(let i=0;i<5;i++){
                board[0][i]=pieceArray[i];
            }
        }
        
        findCoordinateOnBoard(piece,board){
            for(let i=0;i<5;i++){
                for(let j=0;j<5;j++){
                    if(piece==board[i][j]){
                        return {i:i,j:j};
                    }
                }
            }
        }
        isFriendly(playerType,i,j,board){
            if(playerType==(board[i][j].split("-")[0])){
                return true;
            }else{
                return false;
            }
        }
        isEmpty(i,j,board){
            if(board[i][j].length==0){
                return true;
            }else{
                return false;
            }
        }
        isInBounds(i,j){
            if((i>=0&&i<5)&&(j>=0&&j<5)){
                return true;
            }else{
                return false;
            }
        }
         checkIsFriendlyPiece(cellValue,playerType){
            const cellContent= cellValue.split("-");
            if(cellContent.length!=2){
                return false;
            }else{
                if(cellContent[0]!=playerType){
                    return false;
                }else{
                    return true;
                }
            }
        }
        checkIsEnemyPiece(cellValue,playerType){
            const cellContent= cellValue.split("-");
            if(cellContent.length!=2){
                return false;
            }else{
                if(cellContent[0]!=playerType){
                    return true;
                }else{
                    return false;
                }
            }
        }
         isMoveValid(playerType,origin_i,origin_j,L,R,F,B,objectBoard){
            //console.log(objectBoard);
            let i=origin_i;
            let j=origin_j;
            const enemiesEncountered=[];
            while(L!=0||R!=0||F!=0||B!=0){
                if(L!==0){j-=1;L-=1;}
                if(R!==0){j+=1;R-=1;}
                if(F!==0){i-=1;F-=1;}
                if(B!==0){i+=1;B-=1;}
        
                if((i>=0&&i<5)&&(j>=0&&j<5)){
                    //check if there is a friendly here
                    
                    if(this.checkIsFriendlyPiece(objectBoard[i][j],playerType)){
                        return false;
                    }else{
                        //here if enemy is encountered add them to the encountered list
                        if(this.checkIsEnemyPiece(objectBoard[i][j],playerType)){
                            enemiesEncountered.push({enemy:objectBoard[i][j],i:i,j:j});
                        }
                    }
                }else{
                    return false;
                }
            }
            return {playerFinal:{i:i,j:j},enemiesEncountered:enemiesEncountered};
        }

        
        makeMove(playerType,piece,move,board){
            const pieceBreakdown=piece.split("-");
            const boardCopy=JSON.parse(JSON.stringify(board));
            //a string array that stores all the events as messages so that clients can read what happened
            const gameEvents=[];
            if(playerType!=pieceBreakdown[0]){
                return false;
            }else{
                //original cords
                const cords= this.findCoordinateOnBoard(piece,board);
                //these might be subject to change
                let i=cords.i;
                let j=cords.j;
                let moveResult=null;
                if(pieceBreakdown[1]=="P1"||pieceBreakdown[1]=="P2"){
                    //control movements of the pawns
                    switch(move){
                        case "L":
                             moveResult=this.isMoveValid(playerType,i,j,1,0,0,0,boardCopy);
                            if(moveResult){
                                for(let idx=0;idx<moveResult.enemiesEncountered.length;idx++){
                                    let enemy=moveResult.enemiesEncountered[idx];
                                    gameEvents.push(`${piece} killed ${enemy.enemy}`);
                                    board[enemy.i][enemy.j]="";
                                }
                                board[cords.i][cords.j]="";
                                board[moveResult.playerFinal.i][moveResult.playerFinal.j]=piece;
                                return gameEvents;
                            }else{
                                console.log("Invalid move was sent");
                                return false;
                            }
                            break;
                        case "R":
                            moveResult=this.isMoveValid(playerType,i,j,0,1,0,0,boardCopy);
                            if(moveResult){
                                for(let idx=0;idx<moveResult.enemiesEncountered.length;idx++){
                                    let enemy=moveResult.enemiesEncountered[idx];
                                    gameEvents.push(`${piece} killed ${enemy.enemy}`);
                                    board[enemy.i][enemy.j]="";
                                }
                                board[cords.i][cords.j]="";
                                board[moveResult.playerFinal.i][moveResult.playerFinal.j]=piece;
                                return gameEvents;
                            }else{
                                console.log("Invalid move was sent");
                                return false;
                            }
                            break;
                        case "F":
                            moveResult=this.isMoveValid(playerType,i,j,0,0,1,0,boardCopy);
                            if(moveResult){
                                for(let idx=0;idx<moveResult.enemiesEncountered.length;idx++){
                                    let enemy=moveResult.enemiesEncountered[idx];
                                    gameEvents.push(`${piece} killed ${enemy.enemy}`);
                                    board[enemy.i][enemy.j]="";
                                }
                                board[cords.i][cords.j]="";
                                board[moveResult.playerFinal.i][moveResult.playerFinal.j]=piece;
                                return gameEvents;
                            }else{
                                console.log("Invalid move was sent");
                                return false;
                            }
                            break;
                        case "B":
                            moveResult=this.isMoveValid(playerType,i,j,0,0,0,1,boardCopy);
                            if(moveResult){
                                for(let idx=0;idx<moveResult.enemiesEncountered.length;idx++){
                                    let enemy=moveResult.enemiesEncountered[idx];
                                    gameEvents.push(`${piece} killed ${enemy.enemy}`);
                                    board[enemy.i][enemy.j]="";
                                }
                                board[cords.i][cords.j]="";
                                board[moveResult.playerFinal.i][moveResult.playerFinal.j]=piece;
                                return gameEvents;
                            }else{
                                console.log("Invalid move was sent");
                                return false;
                            }
                            break;
                    }
                }
                else if(pieceBreakdown[1]=="H1"){
                    switch(move){
                        case "L":
                             moveResult=this.isMoveValid(playerType,i,j,2,0,0,0,boardCopy);
                            if(moveResult){
                                for(let idx=0;idx<moveResult.enemiesEncountered.length;idx++){
                                    let enemy=moveResult.enemiesEncountered[idx];
                                    gameEvents.push(`${piece} killed ${enemy.enemy}`);
                                    board[enemy.i][enemy.j]="";
                                }
                                board[cords.i][cords.j]="";
                                board[moveResult.playerFinal.i][moveResult.playerFinal.j]=piece;
                                return gameEvents;
                            }else{
                                console.log("Invalid move was sent");
                                return false;
                            }
                            break;
                        case "R":
                            moveResult=this.isMoveValid(playerType,i,j,0,2,0,0,boardCopy);
                            if(moveResult){
                                for(let idx=0;idx<moveResult.enemiesEncountered.length;idx++){
                                    let enemy=moveResult.enemiesEncountered[idx];
                                    gameEvents.push(`${piece} killed ${enemy.enemy}`);
                                    board[enemy.i][enemy.j]="";
                                }
                                board[cords.i][cords.j]="";
                                board[moveResult.playerFinal.i][moveResult.playerFinal.j]=piece;
                                return gameEvents;
                            }else{
                                console.log("Invalid move was sent");
                                return false;
                            }
                            break;
                        case "F":
                            moveResult=this.isMoveValid(playerType,i,j,0,0,2,0,boardCopy);
                            if(moveResult){
                                for(let idx=0;idx<moveResult.enemiesEncountered.length;idx++){
                                    let enemy=moveResult.enemiesEncountered[idx];
                                    gameEvents.push(`${piece} killed ${enemy.enemy}`);
                                    board[enemy.i][enemy.j]="";
                                }
                                board[cords.i][cords.j]="";
                                board[moveResult.playerFinal.i][moveResult.playerFinal.j]=piece;
                                return gameEvents;
                            }else{
                                console.log("Invalid move was sent");
                                return false;
                            }
                            break;
                        case "B":
                            moveResult=this.isMoveValid(playerType,i,j,0,0,0,2,boardCopy);
                            if(moveResult){
                                for(let idx=0;idx<moveResult.enemiesEncountered.length;idx++){
                                    let enemy=moveResult.enemiesEncountered[idx];
                                    gameEvents.push(`${piece} killed ${enemy.enemy}`);
                                    board[enemy.i][enemy.j]="";
                                }
                                board[cords.i][cords.j]="";
                                board[moveResult.playerFinal.i][moveResult.playerFinal.j]=piece;
                                return gameEvents;
                            }else{
                                console.log("Invalid move was sent");
                                return false;
                            }
                            break;
                    }
                }
                else if(pieceBreakdown[1]=="H2"){
                    switch(move){
                        case "LF":
                             moveResult=this.isMoveValid(playerType,i,j,2,0,2,0,boardCopy);
                            if(moveResult){
                                for(let idx=0;idx<moveResult.enemiesEncountered.length;idx++){
                                    let enemy=moveResult.enemiesEncountered[idx];
                                    gameEvents.push(`${piece} killed ${enemy.enemy}`);
                                    board[enemy.i][enemy.j]="";
                                }
                                board[cords.i][cords.j]="";
                                board[moveResult.playerFinal.i][moveResult.playerFinal.j]=piece;
                                return gameEvents;
                            }else{
                                console.log("Invalid move was sent");
                                return false;
                            }
                            break;
                        case "RF":
                            moveResult=this.isMoveValid(playerType,i,j,0,2,2,0,boardCopy);
                            if(moveResult){
                                for(let idx=0;idx<moveResult.enemiesEncountered.length;idx++){
                                    let enemy=moveResult.enemiesEncountered[idx];
                                    gameEvents.push(`${piece} killed ${enemy.enemy}`);
                                    board[enemy.i][enemy.j]="";
                                }
                                board[cords.i][cords.j]="";
                                board[moveResult.playerFinal.i][moveResult.playerFinal.j]=piece;
                                return gameEvents;
                            }else{
                                console.log("Invalid move was sent");
                                return false;
                            }
                            break;
                        case "RB":
                            moveResult=this.isMoveValid(playerType,i,j,0,2,0,2,boardCopy);
                            if(moveResult){
                                for(let idx=0;idx<moveResult.enemiesEncountered.length;idx++){
                                    let enemy=moveResult.enemiesEncountered[idx];
                                    gameEvents.push(`${piece} killed ${enemy.enemy}`);
                                    board[enemy.i][enemy.j]="";
                                }
                                board[cords.i][cords.j]="";
                                board[moveResult.playerFinal.i][moveResult.playerFinal.j]=piece;
                                return gameEvents;
                            }else{
                                console.log("Invalid move was sent");
                                return false;
                            }
                            break;
                        case "LB":
                            moveResult=this.isMoveValid(playerType,i,j,2,0,0,2,boardCopy);
                            if(moveResult){
                                for(let idx=0;idx<moveResult.enemiesEncountered.length;idx++){
                                    let enemy=moveResult.enemiesEncountered[idx];
                                    gameEvents.push(`${piece} killed ${enemy.enemy}`);
                                    board[enemy.i][enemy.j]="";
                                }
                                board[cords.i][cords.j]="";
                                board[moveResult.playerFinal.i][moveResult.playerFinal.j]=piece;
                                return gameEvents;
                            }else{
                                console.log("Invalid move was sent");
                                return false;
                            }
                            break;
                    }
                }else if(pieceBreakdown[1]=="H3"){
                    switch(move){
                        case "LLF":
                             moveResult=this.isMoveValid(playerType,i,j,2,0,0,0,boardCopy);
                            if(moveResult){
                                moveResult=this.isMoveValid(playerType,i,j-2,0,0,1,0,boardCopy);
                                if(moveResult){
                                for(let idx=0;idx<moveResult.enemiesEncountered.length;idx++){
                                    let enemy=moveResult.enemiesEncountered[idx];
                                    gameEvents.push(`${piece} killed ${enemy.enemy}`);
                                    board[enemy.i][enemy.j]="";
                                }
                                board[cords.i][cords.j]="";
                                board[moveResult.playerFinal.i][moveResult.playerFinal.j]=piece;
                                return gameEvents;
                            }else{
                                console.log("Invalid move was sent");
                                return false;  
                            }
                            }else{
                                console.log("Invalid move was sent");
                                return false;
                            }
                            break;
                            case "LLB":
                                moveResult=this.isMoveValid(playerType,i,j,2,0,0,0,boardCopy);
                               if(moveResult){
                                   moveResult=this.isMoveValid(playerType,i,j-2,0,0,0,1,boardCopy);
                                   if(moveResult){
                                   for(let idx=0;idx<moveResult.enemiesEncountered.length;idx++){
                                       let enemy=moveResult.enemiesEncountered[idx];
                                       gameEvents.push(`${piece} killed ${enemy.enemy}`);
                                       board[enemy.i][enemy.j]="";
                                   }
                                   board[cords.i][cords.j]="";
                                   board[moveResult.playerFinal.i][moveResult.playerFinal.j]=piece;
                                   return gameEvents;
                               }else{
                                   console.log("Invalid move was sent");
                                   return false;  
                               }
                               }else{
                                   console.log("Invalid move was sent");
                                   return false;
                               }
                               break;
                               case "RRF":
                                moveResult=this.isMoveValid(playerType,i,j,0,2,0,0,boardCopy);
                               if(moveResult){
                                   moveResult=this.isMoveValid(playerType,i,j+2,0,0,1,0,boardCopy);
                                   if(moveResult){
                                   for(let idx=0;idx<moveResult.enemiesEncountered.length;idx++){
                                       let enemy=moveResult.enemiesEncountered[idx];
                                       gameEvents.push(`${piece} killed ${enemy.enemy}`);
                                       board[enemy.i][enemy.j]="";
                                   }
                                   board[cords.i][cords.j]="";
                                   board[moveResult.playerFinal.i][moveResult.playerFinal.j]=piece;
                                   return gameEvents;
                               }else{
                                   console.log("Invalid move was sent");
                                   return false;  
                               }
                               }else{
                                   console.log("Invalid move was sent");
                                   return false;
                               }
                               break;
                               case "RRB":
                                moveResult=this.isMoveValid(playerType,i,j,0,2,0,0,boardCopy);
                               if(moveResult){
                                   moveResult=this.isMoveValid(playerType,i,j+2,0,0,0,1,boardCopy);
                                   if(moveResult){
                                   for(let idx=0;idx<moveResult.enemiesEncountered.length;idx++){
                                       let enemy=moveResult.enemiesEncountered[idx];
                                       gameEvents.push(`${piece} killed ${enemy.enemy}`);
                                       board[enemy.i][enemy.j]="";
                                   }
                                   board[cords.i][cords.j]="";
                                   board[moveResult.playerFinal.i][moveResult.playerFinal.j]=piece;
                                   return gameEvents;
                               }else{
                                   console.log("Invalid move was sent");
                                   return false;  
                               }
                               }else{
                                   console.log("Invalid move was sent");
                                   return false;
                               }
                               break;
                               case "FFL":
                                moveResult=this.isMoveValid(playerType,i,j,0,0,2,0,boardCopy);
                               if(moveResult){
                                   moveResult=this.isMoveValid(playerType,i-2,j,1,0,0,0,boardCopy);
                                   if(moveResult){
                                   for(let idx=0;idx<moveResult.enemiesEncountered.length;idx++){
                                       let enemy=moveResult.enemiesEncountered[idx];
                                       gameEvents.push(`${piece} killed ${enemy.enemy}`);
                                       board[enemy.i][enemy.j]="";
                                   }
                                   board[cords.i][cords.j]="";
                                   board[moveResult.playerFinal.i][moveResult.playerFinal.j]=piece;
                                   return gameEvents;
                               }else{
                                   console.log("Invalid move was sent");
                                   return false;  
                               }
                               }else{
                                   console.log("Invalid move was sent");
                                   return false;
                               }
                               break;
                               case "FFR":
                                moveResult=this.isMoveValid(playerType,i,j,0,0,2,0,boardCopy);
                               if(moveResult){
                                   moveResult=this.isMoveValid(playerType,i-2,j,0,1,0,0,boardCopy);
                                   if(moveResult){
                                   for(let idx=0;idx<moveResult.enemiesEncountered.length;idx++){
                                       let enemy=moveResult.enemiesEncountered[idx];
                                       gameEvents.push(`${piece} killed ${enemy.enemy}`);
                                       board[enemy.i][enemy.j]="";
                                   }
                                   board[cords.i][cords.j]="";
                                   board[moveResult.playerFinal.i][moveResult.playerFinal.j]=piece;
                                   return gameEvents;
                               }else{
                                   console.log("Invalid move was sent");
                                   return false;  
                               }
                               }else{
                                   console.log("Invalid move was sent");
                                   return false;
                               }
                               break;
                               case "BBL":
                                moveResult=this.isMoveValid(playerType,i,j,0,0,0,2,boardCopy);
                               if(moveResult){
                                   moveResult=this.isMoveValid(playerType,i+2,j,1,0,0,0,boardCopy);
                                   if(moveResult){
                                   for(let idx=0;idx<moveResult.enemiesEncountered.length;idx++){
                                       let enemy=moveResult.enemiesEncountered[idx];
                                       gameEvents.push(`${piece} killed ${enemy.enemy}`);
                                       board[enemy.i][enemy.j]="";
                                   }
                                   board[cords.i][cords.j]="";
                                   board[moveResult.playerFinal.i][moveResult.playerFinal.j]=piece;
                                   return gameEvents;
                               }else{
                                   console.log("Invalid move was sent");
                                   return false;  
                               }
                               }else{
                                   console.log("Invalid move was sent");
                                   return false;
                               }
                               break;
                               case "BBR":
                                moveResult=this.isMoveValid(playerType,i,j,0,0,0,2,boardCopy);
                               if(moveResult){
                                   moveResult=this.isMoveValid(playerType,i+2,j,0,1,0,0,boardCopy);
                                   if(moveResult){
                                   for(let idx=0;idx<moveResult.enemiesEncountered.length;idx++){
                                       let enemy=moveResult.enemiesEncountered[idx];
                                       gameEvents.push(`${piece} killed ${enemy.enemy}`);
                                       board[enemy.i][enemy.j]="";
                                   }
                                   board[cords.i][cords.j]="";
                                   board[moveResult.playerFinal.i][moveResult.playerFinal.j]=piece;
                                   return gameEvents;
                               }else{
                                   console.log("Invalid move was sent");
                                   return false;  
                               }
                               }else{
                                   console.log("Invalid move was sent");
                                   return false;
                               }
                               break;
                    }
                }
            }
        }

}

module.exports=ChessmenHelper;