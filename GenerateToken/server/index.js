const express = require('express');
const morgan = require('morgan')
const path = require('path');
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

//For saving tokens during the authentication process
const token_cache = {};
//To hold the state passed by Alexa, let her know she hasn't been hacked
const state_cache = {};

const app = express();
app.use(morgan('combined'))

const PORT = process.env.PORT || 8080;

//Serve static assets
app.use(express.static(path.resolve(__dirname, '..', 'build')));

app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, '..', 'build', 'index.html'))
});

app.get('/request_token', (req, res) => {
  const state = req.query.state;
  const redirect_uri = req.query.redirect_uri;
  oa.getOAuthRequestToken((err, token, token_secret) => {
    if (err) {
      console.error(err)
      res.status(500).send("I'm having trouble talking to Twitter")
    } else {
      token_cache[token] = token_secret;
      state_cache[token] = {state, redirect_uri};
      res.send(token);
    }
  })
});

app.get('/callback', (req, res) => {
  const token = req.query.oauth_token;
  const verifier = req.query.oauth_verifier;
  if (!(token in token_cache && token in state_cache)) {
    res.status(403).send("Access token was not obtained correctly.")
  } else {
    token_secret = token_cache[token];
    const state = state_cache[token];
    oa.getOAuthAccessToken(token, token_secret, verifier, (err, token, token_secret) => {
      if (err) {
        console.error(err);
        res.status(500).send("I'm having trouble talking to Twitter");
      } else {
        const alexa_token = token + "_" + token_secret //I don't want to hold on to this
        // Send all this shit back to alexa
        const redirect = `${state.redirect_uri}#state=${state.state}&access_token=${alexa_token}&token_type=Bearer`;
        console.log("Redirecting to " + redirect)
        res.redirect(301, redirect);
      }
    });
  }
});

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
