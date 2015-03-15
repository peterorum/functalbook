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
    // desc sort by date
    posts = R.compose(R.reverse, R.sortBy(R.prop('date')))(posts);

    // console.log(posts);
    // console.log(posts.length);

    // get ids those reblogged
    var rebloggedIds = R.compose(R.uniq, R.pluck('reblogged_from_id'), R.filter(R.has('reblogged_from_id')))(allPosts);

    // console.log(rebloggedIds.length);

    // find posts that haven't been reblogged yet
    // todo: must be at least 3 months old
    var unreblogged = R.filter(function(p)
    {
        return ! R.contains(p.id.toString(), rebloggedIds);
    }, posts);

    // console.log(unreblogged);
    // console.log(unreblogged.length);

    // grab the oldest
    var post = R.last(unreblogged);

    // post if not reblogged
    console.log(post);

}());