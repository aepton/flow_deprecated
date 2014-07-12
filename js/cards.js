function newCard (speech) {
    setSpeech(speech);
    inNewCard = true;
    var boxId = "new_card_box_" + speech;

    if (!$("#" + boxId).length) {
        $("#new_" + speech).replaceWith('<textarea class="typeahead" id="' + boxId + '" placeholder="Enter card text. Separate cite with \\"></textarea>');
        if (cardHashed) {
            typeAhead = $('#' + boxId).typeahead({
                hint: true,
                highlight: true,
                minLength: 1
            }, {
                name: 'cards',
                displayKey: 'tag',
                source: typeaheadCards.ttAdapter()
            });
        }
        $("#" + boxId).focus();
        $("#" + boxId).focusout(function () { saveCard(speech); });
    }
}

function editCard (card_id, speech) {
    setSpeech(speech);
    inNewCard = true;
    editingCard = card_id;

    if ($("#" + card_id).html().length) {
        var existing_contents = $("#" + card_id).html();
        if ($("#" + card_id + "_cite").length) {
            existing_contents += "\\" + $("#" + card_id + "_cite").html();
        }
        $("#" + card_id).replaceWith('<textarea id="new_card_box_' + speech + '">' + existing_contents + '</textarea>');
        $("#" + card_id).focus();
    }
}

function saveCard (speech) {
    setSpeech(speech);

    // Extract text and citation
    var text = $("#new_card_box_" + speech).val();
    try {
        if (!text.length) {
            $('.typeahead').typeahead('destroy');
            setUpNewCardBox(speech);
            return;
        }
    } catch(err) {
       ;
    }
    var cite_loc = text.indexOf('\\');
    var cite = '';
    var hash = '';
    if (cite_loc != -1) {
        cite = text.substr(cite_loc + 1, text.length);
        text = text.substr(0, cite_loc);
        hash = '';
    } else {
        cite_loc = text.indexOf('<br>');
        if (cite_loc != -1) {
            hash_loc = text.indexOf('<span');
            cite = text.substr(cite_loc + 4, hash_loc - cite_loc + 4);
            hash = text.substr(hash_loc + 10);
            end_hash_loc = hash.indexOf("'>");
            hash = hash.substr(0, end_hash_loc);
            text = text.substr(0, cite_loc);
        }
    }

    var hash_str = '"';
    if (hash) {
        hash_str = '" data-card-hash="' + hash + '"';
    }

    if (editingCard) {
      $('#new_card_box_' + speech).replaceWith('<p class="debate_cell card topic' + currentTopicId + ' ' + currentTeam + '" id="' + editingCard + hash_str + '>' + text + '</p><span class="cardNum">' + editingCard + '</span>');
      $("#" + editingCard).click(function(event) {
        editCard(currentCard, speech);
      });
      editingCard = '';
      return;
    }

    // Visually update page with new card
    currentCard += 1;
    var topicId = currentTopicId;
    var cardId = "#new_card_box_" + speech;

    $('.typeahead').typeahead('destroy');

    $(cardId).parent().append('<p class="debate_cell card topic' + topicId + ' ' + currentTeam + '" id="' + currentCard + hash_str + '>' + text + '</p><span class="cardNum">' + (currentCard - 1) + '</span>');
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
    $("html, body").animate({
      scrollTop: ($('#new_' + currentSpeech).offset()['top'] - $('#top').height() - 100)
    }, 300, 'swing');
}

function setUpNewCardBox(speech) {
    var newHtml = '<p class="' + currentTeam + ' new_card current_arrow_box arrow_box_newcard" id="new_' + currentSpeech + '" onclick="">new card</p>';
    $("#new_card_box_" + speech).parent().append(newHtml);
    $("#new_card_box_" + speech).remove();
    inNewCard = false;
}
