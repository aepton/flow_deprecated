$('form').submit(function() {
  console.log($('#newtopic_name').val());
  parent.processNewTopic();
  return false;
});
