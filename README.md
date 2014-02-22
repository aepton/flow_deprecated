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
                    "text":"BO recent appt to UN proves admin taking confront approach 2 Ven, driving apart",
                    "cite":"AFP 13",
                    "speech":"1ac",
                    "cardNum":1,
                    "topicId":1,
                    "roundId":null,
                    "cardId":2
                }, {
                    "text":"US has no pol 4 guarnt fair Ven electns, demo @ risk",
                    "cite":"Walser 12",
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
