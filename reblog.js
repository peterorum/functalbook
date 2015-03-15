(function()
{
    "use strict";

    // reblog selected post

    var tumblr = require('tumblr.js');
    var R = require('ramda');
    var fs = require('fs');
    var fsq = require('../functal/fsq');

    // Authenticate via OAuth
    var client = tumblr.createClient(
    {
        consumer_key: process.env.tumblr_consumer_key,
        consumer_secret: process.env.tumblr_consumer_secret,
        token: process.env.tumblr_token,
        token_secret: process.env.tumblr_token_secret
    });

    client.userInfo(function(err, data)
    {
        if (err)
        {
            console.log(err);
        }

        //todo//////////////////////// skip if queue is not empty

        // console.log(JSON.stringify(data, null, 4));

        var blogName = 'peterorum';

        var processPosts = function(allPosts)
        {
            // save for tumblrPosts.js
            // console.log(JSON.stringify(allPosts, null, 4));

            var posts = allPosts;
            // get original posts (not reblogs)
            posts = R.filter(R.not(R.prop('reblogged_from_id')), posts);
            // just get important fields
            posts = R.project(['id', 'post_url', 'date', 'caption', 'note_count', 'reblog_key'], posts);
            // desc sort by date
            posts = R.compose(R.reverse, R.sortBy(R.prop('date')))(posts);

            // get ids those reblogged
            var rebloggedIds = R.compose(R.uniq, R.pluck('reblogged_from_id'), R.filter(R.has('reblogged_from_id')))(allPosts);

            // find posts that haven't been reblogged yet
            // must be at least 100 days old
            var unreblogged = R.filter(function(p)
            {
                // '2014-08-17 08:02:00 GMT
                var age = moment.utc(p.date, 'YYYY-MM-DD HH:mm:ss');

                return !R.contains(p.id.toString(), rebloggedIds) && moment.duration(moment().diff(age)).asDays() >= 100;

            }, posts);

            console.log('unreblogged count', unreblogged.length);

            if (unreblogged.length)
            {
            // grab the oldest
            var post = R.last(unreblogged);

            console.log(post);

            // reblog it
            var options = {
                id: post.id,
                reblog_key: post.reblog_key
            };

            client.reblog(blogName, options, function(err, data)
            {
                console.log(err || '');
                console.log(data);
            });
        }
        else
        {
            console.log('No posts not reblogged');
        }
        };

        var getPosts = function(offset, posts, callback)
        {
            var options = {
                type: 'photo',
                limit: 20,
                offset: offset,
                reblog_info: true
            };

            client.posts(blogName, options, function(err, data)
            {
                // console.log(err || '');
                // console.log('Got posts from', offset, data.posts.length);

                var getMore = false;

                if (data.posts.length)
                {
                    posts = R.concat(posts, data.posts);

                    getMore = data.posts.length === 20;
                }

                if (getMore)
                {
                    getPosts(offset + 20, posts, callback);

                }
                else
                {
                    callback(posts);
                }
            });
        };

        // kick off
        getPosts(0, [], processPosts);

    });
}());
