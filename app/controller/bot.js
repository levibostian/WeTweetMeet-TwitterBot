/* @flow */

var Twitter = require('twitter');
var Promise = require('bluebird');
var models = require('../model');
var User = models.User;
var express = require('express');
var request = require('request-promise');
request.debug = true;
var querystring = require("querystring");
var oauthSignature = require("oauth-signature");
var uid2 = require('uid2');
var queryString = require('query-string');
var TwitterAPI = require('node-twitter-api');

const baseURL: ?string = process.env.WE_TWEET_MEET_URL;
const consumerKey: ?string = process.env.WE_TWEET_MEET_CONSUMER_KEY;
const consumerSecret: ?string = process.env.WE_TWEET_MEET_CONSUMER_SECRET;

if (!baseURL || !consumerKey || !consumerSecret) { throw new Error("You must set environmental variables before running."); }

var twitterLogin = new TwitterAPI({
    consumerKey: consumerKey,
    consumerSecret: consumerSecret,
    callback: baseURL + "/sign-in-with-twitter/callback"
});

var app = express();
app.set('port', 5000);

app.get('/sign-in-with-twitter/callback', function(req, res, next) {
    var oauthToken: string = req.query.oauth_token;
    var oauthVerifier: string = req.query.oauth_verifier;

    console.log('info', 'sign in callback');
    User.findOne({
        where: {
            twitter_oauth_token: oauthToken
        }
    }).then(function(user: ?User) {
        if (user == null) {
            console.log('info', 'user null');
            return res.status(402).send("User not found.");
        } else {
            twitterLogin.getAccessToken(oauthToken, user.twitter_oauth_token_secret, oauthVerifier, function(error, accessToken, accessTokenSecret, results) {
                if (error) {
                    console.log(error);
                    return res.status(500).send("Sorry, there was an error");
                } else {
                    if (user == null) {
                        throw new Error("this shouldnt even be here. flow isnt catching this above");
                    }

                    user.update({
                        twitter_access_token: accessToken,
                        twitter_access_secret: accessTokenSecret
                    }).then(function(result) {
                        if (user == null) {
                            throw new Error("this shouldnt even be here. flow isnt catching this above");
                        }

                        return User.findOne({where: {twitter_screen_name: user.twitter_screen_name}});
                    }).then(function(user: User) {
                        console.log('info', 'logged in!!!');
                        // TODO lookup pending tweet, respond to tweet with lookup response.
                        return res.status(200).send("Logged in!!");
                    }).catch(function(error) {
                        console.log('error', 'error' + error.message);
                        return res.status(500).send("Sorry, there was an error.");
                    });
                }
            });
        }
    });
});        

var client = new Twitter({
    consumer_key: process.env.WE_TWEET_MEET_CONSUMER_KEY,
    consumer_secret: process.env.WE_TWEET_MEET_CONSUMER_SECRET,
    access_token_key: process.env.WE_TWEET_MEET_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.WE_TWEET_MEET_ACCESS_TOKEN_SECRET
});

function isTweetSentToMe(tweet: Object): boolean {
    if (tweet.text == null || tweet.text.length <= 0) { return false; }

    return tweet.text.split(" ")[0] === process.env.WE_TWEET_MEET_TWITTER_HANDLE;
};

function assertNotSendingTweetToSelf(tweet: Object): Promise<> {
    return new Promise(function(resolve, reject) {
        var splitTweetText = tweet.text.split(" ");

        if (splitTweetText[1] === splitTweetText[3]) {
            sendReplyTweet(tweet, "you talk to yourself, hmm? That's cool.");
            return reject(new Error("Talking to self."));
        } else {
            return resolve();
        }
    });
};

function sendReplyTweet(tweet: Object, message: string): Promise<> {
    return new Promise(function(resolve, reject) {
        var replyTweet: string = "@" + tweet.user.screen_name + " " + message;

        var reply: Object = {status: replyTweet, in_reply_to_status_id: tweet.id};

        if (process.env.NODE_ENV === "production") {
            client.post('statuses/update', reply,  function(error, tweet, response) {
                if (error) { return reject(error) };

                return resolve();
            });
        } else {
            console.log('info', "sending tweet: " + replyTweet);
            return resolve();
        }
    });
};

function isTweetCorrectSyntax(tweet: Object): Promise<boolean> {
    return new Promise(function(resolve, reject) {
        var splitTweetText = tweet.text.split(" ");

        // syntax: "@wetweetmeet @yourhandle + @otherhandle"
        var isTweetRightSyntax: boolean = /(@)\w+/.test(splitTweetText[1]) && splitTweetText[2] === "+" && /(@)\w+/.test(splitTweetText[3])

        if (!isTweetRightSyntax) {
            sendReplyTweet(tweet, "sorry, I don't understand. Tweet me: @someone + @someoneelse");
            return reject(new Error("Invalid syntax"));
        } else {
            return resolve(isTweetRightSyntax);
        }
    });
};

function parseQuery(qstr: string): Promise<Object> {
    return new Promise(function(resolve, reject) {
        var query = {};

        var a: string[];
        if (qstr[0] === "?") {
            a = qstr.substr(1).split('&');
        } else {
            a = qstr.split('&');
        }

        for (var i = 0; i < a.length; i++) {
            var b: string[] = a[i].split('=');
            query[decodeURIComponent(b[0])] = decodeURIComponent(b[1] || '');
        }

        return resolve(query);
    });
}

function getTwitterRequestToken(user: User): Promise<User> {
    return new Promise(function(resolve, reject) {
        if (!process.env.WE_TWEET_MEET_CONSUMER_KEY || !process.env.WE_TWEET_MEET_ACCESS_TOKEN_KEY || !process.env.WE_TWEET_MEET_URL) { throw new Error('Need to set consumer key and access token and base URL'); }

        var options = {
            method: 'POST',
            uri: 'https://api.twitter.com/oauth/request_token',
            body: {
                oauth_callback: process.env.WE_TWEET_MEET_URL + "/sign-in-with-twitter/callback"
            },
            headers: {
            },
            json: true // Automatically parses the JSON string in the response
        };

        var authSignatureParams = {
            oauth_consumer_key: process.env.WE_TWEET_MEET_CONSUMER_KEY,
            oauth_token: process.env.WE_TWEET_MEET_ACCESS_TOKEN_KEY,
            oauth_nonce: uid2(16),
            oauth_timestamp: Math.floor((new Date).getTime() / 1000),
            oauth_signature_method: 'HMAC-SHA1',
            oauth_version: '1.0'
        };

        var signature: string = oauthSignature.generate(options.method, options.uri, authSignatureParams, process.env.WE_TWEET_MEET_CONSUMER_SECRET, process.env.WE_TWEET_MEET_ACCESS_TOKEN_SECRET, {encodeSignature: true});

        var authHeader = 'OAuth oauth_consumer_key="' + authSignatureParams.oauth_consumer_key + '",';
        authHeader += 'oauth_nonce="' + authSignatureParams.oauth_nonce + '",';
        authHeader += 'oauth_signature_method="' + authSignatureParams.oauth_signature_method + '",';
        authHeader += 'oauth_timestamp="' + authSignatureParams.oauth_timestamp + '",';
        authHeader += 'oauth_token="' + authSignatureParams.oauth_token + '",';
        authHeader += 'oauth_version="1.0",';
        authHeader += 'oauth_signature="' + signature + '"';

        options.headers = {
            'Authorization': authHeader
        };

        console.log('info', 'getting twitter request tokn');
        request(options).then(function(response) {
            return parseQuery(response);
        }).then(function(parsedQuery: Object) {
            console.log('info', 'request token back.');
            console.log('info', 'response token ' + parsedQuery.oauth_token);

            return user.update({
                twitter_oauth_token: parsedQuery.oauth_token,
                twitter_oauth_token_secret: parsedQuery.oauth_token_secret
            });
        }).then(function(result) {
            return User.findOne({where: {twitter_screen_name: user.twitter_screen_name }});
        }).then(function(user: User) {
            return resolve(user);
        }).catch(function(error) {
            console.log('error', 'error' + error.message);
        });
    });
};

function getUser(tweet: Object): Promise<Object> {
    return new Promise(function(resolve, reject) {
        var username: string = tweet.user.screen_name;

        console.log('info', 'getting user');
        User.findOne({
            where: {
                twitter_screen_name: username
            }
        }).then(function(user: ?User) {
            if (user == null) {
                User.create({twitter_screen_name: username}).then(function(user: User) {
                    return getTwitterRequestToken(user);
                }).catch(function(error) {
                    return reject(error);
                });
            } else {
                if (user.twitter_access_token == null) {
                    return getTwitterRequestToken(user);
                } else {
                    return resolve(user);
                }
            }
        }).then(function(user: User) {
            return sendReplyTweet(tweet, "first time using We Tweet Meet? Please, login first: " + "https://api.twitter.com/oauth/authenticate?oauth_token=" + user.twitter_oauth_token);
        }).then(function() {
            return reject(new Error("User has not logged into service before."));
        }).catch(function(error) {
            return reject(error);
        });
    });
};

function findFirstTweetTogether(tweet: Object, user: User): Promise<> {
    return new Promise(function(resolve, reject) {
        console.log('info', 'getting first tweet together');
        return resolve();
        // TODO use twitter search on behalf of user's access token. truncate down the tweets (using max_id) until find last one.
    });
};

function processTweet(tweet: Object) {
    isTweetCorrectSyntax(tweet).then(function() {
        console.log("correct syntax.");
        return assertNotSendingTweetToSelf(tweet);
    }).then(function() {
        return getUser(tweet);
    }).then(function(user) {
        return findFirstTweetTogether(tweet, user);
    }).then(function() {

    }).catch(function(error) {
        console.log('error', "error" + error.message);
    });
};

models.sequelize.sync().then(function() {
    var server = app.listen(app.get('port'), function() {
        var host = server.address().address;
        var port = server.address().port;

        console.log('info', 'Server started. Listening at: %s:%s', host, port);
    });

    client.stream('user', {}, function(stream) {
        stream.on('data', function(tweet) {
            console.log('info', "tweet received" + tweet.text);
            if (isTweetSentToMe(tweet)) {
                console.log('info', "processing");
                processTweet(tweet);
            } else {
                console.log('info', "not sent to me.");
            }
        });

        stream.on('error', function(error) {
            console.log('error', error.message);
        });
    });
});
