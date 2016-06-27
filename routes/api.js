var express = require('express');
var request = require('request');

var router = express.Router();
var forge = require('../forge/services.js');
var multer = require('multer')
var bodyParser = require('body-parser')
router.use( bodyParser() );       // to support JSON-encoded bodies

router.post("/signin", function(req, res) {

    forge.authenticate()
    .then(function(creds) {
        res.json(creds);
    });
 
});

router.post("/upload", multer().single('fileupload'), function(req, res) {

    forge.upload(req.file.originalname, req.file.buffer)
    .then(function(urn) {
       res.json({urn:urn});
    });
 
});

router.post("/register", function(req, res) {

    forge.register(req.body.urn)
    .then(function() {
       res.sendStatus(200);
    });
});

router.get("/viewStatus", function(req, res) {

    forge.getViewStatus(req.query.urn)
    .then(function(resp) {
       res.json(resp);
    });
});

module.exports = router;

//////////////test//////////////
router.post("/test", function(req, res) {

//urn:adsk.objects:os.object:xbc1234/Basic_Assembly.iam -- dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6eGJjMTIzNC9CYXNpY19Bc3NlbWJseS5pYW0=
//urn:adsk.objects:os.object:xbc1234/Block_Part.ipt -- dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6eGJjMTIzNC9CbG9ja19QYXJ0LmlwdA==
//urn:adsk.objects:os.object:xbc1234/Tube_Part.ipt -- dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6eGJjMTIzNC9UdWJlX1BhcnQuaXB0


 // possible payload?
 var sample = 
 { filename: "Basic Assembly.iam", urn: "dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6eGJjMTIzNC9CYXNpY19Bc3NlbWJseS5pYW0=",
     children: [  
        { filename: "Tube Part.ipt", urn: "dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6eGJjMTIzNC9CbG9ja19QYXJ0LmlwdA==" },
        { filename: "Block Part.ipt", urn: "dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6eGJjMTIzNC9UdWJlX1BhcnQuaXB0" } 
               ]
 };

 var dependencies = {
    "master" : "urn:adsk.objects:os.object:xbc1234/Basic_Assembly.iam",
    "dependencies" : [
      { "file" : "urn:adsk.objects:os.object:xbc1234/Block_Part.ipt",
        "metadata" : {
            "childPath" : "Block Part.ipt",
            "parentPath" : "Basic Assembly.iam"
        }
      },
      { "file" : "urn:adsk.objects:os.object:xbc1234/Tube_Part.ipt",
        "metadata" : {
            "childPath" : "Tube Part.ipt",
            "parentPath" : "Basic Assembly.iam"
        }
      }
      ]
    }   

    forge.createRelationships(dependencies)
    .then(function(resp) {
        res.json({urn:'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6eGJjMTIzNC9CYXNpY19Bc3NlbWJseS5pYW0='});
    });
        
});
