$(document).ready(function () {
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
});
