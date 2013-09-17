
var md5 = require('MD5');
var pubsub = require('pubsub-js');
var loader = require('./loader');


module.exports = function(app, options, type){
  
  //create a function that gets options according to asset type
  var getOption = require('./optionManager')(type, options);
  
  //build the route
  var route = getOption('bundlePath').replace(/:type/ig, type);
  
  //prepare a key/value cache
  var cache = {};

  //convert list of sources to a repeatable key
  var srcsToKey = function(srcs){
    return md5(srcs.join("|"));
  };
  
  //begin loading/bundling/caching (asynchronously)
  var beginCache = function(key, srcs){
    //setup an object to track the caching status (so we don't re-cache)
    var cacheInfo = cache[key] = {
      version: getOption('version')
    };
    
    //create full URLs from the list of sources
    var urls = [];
    for(var i=0; i<srcs.length; i++){
      var src = srcs[i] || '';
      
      //was the protocol left off?
      if(/^\/\//.test(src)){
        //add a protocol
        src = "http:"+src;
      }
      
      //is it a relative path?
      if(!/^http/i.test(src)){
        //add the base URL
        src = getOption("baseUrl")+src.replace(/^[~\/]*/, '');
      }
      
      urls.push(src);
    }
    
    //load all the urls and concat the results
    loader(urls, getOption, function(err, content){
      if(err)
      {
        //try caching again next time it is requested
        cache[key] = undefined;
        
        //set the error message as a comment
        content = "/**\n"+err+"\n*/";
      }
      else
      {
        //compress or otherwise bundle the resulting string
        content = getOption('formatBundle')(content);
      }      
      
      cacheInfo.content = content;
      cacheInfo.version = md5(content);
      pubsub.publish(key);
    });
    
    //return the object that has cache info
    return cacheInfo;
  };
  
  //this is how we respond
  var sendContent = function(res, cacheInfo){
    //set content type
    res.setHeader("Content-Type", getOption('contentType'));
    
    //set caching headers
    res.setHeader("Cache-Control", "public, max-age="+(getOption("cache")/1000));
    res.setHeader("Expires", new Date(Date.now() + getOption("cache")).toUTCString());
    
    //send the content    
    res.send(cacheInfo.content);
  };
  
  //setup the route that returns the bundled content
  app.all(route, function(req, res){    
    //get the bundle info
    var qs = decodeURIComponent(req.url.substr(req.url.indexOf('?')+1));
    var info = JSON.parse(qs);
    var srcs = info.srcs;
    var key = srcsToKey(srcs);
    
    //get the cache record
    var cacheInfo = cache[key];
    
    //not bundled yet?
    if(!cacheInfo){
      //start bundling now
      cacheInfo = beginCache(key, srcs);
    }
    
    //already bundled?
    if(cacheInfo.content){
      //send it
      sendContent(res, cacheInfo);
      return;
    }
    
    //wait until bundling is complete
    var token = pubsub.subscribe(key, function(){
      //send it to the client
      sendContent(res, cacheInfo);
      
      //unsubscribe from notifications
      pubsub.unsubscribe(token);
    });
  });
  
  //return the method that creates the HTML tags
  return function getHtml(){
    //flatten arguments into list of sources
    var srcs = require('./argFlattener')(arguments);
    
    //Debug mode?
    if(getOption("debug"))
    {
      //debug, so create a single tag for each source
      var html = [];
      for(var i=0; i<srcs.length; i++){
        var tag = getOption('tag').replace(/[:]url/ig, srcs[i]);
        html.push(tag);
      }
      return html.join('');      
    }
    
    //Create a key from this list of sources
    var key = srcsToKey(srcs);
    
    //Is it already cached?
    var cacheInfo = cache[key];
    if(!cacheInfo)
    {
      //begin loading/caching (async)
      cacheInfo = beginCache(key, srcs);
    }
    
    //Build the URL to the bundle
    var url = route.replace(':info', encodeURIComponent(JSON.stringify({
                srcs: srcs,
                version: cacheInfo.version
              })));
    
    //create the tag
    var tag = getOption('tag').replace(/[:]url/ig, url);
    return tag;
  };
  
};
