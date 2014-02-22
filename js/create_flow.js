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

function console_vis(newLine) {
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
  console_vis('Setting up db...');
  dbOpenPromise = $.indexedDB(dbName, {
    'version': 1,
    'schema': {
      '1': function(transaction) {
        console_vis('In Schema v1');
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
    console_vis('Warning: ' + event.type + ' on db open');
  });

  dbOpenPromise.done(function() {
    console_vis('Done opening db...');
    enableCardSaving();
  });
  
  dbOpenPromise.fail(function(error, event) {
    console_vis('Error: ' + event.type + ', ' + error);
  });
}

function enableCardSaving() {
  canSaveToDB = true;
  $(".new_card").click(function(event) {
    var card_id = event.target.id;
    console_vis('New card for ' + card_id + ', passing ' + card_id.substr(4));
    if(card_id.indexOf("new_") != null){
      newCard(card_id.substr(4));
    }
  });
  console_vis('Saving to db enabled, connection successfully opened');
}

function processNewRound() {
    console_vis('proccessing new round');
  //var objectStore = $.indexedDB(dbName).objectStore('rounds');
  //var roundPromise = objectStore.get(currentRoundId);
  //var result = storage.get('currentRoundInfo');
  //console.log(result);
  
  //roundPromise.done(function(result, event) {
  storage.get('currentRoundInfo', function(result) {
      console_vis('Got results');
      console_vis(Object.keys(result));
      console_vis(Object.keys(result['currentRoundInfo']));
      console_vis(result['affSchool']);
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
  //  console_vis('Error' + error + ': could not get round data; ' + event);
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

function newCard (speech) {
  setSpeech(speech);
  inNewCard = true;
  var boxId = "new_card_box_" + speech;
  console_vis('Creating box ' + boxId);
  
  if (!$("#" + boxId).length) {
    $("#new_" + speech).replaceWith('<textarea id="' + boxId + '"></textarea>');
    $("#" + boxId).focus();
    $("#" + boxId).focusout(function () { saveCard(speech); });
  } else {
    console_vis('hm, card text...');
  }
}

function editCard (card_id, speech) {
  setSpeech(speech);
  inNewCard = true;
  console.log('Editing box ' + card_id);
  
  if ($("#" + card_id).html().length) {
    var existing_contents = $("#" + card_id).html();
    if ($("#" + card_id + "_cite").length) {
      existing_contents += "\\" + $("#" + card_id + "_cite").html();
    }
    console.log('Existing contents: ' + existing_contents);
    $("#" + card_id).replaceWith('<textarea id="' + card_id + '">' + existing_contents + '</textarea>');
    $("#" + card_id).focus();
    //$("#" + card_id).focusout(function () { saveCard(speech); });
  } else {
    console.log('hm, card text...');
  }
}

function saveCard (speech) {
  setSpeech(speech);
  
  // Extract text and citation
  var text = $("#new_card_box_" + speech).val();
    if (!text.length) {
    console_vis('no card text');
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
  //$("#" + currentCard.toString()).backgroundColor = 'red';
  createArrow((currentCard).toString());
  $("#new_card_box_" + speech).remove();
  inNewCard = false;
}

function setSpeech (speech) {
  currentSpeech = speech;
  console_vis('Just set speech to ' + speech);
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
  for( var i=0; i < 20; i++ )
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
}

function syncToS3() {
  var to_sync = {
    'topics': topics,
    'cards': All_Cards,
    'round': getRoundInfo()
  }
  var xhr = new XMLHttpRequest();
  var file_path = generateRandomPath();
  xhr.open('PUT', 'http://myflo.ws.s3.amazonaws.com/rounds/' + file_path, true);
  xhr.setRequestHeader('Content-Type', 'application/jsonp;charset=UTF-8');
  xhr.setRequestHeader('x-amz-grant-read', 'uri=http://acs.amazonaws.com/groups/global/AllUsers');
  xhr.setRequestHeader('x-amz-grant-full-control', 'id=232e57676375e3662e1f6071e27ba830d61a56435635409a02da101abffa7e30');
  xhr.send('f(' + JSON.stringify(to_sync) + ');');
  console.log(xhr);
  $('#rnd-link').html('<a target="_blank" href="http://myflo.ws/view?rnd=' + file_path + '">http://myflo.ws/view?rnd=' + file_path + '</a>');
  $('#saved_round').modal();
}

$(document).ready(function () {
  processParams();
  openDB();
  console_vis(currentRoundId);
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

  //$.fancybox.open([{href: "/html/in_round/newtopic.html", type: "iframe"}]);
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
    setTimeout(function() {$('#new_topic_name').focus()},750);
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
    console_vis('New card for ' + card_id + ', passing ' + card_id.substr(4));
    if(card_id.indexOf("new_") != -1){
      newCard(card_id.substr(4));
    }
    console_vis('Setting speech to ' + card_id);
    setSpeech(card_id);
  });

  $("#newround").submit(function(ev) {
    console_vis('PNR!');
    processNewRound(ev);
  });
  
  // Handle changes to current round
  chrome.storage.onChanged.addListener(function(changes, namespace) {
    console_vis('Change detected: cRI=' + changes['currentRoundId'] + ', cTN=' + changes['currentTopicName']);
    console_vis(Object.keys(changes));
    if(changes['currentRoundInfo']){
      currentRoundId = 0;// changes['currentRoundId'].newValue;
      console_vis('New currentRoundId is ' + currentRoundId);
      processNewRound();
      $.fancybox.open([{href: "/html/in_round/newtopic.html", type: "iframe"}]);
      console_vis('New currentTopicName is ' + currentTopicName);
    }
    if(changes['currentTopicName']){
      currentTopicName = changes['currentTopicName'].newValue;
      console_vis('New currentTopicName is ' + currentTopicName);
      addTopic();
    }
    console_vis('Done with changes');
  });
  console_vis('Done with main');
});
