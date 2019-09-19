// reblog selected post

var tumblr = require('tumblr.js')

const _ = require('lodash')

function reblog() {
  return new Promise(function(resolve, reject) {
    // Authenticate via OAuth
    var client = tumblr.createClient({
      consumer_key: process.env.tumblr_df_consumer_key,
      consumer_secret: process.env.tumblr_df_consumer_secret,
      token: process.env.tumblr_df_token,
      token_secret: process.env.tumblr_df_token_secret
    })

    client.userInfo(function(err, data) {
      if (err) {
        console.log(err)
      }

      // console.log(JSON.stringify(data, null, 4));

      var blogName = 'peterorum'

      // get the blog
      var blog = data.user.blogs.find(b => b.name === blogName)

      // console.log(blog);

      var processPosts = function(allPosts) {
        // save for tumblrPosts.js
        // console.log(JSON.stringify(allPosts, null, 4));

        let posts = allPosts

        // get original posts (not reblogs)
        posts = posts.filter(p => !p.reblogged_from_id) //     R.filter(R.not(R.prop('reblogged_from_id')), posts)

        // set date to the latest reblog, if any
        var getLastPublishedDate = function(post) {
          var d8 = post.date

          var reblog = allPosts.find(
            p => p.reblogged_from_id === post.id.toString()
          )

          if (reblog) {
            d8 = reblog.date
          }

          return d8
        }

        // update post dates
        posts = posts.map(p => ({
          ...p,
          date: getLastPublishedDate(p)
        }))

        // desc sort by date
        posts = _.sortBy(posts, p => p.date).reverse()

        // grab the oldest
        var post = posts[posts.length - 1]

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
            var tags = post.tags.join(',')

            client.edit(
              blogName,
              {
                id: id,
                tags: tags
              },
              function(err, data) {
                console.log(err || '')
                console.log('Added tags', data)

                resolve()
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
          if (err) {
            console.log(err)
          } else {
            // console.log('Got posts from', offset, data.posts.length);

            var getMore = false

            if (data.posts.length) {
              posts = [...posts, ...data.posts] //  R.concat(posts, data.posts)

              getMore = data.posts.length === 20
            }

            if (getMore) {
              getPosts(offset + 20, posts, callback)
            } else {
              callback(posts)
            }
          }
        })
      }

      if (blog.queue === 0) {
        // kick off
        getPosts(0, [], processPosts)

      } else {
        console.log('Skip due to queue:', blog.queue)
        resolve();
      }
    })
  })
}

exports.reblog = reblog
