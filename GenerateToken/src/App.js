import React, { Component } from 'react';
import axios from 'axios';

class App extends Component {
  constructor() {
    super();
    this.login = this.login.bind(this);
  }
  login() {
    const query = window.location.search; //Pass on the Alexa state
    axios.get(`/request_token/${query}`)
      .then((res) => {
        const token = res.data;
        window.location = `https://api.twitter.com/oauth/authenticate?oauth_token=${token}`;
      })
      .catch((err) => {
        console.error(err)
      });
  }
  render() {
    return (
      <div>
        <div
          className="jumbotron"
          style={{
            textAlign: "center"
          }}>
          <h1>Weirdr</h1>
          <p>Let's get weird</p>
        </div>
        <div style={{
          textAlign: "center"
        }}>
          <button type="button" className="btn btn-info"
            onClick={this.login}>
            Click here to login with Twitter.
          </button>
        </div>
      </div>
    );
  }
}

export default App;
