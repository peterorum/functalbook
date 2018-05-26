'use strict'

// docs: https://www.npmjs.com/package/@jigsaw/tumblr
const tumblr = require('tumblr.js')

const fs = require('fs')
const sortBy = require('lodash/sortBy')
const differenceInDays = require('date-fns/difference_in_days')
/* eslint-disable handle-callback-err */

// config

const postsToKeep = 140

const tempFile = `/tmp/posts.json`
const resultsFile = `/tmp/results.json`

// if false, expects /tmp/posts.json to exist.
// first time run as dev, it will save the file. Takes a while.
// actual deletion does not happen for dev.
const isDev = false

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

  const deleteLeastPopular = posts => {
    console.log('Count', posts.length)

    // filter out reblogs
    let data = posts.filter(x => !x.reblogged_from_id).map(x => ({
      id: x.id,
      url: x.post_url,
      likes: x.note_count,
      days: differenceInDays(today, x.date),
      likesPerDay: x.note_count / (1 + differenceInDays(today, x.date))
    }))

    data = sortBy(data, x => x.likesPerDay)

    console.log(data.length)

    fs.writeFileSync(resultsFile, JSON.stringify(data))

    if (data.length > postsToKeep) {
      // delete  lowest rated one
      const id = data[0].id

      const toDelete = posts
        .filter(x => x.id === id || x.reblogged_from_id === id.toString())
        .map(x => ({ id: x.id, url: x.post_url }))

      console.log(toDelete)

      if (!isDev) {
        toDelete.forEach(x => {
          client.deletePost(blogName, x.id, (err, data) => {
            if (err) {
              console.log('Error deleting', err)
            } else {
              console.log('Deleted', x.url)
            }
          })
        })
      }
    }
  }

  const processPosts = posts => {
    fs.writeFileSync(tempFile, JSON.stringify(posts, null, 2))

    deleteLeastPopular(posts)
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

  if (blog.posts > postsToKeep) {
    if (!isDev || !fs.existsSync(tempFile)) {
      getPosts(0, [], processPosts)
    } else {
      const posts = JSON.parse(fs.readFileSync(tempFile))
      deleteLeastPopular(posts)
    }
  }
})
