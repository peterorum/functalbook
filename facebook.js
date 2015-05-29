(function()
{
    "use strict";

    // post & delete oldest file

    var graph = require('fbgraph');
    var R = require('ramda');
    var fs = require('fs');
    var fsq = require('../functal/fsq');
    var s3 = require('../functal/s3client');

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

    var bucket = 'functal-images';
    var bucketJson = 'functal-json';
    var cdn = 'https://d1aienjtp63qx3.cloudfront.net/';

    s3.list('functal-images').then(function(result)
    {
        if (result.count === 0)
        {
            console.log('No files');
        }
        else
        {
            var oldestKey = result.files[0].Key;
            var url = cdn + oldestKey;

            // get page accounts
            graph.get("me/accounts", function(err, res)
            {
                // find relevant page to get access token for it
                var df = R.find(R.propEq('name', 'Daily Functal'), res.data);

                // change access token to page's
                graph.setAccessToken(df.access_token);

                // create message & serve up local file
                var post = {
                    message: "#fractal #functal #digitalart",
                    url: url
                };

                // post to page photos

                graph.post("/" + df.id + "/photos", post, function(err, res)
                {
                    console.log(res); // { id: xxxxx}

                    // // delete image

                    s3.delete(bucket, oldestKey)
                        .then(function()
                        {
                            // delete json
                            return s3.delete(bucketJson, oldestKey.replace(/(png|jpg)$/, 'json'));
                        })
                        .done();

                });
            });
        }
    });

}());
