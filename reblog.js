;(function() {
  'use strict'

  // reblog selected post

  var tumblr = require('tumblr.js')
  var R = require('ramda')
  // var fs = require('fs')
  // var fsq = require('../functal/fsq')

  // Authenticate via OAuth
  var client = tumblr.createClient({
    consumer_key: process.env.tumblr_consumer_key,
    consumer_secret: process.env.tumblr_consumer_secret,
    token: process.env.tumblr_token,
    token_secret: process.env.tumblr_token_secret
  })

  client.userInfo(function(err, data) {
    if (err) {
      console.log(err)
    }

    // console.log(JSON.stringify(data, null, 4));

    var blogName = 'peterorum'

    // get the blog
    var blog = R.find(R.propEq('name', blogName), data.user.blogs)
    // console.log(blog);

    var processPosts = function(allPosts) {
      // save for tumblrPosts.js
      // console.log(JSON.stringify(allPosts, null, 4));

      var posts = allPosts

      // get original posts (not reblogs)
      posts = R.filter(R.not(R.prop('reblogged_from_id')), posts)

      // just get important fields
      posts = R.project(
        [
          'id',
          'post_url',
          'date',
          'caption',
          'note_count',
          'reblog_key',
          'tags'
        ],
        posts
      )

      // set date to the latest reblog, if any
      var getLastPublishedDate = function(post) {
        var d8 = post.date

        var reblog = R.find(
          R.propEq('reblogged_from_id', post.id.toString()),
          allPosts
        )

        if (reblog) {
          d8 = reblog.date
        }

        return d8
      }

      // update post dates
      posts = R.map(function(p) {
        return R.assoc('date', getLastPublishedDate(p), p)
      }, posts)

      // desc sort by date
      posts = R.compose(R.reverse, R.sortBy(R.prop('date')))(posts)

      // grab the oldest
      var post = R.last(posts)

      console.log(post)

      // reblog it
      var options = {
        id: post.id,
        reblog_key: post.reblog_key
      }

      client.reblog(blogName, options, function(err, data) {
        console.log(err || '')
        console.log(data)

        var id = data.id

        // update tags

        if (post.tags.length) {
          var tags = R.join(',', post.tags)

          client.edit(
            blogName,
            {
              id: id,
              tags: tags
            },
            function(err, data) {
              console.log(err || '')
              console.log('Added tags', data)
            }
          )
        }
      })
    }

    var getPosts = function(offset, posts, callback) {
      var options = {
        type: 'photo',
        limit: 20,
        offset: offset,
        reblog_info: true
      }

      client.posts(blogName, options, function(err, data) {
        // console.log(err || '');
        // console.log('Got posts from', offset, data.posts.length);

        var getMore = false

        if (data.posts.length) {
          posts = R.concat(posts, data.posts)

          getMore = data.posts.length === 20
        }

        if (getMore) {
          getPosts(offset + 20, posts, callback)
        } else {
          callback(posts)
        }
      })
    }

    if (blog.queue === 0) {
      // kick off
      getPosts(0, [], processPosts)
    } else {
      console.log('Skip due to queue:', blog.queue)
    }
  })
})()
