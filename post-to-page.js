(function()
{
    var graph = require('fbgraph');
    var R = require('ramda');
    var fs = require('fs');

    graph.setAccessToken(process.env.fb_df_access_token);

    // graph.post("/feed", post, function(err, res)
    // {
    //     console.log(res); // { id: xxxxx}
    // });

    // data: [
    //     {
    //         access_token: ...
    //         category: 'Artist',
    //         name: 'Daily Functal',
    //         id: ...
                // perms: ['ADMINISTER',
                //     'EDIT_PROFILE',
                //     'CREATE_CONTENT',
                //     'MODERATE_CONTENT',
                //     'CREATE_ADS',
                //     'BASIC_ADMIN'
                // ]
    //     },
    // ...
    // }],

    graph
        .get("me/accounts", function(err, res)
        {
            var df = R.find(R.propEq('name', 'Daily Functal'), res.data);

            // console.log(df);

            graph.setAccessToken(df.access_token);

            //------------ via url

            var post = {
                message: "#fractal #functal #digitalart",
                url: "https://pbs.twimg.com/media/CACiB7TWoAEskBa.png"
            };

            graph.post("/" + df.id + "/photos", post, function(err, res)
            {
                console.log(res); // { id: xxxxx}
            });

        });



})();
