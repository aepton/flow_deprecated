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
