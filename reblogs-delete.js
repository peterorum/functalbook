'use strict'

// docs: https://www.npmjs.com/package/@jigsaw/tumblr
const tumblr = require('tumblr.js')

const fs = require('fs')
const differenceInDays = require('date-fns/difference_in_days')
/* eslint-disable handle-callback-err */

// config

const tempFile = `/tmp/posts.json`
const resultsFile = `/tmp/results.json`

// if false, expects /tmp/posts.json to exist.
// first time run as dev, it will save the file. Takes a while.
// actual deletion does not happen for dev.
const isDev = true

console.log('is dev:', isDev);

const today = new Date()

// Authenticate via OAuth
const client = tumblr.createClient({
  consumer_key: process.env.tumblr_consumer_key,
  consumer_secret: process.env.tumblr_consumer_secret,
  token: process.env.tumblr_token,
  token_secret: process.env.tumblr_token_secret
})

client.userInfo((err, data) => {
  if (err) {
    console.log(err)
  }

  // console.log(JSON.stringify(data, null, 4));

  const blogName = 'peterorum'

  // [ { admin: true,
  //     ask: false,
  //     ask_anon: false,
  //     ask_page_title: 'Ask me anything',
  //     can_send_fan_mail: true,
  //     can_subscribe: false,
  //     description: '<div><b>Street photography by Peter Orum<b></div>',
  //     drafts: 0,
  //     facebook: 'N',
  //     facebook_opengraph_enabled: 'N',
  //     followed: false,
  //     followers: 3380,
  //     is_adult: false,
  //     is_blocked_from_primary: false,
  //     is_nsfw: false,
  //     likes: 73,
  //     messages: 1,
  //     name: 'peterorum',
  //     posts: 1354,
  //     primary: true,
  //     queue: 0,
  //     reply_conditions: '3',
  //     share_likes: true,
  //     subscribed: false,
  //     title: 'Street.Pics',
  //     total_posts: 1354,
  //     tweet: 'N',
  //     twitter_enabled: false,
  //     twitter_send: false,
  //     type: 'public',
  //     updated: 1526490016,
  //     url: 'http://street.pics/' },
  // ]

  // get the blog
  const blog = data.user.blogs.find(x => x.name === blogName)
  // console.log(blog)

  // get stats

  const deleteReblogs = posts => {
    console.log('Count', posts.length)

    // get reblogs
    let reblogs = posts.filter(x => x.reblogged_from_id).map(x => ({
      id: x.id,
      url: x.post_url,
      likes: x.note_count,
      days: differenceInDays(today, x.date),
      likesPerDay: x.note_count / (1 + differenceInDays(today, x.date))
    }))

    console.log('All posts', posts.length);
    console.log('Reblogs', reblogs.length)

    fs.writeFileSync(resultsFile, JSON.stringify(reblogs))

    const toDelete = reblogs;

    let count = 0;
    let deletions = 0;

    if (true) { // !isDev) {
      toDelete.forEach(x => {
        count += 1;

        setTimeout(() => {
          client.deletePost(blogName, x.id, (err, data) => {
            if (err) {
              console.log('Error deleting', err)
            } else {
              deletions += 1;
              console.log('Deleted', deletions, x.url)
            }
          })

        }, count * 3000)

      })
    }

  }

  const processPosts = posts => {
    fs.writeFileSync(tempFile, JSON.stringify(posts, null, 2))

    deleteReblogs(posts)
  }

  const getPosts = (offset, posts, callback) => {
    const options = {
      type: 'photo',
      limit: 20,
      offset: offset,
      reblog_info: true
    }

    client.posts(blogName, options, (err, data) => {
      let getMore = false

      if (data.posts.length) {
        posts = [...posts, ...data.posts]

        getMore = data.posts.length === 20
      }

      if (getMore) {
        getPosts(offset + 20, posts, callback)
      } else {
        callback(posts)
      }
    })
  }

  // start

  if (!isDev || !fs.existsSync(tempFile)) {
    getPosts(0, [], processPosts)
  } else {
    const posts = JSON.parse(fs.readFileSync(tempFile))
    deleteReblogs(posts)
  }
})
