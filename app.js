#!/usr/local/bin/node

//
// Very basic XMPP/Jabber bot that listens and responds to keywords said in
// multi user chatrooms, and has an http "api" exposed that can be used 
// to do announcements on behalf of the bot (to the muc) from external
// apps just by opening a url.
//
//
// Usage:
//  1. Tweak config
//  2. Run `node app.js`
//

// config
var jid = "user@server.com"               // xmpp username
var password = "your_password"            // xmpp password
var room_jid = "dev@muc.domain.com"       // the chatroom to listen to
var room_nick = "Bender"                              // the bots nickname

var http_listen_port = 8081;              // port to run the http "api"
var debug = false;                        // enable to print every xmpp request recieved to the console

var fs = require('fs');
var url = require("url");
var util = require('util');
var http = require('http');
var xmpp = require('node-xmpp');
var request = require('request');
var querystring = require('querystring');

// The http "api" to be used for making announcements on behalf of the bot
// Example: curl "http://localhost:8081/say/hello world" - will make the bot say "hello world" on the configured muc
http.createServer(function (req, res) {

  res.writeHead(200, {'Content-Type': 'text/plain'});

  var pathname = url.parse(req.url).pathname;
  if(debug) console.log("Request for " + pathname + " received.");
  var doit = 0;

  var test = pathname.split('/');
  for(i in test) {
  	if(i == 0) continue;
  	if(i == 1 && test[i].trim() == "say") {
  		doit = 1;
  		continue;
  	}

  	if(i == 2 && doit == 1) {

        var say_this = querystring.unescape(test[i]);
        util.log('[info] ' + "bender said '"+say_this+"' in chatroom");
        
        var uri = 'http://localhost';
    		request({'uri': uri}, function(error, response, body) {
	  			cl.send(new xmpp.Element('message', { from: 'bender@adell.no/bot', to: room_jid, type: 'groupchat' }).c('body').t(say_this));
    		});

  	}
  }

  res.end();

}).listen(http_listen_port);

// the xmpp client
var cl = new xmpp.Client({
  jid: jid + '/bot',
  password: password
});

// if we are debugging, log every request
cl.on('data', function(d) {
  if(debug) util.log("[data in] " + d);
});

cl.on('online', function() {
  util.log("We're online!");

  // set ourselves as online
  cl.send(new xmpp.Element('presence', { type: 'available' }).
    c('show').t('chat')
   );

  // join room (and request no chat history)
  cl.send(new xmpp.Element('presence', { to: room_jid+'/'+room_nick }).
    c('x', { xmlns: 'http://jabber.org/protocol/muc' })
  );

  // send keepalive data or server will disconnect us after 150s of inactivity
  setInterval(function() {
    cl.send(' ');
  }, 30000);
});

cl.on('stanza', function(stanza) {
  // always log error stanzas
  if (stanza.attrs.type == 'error') {
    util.log('[error] ' + stanza);
    return;
  }

  // ignore everything that isn't a room message
  if (!stanza.is('message') || !stanza.attrs.type == 'groupchat') {
    return;
  }

  // ignore messages we sent
  if (stanza.attrs.from == room_jid+'/'+room_nick) {
    return;
  }

  var body = stanza.getChild('body');
  // message without body is probably a topic change
  if (!body) {
    return;
  }
  
  // fetch the message
  var message = body.getText();

  // Look for messages like bender, bot or robot (adjust as needed)
  if(message.regexIndexOf(/(bender|bot|robot)/gim)>=0) {

    var uri = 'http://localhost';
    var message = "";
    
    get_line('./quotes.txt', 1, function(err, line){
			  message = message + line;
		})

    request({'uri': uri}, function(error, response, body) {
      cl.send(new xmpp.Element('message', { from: 'bender@adell.no/bot', to: room_jid, type: 'groupchat' }).c('body').t(message));
    });

  }
  
});


function get_line(filename, line_no, callback) {
  var data = fs.readFileSync(filename, 'utf8');
  var lines = data.split("\n");

	var randLine = new Number(Math.random() * lines.length).toFixed(0);
	if(randLine > 0) randLine = randLine - 1;

    if(+line_no > lines.length){
      throw new Error('File end reached without finding line');
    }

    callback(null, lines[+randLine]);
}

String.prototype.regexIndexOf = function( pattern, startIndex )
{
    startIndex = startIndex || 0;
    var searchResult = this.substr( startIndex ).search( pattern );
    return ( -1 === searchResult ) ? -1 : searchResult + startIndex;
}

