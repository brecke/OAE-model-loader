var general = require("./api/general.js");
var userAPI = require("./api/user.api.js");
var contactAPI = require("./api/contacts.api.js");
var worldAPI = require("./api/world.api.js");

//////////////////////////////////////
// OVERALL CONFIGURATION PARAMETERS //
//////////////////////////////////////

var SCRIPT_FOLDER = "scripts";

if (process.argv.length !== 5){
    throw new Error("Please run this program in the following way: node loaddata.js <NUMBER OF BATCHES TO LOAD> <SERVER_URL> <ADMIN PASSWORD>");
}

var BATCHES = parseInt(process.argv[2], 10);
var SERVER_URL = process.argv[3];
var ADMIN_PASSWORD = process.argv[4];

////////////////////
// KICK OFF BATCH //
////////////////////

var currentBatch = 0;

var loadNextBatch = function(){
    if (currentBatch < BATCHES){
        console.log("Loading Batch " + currentBatch);
        // Load the data from the model
        var users = general.loadJSONFileIntoArray("./scripts/users/" + currentBatch + ".txt");
        var contacts = general.loadJSONFileIntoArray("./scripts/contacts/" + currentBatch + ".txt");
        var worlds = general.loadJSONFileIntoArray("./scripts/worlds/" + currentBatch + ".txt");
        loadUsers(users, contacts, worlds);
    } else {
        console.log("*****************************");
        console.log("Finished generating " + BATCHES + " batches");
        console.log("Requests made: " + general.requests);
        console.log("Request errors: " + general.errors);
    }
}

var finishBatch = function(){
    console.log("Finished Loading Batch " + currentBatch);
    console.log("=================================");
    currentBatch++;
    loadNextBatch();
}

///////////
// USERS //
///////////

var loadUsers = function(users, contacts, worlds){
    var currentUser = 0;
    var loadNextUser = function(){
        console.log("  Finished Loading User " + currentUser + " of " + users.length);
        if (currentUser >= users.length){
            loadContacts(users, contacts, worlds);
        } else {
            var nextUser = users[currentUser];
            userAPI.loadUser(nextUser, SERVER_URL, ADMIN_PASSWORD, loadNextUser);
            currentUser++;
        }
    }
    loadNextUser();
}

//////////////
// CONTACTS //
//////////////

var loadContacts = function(users, contacts, worlds){
    var currentContact = 0;
    var loadNextContact = function(){
        console.log("  Finished Loading Contact " + currentContact + " of " + contacts.length);
        if (currentContact >= contacts.length){
            loadWorlds(users, worlds);
        } else {
            var nextContact = contacts[currentContact];
            currentContact++;
            contactAPI.loadContact(nextContact, users, SERVER_URL, ADMIN_PASSWORD, loadNextContact);
        }
    }
    loadNextContact();
}

////////////
// WORLDS //
////////////

var loadWorlds = function(users, worlds){
    var currentWorld = -1;
    var loadNextWorld = function(){
        console.log("  Finished Loading World " + (currentWorld + 1) + " of " + worlds.length);
        if (currentWorld >= worlds.length){
            loadWorldGroupMemberships(users, worlds);
        } else {
            var nextWorld = worlds[currentWorld];
            currentWorld++;
            worldAPI.loadWorld(nextWorld, users, SERVER_URL, ADMIN_PASSWORD, loadNextWorld);
        }
    }
    loadNextWorld();
}

var loadWorldGroupMemberships = function(users, worlds){
    var currentWorldGroupMembership = -1;
    var loadNextWorldGroupMembership = function(){
        console.log("  Finished Loading Group Memberships " + (currentWorldGroupMembership + 1) + " of " + worlds.length);
        if (currentWorldGroupMembership >= worlds.length){
            finishBatch();
        } else {
            console.log(currentWorldGroupMembership);
            currentWorldGroupMembership++;
            var nextWorld = worlds[currentWorldGroupMembership];
            worldAPI.loadGroupMembership(nextWorld, users, SERVER_URL, ADMIN_PASSWORD, loadNextWorldGroupMembership);
        }
    }
    loadNextWorldGroupMembership();
}

///////////
// START //
///////////

loadNextBatch();