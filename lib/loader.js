
var async = require('async');
var request = require('request');

module.exports = function(urls, options, callback){
  var results = {};
  
  var actions = [];
  for(var i=0; i<urls.length; i++){
    (function(url){
      actions.push(function(cb){
        request(url, function (error, response, body) {
          if(error){
            console.log('error', error);
          }
          results[url] = body;
          cb();
        });
      });
    })(urls[i]);
  }
  
  async.parallel(actions, function(){
    var js = [];
    for(var i=0; i<urls.length; i++){
      var url = urls[i];
      js.push(
        options.jsPrefix.replace("[SRC]", url),
        results[url], 
        options.jsSuffix
      );
    }
    callback(js.join(''));
  });
};
