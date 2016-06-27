
var AUTH_URL = 'https://developer-stg.api.autodesk.com/authentication/v1/authenticate';
var COMMENTS_URL = 'https://developer-stg.api.autodesk.com/comments/v2/resources';
var NOTIFY_URL = 'https://developer-stg.api.autodesk.com/notifications/v1/channel';
var myChannel = 'obfuscation'

        signinAndSubscribe = function(callback) {
            $.post('/api/signin', function(authToken) {
                getChannel(authToken.access_token, myChannel, function(channelId) {
                    subscribe(channelId, callback)
                })
            });  
        };

        sendNotification = function(urn) {
            $.post('/api/signin', function(authToken) {
                sendMessage(authToken.access_token, myChannel, JSON.stringify({urn:urn}));
            });  
        }

      function getChannel(accessToken, channelName, next) {
 
        $.ajax({
            type: 'GET',
            url: NOTIFY_URL + '/' + channelName,
            headers: { Authorization: 'Bearer ' + accessToken},
            success: function(response) {
                 console.log(response);
                 next(response.Channel);
              },
            error: function(response) {
                console.log(response);
                createChannel(accessToken, channelName, next);
              }      
         });
      }

    function createChannel(accessToken, channelName, next) {
         $.ajax({
            type: 'POST',
            url: NOTIFY_URL,
            data: JSON.stringify({
                channelName: channelName,
                channelType: 'broadcast'
            }),
            headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + accessToken},
            success: function(response) { 
                next(response); 
            }
        });

    }

   function sendMessage(accessToken, channelName, message) {
         $.ajax({
            type: 'POST',
            url: NOTIFY_URL + '/' + channelName,
            data: JSON.stringify({ message: message }),
            headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + accessToken},
            success: function(response) { 
                console.log(response); 
            },
            error: logError
        });

    }

     function subscribe(channelId, callback) {

             // Create Secure Connection
            var secure_pubnub = PUBNUB.secure({
            subscribe_key : SUBSCRIBE_KEY,
            origin        : "pubsub.pubnub.com",
            ssl           : true,
            cipher_key    : CIPHER_KEY
            });

            secure_pubnub.subscribe({
                    channel    : channelId,
                    callback   : callback
            });        
      } 
      
      function logError(reason) {
        console.error('Request failed: ', reason);
    }