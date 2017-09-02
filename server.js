'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express();
const token = process.env.token || 'empty';
app.set('port', (process.env.PORT || 5000))

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json())

// Index route
app.get('/', function (req, res) {
    res.send('Hello world, I am a chat bot')
})

// for Facebook verification
app.get('/webhook', function (req, res) {
  console.log('get');
  if (req.query['hub.verify_token'] === 'test_token') {
      res.send(req.query['hub.challenge'])
  } else
    res.send('Error, wrong token')
})

app.post('/webhook', function (req, res) {
  var data = req.body;
  console.log('Called webhook');
  console.log(data);
  // Make sure this is a page subscription
  if (data.object === 'page') {

    // Iterate over each entry - there may be multiple if batched
    data.entry.forEach(function(entry) {
      var pageID = entry.id;
      var timeOfEvent = entry.time;

      // Iterate over each messaging event
      entry.messaging.forEach(function(event) {
        if (event.message) {
          receivedMessage(event);
        } else if (event.postback) {
          receivedPostback(event); 
        } else {
          console.log("Webhook received unknown event: ", event);
        }
      });
    });

    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know
    // you've successfully received the callback. Otherwise, the request
    // will time out and we will keep trying to resend.
    res.send(200);
  } else 
    res.send(400);
});

function receivedMessage(event) {
  console.log(event);
  var senderId = event.sender.id;
  var recipientId = event.recipient.id;
  var timeOfMessage = event.time;
  var message = event.message;
  console.log('Received a message from user %d and page %d at %d with message:',
    senderId, recipientId, timeOfMessage)
  console.log(JSON.stringify(message));
  var messageId = message.mid;

  var messageText = message.text;
  var messageAttachements = message.messageAttachements;

  if (messageText) {
    switch (messageText) {
      case 'generic':
        sendGenericMessage(senderId);
        break;
      default:
        sendTextMessage(senderId, messageText);
    }
  } else if (messageAttachements) {
    sendTextMessage(senderId, "Message with attachments received.");
  }
}

function receivedPostback(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfPostback = event.timestamp;

  // The 'payload' param is a developer-defined field which is set in a postback 
  // button for Structured Messages. 
  var payload = event.postback.payload;

  console.log("Received postback for user %d and page %d with payload '%s' " + 
    "at %d", senderID, recipientID, payload, timeOfPostback);

  // When a postback is called, we'll send a message back to the sender to 
  // let them know it was successful
  sendTextMessage(senderID, "Postback called");
}

function sendGenericMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [{
            title: "SAINT-EMILION GRAND CRU 2011 - Chateau Piney",
            subtitle: "89 RON",
            item_url: "https://www.unvinpezi.ro/",               
            image_url: "https://www.unvinpezi.ro/data/articles/2/7214/wnl-cpsegc11-1b.jpg",
            buttons: [{
              type: "web_url",
              url: "https://www.unvinpezi.ro/",
              title: "Comanda"
            }, {
              type: "postback",
              title: "Dezabonare",
              payload: "Dezabonare",
            }],
          }]
        }
      }
    }
  };  

  callSendAPI(messageData);
}

function sendTextMessage(recipientId, messageText) {
  console.log(recipientId);
  console.log(messageText);
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  }

  callSendAPI(messageData);
}

function callSendAPI (message) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: token },
    method: 'POST',
    json: message
  }, function (err, res, body){
    if (err) {
      console.log(err);
      return;
    } else {
      console.log(res);
      console.log('Response status code: %d', res.statusCode);
      console.log('Message to id %d', body.recipient_id);
    }
  })
}

// Spin up the server
app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'))
})