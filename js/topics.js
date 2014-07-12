function addTopic() {
    var topic = currentTopicName;

    if (topic.length) {
        var newtopic = $(
          "<li><a href='#' id='topic_" + topic + "' class='menutopic'>" + topic + "</a></li>");
        newtopic.attr("value", topic);
        $("#topic-dropdown").append(newtopic);
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
    $("#topic").text(topicname);
    for (var i=0; i < all_arrows.length; i++) {
      if (all_arrows[i]['topic'] == currentTopicId) {
        all_arrows[i]['arrow'].show();
      } else {
        all_arrows[i]['arrow'].hide();
      }
    }
}

function launchNewTopic() {
    $('#new_topic').modal({keyboard: true, backdrop: true});
    $('#new_topic_close_button').show();
}
