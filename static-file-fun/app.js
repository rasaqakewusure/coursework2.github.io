var express = require("express");
var morgan = require("morgan"); 
var path = require("path");
var fs = require("fs");
var app = express();

app.use(morgan("short"));

app.use(function(req, res, next) {
    console.log("Request IP: " + req.url);
    console.log("Request date: " + new Date());
    next();
    });

var staticPath = path.join(__dirname, "static");

app.use(express.static(staticPath));

app.use(function(req, res) {
res.status(404);
res.send("File not found!");
});

const port = process.env.PORT || 3000;
app.listen(port, function() {
console.log("App started on port: " + port);
});