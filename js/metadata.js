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
        'tournament': $('#meta_tournament').text(),
        'round': $('#meta_round').text(),
        'judge': $('#meta_judge').text()
    }
    return round_info;
}

function saveRoundMetaData() {
    $('#round_meta').modal('hide');
    inRoundMeta = false;
    if ($('#tournament_name').val()) $('#meta_tournament').text($('#tournament_name').val());
    if ($('#round_number').val()) $('#meta_round').text($('#round_number').val());
    if ($('#judge_name').val()) $('#meta_judge').text($('#judge_name').val());
    if ($('#aff_school').val()) $('#create_affschool').text($('#aff_school').val());
    if ($('#aff_team').val()) $('#create_affteam').text($('#aff_team').val());
    if ($('#aff_speaker_1').val()) $('#create_1a').text($('#aff_speaker_1').val());
    if ($('#aff_speaker_2').val()) $('#create_2a').text($('#aff_speaker_2').val());
    if ($('#neg_school').val()) $('#create_negschool').text($('#neg_school').val());
    if ($('#neg_team').val()) $('#create_negteam').text($('#neg_team').val());
    if ($('#neg_speaker_1').val()) $('#create_1n').text($('#neg_speaker_1').val());
    if ($('#neg_speaker_2').val()) $('#create_2n').text($('#neg_speaker_2').val());

    if (launch_new_topic) {
      // Launch new topic modal
      $('#new_topic').modal({
          keyboard: false,
          backdrop: 'static'
      });
      $('#new_topic_close_button').hide();
      $('#new_topic').on('shown.bs.modal', function(e) {
          launch_new_topic = false;
      });
    }
}
