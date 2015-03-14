(function()
{
    "use strict";

    // post & delete oldest file

    var graph = require('fbgraph');
    var R = require('ramda');
    var fs = require('fs');
    var fsq = require('../functals/fsq');

    // extended access token to main account
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

    // copy latest file over
    var functalsFolder = process.env.HOME + '/Dropbox/functals/medium';

    fsq.readdir(folder).then(function(files)
    {
        // get oldest (first)
        var file = R.find(function(f)
        {
            return /\.png$/.test(f);
        }, files);

        if (file)
        {
            // move to current folder by renaming
            var src = folder + file;
            var dest = 'functal.png';

            console.log(src);

            fs.unlinkSync(dest);
            fs.renameSync(src, dest);

            // delete associated json
            fsq.unlinkSync(file.replace(/\.png/, '.json'));

            // get page accounts
            graph.get("me/accounts", function(err, res)
            {
                // find relevant age to get access token for it
                var df = R.find(R.propEq('name', 'Daily Functal'), res.data);

                // console.log(df);

                // change access token to pages'
                graph.setAccessToken(df.access_token);

                //------------ via url

                // create message & serve up local file
                var post = {
                    message: "#fractal #functal",
                    url: "http://" + process.env.fb_df.server + '/' + file
                };

                // post to page photos
                graph.post("/" + df.id + "/photos", post, function(err, res)
                {
                    console.log(res); // { id: xxxxx}
                });
            });
        }
        else
        {
            console.log('no file');
        }
    });
}());
