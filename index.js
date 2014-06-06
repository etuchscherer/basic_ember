var express = require('express');
var bodyParser = require('body-parser')

var app = express();
app.use(bodyParser());

var currentToken;

var contacts = [
	{
		name: 'Steve',
		number: 2013330941
	}
];


app.get('/data.json', function(req, res) {
	if (validTokenProvided(req, res)) {
		res.send(contacts);
	}
});

app.use('/', express.static(__dirname + '/app'));
app.use('/js', express.static(__dirname + '/bower_components'));

app.post('/auth.json', function(req, res) {

  var body = req.body,
      username = body.username,
      password = body.password;

  if (username == 'ember' && password == 'casts') {
    // Generate and save the token (forgotten upon server restart).
    currentToken = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    res.send({
      success: true,
      token: currentToken
    });
  } else {
    res.send({
      success: false,
      message: 'Invalid username/password'
    });
  }
});

function validTokenProvided(req, res) {

  // Check POST, GET, and headers for supplied token.
  var userToken = req.body.token || req.param('token') || req.headers.token;

  if (!currentToken || userToken != currentToken) {
    res.send(403, { error: 'Invalid token. You provided: ' + userToken });
    return false;
  }

  return true;
}

app.listen(3000);
console.log('Server is running…');