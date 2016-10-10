# We Tweet Meet - Twitter bot

A bot that shows you your first tweet with someone. Created by @levibostian & @willlenzenjr

We Tweet Meet? was a dream not able to come true. [Read the story on We Tweet Meet?'s Twitter account to hear about it.'](https://twitter.com/wetweetmeet)

I learned a lot. Check out the code. If I was to build a bot again, I will use [async](https://github.com/caolan/async) more along side [bluebird](https://github.com/petkaantonov/bluebird) for parts of the program. Would remove lots of the hacky flow I had to implement. 

# Deploy

* Create a Twitter account to act as a bot.

* Obtain credentials [here](https://apps.twitter.com/) when you register a new app with Twitter on this created Twitter account.

* Deploy code to server with following environment variables.

```
export WE_TWEET_MEET_CONSUMER_KEY="consumer key here"
export WE_TWEET_MEET_CONSUMER_SECRET="consumer secret here"
export WE_TWEET_MEET_ACCESS_TOKEN_KEY="access token key here"
export WE_TWEET_MEET_ACCESS_TOKEN_SECRET="access token secret here"
export WE_TWEET_MEET_TWITTER_HANDLE="@yourtwitterhandle"
export WE_TWEET_MEET_URL="https://yourdomain.com"
```

Run program:

```
npm install
npm start
```
