(function()
{
    "use strict";

    // post & delete oldest file

    var tumblr = require('tumblr.js');
    var R = require('ramda');
    var fs = require('fs');
    var fsq = require('../functal/fsq');

    // tokens are environment variables

    // Authenticate via OAuth
    var client = tumblr.createClient(
    {
        consumer_key: process.env.tumblr_consumer_key,
        consumer_secret: process.env.tumblr_consumer_secret,
        token: process.env.tumblr_token,
        token_secret: process.env.tumblr_token_secret
    });

    var isDev = (process.env.TERM_PROGRAM === 'Apple_Terminal');

    var functalsFolder = process.env.HOME + '/Dropbox/functals';

    var folder = functalsFolder + '/medium/';

    fsq.readdir(folder).then(function(files)
    {
        var file = R.find(function(f)
        {
            return /\.png$/.test(f);
        }, files);

        if (file)
        {
            file = folder + file;

            console.log(file);

            // Make the request
            client.userInfo(function(err, data)
            {
                if (err)
                {
                    console.log(err);
                }

                // console.log(JSON.stringify(data, null, 4));

                // client.userInfo(function(err, data)
                //         {
                //             R.forEach(function(blog)
                //             {
                //                 console.log(blog.name);
                //             }, data.user.blogs);
                // });

                // get the blog
                var df = R.find(R.propEq('name', 'functal'), data.user.blogs);
                // console.log(df);

                var options = {
                    caption: '#fractal #functal', // todo: add as tags
                    link: 'https://functal.tumblr.com', // something required or post fails with 401
                    data: file
                };

                client.photo('functal', options, function(err, data)
                {
                    console.log(err);
                    console.log(data);

                    // delete file & json
                    fsq.unlink(file).then(function()
                    {
                        try
                        {
                            fsq.unlink(file.replace(/\.png/, '.json'));
                        }
                        catch (ex)
                        {}
                    });

                });
            });
        }
        else
        {
            console.log('no file');
        }
    });
}());
