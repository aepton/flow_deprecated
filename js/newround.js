var appConsole = '';
var consoleIsEnabled = false;
var storage = chrome.storage.local;
var dbName = 'DebateRounds';
updateConsole('yay!yay!');
$(document).ready(function () {
  openDB();
  processParams();
  updateConsole('alright');
  // Once form is submitted, send it to round idb
  $('#newround').submit(addNewRound);
  $('#newtopic').submit(addNewTopic);
  
  // Set default text for form
  $('.newround_form').each(function(){
    this.value = $(this).attr('title');
    $(this).addClass('text_label');
  
    $(this).focus(function(){
      if(this.value == $(this).attr('title')) {
        this.value = '';
        $(this).removeClass('text_label');
      }
    });
  
    $(this).blur(function(){
      if(this.value == '') {
        this.value = $(this).attr('title');
        $(this).addClass('text_label');
      }
    });
  });
});

function processParams() {
  var params = $.url().param();
  if(params['console']){
    consoleIsEnabled = true;
    updateConsole('Console enabled?');
  }
}

function openDB() {
  updateConsole('<p>Opening connection to db</p>');
  
  // Set up indexedDB for round metadata
  var dbPromise = $.indexedDB(dbName);

  updateConsole('<p>Connection should be open...</p>');
  // Progress handler
  dbPromise.progress(function(db, event) {
    updateConsole('<p>Warning: ' + event + '</p>');
  });
  
  // Success handler
  dbPromise.done(function() {
    updateConsole('<p>Successfully opened db</p>');
  });
  
  // Failure handler
  dbPromise.fail(function(error, event) {
      console.log(error);
      console.log(event);
    updateConsole('<p>Error opening db: ' + error + ', ' + event + '</p>');
  });
}

function updateConsole(line) {
  appConsole += line;
  if(consoleIsEnabled) {
    $('#databody').html(appConsole); 
  }
}

function addNewRound(event) {
  updateConsole('anr!');
  var newRound = {
    'affSchool': $('#newround_affschool').val(),
    'affTeam': $('#newround_affteam').val(),
    '1a': $('#newround_1a').val(),
    '2a': $('#newround_2a').val(),
    'negSchool': $('#newround_negschool').val(),
    'negTeam': $('#newround_negteam').val(),
    '1n': $('#newround_1n').val(),
    '2n': $('#newround_2n').val()
  };
  storage.set({'currentRoundInfo': newRound});
  //console.log(storage.get('currentRoundInfo'));
  storage.set({'currentRoundId': 0}, function(result) {
    updateConsole('<p>Setting currentRoundId to ' + result + '</p>');
    storage.get('currentRoundId', function(result) {
      updateConsole('<p>Found value of ' + result['currentRoundId'] + '</p>'); 
    });
  });
      
  // Close the fancybox and take us to the main window
  parent.$.fancybox.close();
  event.preventDefault();
  /*
  
      // Failure callback
      addPromise.fail(function(error, event) {
          console.log(error);
          console.log(event);
        updateConsole('<p>Failure: ' + error + '<br>' + event + '</p>');
        });

  });
  event.preventDefault();*/
  /*console.log($.indexedDB(dbName));
  var objectStore = $.indexedDB(dbName).objectStore('rounds');
  console.log(objectStore);
  //var objectStore = transaction.objectStore('rounds');
  // Commit the filled-out form to the metadata object store at the "current_round" key
  newRound = {
    'affSchool': $('#newround_affschool').val(),
    'affTeam': $('#newround_affteam').val(),
    '1a': $('#newround_1a').val(),
    '2a': $('#newround_2a').val(),
    'negSchool': $('#newround_negschool').val(),
    'negTeam': $('#newround_negteam').val(),
    '1n': $('#newround_1n').val(),
    '2n': $('#newround_2n').val()
  };
  $.each(newRound, function(i, n) {
    updateConsole('<p>' + i + ': ' + n + '</p>');
  });
  console.log(newRound);
  console.log( newRound['affSchool'] + newRound['negSchool']);

  var addPromise = objectStore.add(newRound);//, newRound['affSchool'] + newRound['negSchool']);
  console.log(addPromise);
  // Success callback
  addPromise.done(function(result, event) {
    updateConsole('<p>Success: ' + result + '<br>' + event + '</p>');
    storage.set({'currentRoundId': parseInt(result)}, function() {
      updateConsole('<p>Setting currentRoundId to ' + result + '</p>');
      storage.get('currentRoundId', function(result) {
        updateConsole('<p>Found value of ' + result['currentRoundId'] + '</p>'); 
      });
    });
      
    // Close the fancybox and take us to the main window
    parent.$.fancybox.close();
  });
  
  // Failure callback
  addPromise.fail(function(error, event) {
      console.log(error);
      console.log(event);
    updateConsole('<p>Failure: ' + error + '<br>' + event + '</p>');
    });

    event.preventDefault();*/
}

function addNewTopic(event) {
  storage.set({'currentTopicName': $('#newtopic_name').val()}, function() {
    updateConsole('<p>Setting currentTopicName to ' + $('#newtopic_name').val() + '</p>');
    storage.get('currentTopicName', function(result) {
      updateConsole('<p>Found value of ' + result['currentTopicName'] + '</p>'); 
    });
  });
      
  // Close the fancybox and take us to the main window
  parent.$.fancybox.close();

  event.preventDefault();
}
