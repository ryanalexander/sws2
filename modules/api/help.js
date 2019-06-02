module.exports = function(args,request,reply,headers,callback){
    reply.write(JSON.stringify({"data":"This is an example of the SWS API module","code":200}));
    callback();
};