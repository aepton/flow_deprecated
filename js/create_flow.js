var inNewCard = false;
var currentSpeech = '1ac';
var currentTeam = 'aff';
var currentCard = 1;
var currentTopicId = 1;
var currentTopicName = '';
var topics = {};
var current_flow_path = '';

// Set up models for backbone
var Card = Backbone.Model.extend({
    text: '',
    cite: '',
    speech: '',
    cardNum: -1,
    topicId: -1,
    roundId: -1,
    cardId: -1
});
var Cards = Backbone.Collection.extend();
var Topic = Backbone.Model.extend();
var All_Cards = new Cards();

function addTopic() {
    var topic = currentTopicName;

    if (topic.length) {
        var newtopic = $("<option>" + topic.toUpperCase() + "</option>");
        newtopic.attr("value", topic);
        $("#topic").append(newtopic);
    }

    // Add new topic to global topics dict
    topics[topic] = _.size(topics) + 1;
    jumpTopic(topic);

    // Create the new topic object and send it to the backend
    topicObj = new Topic({
        topicName: topic,
        topicId: topics[topic],
        roundId: currentRoundId
    });
    topicObj.save();
}

function jumpTopic(topicname) {
    $(".topic" + currentTopicId).hide();
    currentTopicId = topics[topicname];
    $(".topic" + currentTopicId).show()
    $("#topic").val(topicname);
}

function newCard (speech) {
    setSpeech(speech);
    inNewCard = true;
    var boxId = "new_card_box_" + speech;

    if (!$("#" + boxId).length) {
        $("#new_" + speech).replaceWith('<textarea id="' + boxId + '"></textarea>');
        $("#" + boxId).focus();
        $("#" + boxId).focusout(function () { saveCard(speech); });
    }
}

function editCard (card_id, speech) {
    setSpeech(speech);
    inNewCard = true;

    if ($("#" + card_id).html().length) {
        var existing_contents = $("#" + card_id).html();
        if ($("#" + card_id + "_cite").length) {
            existing_contents += "\\" + $("#" + card_id + "_cite").html();
        }
        $("#" + card_id).replaceWith('<textarea id="' + card_id + '">' + existing_contents + '</textarea>');
        $("#" + card_id).focus();
    }
}

function saveCard (speech) {
    setSpeech(speech);

    // Extract text and citation
    var text = $("#new_card_box_" + speech).val();
    if (!text.length) {
        console.log('No text length');
        setUpNewCardBox(speech);
        return;
    }
    var cite_loc = text.indexOf('\\');
    var cite = '';
    if (cite_loc != -1) {
        cite = text.substr(cite_loc + 1, text.length);
        text = text.substr(0, cite_loc);
    }

    // Visually update page with new card
    currentCard += 1;
    var topicId = currentTopicId;
    var cardId = "#new_card_box_" + speech;

    $(cardId).parent().append('<p class="debate_cell card topic' + topicId + ' ' + currentTeam + '" id="' + currentCard + '">' + text + '</p><span class="cardNum">' + (currentCard - 1) + '</span>');
    if (cite_loc != -1){
        $(cardId).parent().append('<p class="debate_cell topic' + topicId + ' ' + currentTeam + ' cite" id="' + currentCard + '_cite">' + cite + '</p>');
        $("#" + currentCard + "_cite").click(function(event) {
            editCard(currentCard, speech);
        });
    }
    $("#" + currentCard).click(function(event) {
        editCard(currentCard, speech);
    });

    // Create the new card object and send it to the backend
    card = new Card({
        text: text,
        cite: cite,
        speech: speech,
        cardNum: currentCard - 1,
        topicId: currentTopicId,
        roundId: currentRoundId,
        cardId: currentCard
    });
    card.save();
    All_Cards.add([card]);

    setUpNewCardBox(speech);
}

function setUpNewCardBox(speech) {
    var newHtml = '<p class="' + currentTeam + ' new_card" id="new_' + currentSpeech + '" onclick="">new card</p>';
    $("#new_card_box_" + speech).parent().append(newHtml);
    $("#new_card_box_" + speech).remove();
    inNewCard = false;
}

function setSpeech(speech) {
    currentSpeech = speech;
    if (speech.indexOf('n') != -1){
        currentTeam = 'neg';
    } else {
        currentTeam = 'aff';
    }
    $(".speechhed.aff").css({'background-color': 'white'});
    $(".speechhed.neg").css({'background-color': 'black'});
    $(".grid_2").css({'background-color': 'white'});
    $(".grid_2." + speech).css({'background-color': '#5cb85c'});
    $(".speechhed." + speech).css({'background-color': '#5cb85c'});
}

function getRoundInfo() {
    var round_info = {
        'affSchool': $('#create_affschool').text(),
        'affTeam': $('#create_affteam').text(),
        '1a': $('#create_1a').text(),
        '2a': $('#create_2a').text(),
        'negSchool': $('#create_negschool').text(),
        'negTeam': $('#create_negteam').text(),
        '1n': $('#create_1n').text(),
        '2n': $('#create_2n').text(),
    }
    return round_info;
}

function generateRandomPath() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for(var i=0; i < 20; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

function syncToS3() {
    var to_sync = {
        'topics': topics,
        'cards': All_Cards,
        'round': getRoundInfo()
    }
    var xhr = new XMLHttpRequest();
    xhr.open('PUT', 'http://myflo.ws.s3.amazonaws.com/rounds/' + currentRoundId, true);
    xhr.setRequestHeader('Content-Type', 'application/jsonp;charset=UTF-8');
    xhr.setRequestHeader('x-amz-grant-read', 'uri=http://acs.amazonaws.com/groups/global/AllUsers');
    xhr.send('f(' + JSON.stringify(to_sync) + ');');
    $('#rnd-link').html('<a target="_blank" href="http://myflo.ws/view?rnd=' + currentRoundId + '">http://myflo.ws/view?rnd=' + currentRoundId + '</a>');
    $('#saved_round').modal();
}

$(document).ready(function () {
    currentRoundId = generateRandomPath();

    // Bind enter key to saving current card
    $(window).bind('keypress', function(e){
        if (e.keyCode == 13) {
            e.preventDefault();
            if (inNewCard){
                saveCard(currentSpeech);
            } else {
                newCard(currentSpeech);
            }
        }
    });

    // Launch new topic modal immediately
    $('#new_topic').modal({
        keyboard: false,
        backdrop: 'static'
    });

    $('#new_topic_close_button').hide();
    setTimeout(function() {$('#new_topic_name').focus()},1000);
    $('#new_topic').keydown(function (e) {
        if (e.keyCode == 13) {
            if ($('#new_topic_name').val() != '') {
                e.preventDefault();
                currentTopicName = $('#new_topic_name').val();
                $('#new_topic').modal('hide');
                $('#new_topic_name').val('');
                addTopic();
            } else {
                e.preventDefault();
            }
        }
    });

    $('#new_topic_button').click(function() {
        $('#new_topic').modal({
            keyboard: true,
            backdrop: true
        });
        $('#new_topic_close_button').show();
        setTimeout(function() {$('#new_topic_name').focus()},150);
    });

    $('#sync_button').click(function() {
        $('#sync_button').toggleClass('btn-primary btn-success');
        syncToS3();
    });

    // Handle user selection of different topic
    $("#topic").change(function (){
        var selected = $(this).children(":selected").attr("value");
        jumpTopic(selected);
    });

    // Handle user selection of different speech
    setSpeech('1ac');
    $(".speechhed").click(function(event) {
        var card_id = event.target.id;
        if(card_id.indexOf("new_") != -1){
            newCard(card_id.substr(4));
        }
        setSpeech(card_id);
    });
});
