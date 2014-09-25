/*
 * Copyright 2013 Apereo Foundation (AF) Licensed under the
 * Educational Community License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License. You may
 * obtain a copy of the License at
 *
 *     http://www.osedu.org/licenses/ECL-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an "AS IS"
 * BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

var _ = require('underscore');

var general = require('./general.js');
var messageLoader = require('./message.dataload');

exports.loadContent = function(content, users, groups, SERVER_URL, callback) {
    createContent(content, users, groups, SERVER_URL, function(body, success, res) {
        if (success) {
            try {
                // Retain the original id
                content.originalid = content.id;

                // Get the generated content id and add it to the content item
                content.id = content.generatedid = JSON.parse(body).id;
            } catch (ex) {
                console.log('Error parsing create content HTTP response:');
                console.log(body);
                return callback(body, success, res);
            }

            // Create the content messages.
            var contentUsers = _.union(content.roles['manager'].users, content.roles['viewer'].users);
            var createdMessages = [];
            createMessages(content, users, groups, SERVER_URL, contentUsers, createdMessages, function() {
                callback(body, success, res);
            });
        } else {
            callback(body, success, res);
        }
    });
};

/**
 * Create a new piece of content
 *
 * @param  {Content}     content         The content object to create
 * @param  {User[]}      users           An array of all the User model objects in this batch.
 * @param  {Group[]}     groups          An array of all the Group model objects in this batch.
 * @param  {String}      SERVER_URL      The server where the content should be created.
 * @param  {Function}    callback        Standard callback function
 */
var createContent = function(content, users, groups, SERVER_URL, callback) {
    var contentObj = {
        'resourceSubType': content.resourceSubType,
        'displayName': content.name,
        'visibility': content.visibility
    };

    if (content.hasDescription) {
        contentObj['description'] = content.description;
    }
    if (content.roles['viewer'].users.length || content.roles['viewer'].groups.length) {
        contentObj['viewers'] = _.union(content.roles['viewer'].users, content.roles['viewer'].groups);
    }
    if (content.roles['manager'].users.length || content.roles['manager'].groups.length) {
        contentObj['managers'] = _.union(content.roles['manager'].users, content.roles['manager'].groups);
    }

    if (content.resourceSubType === 'file') {
        general.filePost(SERVER_URL + '/api/content/create', content.path, content.filename, {
                'auth': users[content.creator],
                'params': contentObj
            }, callback);

    } else {
        if (content.resourceSubType === 'link') {
            contentObj['link'] = content.link;
        }

        general.urlReq(SERVER_URL + '/api/content/create', {
            'method': 'POST',
            'params': contentObj,
            'auth': users[content.creator]
        }, callback);
    }
};

/**
 * Creates the messages for a piece of content.
 *
 * @param {Content}     content         The content object to create the messages for
 * @param {User[]}      users           An array of all the User model objects in this batch.
 * @param {Group[]}     groups          An array of all the Group model objects in this batch.
 * @param {String}      SERVER_URL      The server where the messages should be created.
 * @param {User[]}      contentUsers    An array of users that are members or managers of this piece of content. For each message we'll select at random if the content creator or one of the content members/manager should create the message.
 * @param {Object[]}    createdMessages An array of message items that are already created for this piece of content. The id's will be used to generate replies on messages (ie: threading)
 * @param {Function}    callback        Standard callback function
 */
var createMessages = function(content, users, groups, SERVER_URL, contentUsers, createdMessages, callback) {
    if (content.hasMessages && content.messages.length > 0) {
        messageLoader.createMessages(content.id, 'content', content.messages, users, SERVER_URL, contentUsers, users[content.creator], createdMessages, callback);
    } else {
        callback();
    }
};
