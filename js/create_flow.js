var inNewCard = false;
var inNewTopic = false;
var inRoundMeta = false;
var inTopicDropdown = false;
var currentSpeech = '1ac';
var currentTeam = 'aff';
var currentCard = 1;
var currentTopicId = 1;
var currentTopicName = '';
var topics = {};
var current_flow_path = '';
var currentArrowBoxId = 0;
var arrowBaseId = '';
var arrowBaseSpeech = '';
var paper = '';
var left_paper = 0;
var top_paper = 0;
var paper_width = 0;
var paper_height = 0;
var arrow_colors = ['#428bca', '#f0ad4e', '#5bc0de', '#d9534f'];
var all_arrows = [];
var arrow_highlights = [];
var targeted_boxes = [];
var round_init = false;
var launch_new_topic = true;
var lastArrowBaseId = '';
var lastArrowBaseSpeech = '';

var speechOrder = {
  '1ac': {'next': '1nc', 'prev': ''},
  '1nc': {'next': '2ac', 'prev': '1ac'},
  '2ac': {'next': '2nc', 'prev': '1nc'},
  '2nc': {'next': '1nr', 'prev': '2ac'},
  '1nr': {'next': '1ar', 'prev': '2nc'},
  '1ar': {'next': '2nr', 'prev': '1nr'},
  '2nr': {'next': '2ar', 'prev': '1ar'},
  '2ar': {'next': '', 'prev': '2nr'},
}

// Set up models for backbone
var Card = Backbone.Model.extend({
    sync: function() {
        ;
    }
});
var Cards = Backbone.Collection.extend();
var Topic = Backbone.Model.extend({
    sync: function() {
        ;
    }
});
var All_Cards = new Cards();

function addTopic() {
    var topic = currentTopicName;

    if (topic.length) {
        var newtopic = $(
          "<li><a href='#' id='topic_" + topic + "' class='menutopic'>" + topic + "</a></li>");
        newtopic.attr("value", topic);
        $("#topic-dropdown").append(newtopic);
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
    $("#topic").text(topicname);
    for (var i=0; i < all_arrows.length; i++) {
      if (all_arrows[i]['topic'] == currentTopicId) {
        all_arrows[i]['arrow'].show();
      } else {
        all_arrows[i]['arrow'].hide();
      }
    }
}

function newCard (speech) {
    setSpeech(speech);
    inNewCard = true;
    var boxId = "new_card_box_" + speech;

    if (!$("#" + boxId).length) {
        $("#new_" + speech).replaceWith('<textarea id="' + boxId + '" placeholder="Enter card text. Separate cite with \\"></textarea>');
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
    try {
        if (!text.length) {
            setUpNewCardBox(speech);
            return;
        }
    } catch(err) {
       ;
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
    var newHtml = '<p class="' + currentTeam + ' new_card current_arrow_box arrow_box_newcard" id="new_' + currentSpeech + '" onclick="">new card</p>';
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
    /*$(".grid_2").css({'background-color': 'white'});
    $(".grid_2." + speech).css({'background-color': '#5cb85c'});*/
    $(".speechhed").each(function() {
      $(this).removeClass('active-speech');
    });
    $(".speechhed." + speech).addClass('active-speech');
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
        'tournament': $('#meta_tournament').text(),
        'round': $('#meta_round').text(),
        'judge': $('#meta_judge').text()
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
        'round': getRoundInfo(),
        'arrows': exportArrows()
    };
    var xhr = new XMLHttpRequest();
    xhr.open('PUT', 'http://myflo.ws.s3.amazonaws.com/rounds/' + currentRoundId, true);
    xhr.setRequestHeader('Content-Type', 'application/jsonp;charset=UTF-8');
    xhr.setRequestHeader('x-amz-grant-read', 'uri=http://acs.amazonaws.com/groups/global/AllUsers');
    xhr.send('f(' + JSON.stringify(to_sync) + ');');
    $('#rnd-link').html('<a target="_blank" href="http://myflo.ws/view.html?rnd=' + currentRoundId + '">http://myflo.ws/view?rnd=' + currentRoundId + '</a>');
    $('#saved_round').modal();
}

function showModal(title, body) {
    $('#modal-template_label').text(title);
    $('#modal-contents').html(body);
    $('#modal-template').modal();
}

function template(message, data) {
    if (typeof data === 'undefined') {
      return _.partial(template, message);
    } else {
      return message.replace(/\{\{([^}]+)}}/g, function(s, match) {
        var result = data;
        _.each(match.trim().split('.'), function(propertyName) {
          result = result[propertyName]
        });
        return _.escape(result);
      });
    }
}

function syncToLocal() {
    var to_sync = {
        'topics': topics,
        'cards': All_Cards,
        'round': getRoundInfo(),
        'arrows': exportArrows()
    };
    chrome.storage.sync.get('round_ids', function(result) {
        var round_ids = result.round_ids;
        if (!round_ids) {
            round_ids = {};
        }
        round_ids[currentRoundId] = {
            'round': to_sync['round'],
            'timestamp': moment()
        }
        showModal('Rounds saved to this account',
            // Template function shouldn't remain in use, too limited/hacky
            template(
                $('#local-rounds-template').html(),
                {
                    'rounds': round_ids['hxBoXy1MRSXdhpiLP8v6']['round']['affSchool']
                }
            )
        );
        chrome.storage.sync.set({'round_ids': round_ids}, function() {});
        chrome.storage.sync.set({currentRoundId: to_sync}, function() {});
    });
}

function arrowBoxMove(dir) {
    if (dir == 'up' || dir == 'down') {
        var cards = $('.' + currentSpeech + ' > .topic' + currentTopicId);
        // If there aren't any cards, can't move up or down
        if (!cards.length) {
            return;
        }
        if (currentArrowBoxId == 'new_' + currentSpeech) {
            if (dir == 'up') {
                // Starting from the bottom of the card list
                arrowBoxMoveChangeHighlight(cards[cards.length - 1].id);
                return;
            }
        }
        // Loop through and find the index of the current card
        for (var i = 0; i < cards.length; i+= 1) {
            if (cards[i].id == currentArrowBoxId) {
                if (dir == 'up') {
                    // If we're not at the top, go up one
                    if (i > 0) {
                        arrowBoxMoveChangeHighlight(cards[i - 1].id);
                        return;
                    }
                } else {
                    // If we're not at the bottom, go down one
                    if (i < (cards.length - 1)) {
                        arrowBoxMoveChangeHighlight(cards[i + 1].id);
                        return;
                    } else if (i == (cards.length - 1)) {
                        // We're at the bottom, so go to new card box
                        arrowBoxMoveChangeHighlight('new_' + currentSpeech);
                        return;
                    }
                }
            }
        }
    } else if (dir == 'left' || dir == 'right') {
        var cards = [];
        if (dir == 'right' && speechOrder[currentSpeech]['next'] != '') {
            cards = $('.' + speechOrder[currentSpeech]['next'] + '> .topic' + currentTopicId);
        } else if (dir == 'left' && speechOrder[currentSpeech]['prev'] != '') {
            cards = $('.' + speechOrder[currentSpeech]['prev'] + '> .topic' + currentTopicId);
        } else {
            // Can't go any farther, no more speeches in that direction
            return;
        }
        if (!cards.length) {
            // No cards in speech so highlight the create-card box
            if (dir == 'right') {
                arrowBoxMoveChangeHighlight('new_' + speechOrder[currentSpeech]['next']);
                setSpeech(speechOrder[currentSpeech]['next']);
            } else {
                arrowBoxMoveChangeHighlight('new_' + speechOrder[currentSpeech]['prev']);
                setSpeech(speechOrder[currentSpeech]['prev']);
            }
            return;
        }
        // We know what the speech to highlight is, so set it; while we're at
        // it, add new-card box to the card list since it's a valid candidate
        if (dir == 'right') {
            setSpeech(speechOrder[currentSpeech]['next']);
            cards.push($('#new_' + currentSpeech)[0]);
        } else {
            setSpeech(speechOrder[currentSpeech]['prev']);
            cards.push($('#new_' + currentSpeech)[0]);
        }
        // Now look for the card whose top is closest to the current one
        var currTop = $('#' + currentArrowBoxId).offset().top;
        var preTop = postTop = -1;
        for (var i = 0; i < cards.length; i+= 1) {
            if ($('#' + cards[i].id).offset().top < currTop) {
                preTop = i;
            } else if ($('#' + cards[i].id).offset().top == currTop) {
                // The cards are in the exact same position, so just pick this
                arrowBoxMoveChangeHighlight(cards[i].id);
                return;
            } else {
                postTop = i;
                // We must have one before and one after now, so we're done
                break;
            }
        }
        // If we never found one below the current card, pick the lowest card
        // from the next speech
        if (postTop == -1) {
            arrowBoxMoveChangeHighlight(cards[preTop].id);
            return;
        } else {
            // Pick the card with smallest distance between current card top
            // and it's top; if a tie, go with the lower one (arbitrary)
            var preDist = currTop - $('#' + cards[preTop].id).offset().top;
            var postDist = $('#' + cards[postTop].id).offset().top - currTop;
            if (preDist < postDist) {
                arrowBoxMoveChangeHighlight(cards[preTop].id);
            } else {
                arrowBoxMoveChangeHighlight(cards[postTop].id);
            }
        }
    }
}

function arrowBoxMoveChangeHighlight(new_id) {
    var arrow_box_color = 'arrow_box_newcard';
    if (currentArrowBoxId.indexOf('new_') == -1) {
      arrow_box_color = 'arrow_box_' + currentArrowBoxId % arrow_colors.length;
    }
    $('#' + currentArrowBoxId).removeClass('current_arrow_box');
    $('#' + currentArrowBoxId).removeClass(arrow_box_color);
    currentArrowBoxId = new_id;
    arrow_box_color = 'arrow_box_newcard';
    if (new_id.indexOf('new_') == -1) {
      arrow_box_color = 'arrow_box_' + new_id % arrow_colors.length;
    }
    $('#' + currentArrowBoxId).addClass('current_arrow_box');
    $('#' + currentArrowBoxId).addClass(arrow_box_color);
    highlightArrows(new_id);
}

function exportArrows() {
  var toExport = [];
  for (var i=0; i < all_arrows.length; i++) {
    toExport.push({
      'from': all_arrows[i]['from'],
      'to': all_arrows[i]['to'],
      'topic': all_arrows[i]['topic']
    });
  }
  return toExport;
}

function highlightArrows(new_id) {
  // Clear out all targeted boxes
  while (targeted_boxes.length) {
    var target = targeted_boxes.pop();
    $('#' + target['id']).removeClass(target['class']);
  }
  // Go through all arrows; if one is connected to new_id, make it bolder, otherwise fade it out
  var found_arrows = false;
  for (var i=0; i < all_arrows.length; i++) {
    if (all_arrows[i]['from'] == new_id || all_arrows[i]['to'] == new_id) {
      found_arrows = true;
      all_arrows[i]['arrow'].attr({'stroke-opacity': 0.9});
      if (all_arrows[i]['from'] == new_id) {
        var target_box = 'arrow_target_' + all_arrows[i]['from'] % arrow_colors.length;
        $('#' + all_arrows[i]['to']).addClass(target_box);
        targeted_boxes.push({'id': all_arrows[i]['to'], 'class': target_box});
      } else {
        var target_box = 'arrow_target_' + all_arrows[i]['from'] % arrow_colors.length;
        $('#' + all_arrows[i]['from']).addClass(target_box);
        targeted_boxes.push({'id': all_arrows[i]['from'], 'class': target_box});
      }
    } else {
      all_arrows[i]['arrow'].attr({'stroke-opacity': 0.2});
      arrow_highlights.push(all_arrows[i]['arrow']);
    }
  }
  // If we don't have any connected arrows, return everything to its normal opacity
  if (!found_arrows) {
    while (arrow_highlights.length) {
      var arrow = arrow_highlights.pop();
      arrow.attr({'stroke-opacity': 0.5});
    }
  }
}

function saveRoundMetaData() {
    $('#round_meta').modal('hide');
    inRoundMeta = false;
    if ($('#tournament_name').val()) $('#meta_tournament').text($('#tournament_name').val());
    if ($('#round_number').val()) $('#meta_round').text($('#round_number').val());
    if ($('#judge_name').val()) $('#meta_judge').text($('#judge_name').val());
    if ($('#aff_school').val()) $('#create_affschool').text($('#aff_school').val());
    if ($('#aff_team').val()) $('#create_affteam').text($('#aff_team').val());
    if ($('#aff_speaker_1').val()) $('#create_1a').text($('#aff_speaker_1').val());
    if ($('#aff_speaker_2').val()) $('#create_2a').text($('#aff_speaker_2').val());
    if ($('#neg_school').val()) $('#create_negschool').text($('#neg_school').val());
    if ($('#neg_team').val()) $('#create_negteam').text($('#neg_team').val());
    if ($('#neg_speaker_1').val()) $('#create_1n').text($('#neg_speaker_1').val());
    if ($('#neg_speaker_2').val()) $('#create_2n').text($('#neg_speaker_2').val());

    if (launch_new_topic) {
      // Launch new topic modal
      $('#new_topic').modal({
          keyboard: false,
          backdrop: 'static'
      });
      $('#new_topic_close_button').hide();
      $('#new_topic').on('shown.bs.modal', function(e) {
          launch_new_topic = false;
      });
    }
}

function setupRaphaelPaper() {
    left_paper = $('#new_1ac').offset()['left'];
    top_paper = $('#new_1ac').offset()['top'];
    paper_width = $('#new_2ar').offset()['left'] - left_paper + $('#new_2ar').outerWidth();
    paper_height = $(window).height() - $('#new_1ac').offset()['top'];
    paper = Raphael(left_paper, top_paper, paper_width, paper_height);
}

function drawArrow(from_id, to_id) {
    if ($('#' + to_id).offset()['left'] < $('#' + from_id).offset()['left']) {
      var temp = to_id;
      to_id = from_id;
      from_id = temp;
    }
    var origin_left = $('#' + from_id).offset()['left'] + ($('#' + from_id).outerWidth() * .95) - left_paper;
    var origin_top = $('#' + from_id).offset()['top'] + ($('#' + from_id).height() / 2) - top_paper;
    var delta_height = $('#' + to_id).offset()['top'] + ($('#' + to_id).height() / 2) - top_paper - origin_top;
    var delta_width = $('#' + to_id).offset()['left'] + ($('#' + to_id).outerWidth() * .05) - origin_left - left_paper;
    // Go some %age of width, then come back another %age, then go back remaining %age
    var x1 = 0.525 * delta_width;
    var x2 = -0.05 * delta_width;
    var x3 = 0.525 * delta_width;
    // Go up some %age of height 3 times
    var y1 = 0.25 * delta_height;
    var y2 = 0.25 * delta_height;
    var y3 = 0.5 * delta_height;
    //var arrow = paper.path('M' + origin_left + ',' + origin_top + 't' + x1 + ',' + y1 + ',' + x2 +
    //                       ',' + y2 + ',' + x3 + ',' + y3);
    var arrow = paper.path('M' + origin_left + ',' + origin_top + 'l' +
                           delta_width + ',' + delta_height);
    if (from_id.indexOf('new_') != -1) {
      from_id = currentCard + 1;
    } else if (to_id.indexOf('new_') != -1) {
      to_id = currentCard + 1;
    }
    all_arrows.push({'from': from_id, 'to': to_id, 'arrow': arrow, 'topic': currentTopicId});
    arrow.attr({'fill': 'none', 'stroke': arrow_colors[from_id % arrow_colors.length], 'stroke-width': 2, 'stroke-opacity': 0.5});
}

function launchNewTopic() {
    $('#new_topic').modal({keyboard: true, backdrop: true});
    $('#new_topic_close_button').show();
}

$(document).ready(function () {
    currentRoundId = generateRandomPath();
    currentArrowBoxId = 'new_1ac';

    // Bind enter key to saving current card
    $(document).keydown(function(e) {
        if (inRoundMeta) {
            if (e.which != 13) return;
            saveRoundMetaData();
            return;
        }
        switch(e.which) {
            case 13: // enter
                if (inNewCard){
                    saveCard(currentSpeech);
                } else if (inNewTopic) {
                    if ($('#new_topic_name').val() != '') {
                        currentTopicName = $('#new_topic_name').val();
                        $('#new_topic').modal('hide');
                        $('#new_topic_name').val('');
                        addTopic();
                    }
                } else if (inTopicDropdown) {
                    jumpTopic($(':focus')[0].id.replace(/^topic_/, ''));
                    $('#topic').dropdown('toggle');
                } else {
                    arrowBoxMoveChangeHighlight('new_' + currentSpeech);
                    newCard(currentSpeech);
                }
                break;
            case 32: // space
                if (inNewCard || inNewTopic) return;
                if (arrowBaseId == '') {
                    $('#' + currentArrowBoxId).addClass('arrow_base');
                    arrowBaseId = currentArrowBoxId;
                    arrowBaseSpeech = currentSpeech;
                    if (lastArrowBaseId == '') {
                        lastArrowBaseId = currentArrowBoxId;
                    } else {
                        setSpeech(lastArrowBaseSpeech);
                    }
                    console.log('moving to ', lastArrowBaseId, 'from', currentArrowBoxId);
                    arrowBoxMoveChangeHighlight(lastArrowBaseId);
                } else if (arrowBaseId == currentArrowBoxId) {
                    $('#' + currentArrowBoxId).removeClass('arrow_base');
                    arrowBaseId = '';
                    arrowBaseSpeech = '';
                } else {
                    lastArrowBaseId = currentArrowBoxId;
                    lastArrowBaseSpeech = currentSpeech;
                    drawArrow(arrowBaseId, currentArrowBoxId);
                    $('#' + currentArrowBoxId).removeClass('arrow_base');
                    $('#' + arrowBaseId).removeClass('arrow_base');
                    arrowBoxMoveChangeHighlight(arrowBaseId);
                    setSpeech(arrowBaseSpeech);
                    arrowBaseSpeech = '';
                    arrowBaseId = '';
                }
                break;
            case 37: // left
                if (inNewCard || inNewTopic || inTopicDropdown) return;
                arrowBoxMove('left');
                break;

            case 38: // up
                if (inNewCard || inNewTopic || inTopicDropdown) return;
                arrowBoxMove('up');
                break;

            case 39: // right
                if (inNewCard || inNewTopic || inTopicDropdown) return;
                arrowBoxMove('right');
                break;

            case 40: // down
                if (inNewCard || inNewTopic || inTopicDropdown) return;
                arrowBoxMove('down');
                break;

            case 78: // n - create new topic
                if (inNewCard || inNewTopic || inRoundMeta) return;
                launchNewTopic();
                break; 

            case 83: // s - toggle topic-selection menu
                if (inNewCard || inNewTopic || inRoundMeta) return;
                $('#topic').dropdown('toggle');
                $('.menutopic:first').focus();
                break;

            // Exit for other keydown events to be captured
            default: return;
        }
        e.preventDefault();
        $('#' + currentArrowBoxId).scrollintoview();
        try {
            if ($('#' + currentArrowBoxId).offset().top < (
                $('#' + currentSpeech).offset().top + $('#' + currentSpeech).height())) {
                // 6 is just for a bit of extra padding
                $(window).scrollTop($('#' + currentArrowBoxId).offset().top - $('#top').height() - 6);
            }
        } catch(err) {
            ;
        }
    });

    // Launch round meta modal immediately
    $('#round_meta').modal({
        keyboard: false,
        backdrop: 'static'
    });
    inRoundMeta = true;
    round_init = true;
    $('#round_meta').on('shown.bs.modal', function(e) {
        $('#aff_school').focus();
        if (round_init) {
          setupRaphaelPaper();
        }
        round_init = false;
    });
    $('#round_meta_submit').click(saveRoundMetaData);

    $('#round_title').click(function() {
      inRoundMeta = true;
      $('#round_meta').modal({
        keyboard: false,
        backdrop: 'static'
      });
    });

    $('#new_topic_button').click(launchNewTopic);
    $('#new_topic').on('shown.bs.modal', function(e) {
        inNewTopic = true;
        $('#new_topic_name').focus();
    });
    $('#new_topic').on('hidden.bs.modal', function(e) {
        inNewTopic = false;
    });
    $('#topic-dropdown-parent').on('shown.bs.dropdown', function(e) {
        inTopicDropdown = true;
    });
    $('#topic-dropdown-parent').on('hidden.bs.dropdown', function(e) {
        inTopicDropdown = false;
    });
    
    $('#sync_button').click(function() {
        $('#sync_button').toggleClass('btn-primary btn-success');
        syncToS3();
        //syncToLocal();
    });

    // Handle user selection of different topic
    $(document).on('click', '.dropdown-menu li a', function () {
      var selected = $(this).text();
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
