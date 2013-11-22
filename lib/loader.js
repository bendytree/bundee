
var async = require('async');
var request = require('request');
var fs = require('fs');
    
module.exports = function(pathInfos, getOption, callback){
  //store the results in a hash
  var results = {};
  
  //start the parallel loading of URLs
  async.map(
    pathInfos,
    function(pathInfo, cb){
      //check local file system
      fs.readFile(pathInfo.src, 'utf8', function(err, data) {
        if (!err) {
          pathInfo.result = getOption('formatSrc')(body, pathInfo.src);
          cb(null, pathInfo);
          return;
        }
        
        //try HTTP request
        request(pathInfo.url, function (error, response, body) {
          if(error || response.statusCode != 200){
            cb((error || response.statusCode) + " url:" + pathInfo.url);
            return;
          }
          pathInfo.result = getOption('formatSrc')(body, pathInfo.url);
          cb(null, pathInfo);
        });
      });
    }, 
    function(err, pathInfos){
      //check for errors
      if(err){
        callback(err);
        return;
      }
      
      //combine results in order into an array
      var js = [];
      for(var i=0; i<pathInfos.length; i++){
        var pathInfo = pathInfos[i];
        js.push(
          getOption('prefix').replace(/[:]url/gi, pathInfo.url),
          pathInfo.result, 
          getOption('suffix')
        );
      }
      
      //join the array into a string
      js = js.join('');
    
      callback(null, js);
    }
  );
};
