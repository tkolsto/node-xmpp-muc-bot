node-xmpp-muc-bot
=============
Very basic Node.js XMPP/Jabber bot that listens and responds to keywords observed in 
multi user chat-rooms, and it has a http "api" exposed that can be used 
to do announcements on behalf of the bot from external apps just by opening a url.

Example
-------
To make the bot say "hello world" in configured MUC: 

	curl "http://localhost:8081/say/hello world"

Why
-------
Based off prototype code for an internal chat bot in use at [Adell Group](http://www.adell.n) that makes announcements 
on code commits, deployments, build success/failures and other status messages from our continuous integration (CI) system(s).
