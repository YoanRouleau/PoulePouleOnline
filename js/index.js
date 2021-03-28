$(document).ready(function(){

    const socket = io();
    let userId;

    socket.on('connect', function(){
        userId = socket.id;
    });

    socket.on('userdisconnected', function(userId){
        if($('#' + userId).length) 
            $('#' + userId).remove()
    })

    
    /* ========================================================================= *\
    **  === HOME                                                                 *| 
    \* ========================================================================= */


    $('.goToLoby').on('click', function(){
        if(!$('#pseudo').val()){
            $('.home .warning').hasClass('shown') ? '' : $('.home .warning').addClass('shown')
        }
        else{
            $('.home').toggleClass('is-active');
            $('.lobby').toggleClass('is-active');
            socket.emit("enter", {
                id: userId,
                pseudo: $('#pseudo').val(),
                status: 0
            })
        }     
    })

    // $('.goToRules').on('click', function(){
    //     $('.home').toggleClass('is-active');
    //     $('.wrapper, body').toggleClass('rules-layout')
    //     $('.rules').toggleClass('is-active')
    // })


    /* ========================================================================= *\
    **  === LOBBY                                                                *| 
    \* ========================================================================= */
   
    $('.setReady').on('click', function(){
        console.log(userId)
        socket.emit("setReady", { id: socket.id });
    })
   
    socket.on("entered", function(users){
        console.log("Connecté")
        console.log(users)
        users.forEach(user => {
            if(!$('#' + user.id).length){
                $('.lobby--table').append(`
                    <tr id="${ user.id }">
                        <td>${ user.pseudo }</td>
                        <td>
                            <span class="status not-ready ${ user.status == 0 ? 'is-active':'' }">Pas prêt</span>
                            <span class="status ready ${ user.status == 1 ? 'is-active':'' }">Prêt</span>
                        </td>
                    </tr>
                `)
            }
        });
    })

    socket.on('playerReady', function(userId){
        $('#'+ userId + ' .status.not-ready').toggleClass('is-active')
        $('#'+ userId + ' .status.ready').toggleClass('is-active')
    })


    /* ========================================================================= *\
    **  === GAME                                                                 *| 
    \* ========================================================================= */

    socket.on('gamelaunch', function(){
        $('.lobby').toggleClass('is-active');
        $('.countdown').toggleClass('is-active');
        $('.game').toggleClass('d-none')
        setTimeout(function(){
            $('.3').toggleClass('is-active')
            $('.2').toggleClass('is-active') 
            setTimeout(function(){
                $('.2').toggleClass('is-active')
                $('.1').toggleClass('is-active')
                setTimeout(function(){
                    $('.countdown').toggleClass('is-active')
                    $('.game').toggleClass('is-active')
                },1000)
            },1200)
        },1500)
    })

    socket.on('card', function(card){ 
        $('.game--river').append(`
            <div class="game--card ${ card }"></div>
        `);
        setTimeout(function(){
            $('.game--river').find('.game--card').addClass('is-active')
            setTimeout(function(){
                $('.game--river').find('.game--card').eq(0).remove()
            },1000)
        }, 200)
    })

    $('.stopGame').on('click', function(){
        socket.emit("gamestop", { id: userId });
    })


    /* ========================================================================= *\
    **  === VOTE PHASE                                                           *| 
    \* ========================================================================= */

    socket.on('votephase', function(playerWhoStopped){
        $('.game').toggleClass('is-active');
        $('.debate').toggleClass('is-active');
        $('.debate--other-players .player-name').html(playerWhoStopped.pseudo)
        console.log(playerWhoStopped)
        if(playerWhoStopped.id == userId)
            $('.debate--interupt-player').toggleClass('is-active');
        else
            $('.debate--other-players').toggleClass('is-active');
    })

    $('.right').on('click', function(){
        socket.emit('voteValue', {
            id: userId,
            voteValue: true,
            guesser: false
        })
        $('.debate .buttons-container').hide()
        $('.debate--votes').toggleClass('is-active')
        $('debate--other-players').append(`<p class="notice">Vous pensez qu'il a raison.</p>`)
    });
    
    $('.wrong').on('click', function(){
        socket.emit('voteValue', {
            id: userId,
            voteValue: false,
            guesser: false
        })
        $('.debate .buttons-container').hide()
        $('.debate--votes').toggleClass('is-active')
        $('debate--other-players').append(`<p class="notice">Vous pensez qu'il a tort.</p>`)
    });

    socket.on('voteRemains', function(data){
        $('.debate--votes .current').html(data.current);
        $('.debate--votes .total').html(data.total);
    })


    /* ========================================================================= *\
    **  === RESULTS                                                              *| 
    \* ========================================================================= */

    socket.on('result', function(result){
        $('.debate').toggleClass('is-active');
        $('.results').toggleClass('is-active');
        $('.egg-count').html(result.finalScore);
        if(result.result){
            $('.results--win').toggleClass('is-active')
            $('.wrapper').toggleClass('win')
        }
        else{
            $('.results--loose').toggleClass('is-active')
            $('.wrapper').toggleClass('loose')
        }
    })


    $('.backToHome').on('click', function(){
        $('.game').toggleClass('d-none')
        $('.results').toggleClass('is-active');
        $('.home').toggleClass('is-active');
        $('.wrapper').hasClass('loose') ? $('.wrapper').toggleClass('loose') : ''
        $('.wrapper').hasClass('win') ? $('.wrapper').toggleClass('win') : ''
        document.location.reload();
    })

})
