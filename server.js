/*jshint node:true  strict:false */

var http = require('http');
var httphost = process.env.VCAP_APP_HOST || "0.0.0.0";
var httpport = process.env.VCAP_APP_PORT || "8888";
var nats_host = process.env.VCAP_FOUNDATION_IP || "localhost";
var url = require('url');

var nats = require('nats').connect("nats://nats:b01270623dabb96c@127.0.0.1:4222/");

nats.on('error', function(exception) {
  console.log("Can't connect to the nats-server [" + nats.options.url + "] is it running? \n - "+exception);
});

var maxMessages=1000;
var natsdatacount=0;
var natsdata={};
nats.subscribe('>', function(msg, reply, subject) {
    natsdata[natsdatacount]={};
    natsdata[natsdatacount].message=msg;
    natsdata[natsdatacount].subject=subject;
    natsdatacount++;
    if (natsdata[natsdatacount-maxMessages]){
        //Keep no more than maxMessage messages in memory.
        delete natsdata[natsdatacount-maxMessages];
    }
});


function pageHeader(res){
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write("<html dir='ltr' lang='en-US'>\n<head>\n<meta charset='UTF-8' />\n<title>Foundry Assay</title></head>\n<body style='font-family:Consolas, Monospace'>\n");
    res.write('<a href="/" style="color:black; text-decoration:none"><h1>Foundry Assay</h1></a>');
}

function Root(urlpath, req, res, count, natsdata) {
    pageHeader(res,req);
    res.write("<table>");
    res.write("<tr><td>&nbsp;</td><td><b>Subject</b></td><td><b>Message</b></td>");
    while (count>=0){
        count--;
        if(natsdata[count]) {
            var message=natsdata[count].message;
            res.write("<tr><td valign='top'>"+count+"</td><td valign='top'>"+natsdata[count].subject+"</td><td><pre><code>"+message+"</code></pre></td></tr>");
        }
    }
    res.end("</table>");
}

function show404(path, req, res){  
  res.writeHead(404, {'Content-Type': 'text/plain'});
  res.write('"' + path + '" not found on this server');
  res.end("\n");
}

http.createServer(function (req, res) {
  var url_parts = url.parse(req.url);
  switch(url_parts.pathname) {
    case '/':
      Root(url_parts.pathname, req, res, natsdatacount, natsdata);
      break;
    default:
      show404(url_parts.pathname, req, res);
  }
  return;
}).listen(httpport,httphost);
console.log("Server listening on http://" + httphost + ":" + httpport);