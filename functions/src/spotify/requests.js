var express = require('express');
var router = express.Router();
var http = require("http");
var request = require("request");

router.get("/currenttrack/:accesstoken", (req,res,next) => {
    var options = {
      url: 'https://api.spotify.com/v1/me/player/currently-playing',
      headers: {
        'Authorization': 'Bearer {' + req.params.accesstoken+'}'
      }
    };
    request(options, (error, response, body) => {
        if(error) return res.send(error).end();
        if(response.statusCode === 200) res.status(200).send(body).end();
    });
})