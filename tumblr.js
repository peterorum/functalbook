(function() {
  "use strict";

  // post & delete oldest file

  var tumblr = require('tumblr.js');
  var R = require('ramda');
  var moment = require('moment');
  var fs = require('fs');
  var fsq = require('../functal/fsq');
  var s3 = require('../functal/s3client');
  var promise = require("bluebird");
  var mongodb = promise.promisifyAll(require("mongodb"));
  var mongoClient = promise.promisifyAll(mongodb.MongoClient);

  mongoClient.connectAsync(process.env.mongo_functal).then(function(client) {

    var db = client.db('functal');

    // tokens are environment variables

    // Authenticate via OAuth
    var tumblrClient = tumblr.createClient(
      {
        consumer_key: process.env.tumblr_consumer_key,
        consumer_secret: process.env.tumblr_consumer_secret,
        token: process.env.tumblr_token,
        token_secret: process.env.tumblr_token_secret
      });

    var bucket = 'functal-images';
    var bucketJson = 'functal-json';

    s3.list('functal-images').then(function(result) {
      if (result.count === 0) {
        console.log('No files');
      }
      else {
        var r = Math.floor(Math.random() * result.files.length);
        var key = result.files[r].Key;

        var tmpFile = '/tmp/tumblr-' + key;

        s3.download(bucket, key, tmpFile).then(function() {
          tumblrClient.userInfo(function(err, data) {
            if (err) {
              console.log(err);
            }

            // get the blog
            var df = R.find(R.propEq('name', 'functal'), data.user.blogs);

            var msg = "iPhone app https://bit.ly/dailyfunctal";

            // prefix msg with title if any
            db.collection('images').findOneAsync(
              {
                name: key
              }).then(function(image) {

              if (image && image.title) {
                msg = '"' + image.title + '" ' + msg;
              }

              var options = {
                caption: msg,
                tags: 'fractal,functal',
                format: 'markdown',
                link: 'https://functal.tumblr.com', // something required or post fails with 401
                data: tmpFile
              };

              tumblrClient.photo('functal', options, function(err, data) {
                if (err) {
                  console.log(err);
                }

                console.log(data);

                fsq.unlink(tmpFile);

                client.close();
              });
            });
          });
        });
      }
    });
  });
}());
