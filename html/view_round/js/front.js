var Rounds = new Backbone.Collection();
var RoundsView = Backbone.View.extend({
    id: 'rounds-view',
    render: function() {
        $('#rounds-view').html(
            _.template($('#rounds-template').html(), {rounds: this.collection.toJSON()}));
    }
});
var RV;

$(document).ready(function() {
    $.get('http://myflo.ws/rounds/metadata', function() {}, 'jsonp');
    $('#most-recent').click(function() {
        $('#app-view').hide();
        $('#rounds-view').show();
        $('#show-app').parent().removeClass('active');
        $('#rounds-menu').addClass('active');
    });
    $('#show-app').click(function() {
        $('#rounds-view').hide();
        $('#app-view').show();
        $('#show-app').parent().addClass('active');
        $('#rounds-menu').removeClass('active');
    });
});

function f(data) {
    // This is the callback from the metadata file. So prep and display the results.
    // Put it into a backbone collection, send it through a template, hook that up to
    // Twitter autocomplete and/or chozen. Display a permalink to whatever results are currently
    // viewable, so ppl can bookmark school/tourney/whatever pages.
    $.each(data, function(d) {
        data[d]['key'] = d;
        Rounds.add(data[d]);
    });
    RV = new RoundsView({collection: Rounds});
    RV.render();
}
