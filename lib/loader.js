
var async = require('async');
var request = require('request');
    
module.exports = function(urls, getOption, callback){
  //store the results in a hash
  var results = {};
  
  //create a loader for each url
  var actions = [];
  for(var i=0; i<urls.length; i++){
    (function(url){
      actions.push(function(cb){
        request(url, function (error, response, body) {
          if(error){
            cb(error);
            return;
          }
          results[url] = getOption('formatSrc')(body, url);
          cb();
        });
      });
    })(urls[i]);
  }
  
  //start the parallel loading of URLs
  async.parallel(actions, function(err){
    //check for errors
    if(err){
      callback(err);
      return;
    }
    
    //combine results in order into an array
    var js = [];
    for(var i=0; i<urls.length; i++){
      var url = urls[i];
      js.push(
        getOption('prefix').replace(/[:]url/gi, url),
        results[url], 
        getOption('suffix')
      );
    }
    
    //join the array into a string
    js = js.join('');
    
    callback(null, js);
  });
};
