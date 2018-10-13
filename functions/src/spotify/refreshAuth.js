/*var express = require('express');
var router = express.Router();
var http = require("http");
var request = require("request");


if(spotifyAuthData && lastAuthTime && spotifyAuthData.expires_in*1000 + lastAuthTime - 20000 < Date.now() ) {
  spotifyAuthServer.post('/token',qs.stringify({
      grant_type:'refresh_token',
      refreshToken: spotifyAuthData.refresh_token
    })
      .then( r => {
        setSpotifyAuthData(r.data())
        return spotifyServer.get('/me')
      }, error => {
        if (error.response && error.response.data) {
          console.log(error.request)
          response.status(error.response.status).send({
            request: error.request.data,
            response: error.response.data,
          })
        } else {
          response.status(500).send("Server Unknown Error")
          console.log(error)
        }
      })
  )
}*/