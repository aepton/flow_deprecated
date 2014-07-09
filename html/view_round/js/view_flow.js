var inNewCard = false;
var inNewTopic = false;
var inRoundMeta = false;
var inTopicDropdown = false;
var inInstructions = false;
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
var typeaheadCards = null;
var typeahead = null;
var cardHashed = {};

var currentRoundId = parseInt(window.location.search.substr(4));

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

function setRoundInfo(rnd) {
  $('#create_affschool').text(rnd['affSchool']);
  $('#create_affteam').text(rnd['affTeam']);
  $('#create_1a').text(rnd['1a']);
  $('#create_2a').text(rnd['2a']);
  $('#create_negschool').text(rnd['negSchool']);
  $('#create_negteam').text(rnd['negTeam']);
  $('#create_1n').text(rnd['1n']);
  $('#create_2n').text(rnd['2n']);
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

function f(data) {
  setRoundInfo(data.round);
  setTopics(data.topics);
  setCards(data.cards);
  $('.card').hide();
  $('.cite').hide();
  jumpTopic(first_topic);
}

function loadRoundData() {
  $.ajax({
    dataType: 'jsonp',
    url: 'http://myflo.ws.s3.amazonaws.com/rounds/' + params['rnd'],
  });
}

function processParams() {
  params = $.url().param();
  if(params['console']){
    consoleIsEnabled = true;
  }
  if(params['on_install']){
    $.fancybox.open([{href: "/html/in_round/on_install.html", type: "iframe"}]);
  }
}

function setTopics(new_topics) {
  var sortable = [];
  for (var t in new_topics) {
    sortable.push([t, new_topics[t]]);
  }
  sortable.sort(function (a, b) {return a[1] - b[1]});
  for (var s = 0; s < sortable.length; s++) {
    var newtopic = $(
      "<li><a href='#' id='topic_" + sortable[s][0] + "' class='menutopic'>" + sortable[s][0] + "</a></li>");
    newtopic.attr("value", sortable[s][0]);
    $("#topic-dropdown").append(newtopic);
    topics[sortable[s][0]] = s + 1;
  }
  first_topic = sortable[0][0];
}

function setCards(new_cards) {
  for (var c = 0; c < new_cards.length; c++) {
    var card_team = 'neg';
    if (new_cards[c]['speech'][1] == 'a') {
      card_team = 'aff';
    }
    var card_data = '<p class="debate_cell card topic' + new_cards[c]['topicId'] + ' ' + card_team + '" id="' + new_cards[c]['cardId'] + '">' + new_cards[c]['text'] + '</p>';
    $('#' + new_cards[c]['speech']).parent().append(card_data);
    if (new_cards[c]['cite'] != '') {
      var cite_data = '<p class="debate_cell topic' + new_cards[c]['topicId'] + ' ' + card_team + ' cite" id="' + new_cards[c]['cardId'] + '_cite">' + new_cards[c]['cite'] + '</p>';
      $('#' + new_cards[c]['speech']).parent().append(cite_data);
    }
  }
}

$(document).ready(function () {
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
                if (inInstructions) {
                    inInstructions = false;
                    $('#instructions').modal('hide');
                    return;
                }
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

            case 69: // e - expand to full text of card
                if (inNewCard || inNewTopic || inRoundMeta) return;
                try {
                  if ($('#card_expand').length) {
                      $('#card_expand').remove();
                  } else {
                      var card_data = cardHashed[$('#' + currentArrowBoxId).data()['cardHash']];
                      var cite_append = '#' + currentArrowBoxId;
                      if ($(cite_append + '_cite').length) {
                          cite_append = cite_append + '_cite';
                      }
                      if (card_data) {
                          $('<div id="card_expand"><p id="card_cite_extras"></p><p id="card_text"></p></div>').insertAfter(cite_append);
                          $('#card_cite_extras').text(card_data.cite_extras.join('<br>'));
                          $('#card_text').html(card_data.text);
                          var left = $('#new_1ac').offset()['left'];
                          var dist = $('#card_expand').offset()['left'] - left;
                          if (dist > 0) {
                              $('#card_expand').css('left', '-' + dist + 'px');
                          }
                      }
                  }
                } catch (err) {
                  ;
                }
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

    $('#round_meta').on('shown.bs.modal', function(e) {
        $('#aff_school').focus();
        if (round_init) {
          setupRaphaelPaper();
        }
        round_init = false;
    });

    $('#round_title').click(function() {
      inRoundMeta = true;
      $('#round_meta').modal({
        keyboard: false,
        backdrop: 'static'
      });
    });
    processParams();
    loadRoundData();

    $('#topic-dropdown-parent').on('shown.bs.dropdown', function(e) {
        inTopicDropdown = true;
    });
    $('#topic-dropdown-parent').on('hidden.bs.dropdown', function(e) {
        inTopicDropdown = false;
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
