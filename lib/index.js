
var md5 = require('MD5');
var pubsub = require('pubsub-js');
var loader = require('./loader');

var cache = {};

module.exports = function(app, options){
  
  options = options || {};
  options.debug = typeof options.debug == 'undefined' ? (process.env.ENV_VARIABLE != 'production') : options.debug;
  options.bundleUrl = options.bundleUrl || '/bundee/js?:info';
  options.cacheInMs = options.cacheInMs || 365*24*60*60*1000; //default 1 year
  options.defaultVersion = options.defaultVersion || "v"+(+new Date);
  options.jsTag = options.jsTag || function(src){ return '<script type="text/javascript" src="'+src+'"></script>\n'; };
  options.baseUrl = options.baseUrl || "http://127.0.0.1:" + (process.env.PORT || 3000) + "/";
  options.jsPrefix = options.jsPrefix || "\n\n/* [SRC] */\n";
  options.jsSuffix = options.jsSuffix || "\n\n";
  
  var log = function(){
    console.log.apply(console, arguments);
  };
  
  var srcsToKey = function(srcs){
    return md5(srcs.join("|"));
  };
  
  var beginCache = function(srcs){
    var key = srcsToKey(srcs);
    var cacheInfo = cache[key] = {
      version: options.defaultVersion
    };
    
    var urls = [];
    for(var i=0; i<srcs.length; i++){
      var src = srcs[i] || '';
      if(!/^http/i.test(src)){
        src = options.baseUrl+src.replace(/^[~\/]*/, '');
      }
      urls.push(src);
    }
    
    loader(urls, options, function(js){
      cacheInfo.js = js;
      cacheInfo.version = md5(js);
      pubsub.publish(key);
    });
    return cacheInfo;
  };
  
  var js_debug = function(srcs){
    var html = [];
    for(var i=0; i<srcs.length; i++){
      html.push(options.jsTag(srcs[i]));
    }
    return html.join('');
  };
  
  var js = function(){
    var srcs = Array.prototype.slice.call(arguments, 0);
    
    if(options.debug)
      return js_debug(srcs);
    
    var key = srcsToKey(srcs);
    var cacheInfo = cache[key];
    
    if(!cacheInfo){
      cacheInfo = beginCache(srcs);
    }
    
    var html = options.jsTag(
      options.bundleUrl
        .replace(':info', encodeURIComponent(JSON.stringify(
          {
            srcs: srcs,
            version: cacheInfo.version
          }
        )))
    );    
    return html;
  };
  
  var sendCachedJs = function(res, cacheInfo){
    res.setHeader("Content-Type", "application/javascript");
    res.setHeader("Cache-Control", "public, max-age="+(options.cacheInMs/1000));
    res.setHeader("Expires", new Date(Date.now() + options.cacheInMs).toUTCString());
    
    res.send(cacheInfo.js);
  };
  
  app.all(options.bundleUrl, function(req, res){    
    var qs = decodeURIComponent(req.url.substr(req.url.indexOf('?')+1));
    var info = JSON.parse(qs);
    var srcs = info.srcs;
    var key = srcsToKey(srcs);
    var cacheInfo = cache[key];
    if(!cacheInfo)
      cacheInfo = beginCache(srcs);
    if(cacheInfo.js){
      sendCachedJs(res, cacheInfo);
    }else{
      var token = pubsub.subscribe(key, function(){
        sendCachedJs(res, cacheInfo);
        pubsub.unsubscribe(token);
      });
    }
  });
  
  return {
    js: js
  };
  
};
