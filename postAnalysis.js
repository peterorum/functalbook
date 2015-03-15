(function()
{
    "use strict";

    // reblog selected post

    var R = require('ramda');
    var moment = require('moment');

    // load posts saved as text from a dump of all posts from uncommented the dump in reblog.gs
    var tumblrPosts = require("./tumblrPosts");

    var allPosts = tumblrPosts.data;
    // console.log(allPosts);

    var posts = tumblrPosts.data;
    // get original posts (not reblogs)
    posts = R.filter(R.not(R.prop('reblogged_from_id')), posts);
    // just get important fields
    posts = R.project(['id', 'post_url', 'date', 'caption', 'note_count', 'reblog_key'], posts);

    // set date to the latest reblog, if any
    var getDate = function(post)
    {
        var d8 = post.date;

        var reblog = R.find(R.propEq('reblogged_from_id', post.id.toString()), allPosts);

        if (reblog)
        {
            d8 = reblog.date;
        }

        return d8;
    };

    posts = R.map(function(p)
    {
        return R.assoc('date', getDate(p), p);
    }, posts);

    // desc sort by date
    posts = R.compose(R.reverse, R.sortBy(R.prop('date')))(posts);

    // grab the oldest
    var post = R.last(posts);

    // post if not reblogged
    console.log(post);

}());
