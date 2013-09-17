


var defaults = {
  debug:        process.env.ENV_VARIABLE != 'production',
  cache:        365*24*60*60*1000,
  version:      "v"+(+new Date),
  baseUrl:      "http://127.0.0.1:" + (process.env.PORT || 3000) + "/",
  bundlePath:   '/bundee/:type?:info',
  prefix:       "\n\n/*!\n * @preserve :url \n */\n",
  suffix:       "\n\n",
  formatSrc:    function(src, url){ return src; },
  formatBundle: function(src){ return src; },
  js: {
    tag:         '<script type="text/javascript" src=":url"></script>\n',
    contentType: "application/javascript", 
    formatBundle: function(js){      
      return require("uglify-js").minify(js, { fromString: true }).code;
    }
  },
  css: {
    tag:         '<link type="text/css" rel="stylesheet" href=":url" />\n',
    contentType: "text/css",
    formatSrc: function(css, srcUrl){
      var baseUrl = srcUrl.replace(/[^\/]*\/?$/i, '');
      css = css.replace(/url\(([^)]+)\)/ig, function(match, url){
        //trim quotes
        url = url.replace(/(^[ '"]*|[ '"]*$)/g, '');
        
        //only mess with relative urls
        if(!/^(http|\/\/)/.test(url))
        {        
          //convert relative path to absolute
          url = baseUrl + url.replace(/^\//, '');
        }

        return 'url("'+url+'")';
      });
      css = require('clean-css').process(css); 
      return css;
    }
  }
};

module.exports = function(type, options){
  
  //looks through an object, first using 'type', then the root
  var getValue = function(obj, k){
    //is there a specific value according to 'type'?
    if(obj && obj[type] && typeof obj[type][k] != 'undefined')
      return obj[type][k];
      
    //is there a generic value?
    if(obj && typeof obj[k] != 'undefined')
      return obj[k];
      
    //no value
    return undefined;
  };
  
  //return a function that returns the value for a key
  return function(key){
    //see if the developer set a custom value
    var userValue = getValue(options, key);
    if(typeof userValue != 'undefined')
        return userValue;
    
    //no custom value, so use the default
    return getValue(defaults, key);
  };
  
};