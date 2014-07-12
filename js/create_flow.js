var inNewCard = false;
var inNewTopic = false;
var inRoundMeta = false;
var inTopicDropdown = false;
var inInstructions = false;
var editingCard = '';
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

$(document).ready(function () {
    currentRoundId = generateRandomPath();
    currentArrowBoxId = 'new_1ac';

    // Optionally show instructions
    $('#instructions').modal();
    inInstructions = true;
    $('#instructions').on('hidden.bs.modal', function(e) {
        // Launch round meta modal immediately
        $('#round_meta').modal({
            keyboard: false,
            backdrop: 'static'
        });
        inRoundMeta = true;
        round_init = true;
    });

    $('#round_meta').on('shown.bs.modal', function(e) {
        $('#aff_school').focus();
        if (round_init) {
          setupRaphaelPaper();
        }
        round_init = false;
    });
    $('#round_meta_submit').click(saveRoundMetaData);

    $('#round_title').click(function() {
      inRoundMeta = true;
      $('#round_meta').modal({
        keyboard: false,
        backdrop: 'static'
      });
    });

    $('#new_topic_button').click(launchNewTopic);
    $('#new_topic').on('shown.bs.modal', function(e) {
        inNewTopic = true;
        $('#new_topic_name').focus();
    });
    $('#new_topic').on('hidden.bs.modal', function(e) {
        inNewTopic = false;
    });
    $('#topic-dropdown-parent').on('shown.bs.dropdown', function(e) {
        inTopicDropdown = true;
    });
    $('#topic-dropdown-parent').on('hidden.bs.dropdown', function(e) {
        inTopicDropdown = false;
    });
    
    $('#sync_button').click(function() {
        $('#sync_button').toggleClass('btn-primary btn-success');
        syncToS3();
        //syncToLocal();
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

    // Set up typeahead
    typeaheadCards = new Bloodhound({
        datumTokenizer: Bloodhound.tokenizers.obj.whitespace('tag'),
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        limit: 30,
        prefetch: {
            url: '/js/json/corefiles.json',
            filter: function(list) {
                return $.map(list, function(card) {
                    cardHashed[card.hash] = {
                        tag: card.tag,
                        cite: card.cite,
                        cite_extras: card.cite_extras,
                        text: card.text
                    }
                    return {
                        tag: card.tag + " <br> " + card.cite + " <span id='" + card.hash + "'></span>",
                        cite: card.cite
                    };
                });
            }
        }
    });
 
    typeaheadCards.initialize();
});
