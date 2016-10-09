/* @flow */

//var squel = require('squel').useFlavour('postgres');
//var db = require('../db');

module.exports = function(sequelize: Object, DataTypes: Object) {
    var User = sequelize.define("User", {
        twitter_screen_name: DataTypes.STRING,
        twitter_oauth_token: DataTypes.STRING, // used to obtain a token in oauth flow.
        twitter_oauth_token_secret: DataTypes.STRING, // used to obtain a token in oauth flow.
        twitter_access_token: DataTypes.STRING, // the actual token can use on twitter API on behalf of user.
        twitter_access_secret: DataTypes.STRING 
    }, {
        defaultScope: {
            where: {
                deleted_at: null
            }
        },
        classMethods: {
        }
    });

    return User;
};
