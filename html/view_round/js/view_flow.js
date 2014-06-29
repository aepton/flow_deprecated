var inNewCard = false;
var currentSpeech = '1ac';
var currentTeam = 'aff';
var currentCard = 1;
var currentTopicId = 1;
var currentTopicName = '';
var dbName = 'DebateRounds';
var params;
var topics = {};
var first_topic = '';
var canSaveToDB = false;  // Indicates whether open connection to db is active
var consoleSize = 25;  // Number of lines to display in console, if enabled
var consoleIsEnabled = false;
var consoleText = [];

// Testing/scaffolding values
var currentRoundId = parseInt(window.location.search.substr(4));

// Set up models for backbone
var Card = Backbone.Model.extend({
  sync: function(method, model) {
    addModelInstanceToDb(model, 'cards');
  }
});

var Cards = Backbone.Collection.extend({
  model: Card
});
var All_Cards = new Cards();

var Arrow = Backbone.Model.extend({
  sync: function(method, model) {
    addModelInstanceToDb(model, 'arrows');
  }
});

var Topic = Backbone.Model.extend({
  sync: function(method, model) {
    addModelInstanceToDb(model, 'topics');
  }
});

function addModelInstanceToDb(model, osName) {
  if(!canSaveToDB){
    console_vis('Sorry, cannot sync ' + osName + ' to db yet');
    return;
  }
  var objectStore = $.indexedDB(dbName).objectStore(osName);
  var promise = objectStore.add(model);
  
  // Success callback
  promise.done(function(result, event) {
    console_vis('Success saving ' + osName + ' ' + JSON.stringify(model) + ': ' + result + '; ' + event);
  });
  promise.onsuccess = function(result, event) {
    console_vis('Success saving ' + osName + ' ' + JSON.stringify(model) + ': ' + result + '; ' + event);
  }

  // Failure callback
  promise.fail(function(error, event) {
    console_vis('Failure saving ' + osName + ' ' + JSON.stringify(model) + ': ' + error + '; ' + event);
  });
  promise.onerror = function(error, event) {
    console_vis('Failure saving ' + osName + ' ' + JSON.stringify(model) + ': ' + error + '; ' + event);
  }
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

function jumpTopic(topicname) {
    $(".topic" + currentTopicId).hide();
    currentTopicId = topics[topicname];
    $(".topic" + currentTopicId).show()
    $("#topic").text(topicname);
}

function createArrow(card_id) {
  console_vis('Creating arrow for ' + card_id);
  var endPtOpts = { isSource:true, isTarget:true, connector: "Straight", maxConnections: 10, connectorOverlays: [
    [ "Arrow", { width: 25, length: 15, location: 1.0, id: "arrow" }],
    [ "Label", { } ]]}; 
  var endpointOptions = { 
    isTarget: true, 
    uniqueEndpoint: false,
    endpoint: ["Dot", {cssClass: "endpoint", width: 10, height: 10}], 
    anchor: "Continuous",
  };
  
  /*jsPlumb.makeSource(card_id, {
	  anchor: "Continuous",
	  endpoint: ["Dot", , endPtOpts],
	  maxConnections: 3
  });*/
}

function editCard (card_id, speech) {
  setSpeech(speech);
  inNewCard = true;
  console_vis('Editing box ' + card_id);
  
  if ($("#" + card_id).html().length) {
    var existing_contents = $("#" + card_id).html();
    if ($("#" + card_id + "_cite").html().length) {
      existing_contents += "\\" + $("#" + card_id + "_cite").html();
    }
    console_vis('Existing contents: ' + existing_contents);
    $("#" + card_id).replaceWith('<textarea id="' + card_id + '">' + existing_contents + '</textarea>');
    $("#" + card_id).focus();
    $("#" + card_id).focusout(function () { saveCard(speech); });
  } else {
    console_vis('hm, card text...');
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

$(document).ready(function () {
  processParams();
	jsPlumb.importDefaults({
  	Anchor: "Continuous",
  	ConnectionsDetachable: true,
  	Connector: "Straight",
  	ConnectorZIndex: 1,
  	LogEnabled: true,
  	MaxConnections: 10	
	});

  loadRoundData();

  // Handle user selection of different topic
  $("#topic").change(function (){
    var selected = $(this).children(":selected").attr("value");
    jumpTopic(selected);
  });
});

