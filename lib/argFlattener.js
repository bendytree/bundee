
module.exports = function(args){
  //convert from potential array-object to real array
  args = Array.prototype.slice.call(args, 0);
  
  var all = [];
  
  var add = function(list){
    if(!list)
    {
      //skip null, undefined, etc
      return;
    }
    else if(Object.prototype.toString.call(list) == '[object Array]')
    {
      //add each item to the list
      for(var i=0; i<list.length; i++){
        add(list[i]);
      }
    }
    else if(typeof list == 'string')
    {
      //add the string to the list
      all.push(list);
    }
  };
  
  //recursively add each item in args
  add(args);
  
  //return the flattened list
  return all;
};
