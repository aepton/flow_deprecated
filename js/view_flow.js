var inNewCard = false;
var currentSpeech = '1ac';
var currentTeam = 'aff';
var currentCard = 0;
var currentTopicId = 1;
var topics = {};

// Testing/scaffolding values
var currentRoundId = parseInt(window.location.search.substr(4));

// Set up models for backbone
var Card = Backbone.Model.extend({
  sync: function(method, model) {
    $.post('/card?action=' + method, JSON.stringify(model));
  }
});
var Arrow = Backbone.Model.extend();
var Topic = Backbone.Model.extend({
  sync: function(method, model) {
    $.post('/topic?action=' + method, JSON.stringify(model));
  }
});

$(document).ready(function () {
	$('.debate_cell').each(createArrow);
	loadSavedCards();
	loadSavedTopics();
  
  // Handle user selection of different topic
  $("#topic").change(function (){
    var selected = $(this).children(":selected").attr("value");
    if (selected == "new") {
      addTopic();
    } else {
      jumpTopic(selected);
    }
  });
  setSpeech('1ac');
  $('.new_card').hide();
});

function loadSavedCards() {
  $.getJSON('/card?id=' + currentRoundId, function(data) {
    $.each(data, function(key, val) {
      saveCard(val.speech, val.text, val.cite, val.topicId);
    });
    return;
  });
}

function loadSavedTopics() {
  $.getJSON('/topic?id=' + currentRoundId, function(data) {
    $.each(data, function(key, val) {
      addTopic(val);
    });
    hideAllButOneTopic(currentTopicId);
  });
}

function addTopic(loadedTopic) {
  if (loadedTopic == null) {
    var topic = prompt("Enter new topic name", "");
  } else if (loadedTopic) {
    var topic = loadedTopic;
  } else {
    return;
  }
  
  if (topic.length) {
    var newtopic = $("<option>" + topic.toUpperCase() + "</option>");
    newtopic.attr("value", topic);
    $("#topic").append(newtopic);
  }
  
  // Add new topic to global topics dict
  topics[topic] = _.size(topics) + 1;
  jumpTopic(topic);
}

function jumpTopic(topicname) {
  $(".topic" + currentTopicId).hide();
  alert('hiding .topic' + currentTopicId);
  currentTopicId = topics[topicname];
  $(".topic" + currentTopicId).show();
  alert('showing .topic' + currentTopicId);
  $("#topic").val(topicname);
}

function hideAllButOneTopic(topicId) {
  var tname = '';

  $.each(topics, function (key, val) {
    $(".topic" + val).hide();
    if (topicId == val) {
      tname = key;
    }
  });
  currentTopicId = topicId;
  jumpTopic(tname);
}

function createArrow() {
  //alert('e: ' + this.id);
  var endPtOpts = { isSource:true, isTarget:true, connector: "Straight", maxConnections: 10, connectorOverlays: [
    [ "Arrow", { width: 25, length: 15, location: 1.0, id: "arrow" }],
    [ "Label", { } ]]};
  var leftAnchorOpts = { endpoint: [ "Rectangle", { cssClass:"endpoint", width:10, height:60 } ], anchor: 'LeftMiddle'};
  var rightAnchorOpts = { endpoint: [ "Rectangle", { cssClass:"endpoint", width:10, height:60 } ], anchor: 'RightMiddle'};  
  /*if (elemId) {
    jsPlumb.addEndpoint(elemId, leftAnchorOpts, endPtOpts);
  	jsPlumb.addEndpoint(elemId, rightAnchorOpts, endPtOpts);
  } else*/ if (this.id) {
    jsPlumb.addEndpoint(this.id, leftAnchorOpts, endPtOpts);
  	jsPlumb.addEndpoint(this.id, rightAnchorOpts, endPtOpts);
  }
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

function saveCard (speech, loadedText, loadedCite, loadedTopic) {
  setSpeech(speech);
  
  // Extract text and citation, or rely on defaults loaded from JSON
  if (loadedText || loadedCite || loadedTopic) {
    var text = loadedText;
    var cite = loadedCite;
    var cite_loc = loadedCite.length;
  } else {
    var text = $("#new_card_box_" + speech).val();
    var cite_loc = text.indexOf('\\');
    var cite = '';
    if (cite_loc != -1){
      cite = text.substr(cite_loc + 1, text.length);
      text = text.substr(0, cite_loc);
    } 
  }
  
  // Visually update page with new card
  currentCard += 1;
  var topicId = loadedTopic;
  var cardId = "#new_" + speech;
  if (topicId == null) {
    topicId = currentTopicId;
    cardId = "#new_card_box_" + speech;
  }
  $(cardId).parent().append('<p class="debate_cell topic' + topicId + ' ' + currentTeam + '" id="' + currentCard + '">' + text + '</p>');
  if (cite_loc != -1){
    $(cardId).parent().append('<p class="debate_cell topic' + topicId + ' ' + currentTeam + ' cite">' + cite + '</p>');
  }
}

function setSpeech (speech) {
  currentSpeech = speech;
  if (speech.indexOf('n') != -1){
    currentTeam = 'neg';
  } else {
    currentTeam = 'aff';
  }
  $(".speechhed.aff").css({'background-color': 'white'});
  $(".speechhed.neg").css({'background-color': 'black'});
  $(".grid_2").css({'background-color': 'white'});
  $(".grid_2." + speech).css({'background-color': '#eee'});
  $(".speechhed." + speech).css({'background-color': '#eee'});
}