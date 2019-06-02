/*
 * |--------------------------------------------------------------|
 * |                                                              |
 * |                   DO NOT DELETE THIS FILE!                   |
 * |                                                              |
 * |      THIS IS THE CORE APPLICATION FILE FOR WEB REQUESTS.     |
 * |                GENERATED BY STELCH WEB SERVER                |
 * |                                                              |
 * |--------------------------------------------------------------|
 */
 
 
let net = require('net');
let fs = require("fs");
let pageloader = require("../modules/pageloader.js");
const {gzip, ungzip} = require('node-gzip');
let parser = require("../util/headerParse.js");
let logger = require("./logger.js");
let errors = require("../errors.js");
let conf = JSON.parse(fs.readFileSync("./config.yml"));
let colors = {
    "red":"\u001b[31m",
    "reset":"\u001b[0m",
    "green":"\u001b[32m",
    "yellow":"\u001b[33m",
    "blue":"\u001b[34m",
    "magenta":"\u001b[35m",
    "cyan":"\u001b[36m",
    "white":"\u001b[37m"
};

let sockets = [];
let port = 80;
let maintenance = false;

exports.maintenance = function(state){
    switch(state){
        case true:
            maintenance=true;
            logger.log(colors.reset+"["+colors.yellow+" MODE "+colors.reset+"] "+colors.red+"The server has entered maintenance mode, blocking all connections."+colors.reset);
            return true;
        case false:
            maintenance=false;
            logger.log(colors.reset+"["+colors.yellow+" MODE "+colors.reset+"] "+colors.green+"The server has exited maintenance mode, allowing connections."+colors.reset);
            return false;
        default:
            return maintenance;
    }
};

exports.start = function(logger) {
    let server = net.createServer(function(socket) {
        socket.on('data', function(data) {
            args = parser(data,socket);
            args['client_address']=socket.remoteAddress;
            qwe=pageloader(((maintenance)?true:args));

            if(!qwe){
                socket.write("HTTP/1.1 500 Internal Server Error\r\n"+
                    "Server: sws\r\n"+
                    ((site_conf&&site_conf['enforce_ssl'])?"Location: https://"+args['host']+"/"+args['url']+" \r\n":"")+
                    "X-Frame-Options: none\r\n"+
                    "Content-Encoding: gzip\r\n" +
                    "Content-Type: text/html"+
                    "\r\n");
                gzip(fs.readFileSync("sites/errors/maintenance.html")).then(function(compressed){
                    logger.log(`${colors.blue}HTTP ${colors.reset}> '${colors.yellow}${args['client_address']}${colors.reset}' Finished '${colors.yellow}${args['url']}${colors.reset}' at ${colors.yellow}${Date.now()}${colors.reset}.`);
                    socket.write(compressed);
                    socket.write("\r\n\r\n");
                    socket.end(function(){
                        socket.destroy();
                    });
                });
                return;
            }

            let file_type;
            try {
                file_type = args['url'].split(".").pop().toLowerCase();
            }catch (e){
                file_type="text/html";
                logger.error(e.toString());
            }

            let site_conf = conf['sites'][args['host']];
            if(site_conf&&site_conf['enforce_ssl']===true){qwe['error']=301;}
            /*
            Accept-Ranges: bytes
            Connection: keep-alive
            Content-Encoding: gzip
            Content-Length: 1656
            Content-Type: text/html
            Server: sws
             */
            //if(site_conf['enforce_ssl']===true){socket.write("\r\n");socket.end(()=>{socket.destroy();});return;}
            logger.log(`${colors.blue}HTTP ${colors.reset}> '${colors.yellow}${args['client_address']}${colors.reset}' Requested '${colors.yellow}${args['url']}${colors.reset}' at ${colors.yellow}${Date.now()}${colors.reset}.`);

            gzip(qwe['data']).then(function(compressed){
                socket.write("HTTP/1.1 200\r\n"+
                    "Server: sws\r\n"+
                    "Accept-Ranges: bytes\r\n"+
                    "Connection: keep-alive\r\n"+
                    "Content-Length: "+compressed.length+"\r\n"+
                    ((site_conf&&site_conf['enforce_ssl'])?"Location: https://"+args['host']+"/"+args['url']+" \r\n":"")+
                    "Content-Encoding: gzip\r\n" +
                    "Content-Type: "+qwe['args'].contentType+"\r\n"+
                    "\r\n");
                logger.log(`${colors.blue}HTTP ${colors.reset}> '${colors.yellow}${args['client_address']}${colors.reset}' Finished '${colors.yellow}${args['url']}${colors.reset}' at ${colors.yellow}${Date.now()}${colors.reset}.`);
                socket.write(compressed);
                socket.write("\r\n\r\n");
                socket.end(function(){
                    socket.destroy();
                });
            });
        });
        socket.on('end', function() {
            removeSocket(socket);
        });
        socket.on('error', function(error) {
            logger.log(`${colors.red}ERROR ${colors.reset}> ${error.message}`);
        });
    });
    function removeSocket(socket) {
        sockets.splice(sockets.indexOf(socket), 1);
    }
    server.on('error', function(error) {
        logger.log(`${colors.red}ERROR ${colors.reset}> ${error.message}`);
    });
    server.listen(port, function() {
        logger.log(`${colors.cyan}STARTED ${colors.reset}> HTTP Server has started on port ${colors.yellow}${port}${colors.reset}.`);
    });
};