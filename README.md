Javascript-based flowing app for cross-ex policy debate. This repo contains both the code for the app itself, and the code for [myflo.ws](http://myflo.ws), the website that allows flows to be shared and commented upon.

Both the app and the website rely on a still-in-flux and to-be-named format (any suggestions? Was thinking .db8 but that's lame) that's basically JSON:

    {
        "topics":
            {
                "Inherency":1
            },
        "cards":
            [
                {
                    "text":"Tiefo je fer f fer fre fref r fre  fref re e fer fre f e fr fre fe fr fre fer fer fer fr ef rru fer fe fe ferjf er f",
                    "cite":"",
                    "speech":"1ac",
                    "cardNum":1,
                    "topicId":1,
                    "roundId":null,
                    "cardId":2
                }, {
                    "text":"iefo je fer f fer fre fref r fre  fref re e fer fre f e fr fre fe fr fre fer fer fer fr ef rru fer fe fe ferjf er f",
                    "cite":"",
                    "speech":"1ac",
                    "cardNum":2,
                    "topicId":1,
                    "roundId":null,
                    "cardId":3
                }
            ],
        "round":
            {
                "affSchool":"affSchool",
                "affTeam":"affTeam",
                "1a":"1a",
                "2a":"2a",
                "negSchool":"negSchool",
                "negTeam":"negTeam",
                "1n":"1n",
                "2n":"2n"
            }
        }
