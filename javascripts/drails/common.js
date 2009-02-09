dojo.provide("drails.common");
dojo.require("dojo._base.xhr");

drails._xhrMap = {
  "before":       null,
  "after":        null,
  "condition":    null,
  "asynchronous": [ "sync", function(v) { return !v; } ],
  "method":       [ "method", function(v) { return v.toLowerCase(); } ],
  "insertion":    null,
  "parameters":   [ "content", function(v) { return dojo.queryToObject(v); } ],
  "position":     null,
//  "with":         null,
  "update":       null,
  "evalScripts":  [ "noop", function(v) { return null; } ],
  "type":         null
};

drails._xhrCallbackMap = {
  "onUninitialized":  null,
  "onLoading":        null,
  "onLoaded":         null,
  "onInteractive":    null,
  "onComplete":       null,   // handle ?
  "onFailure":        "error",
  "onSuccess":        "load"
  // TODO 100..599
};

dojo.declare("drails._base", null, {
  transformCallbacks: function(url, xhrArgs) {
    var dojoXhrArgs = { url: url };
    for (var protoCallback in xhrArgs) {
      var dojoCallback = drails._xhrCallbackMap[protoCallback];
      if (dojoCallback) {   // Found callback mapping
        // If a prototype callback handler exists on this object
        if (this[protoCallback]) {
          dojo.connect(dojoXhrArgs, dojoCallback, this, protoCallback);
          if (xhrArgs[protoCallback]){
            dojo.connect(this, protoCallback, xhrArgs[protoCallback]);  // Connect the callback to the currently existing callback
          }
        } else if (xhrArgs[protoCallback]) {
          dojoXhrArgs[dojoCallback] = xhrArgs[protoCallback];
        }
      } else {              // Did not find a callback mapping
        this.unsupportedOperation(protoCallback);
      }
    }
    return dojoXhrArgs;
  },
  
  transformSettings: function(xhrArgs){
    var dojoXhrArgs = {};
    for (var setting in xhrArgs){
      var dojoSetting = drails._xhrMap[setting];
      if (dojoSetting){
        var value = dojoSetting;
        if (dojo.isArray(value)) {
          dojoSetting = value[0];
          value = value[1](xhrArgs[setting]);
        }
        else {
          value = xhrArgs[setting];
        }
        dojoXhrArgs[dojoSetting] = value;
        delete xhrArgs[setting];
      }
    }
    return dojoXhrArgs;
  },
  
  /* transformParameters function(xhrArgs) {
    var dojoXhrArgs = {};
    if (xhrArgs['parameters']){
      dojoXhrArgs['content'] = 
    }
    
    return dojoXhrArgs;
  }, */
  
  unsupportedOperation: function(callbackName){
    throw(callbackName + " is not a supported drails operation");
  }
});

dojo.declare("drails.Request", [drails._base], {
  _requestOnConstruction: true,
  _transformedArgs: null,
  _transformedMethod: null,
  
  constructor: function(url, xhrArgs){
    if (this._requestOnConstruction){
      this.xhr(url, xhrArgs);
    }
  },
  
  xhr: function(url, xhrArgs) {
    var dojoXhrArgs = {};
    
    if (xhrArgs) {
      //dojo.mixin(dojoXhrArgs), this.transformParameters(xhrArgs);
      dojo.mixin(dojoXhrArgs, this.transformSettings(xhrArgs));
      dojo.mixin(dojoXhrArgs, this.transformCallbacks(url, xhrArgs));
    }
    this._transformedMethod = dojoXhrArgs['method'] || 'get';
    this._transformedArgs = dojoXhrArgs;
    console.debug("-----------------------------> METHOD", this._transformedMethod);
    console.debug("-----------------------------> ARGS", this._transformedArgs);
    dojo.xhr(this._transformedMethod, this._transformedArgs);
  }
});


dojo.declare("drails.Updater", [drails.Request], {
  
  _requestOnConstruction: false,
  _successNode: null,
  _failureNode: null,
  
  constructor: function(target, url, xhrArgs) {
    xhrArgs = xhrArgs || {};
    xhrArgs['onSuccess'] = xhrArgs['onSuccess'] || function() {};
    xhrArgs['onFailure'] = xhrArgs['onFailure'] || function() {};

    if (target) this.interpolateTargets(target);
    this.xhr(url, xhrArgs);
  },
  
  onSuccess: function(response, ioArgs) {
    if (this._successNode){
      dojo.byId(this._successNode).innerHTML = response.toString();
    }
  },
  
  onFailure: function(response, ioArgs) {
    if (this._failureNode){
      dojo.byId(this._failureNode).innerHTML = response.toString();
    }
  },
  
  interpolateTargets: function(target){
    if (typeof target == "string") {
      this._successNode = this._failureNode = target;
    } else if (typeof target == "object") {
      this._successNode = target["success"];
      this._failureNode = target["failure"];
    }
    else {
      throw new Error("Invalid target type");
    }
  }
  
});