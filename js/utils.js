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

function setSpeech(speech) {
    currentSpeech = speech;
    if (speech.indexOf('n') != -1){
        currentTeam = 'neg';
    } else {
        currentTeam = 'aff';
    }
    $(".speechhed").each(function() {
      $(this).removeClass('active-speech');
    });
    $(".speechhed." + speech).addClass('active-speech');
}
