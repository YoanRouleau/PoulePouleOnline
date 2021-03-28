let express = require("express")
let socketio = require("socket.io")
let http = require("http")
var _ = require("underscore");
const { parse } = require("path");

let app = express()
let server = http.Server(app)
let io = socketio(server)

app.use("/img", express.static( __dirname + "/img" ))
app.use("/css", express.static( __dirname + "/css" ))
app.use("/js", express.static( __dirname + "/js" ))

app.get("/", function(req, res){
    res.sendFile(__dirname + "/index.html");
})

app.get("/rules", function(req,res){
    res.sendFile(__dirname + "/rules.html");
})


global.finalScore = 0;
let connectedPeoples = [];
let connectedPlayers = [];
let playersVotes = [];


io.on("connect", function(socket){
    // console.log("connecté" + socket.handshake.address)
   
    /* ========================================================================= *\
    **  === HOME                                                                 *| 
    \* ========================================================================= */

    socket.on("enter", function(data){
        // console.log(connectedPeoples)
        if(!connectedPeoples.includes(data))
            connectedPeoples.push(data);

        io.sockets.emit("entered", connectedPeoples);
    })

    socket.on("disconnect", function(){
        socket.disconnect(true)
        let index = connectedPeoples.indexOf(connectedPeoples.find(user => user.id == socket.id))
        // console.log(connectedPeoples.find(user => user.id = socket.id))
        // console.log(`User with ID "${socket.id}" at index "${ index }" disconnected.`)
        connectedPeoples.splice(index, 1);
        // console.log(connectedPeoples)
        io.emit('userdisconnected', socket.id)
    })


    /* ========================================================================= *\
    **  === LOBBY                                                                *| 
    \* ========================================================================= */

    socket.on("setReady",function(data){
        let index = connectedPeoples.indexOf(connectedPeoples.find(user => user.id == data.id))
        connectedPeoples[index].status == 1 ? connectedPeoples[index].status = 0 : connectedPeoples[index].status = 1;
        
        io.emit('playerReady', data.id)

        if(!connectedPeoples.find(user => user.status !== 1)){
            // console.log("tout le monde est prêt")
            connectedPlayers = JSON.parse(JSON.stringify(connectedPeoples));
            // console.log(connectedPlayers);
            io.emit('gamelaunch');
            setTimeout(function(){
                stop = false;
                game();
            }, 3000)
        }
        
    })


    /* ========================================================================= *\
    **  === GAME                                                                 *| 
    \* ========================================================================= */

    socket.on('gamestop', function(data){
        stop = true;
        // console.log(finalScore)
        if(finalScore >= 5){
            connectedPlayers.forEach(player => {
                if(player.id == data.id)
                    player.win = true;
                else
                    player.win = false;
            });
        }
        else{
            connectedPlayers.forEach(player => {
                player.win = false;
            });
        }

        let playerWhoStopped = connectedPlayers[connectedPlayers.indexOf(connectedPlayers.find(user => user.id == data.id))];
       
        io.emit('votephase', playerWhoStopped)
    })


    /* ========================================================================= *\
    **  === VOTE PHASE                                                           *| 
    \* ========================================================================= */

    socket.on('voteValue', function(data){
        playersVotes.push(data);
        // console.log("avant")
        // console.log(connectedPlayers[connectedPlayers.indexOf(connectedPlayers.find(user => user.id == data.id))])
        if(data.voteValue == false){
            if(finalScore < 5){
                connectedPlayers[connectedPlayers.indexOf(connectedPlayers.find(user => user.id == data.id))].win = true;
            }
        }
        // console.log("après")
        // console.log(connectedPlayers[connectedPlayers.indexOf(connectedPlayers.find(user => user.id == data.id))]);

        let numberOfVotes = playersVotes.length;
        io.emit('voteRemains', {
            current: playersVotes.length,
            total: connectedPlayers.length - 1
        })

        if(playersVotes.length == connectedPlayers.length - 1){
            console.log("Tout le monde a voté")
            connectedPlayers.forEach(player => {
                io.to(player.id).emit('result', {
                    result: player.win,
                    finalScore: finalScore,
                })
            });
            resetGame();
        }

        // console.log(connectedPlayers);
    })
})

/* ========================================================================= *\
**  === GAME ALGORITHM                                                       *| 
\* ========================================================================= */


let cards = [ 
    {
        'id': 'p',
        'card': "Poule",
    },
    {
        'id': 'o',
        'card': 'Oeuf',
        'score': 1,
        'covered': false
    },
    {
        'id': 'oa',
        'score': 2,
        'card': "Oeuf d'autruche"
    },
    {
        'id': 'r',
        'card': 'Renard',
    },
    // {
    //     'id': 'c',
    //     'card': 'Coq'
    // }
]

var i = 0;
let table = [];
let score = 0;
let stop = false;

function game(){
    setTimeout(function(){
        // console.log(cards)
        let drawnCard = cards[Math.floor(Math.random() * cards.length)];
        table.push(JSON.parse(JSON.stringify( drawnCard )));
         
        switch(drawnCard.id){
            case 'o':
                console.log("----------------------------------------")
                console.log(drawnCard.card)
                break;
            case 'oa':
                console.log("----------------------------------------")
                console.log(drawnCard.card)
                break;
            case 'p':
                console.log("----------------------------------------")
                console.log(drawnCard.card)
                if(table.filter(c => c.id === 'o' && c.covered === false).length > 0){
                    let oeufs = _.where(table, { id: 'o' })
                    for(let oeuf of oeufs){
                        if(oeuf.covered == false){
                            oeuf.covered = true;
                            break;
                        }
                    }
                }
                else{
                    console.log("Pas d'oeuf");
                }
                break;
            case 'c': 
                console.log(drawnCard.card)
                i=50;
                console.log("fin de la partie");
                break;
            case 'r':
                console.log("----------------------------------------")
                console.log(drawnCard.card)
                //Get the first covered egg on the table
                let eggToUncover = table.find(coveredEgg);
                if(eggToUncover){
                    //Replace its covered state from 'covered' to 'uncovered'
                    table[table.indexOf(eggToUncover)].covered = false;
                }
                break;
        }
        
        let EggCount = table.filter(c => c.id === 'o' && c.covered === false).length;
        // console.log(EggCount);
        let score = table.filter(c => c.id === 'o' && c.covered === false || c.id === 'oa')
                        .reduce(function(total, egg){
                            return total + egg.score;
                        }, 0);

        finalScore = score
        io.emit('card', drawnCard.id)
        console.log(finalScore)
        
        if(!stop)
            game();
            
    }, 2000)
}

function coveredEgg(card){
    return card.id == 'o' && card.covered == true;
}

function resetGame(){
    finalScore = 0;
    table = [];
    connectedPlayers = [];
    connectedPeoples = [];
    playersVotes = [];
}




server.listen(81)