(function()
{
    "use strict";

    // post & delete oldest file

    var tumblr = require('tumblr.js');
    var R = require('ramda');
    var moment = require('moment');
    var fs = require('fs');
    var fsq = require('../functal/fsq');
    var s3 = require('../functal/s3client');

    // tokens are environment variables

    // Authenticate via OAuth
    var client = tumblr.createClient(
    {
        consumer_key: process.env.tumblr_consumer_key,
        consumer_secret: process.env.tumblr_consumer_secret,
        token: process.env.tumblr_token,
        token_secret: process.env.tumblr_token_secret
    });

    var bucket = 'functal-images';
    var bucketJson = 'functal-json';

    s3.list('functal-images').then(function(result)
    {
        if (result.count === 0)
        {
            console.log('No files');
        }
        else
        {
            var oldestKey = result.files[0].Key;

            var tmpFile = '/tmp/tumblr-' + oldestKey;

            s3.download(bucket, oldestKey, tmpFile).then(function()
            {
                client.userInfo(function(err, data)
                {
                    if (err)
                    {
                        console.log(err);
                    }

                    // get the blog
                    var df = R.find(R.propEq('name', 'functal'), data.user.blogs);

                    var options = {
                        caption: 'Fractal ' + moment().format('YYYYMMDD.HH'),
                        tags: 'fractal,functal',
                        format: 'markdown',
                        link: 'https://functal.tumblr.com', // something required or post fails with 401
                        data: tmpFile
                    };

                    client.photo('functal', options, function(err, data)
                    {
                        if (err)
                        {
                            console.log(err);
                        }

                        console.log(data);

                        // delete image
                        s3.delete(bucket, oldestKey)
                            .then(function()
                            {
                                // delete json
                                return s3.delete(bucketJson, oldestKey.replace(/png$/, 'json'));
                            })
                            .then(function()
                            {
                                // delete local file
                                return fsq.unlink(tmpFile);
                            })
                            .done();

                    });
                });
            });
        }
    });
}());
