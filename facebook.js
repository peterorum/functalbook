(function()
{
    "use strict";

    // post & delete oldest file

    var graph = require('fbgraph');
    var R = require('ramda');
    var fs = require('fs');
    // var moment = require('moment');
    var fsq = require('../functal/fsq');

    // tokens & server are environment variables
    // # facebook daily functal
    // export fb_df_app_id=
    // export fb_df_app_secret=
    // export fb_df_access_token=
    // export fb_df_server="http://ec2-999.compute-1.amazonaws.com:8081"

    // get first access token from graph explorer for the app, giving page management & publish permissions...
    // https://developers.facebook.com/tools/explorer?method=GET&version=v2.2
    // then extend access token to main account (extend.js)

    graph.setAccessToken(process.env.fb_df_access_token);

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

    fsq.readdir(functalsFolder).then(function(files)
    {
        // get oldest (first)
        var file = R.find(function(f)
        {
            return /\.png$/.test(f);
        }, files);

        if (file)
        {
            // move to current folder by renaming
            var src = functalsFolder + '/' + file;
            var dest = 'functal.png';

            console.log(src);

            try
            {
                fs.unlinkSync(dest);
            }
            catch (ex)
            {}

            fs.renameSync(src, dest);

            // delete associated json
            try
            {
                fs.unlinkSync(src.replace(/\.png/, '.json'));
            }
            catch (ex)
            {}

            // get page accounts
            graph.get("me/accounts", function(err, res)
            {
                // find relevant age to get access token for it
                var df = R.find(R.propEq('name', 'Daily Functal'), res.data);

                // console.log(df);

                // change access token to page's
                graph.setAccessToken(df.access_token);

                //------------ post via url using local server

                // create message & serve up local file
                var post = {
                    message: "#fractal #functal #digitalart",
                    url: process.env.fb_df_server + '/' + dest
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
