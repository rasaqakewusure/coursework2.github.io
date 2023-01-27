const express = require("express");
const cors = require("cors");
const morgan = require("morgan"); 
const path = require("path"); 
var fs = require("fs");

let propertiesReader = require("properties-reader");
let propertiesPath = path.resolve(__dirname, "conf/db.properties");
let properties = propertiesReader(propertiesPath); 

let dbPprefix = properties.get("db.prefix"); 
// URL-Encoding of User and PWD
// for potential special characters 
let dbUsername = encodeURIComponent(properties.get("db.user"));
let dbPwd = encodeURIComponent(properties.get("db.pwd"));
let dbName = properties.get("db.dbName");
let dbUrl = properties.get("db.dbUrl"); 
let dbParams = properties.get("db.params"); 

const uri = dbPprefix + dbUsername + ":" + dbPwd + dbUrl + dbParams;

// Option 2
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });
let db = client.db(dbName);

//we need this to parse json received in the requests
//(e.g., to read json passed in req.body)

const app = express();
app.use(cors());
app.use(morgan("short"));
app.use(express.json()); 

var staticPath = path.join(__dirname, "static");
app.use(express.static(staticPath));

app.param('collectionName', function(req, res, next, collectionName) {
req.collection = db.collection(collectionName);
return next();
});

// Find functions 
app.get('/collections/:collectionName', function(req, res, next) {
req.collection.find({}).toArray(function(err, results) {
if (err) {
    return next(err);
}
res.send(results);
});
});

//Sort ascending or descending 

app.get('/collections/:collectionName/:max/:sortAspect/:sortAscDesc', function(req, res, next) {
// TODO: Validate params
var max = parseInt(req.params.max, 10); // base 10
let sortDirection = 1;
if (req.params.sortAscDesc === "desc") {
sortDirection = -1;
}
req.collection.find({}, {limit: max, sort: [[req.params.sortAspect,
sortDirection]]}).toArray(function(err, results) {
if (err) {
return next(err);
}
res.send(results);
});
});

//Retrieve 1 element by id 

//we do not need the following line because we already load ObjectId
//with the connection to the db
//const ObjectId = require('mongodb').ObjectId;
app.get('/collections/:collectionName/:id', function(req, res, next) {
req.collection.findOne({ _id: new ObjectId(req.params.id) }, function(err, results) {
if (err) {
return next(err);
}
res.send(results);
});
});

//POST and create a document 
app.post('/collections/:collectionName', function(req, res, next) {
// TODO: Validate req.body
req.collection.insertOne(req.body, function(err, results) {
if (err) {
return next(err);
}
res.send(results);
});
});

//Delete one element via its ID
app.delete('/collections/:collectionName/:id', function(req, res, next) {
req.collection.deleteOne(
{_id: new ObjectId(req.params.id)}, function(err, result) {
if (err) {
return next(err);
} else {
res.send((result.deletedCount === 1) ? {msg: "success"} : {msg: "error"});
}
}
);
});

//Updating a document using curl 
app.put('/collections/:collectionName/:id', function(req, res, next) {
// TODO: Validate req.body
req.collection.updateOne({_id: new ObjectId(req.params.id)},
{$set: req.body},
{safe: true, multi: false}, function(err, result) {
if (err) {
return next(err);
} else {
res.send((result.matchedCount === 1) ? {msg: "success"} : {msg: "error"});
}
}
);
});

//Middleware 
app.use(function(req, res, next) {
    console.log("Request IP: " + req.url);
    console.log("Request date: " + new Date());
    next();
});

app.use(function(req, res, next) {
    var filePath = path.join(__dirname, "static", req.url);
    fs.stat(filePath, function(err, fileInfo) {
    if (err) {
        next();
        return;
    }
    if (fileInfo.isFile()) {
    res.sendFile(filePath);
    } else {
    next();
    }
    });
    });


/// handles invalid request
app.use(function(req, res) {
    res.status("File not found!");
});

/// listening on port 3000
//app.listen(3000, function() {
    //console.log("App started on port 3000");
//});

const port = process.env.PORT || 3000;
app.listen(port, function(){
    console.log("App started on port: " + port);
});


