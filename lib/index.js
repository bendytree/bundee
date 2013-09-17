
 
module.exports = function(app, options){
  
  var bundee = {};
  
  //return one function for each asset type
  var types = ["js", "css"];
  for(var i=0; i<types.length; i++){
    var type = types[i];
    bundee[type] = require('./packager')(app, options, type);
  }
  
  app.locals.bundee = bundee;
};
