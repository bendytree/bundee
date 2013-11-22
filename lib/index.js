
 
module.exports = function(app, options){
  
  var bundee = {};
  
  //create a bundee app and use it
  //this is because if we call `app.get` on the user's app, then it automatically registers the routing module (which might be too early - before the static handler is setup)
  var bundeeApp = require('express')();
  app.use(bundeeApp);
  
  //return one function for each asset type
  var types = ["js", "css"];
  for(var i=0; i<types.length; i++){
    var type = types[i];
    bundee[type] = require('./packager')(bundeeApp, options, type);
  }
  
  app.locals.bundee = bundee;
  
};
