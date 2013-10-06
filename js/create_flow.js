var inNewCard = false;
var currentSpeech = '1ac';
var currentTeam = 'aff';
var currentCard = 1;
var currentTopicId = 1;
var currentTopicName = '';
var dbName = 'DebateRounds';
var topics = {};
var canSaveToDB = false;  // Indicates whether open connection to db is active
var consoleSize = 25;  // Number of lines to display in console, if enabled
var consoleIsEnabled = false;
var consoleText = [];
var storage = chrome.storage.local;

// Testing/scaffolding values
var currentRoundId = parseInt(window.location.search.substr(4));

// Set up models for backbone
var Card = Backbone.Model.extend({
  sync: function(method, model) {
    addModelInstanceToDb(model, 'cards');
  }
});

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
    console('Sorry, cannot sync ' + osName + ' to db yet');
    return;
  }
  var objectStore = $.indexedDB(dbName).objectStore(osName);
  var promise = objectStore.add(model);
  
  // Success callback
  promise.done(function(result, event) {
    console('Success saving ' + osName + ' ' + JSON.stringify(model) + ': ' + result + '; ' + event);
  });
  promise.onsuccess = function(result, event) {
    console('Success saving ' + osName + ' ' + JSON.stringify(model) + ': ' + result + '; ' + event);
  }

  // Failure callback
  promise.fail(function(error, event) {
    console('Failure saving ' + osName + ' ' + JSON.stringify(model) + ': ' + error + '; ' + event);
  });
  promise.onerror = function(error, event) {
    console('Failure saving ' + osName + ' ' + JSON.stringify(model) + ': ' + error + '; ' + event);
  }

}

$(document).ready(function () {
  processParams();
  openDB();
  console(currentRoundId);
	$(".fancybox").fancybox();
	jsPlumb.importDefaults({
  	Anchor: "Continuous",
  	ConnectionsDetachable: true,
  	Connector: "Straight",
  	ConnectorZIndex: 1,
  	LogEnabled: true,
  	MaxConnections: 10	
	});
	//$.fancybox.open([{href: "/html/in_round/newround.html", type: "iframe"}]);
	//$('.card').each(createArrow);
	$( window ).bind('keypress', function(e){
    if ( e.keyCode == 13 ) {
      e.preventDefault();
      if (inNewCard){
        saveCard(currentSpeech);
      } else {
        newCard(currentSpeech);  
      }
    }
  });

  $.fancybox.open([{href: "/html/in_round/newtopic.html", type: "iframe"}]);
  
  // Handle user selection of different topic
  $("#topic").change(function (){
    var selected = $(this).children(":selected").attr("value");
    if (selected == "new") {
      $.fancybox.open([{href: "/html/in_round/newtopic.html", type: "iframe"}]);
    } else {
      jumpTopic(selected);
    }
  });
  
  // Handle user selection of different speech
  setSpeech('1ac');
  $(".speechhed").click(function(event) {
    var card_id = event.target.id;
    console('New card for ' + card_id + ', passing ' + card_id.substr(4));
    if(card_id.indexOf("new_") != -1){
      newCard(card_id.substr(4));
    }
    console('Setting speech to ' + card_id);
    setSpeech(card_id);
  });

  $("#newround").submit(function(ev) {
    console('PNR!');
    processNewRound(ev);
  });
  
  // Handle changes to current round
  chrome.storage.onChanged.addListener(function(changes, namespace) {
    console('Change detected: cRI=' + changes['currentRoundId'] + ', cTN=' + changes['currentTopicName']);
    console(Object.keys(changes));
    if(changes['currentRoundInfo']){
      currentRoundId = 0;// changes['currentRoundId'].newValue;
      console('New currentRoundId is ' + currentRoundId);
      processNewRound();
      $.fancybox.open([{href: "/html/in_round/newtopic.html", type: "iframe"}]);
      console('New currentTopicName is ' + currentTopicName);
    }
    if(changes['currentTopicName']){
      currentTopicName = changes['currentTopicName'].newValue;
      console('New currentTopicName is ' + currentTopicName);
      addTopic();
    }
    console('Done with changes');
  });
  console('Done with main');
});

function console(newLine) {
  consoleText.push(newLine);
  if(!consoleIsEnabled){
    return;
  }
  var consoleScreen = '';
  for(var i = consoleText.length - 1; i >= consoleText.length - consoleSize; i--) {
    consoleScreen += '<span id="cs' + i + '">' + consoleText[i] + '</span><br>';
  }
  $("#console").html(consoleScreen);
}

function processParams() {
  var params = $.url().param();
  if(params['console']){
    consoleIsEnabled = true;
  }
  if(params['on_install']){
    $.fancybox.open([{href: "/html/in_round/on_install.html", type: "iframe"}]);
  }
}

function openDB() {
  // Set up indexedDB for round metadata
  //$.indexedDB('Debates').deleteDatabase();
  console('Setting up db...');
  dbOpenPromise = $.indexedDB(dbName, {
    'version': 1,
    'schema': {
      '1': function(transaction) {
        console('In Schema v1');
        var cards = transaction.createObjectStore('cards', {
          'keyPath': 'cardId',
          'autoIncrement': true
        });
        cards.createIndex('speech');
        cards.createIndex('roundId');
        cards.createIndex('topicId');
        
        var rounds = transaction.createObjectStore('rounds', {
          'keyPath': 'roundId',
          'autoIncrement': true
        });
        rounds.createIndex('affSchool');
        rounds.createIndex('negSchool');
      }
    }
  });

  dbOpenPromise.progress(function(db, event) {
    console('Warning: ' + event.type + ' on db open');
  });

  dbOpenPromise.done(function() {
    console('Done opening db...');
    enableCardSaving();
  });
  
  dbOpenPromise.fail(function(error, event) {
    console('Error: ' + event.type + ', ' + error);
  });
}

function enableCardSaving() {
  canSaveToDB = true;
  $(".new_card").click(function(event) {
    var card_id = event.target.id;
    console('New card for ' + card_id + ', passing ' + card_id.substr(4));
    if(card_id.indexOf("new_") != null){
      newCard(card_id.substr(4));
    }
  });
  console('Saving to db enabled, connection successfully opened');
}

function processNewRound() {
    console('proccessing new round');
  //var objectStore = $.indexedDB(dbName).objectStore('rounds');
  //var roundPromise = objectStore.get(currentRoundId);
  //var result = storage.get('currentRoundInfo');
  //console.log(result);
  
  //roundPromise.done(function(result, event) {
  storage.get('currentRoundInfo', function(result) {
      console('Got results');
      console(Object.keys(result));
      console(Object.keys(result['currentRoundInfo']));
      console(result['affSchool']);
      result = result['currentRoundInfo'];
    $('#create_affschool').html(result['affSchool']);
    $('#create_affteam').html(result['affTeam']);
    $('#create_1a').html(result['1a']);
    $('#create_2a').html(result['2a']);
    $('#create_negschool').html(result['negSchool']);
    $('#create_negteam').html(result['negTeam']);
    $('#create_1n').html(result['1n']);
    $('#create_2n').html(result['2n']);
  });
  //roundPromise.fail(function(error, event) {
  //  console('Error' + error + ': could not get round data; ' + event);
  //});
}

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

function createArrow(card_id) {
  console('Creating arrow for ' + card_id);
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

function newCard (speech) {
  setSpeech(speech);
  inNewCard = true;
  var boxId = "new_card_box_" + speech;
  console('Creating box ' + boxId);
  
  if (!$("#" + boxId).length) {
    $("#new_" + speech).replaceWith('<textarea id="' + boxId + '"></textarea>');
    $("#" + boxId).focus();
    $("#" + boxId).focusout(function () { saveCard(speech); });
  } else {
    console('hm, card text...');
  }
}

function editCard (card_id, speech) {
  setSpeech(speech);
  inNewCard = true;
  console('Editing box ' + card_id);
  
  if ($("#" + card_id).html().length) {
    var existing_contents = $("#" + card_id).html();
    if ($("#" + card_id + "_cite").html().length) {
      existing_contents += "\\" + $("#" + card_id + "_cite").html();
    }
    console('Existing contents: ' + existing_contents);
    $("#" + card_id).replaceWith('<textarea id="' + card_id + '">' + existing_contents + '</textarea>');
    $("#" + card_id).focus();
    $("#" + card_id).focusout(function () { saveCard(speech); });
  } else {
    console('hm, card text...');
  }
}

function saveCard (speech) {
  setSpeech(speech);
  
  // Extract text and citation
  var text = $("#new_card_box_" + speech).val();
    if (!text.length) {
    console('no card text');
    setUpNewCardBox(speech);
    return;
  }
  var cite_loc = text.indexOf('\\');
  var cite = '';
  if (cite_loc != -1){
    cite = text.substr(cite_loc + 1, text.length);
    text = text.substr(0, cite_loc);
  }
  
  // Visually update page with new card
  currentCard += 1;
  var topicId = currentTopicId;
  var cardId = "#new_card_box_" + speech;

  $(cardId).parent().append('<p class="debate_cell card topic' + topicId + ' ' + currentTeam + '" id="' + currentCard + '" contenteditable="true">' + text + '</p><span class="cardNum">' + (currentCard - 1) + '</span>');
  if (cite_loc != -1){
    $(cardId).parent().append('<p class="debate_cell topic' + topicId + ' ' + currentTeam + ' cite" id="' + currentCard + '_cite" contenteditable="true">' + cite + '</p>');
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
  
  setUpNewCardBox(speech);
}

function setUpNewCardBox(speech) {
  var newHtml = '<p class="' + currentTeam + ' new_card" id="new_' + currentSpeech + '" onclick="">new card</p>';
  $("#new_card_box_" + speech).parent().append(newHtml);
  //$("#" + currentCard.toString()).backgroundColor = 'red';
  createArrow((currentCard).toString());
  $("#new_card_box_" + speech).remove();
  inNewCard = false;
}

function setSpeech (speech) {
  currentSpeech = speech;
  console('Just set speech to ' + speech);
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
