/* eslint-disable  func-names */
/* eslint quote-props: ["error", "consistent"]*/
/**
 * This sample demonstrates a simple skill built with the Amazon Alexa Skills
 * nodejs skill development kit.
 * This sample supports multiple lauguages. (en-US, en-GB, de-DE).
 * The Intent Schema, Custom Slots and Sample Utterances for this skill, as well
 * as testing instructions are located at https://github.com/alexa/skill-sample-nodejs-fact
 **/

'use strict';

const Alexa = require('alexa-sdk');
const OAuth = require('oauth').OAuth;
// Set up oauth authentication
const oa = new OAuth(
  'https://api.twitter.com/oauth/request_token',
  'https://api.twitter.com/oauth/access_token',
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  '1.0A',
  process.env.CALLBACK_URL,
  'HMAC-SHA1'
);


const PUNCTUATION = '.?!"\'';
const VOWELS = 'aeiou';
function weirdify(tweet) {
  return tweet
    .toLowerCase()
    .split('')
    .filter((c) => PUNCTUATION.indexOf(c) < 0) //Remove all punctuation
    .filter((c) => {
      if (VOWELS.indexOf(c) >= 0) {
        return Math.random() > 0.3; // Remove 30% of vowels
      } else {
        return true;
      }
    })
    .map((c) => c == 'y' ? 'i': c) // Replace all y's with i's
    .reduce((str, c) => str + c) // back to a string
    .trim(); //No whitespace
}

const CANCEL = "Okay, I won't post anything"
const TOO_LONG_SPEECH = "Please try to be weird with fewer characters."
const TOO_LONG_TITLE = "Your Ramble"
const NEW_USER = "Hello, please login with the companion app to begin using Weirder!"
const TWITTER_ERROR_SPEECH = "Please log in on the companion app."
const POSTED_SPEECH = "I posted your weird content."
const POSTED_TITLE = "Here's what I posted"
const DIDNT_HEAR = "I'm not sure I heard you right, please try again."
const MENU = "Welcome to weirder, a place for all your weird thoughts. You can ask me to post things by saying <say-as interpret-as=\"interjection\">tell Weird Poster to post</say-as> followed by some weird thought. What would you like me to post?"
const HELP = "You can use me to make weird posts to social media. Do you have any strange thoughts for me to post?"

const handlers = {
    'PostTweet': function () {
      const content = this.event.request.intent.slots.Content.value;
      if (!content) {
        this.emit(':ask', DIDNT_HEAR);
        return;
      }
      const weirdedContent = weirdify(content);
      const alexaToken = this.event.session.user.accessToken;
      const splitToken = alexaToken.split('_');
      const token = splitToken[0];
      const secret = splitToken[1];
      if (weirdedContent.length > 140) {
        this.emit(":tellWithCard", TOO_LONG_SPEECH, TOO_LONG_TITLE, weirdedContent);
      } else {
        const postBody = {
          status: weirdedContent
        }
        oa.post('https://api.twitter.com/1.1/statuses/update.json',
          token,
          secret,
          postBody,
          "text/json",
          (err, res) => {
            if (err) {
              console.log(err);
              this.emit(":tellWithLinkAccountCard", TWITTER_ERROR_SPEECH);
            } else {
              //https://dev.twitter.com/rest/reference/post/statuses/update
              const twitterResponse = JSON.parse(res);
              this.emit(":tellWithCard", POSTED_SPEECH, POSTED_TITLE, weirdedContent);
            }
          }
        );
      }
    },
    'AMAZON.CancelIntent': function() {
      this.emit(':tell', CANCEL)
    },
    'AMAZON.StopIntent': function() {
      this.emit(':tell', CANCEL)
    },
    'AMAZON.HelpIntent': function() {
      this.emit(':ask', HELP)
    },
    'Unhandled': function() {
      const alexaToken = this.event.session.user.accessToken;
      if (! alexaToken) {
        this.emit(':tellWithLinkAccountCard', NEW_USER)
      } else {
        this.emit(':ask', MENU)
      }
    }
};

exports.handler = (event, context) => {
    const alexa = Alexa.handler(event, context);
    alexa.registerHandlers(handlers);
    alexa.execute();
};
