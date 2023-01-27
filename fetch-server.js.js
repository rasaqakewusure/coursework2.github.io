const express = require("express");
const cors = require("cors");
const morgan = require("morgan"); 
const path = require("path"); 

let propertiesReader = require("properties-reader");
let propertiesPath = path.resolve(__dirname, "conf/db.properties");
let properties = propertiesReader(propertiesPath); 

let dbPprefix = properties.get("db.prefix"); 
// URL-Encoding of User and PWD
// for potential special characters 
let dbUsername = encodeURLComponent(properties.get("db.user"));
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
app.use(cors());
app.use(morgan("short"));
app.use(express.json()); 

app.param('collectionName', function(req, res, next, collectionName) {
req.collection = db.collection(collectionName);
return next();
});

app.get('/collections/:collectionName', function(req, res, next) {
req.collection.find({}).toArray(function(err, results) {
if (err) {
    return next(err);
}
res.send(results);
});
});

/// handles invalid request
app.use(function(req, res) {
    res.status(404).send("Resource not found...");
});

/// listening on port 3000
app.listen(3000, function() {
    console.log("App started on port 3000");
});


