class Transformations{
    constructor(){
        this.perspectiveA=[
            ['A','B','C','D','E'],
            ['F','G','H','I','J'],
            ['K','L','M','N','O'],
            ['P','Q','R','S','T'],
            ['U','V','W','X','Y'],
        ];
        this.perspectiveB=[
            ['Y','X','W','V','U'],
            ['T','S','R','Q','P'],
            ['O','N','M','L','K'],
            ['J','I','H','G','F'],
            ['E','D','C','B','A'],
        ];

        this.transformationMatrixAminusB=[];
        this.transformationMatrixBminusA=[];
        for(var i=0;i<5;i++){
            var transformationsA=[];
            var transformationsB=[];
            for(var j=0;j<5;j++){
                var letterA=this.perspectiveA[i][j];
                var letterB=this.perspectiveB[i][j];
                var bCords= this.findInMtrx(letterA,this.perspectiveB);
                var aCords= this.findInMtrx(letterB,this.perspectiveA);
                transformationsA.push({i:i-bCords.i,j:j-bCords.j});
                transformationsB.push({i:i-aCords.i,j:j-aCords.j});
            }
            this.transformationMatrixAminusB.push(transformationsA);
            this.transformationMatrixBminusA.push(transformationsB);
        }
    }
    findInMtrx(letter,mtrx){
        for(var i=0;i<5;i++){
            for(var j=0;j<5;j++){
                if(mtrx[i][j]==letter){
                    return {i:i,j:j};
                }
            }
        }
    }

    //from the server's perspective, A is always at the bottom
    //this function converts coordinates in A world to B world
    cords_convertAtoB(i,j){
        var transformation= this.transformationMatrixAminusB[i][j];
        var Bcords= {i:i-transformation.i,j:j-transformation.j};
        return Bcords;
    }
    cords_convertBtoA(i,j){
        var transformation= this.transformationMatrixBminusA[i][j];
        var Acords= {i:i-transformation.i,j:j-transformation.j};
        return Acords;
    }

    //convert B's world to A's world
    world_convertBtoA(B_board){
        const A_board=[];
        this.init_emptyBoard(A_board);
        for(let i=0;i<5;i++){
            for(let j=0;j<5;j++){
                let a_cords=this.cords_convertBtoA(i,j);
                A_board[a_cords.i][a_cords.j]=B_board[i][j];
            }
        }
        return A_board;
    }
    //convert A's world to B's world
    world_convertAtoB(A_board){
        const B_board=[];
        this.init_emptyBoard(B_board);
        for(let i=0;i<5;i++){
            for(let j=0;j<5;j++){
                let b_cords=this.cords_convertAtoB(i,j);
                B_board[b_cords.i][b_cords.j]=A_board[i][j];
            }
        }
        return B_board;
    }

    init_emptyBoard(board){
        for(let i=0;i<5;i++){
            let row=[];
            for(let j=0;j<5;j++){
                row.push("");
            }
            board.push(row);
        }
    }
}

module.exports=Transformations;

