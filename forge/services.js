var credentials = require('./credentials')
var fs = require('fs');
var Promise = require('bluebird');
var _request = require('request');
var request = Promise.promisify(require('request'));
var streamifier = require('streamifier');

var baseUrl = 'https://developer-stg.api.autodesk.com';
var version = 'v1';
var forgeUrls = {
	authenticationUrl: baseUrl + '/authentication/' + version + '/authenticate',
	ossUrl: baseUrl + '/oss/' + version + '/buckets',
    viewingUrl: baseUrl + '/viewingservice/'  + version,
    registerUrl: baseUrl + '/viewingservice/'  + version +  '/register',
    relationshipUrl: baseUrl + '/references/'  + version +  '/setreference'
};

var grantType = 'client_credentials';
var	scope = 'data:read data:write data:create data:search bucket:create bucket:read bucket:update';



var authenticate = function() {
    return request( {
        url: forgeUrls.authenticationUrl,
        method: 'POST',
        headers: {  ContentType: 'application/x-www-form-urlencoded'  },
        form: {
            client_id: credentials.clientId,
            client_secret: credentials.clientSecret,
            grant_type: grantType,
            scope: scope
        }   
    })
    .then(function(resp) {     
      return JSON.parse(resp.body);
     });
};



var createBucket = function(token, bucketName) {
    return request( {
        url: forgeUrls.ossUrl,
        method: 'POST',
        headers: {  Authorization: 'Bearer ' + token  },
        json: {
                bucketKey: bucketname,
                policy: 'transient'
            }        
    })
    .then(function(resp) {     
        console.log("Create bucket");
        console.log(resp);
        return bucketname; // may have already been created
    });
};

String.prototype.replaceAll = function(target, replacement) {
  return this.split(target).join(replacement);
};

var doUploadFile = function(token, url, bytes) {
   return new Promise(function(resolve, reject) {
      streamifier.createReadStream(bytes).pipe(_request( {
        url: url,
        method: 'PUT',
        headers: { Authorization: 'Bearer ' + token  }      
    }, function(err, resp) {
        if(err) { reject(err); }
        else { resolve(resp); }
    }))
  });
};
var getUrnFromResponse = function(resp) {
    var body = JSON.parse(resp.body);
    var urn = body.objects[0].id;
    var urn64 = new Buffer(urn).toString('base64');
    console.log(body);
    console.log(urn + ' -- ' + urn64);
    return urn64;
};

var uploadFile = function(token, bucketName, filename, bytes) {

    var url = forgeUrls.ossUrl + '/' + bucketName + '/objects/' + filename;

    return doUploadFile(token, url, bytes)
    .then(function(resp) {     
        return getUrnFromResponse(resp);
     });

};

var getFileStatus = function(token, bucketName, filename) {

    var url = forgeUrls.ossUrl + '/' + bucketName + '/objects/' + filename + '/details';

     return request( {
        url: url,
        method: 'GET',
        headers: { Authorization: 'Bearer ' + token },
     })
};

var getViewingStatus = function(token, urn) {

    var url = forgeUrls.viewingUrl + '/' + urn + '/status';

     return request( {
        url: url,
        method: 'GET',
        headers: { Authorization: 'Bearer ' + token },
     })
};

var registerFile = function(token, urn) {
   return request( {
        url: forgeUrls.registerUrl,
        method: 'POST',
        headers: {  Authorization: 'Bearer ' + token  },
        json: { urn: urn }        
    })
    .then(function(resp) {     
        console.log(resp.body);
    });
};

var setReferences = function(token, dependencies) {
   return request( {
        url: forgeUrls.relationshipUrl,
        method: 'POST',
        headers: {  Authorization: 'Bearer ' + token  },
        json: dependencies        
    });
};
/////////////////////////////


var upload = function(fileName, bytes) {
    var token;

    fileName = fileName.replaceAll(' ', '_'); // viewer doesn't like spaces

    return authenticate()
    .then(function(creds) {
        token = creds.access_token;
        return createBucket(token, bucketname);
    })
    .then(function() {
        return uploadFile(token, bucketname, fileName, bytes);
    });
};

var register = function(urn) {
    var token;

     return authenticate()
    .then(function(creds) {
        token = creds.access_token;
        return registerFile(token, urn);
    });
};

var getStatus = function(fileName) {
    var token;
    return authenticate()
    .then(function(creds) {
        token = creds.access_token;
        return getFileStatus(token, bucketname, fileName);
    })
    .then(function(resp) {
        var urn = getUrnFromResponse(resp);
        return getViewingStatus(token, urn)
    })
    .then(function(resp) {
        console.log(resp.body);
        return resp.body;
    });
};

var getViewStatus = function(urn) {
    var token;
    return authenticate()
    .then(function(creds) {
        token = creds.access_token;
        return getViewingStatus(token, urn)
    })
    .then(function(resp) {
        console.log(resp.body);
        return resp.body;
    });
};

var createRelationships = function(dependencies) {
    var token;
    return authenticate()
    .then(function(creds) {
        token = creds.access_token;
        return setReferences(token, dependencies)
    });
};

module.exports = {
    authenticate: authenticate,
    upload: upload,
    register: register,
    getStatus: getStatus,
    getViewStatus: getViewStatus,
    createRelationships:createRelationships
}

var bucketname = 'renyo_stg_bucket'