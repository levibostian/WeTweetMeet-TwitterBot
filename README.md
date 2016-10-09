# We Tweet Meet - Twitter bot

# Deploy

```
export WE_TWEET_MEET_CONSUMER_KEY="consumer key here"
export WE_TWEET_MEET_CONSUMER_SECRET="consumer secret here"
export WE_TWEET_MEET_ACCESS_TOKEN_KEY="access token key here"
export WE_TWEET_MEET_ACCESS_TOKEN_SECRET="access token secret here"
export WE_TWEET_MEET_TWITTER_HANDLE="@yourtwitterhandle"
export WE_TWEET_MEET_URL="https://yourdomain.com"
```

Obtain these credentials [here](https://apps.twitter.com/) when you register a new app.

---

# ExpressjsBlanky
Get up and running FAST on your next API project.

# Development
The API is configured for development, staging, and production builds.

```
npm install
export NODE_ENV="development"
```

You may set `NODE_ENV` to:

* `development`
* `production`
* `staging`

Next we need to create a configuration: `cp app/config/config.example.json app/config/config.json` and then edit it: `nano app/config/config.json`. Edit the names of the databases, change what type of database you are using for each environment ('mysql'|'sqlite'|'postgres'|'mssql'), change the usernames and passwords to connect to your database.

We are now ready for action:

```
npm start
```

ExpressjsBlanky is designed to read the value of `NODE_ENV` and setup the environment for you. The config file does it all from there.

# Documentation

This API is uses [apidoc](http://apidocjs.com/) for API documentation.
All documentation is located in HTML in `apidoc/`. You can open `apidoc/index.html` directly in your web browser to view the API documentation.
