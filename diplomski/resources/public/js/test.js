var CLOSURE_NO_DEPS = true;
var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.DEBUG = true;
goog.LOCALE = "en";
goog.provide = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    delete goog.implicitNamespaces_[name];
    var namespace = name;
    while(namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
      if(goog.getObjectByName(namespace)) {
        break
      }
      goog.implicitNamespaces_[namespace] = true
    }
  }
  goog.exportPath_(name)
};
goog.setTestOnly = function(opt_message) {
  if(COMPILED && !goog.DEBUG) {
    opt_message = opt_message || "";
    throw Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
  }
};
if(!COMPILED) {
  goog.isProvided_ = function(name) {
    return!goog.implicitNamespaces_[name] && !!goog.getObjectByName(name)
  };
  goog.implicitNamespaces_ = {}
}
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split(".");
  var cur = opt_objectToExportTo || goog.global;
  if(!(parts[0] in cur) && cur.execScript) {
    cur.execScript("var " + parts[0])
  }
  for(var part;parts.length && (part = parts.shift());) {
    if(!parts.length && goog.isDef(opt_object)) {
      cur[part] = opt_object
    }else {
      if(cur[part]) {
        cur = cur[part]
      }else {
        cur = cur[part] = {}
      }
    }
  }
};
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split(".");
  var cur = opt_obj || goog.global;
  for(var part;part = parts.shift();) {
    if(goog.isDefAndNotNull(cur[part])) {
      cur = cur[part]
    }else {
      return null
    }
  }
  return cur
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for(var x in obj) {
    global[x] = obj[x]
  }
};
goog.addDependency = function(relPath, provides, requires) {
  if(!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, "/");
    var deps = goog.dependencies_;
    for(var i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path;
      if(!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {}
      }
      deps.pathToNames[path][provide] = true
    }
    for(var j = 0;require = requires[j];j++) {
      if(!(path in deps.requires)) {
        deps.requires[path] = {}
      }
      deps.requires[path][require] = true
    }
  }
};
goog.ENABLE_DEBUG_LOADER = true;
goog.require = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      return
    }
    if(goog.ENABLE_DEBUG_LOADER) {
      var path = goog.getPathFromDeps_(name);
      if(path) {
        goog.included_[path] = true;
        goog.writeScripts_();
        return
      }
    }
    var errorMessage = "goog.require could not find: " + name;
    if(goog.global.console) {
      goog.global.console["error"](errorMessage)
    }
    throw Error(errorMessage);
  }
};
goog.basePath = "";
goog.global.CLOSURE_BASE_PATH;
goog.global.CLOSURE_NO_DEPS;
goog.global.CLOSURE_IMPORT_SCRIPT;
goog.nullFunction = function() {
};
goog.identityFunction = function(opt_returnValue, var_args) {
  return opt_returnValue
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    if(ctor.instance_) {
      return ctor.instance_
    }
    if(goog.DEBUG) {
      goog.instantiatedSingletons_[goog.instantiatedSingletons_.length] = ctor
    }
    return ctor.instance_ = new ctor
  }
};
goog.instantiatedSingletons_ = [];
if(!COMPILED && goog.ENABLE_DEBUG_LOADER) {
  goog.included_ = {};
  goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}};
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != "undefined" && "write" in doc
  };
  goog.findBasePath_ = function() {
    if(goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return
    }else {
      if(!goog.inHtmlDocument_()) {
        return
      }
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName("script");
    for(var i = scripts.length - 1;i >= 0;--i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf("?");
      var l = qmark == -1 ? src.length : qmark;
      if(src.substr(l - 7, 7) == "base.js") {
        goog.basePath = src.substr(0, l - 7);
        return
      }
    }
  };
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    if(!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true
    }
  };
  goog.writeScriptTag_ = function(src) {
    if(goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      doc.write('<script type="text/javascript" src="' + src + '"></' + "script>");
      return true
    }else {
      return false
    }
  };
  goog.writeScripts_ = function() {
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;
    function visitNode(path) {
      if(path in deps.written) {
        return
      }
      if(path in deps.visited) {
        if(!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path)
        }
        return
      }
      deps.visited[path] = true;
      if(path in deps.requires) {
        for(var requireName in deps.requires[path]) {
          if(!goog.isProvided_(requireName)) {
            if(requireName in deps.nameToPath) {
              visitNode(deps.nameToPath[requireName])
            }else {
              throw Error("Undefined nameToPath for " + requireName);
            }
          }
        }
      }
      if(!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path)
      }
    }
    for(var path in goog.included_) {
      if(!deps.written[path]) {
        visitNode(path)
      }
    }
    for(var i = 0;i < scripts.length;i++) {
      if(scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i])
      }else {
        throw Error("Undefined script input");
      }
    }
  };
  goog.getPathFromDeps_ = function(rule) {
    if(rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule]
    }else {
      return null
    }
  };
  goog.findBasePath_();
  if(!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + "deps.js")
  }
}
goog.typeOf = function(value) {
  var s = typeof value;
  if(s == "object") {
    if(value) {
      if(value instanceof Array) {
        return"array"
      }else {
        if(value instanceof Object) {
          return s
        }
      }
      var className = Object.prototype.toString.call(value);
      if(className == "[object Window]") {
        return"object"
      }
      if(className == "[object Array]" || typeof value.length == "number" && typeof value.splice != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("splice")) {
        return"array"
      }
      if(className == "[object Function]" || typeof value.call != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if(s == "function" && typeof value.call == "undefined") {
      return"object"
    }
  }
  return s
};
goog.isDef = function(val) {
  return val !== undefined
};
goog.isNull = function(val) {
  return val === null
};
goog.isDefAndNotNull = function(val) {
  return val != null
};
goog.isArray = function(val) {
  return goog.typeOf(val) == "array"
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == "array" || type == "object" && typeof val.length == "number"
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == "function"
};
goog.isString = function(val) {
  return typeof val == "string"
};
goog.isBoolean = function(val) {
  return typeof val == "boolean"
};
goog.isNumber = function(val) {
  return typeof val == "number"
};
goog.isFunction = function(val) {
  return goog.typeOf(val) == "function"
};
goog.isObject = function(val) {
  var type = typeof val;
  return type == "object" && val != null || type == "function"
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_)
};
goog.removeUid = function(obj) {
  if("removeAttribute" in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_)
  }
  try {
    delete obj[goog.UID_PROPERTY_]
  }catch(ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + Math.floor(Math.random() * 2147483648).toString(36);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.cloneObject(obj[key])
    }
    return clone
  }
  return obj
};
goog.bindNative_ = function(fn, selfObj, var_args) {
  return fn.call.apply(fn.bind, arguments)
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  if(!fn) {
    throw new Error;
  }
  if(arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(selfObj, newArgs)
    }
  }else {
    return function() {
      return fn.apply(selfObj, arguments)
    }
  }
};
goog.bind = function(fn, selfObj, var_args) {
  if(Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) {
    goog.bind = goog.bindNative_
  }else {
    goog.bind = goog.bindJs_
  }
  return goog.bind.apply(null, arguments)
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs)
  }
};
goog.mixin = function(target, source) {
  for(var x in source) {
    target[x] = source[x]
  }
};
goog.now = Date.now || function() {
  return+new Date
};
goog.globalEval = function(script) {
  if(goog.global.execScript) {
    goog.global.execScript(script, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(goog.evalWorksForGlobals_ == null) {
        goog.global.eval("var _et_ = 1;");
        if(typeof goog.global["_et_"] != "undefined") {
          delete goog.global["_et_"];
          goog.evalWorksForGlobals_ = true
        }else {
          goog.evalWorksForGlobals_ = false
        }
      }
      if(goog.evalWorksForGlobals_) {
        goog.global.eval(script)
      }else {
        var doc = goog.global.document;
        var scriptElt = doc.createElement("script");
        scriptElt.type = "text/javascript";
        scriptElt.defer = false;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt)
      }
    }else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.evalWorksForGlobals_ = null;
goog.cssNameMapping_;
goog.cssNameMappingStyle_;
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName
  };
  var renameByParts = function(cssName) {
    var parts = cssName.split("-");
    var mapped = [];
    for(var i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]))
    }
    return mapped.join("-")
  };
  var rename;
  if(goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts
  }else {
    rename = function(a) {
      return a
    }
  }
  if(opt_modifier) {
    return className + "-" + rename(opt_modifier)
  }else {
    return rename(className)
  }
};
goog.setCssNameMapping = function(mapping, opt_style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = opt_style
};
goog.global.CLOSURE_CSS_NAME_MAPPING;
if(!COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING) {
  goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING
}
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for(var key in values) {
    var value = ("" + values[key]).replace(/\$/g, "$$$$");
    str = str.replace(new RegExp("\\{\\$" + key + "\\}", "gi"), value)
  }
  return str
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo)
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if(caller.superClass_) {
    return caller.superClass_.constructor.apply(me, Array.prototype.slice.call(arguments, 1))
  }
  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for(var ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if(ctor.prototype[opt_methodName] === caller) {
      foundCaller = true
    }else {
      if(foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args)
      }
    }
  }
  if(me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args)
  }else {
    throw Error("goog.base called from a method of one name " + "to a method of a different name");
  }
};
goog.scope = function(fn) {
  fn.call(goog.global)
};
goog.provide("goog.string");
goog.provide("goog.string.Unicode");
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length)) == 0
};
goog.string.subs = function(str, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var replacement = String(arguments[i]).replace(/\$/g, "$$$$");
    str = str.replace(/\%s/, replacement)
  }
  return str
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
};
goog.string.isEmpty = function(str) {
  return/^[\s\xa0]*$/.test(str)
};
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str))
};
goog.string.isBreakingWhitespace = function(str) {
  return!/[^\t\n\r ]/.test(str)
};
goog.string.isAlpha = function(str) {
  return!/[^a-zA-Z]/.test(str)
};
goog.string.isNumeric = function(str) {
  return!/[^0-9]/.test(str)
};
goog.string.isAlphaNumeric = function(str) {
  return!/[^a-zA-Z0-9]/.test(str)
};
goog.string.isSpace = function(ch) {
  return ch == " "
};
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= " " && ch <= "~" || ch >= "\u0080" && ch <= "\ufffd"
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ")
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n")
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ")
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ")
};
goog.string.collapseBreakingSpaces = function(str) {
  return str.replace(/[\t\r\n ]+/g, " ").replace(/^[\t\r\n ]+|[\t\r\n ]+$/g, "")
};
goog.string.trim = function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "")
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "")
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();
  if(test1 < test2) {
    return-1
  }else {
    if(test1 == test2) {
      return 0
    }else {
      return 1
    }
  }
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(str1, str2) {
  if(str1 == str2) {
    return 0
  }
  if(!str1) {
    return-1
  }
  if(!str2) {
    return 1
  }
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var count = Math.min(tokens1.length, tokens2.length);
  for(var i = 0;i < count;i++) {
    var a = tokens1[i];
    var b = tokens2[i];
    if(a != b) {
      var num1 = parseInt(a, 10);
      if(!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if(!isNaN(num2) && num1 - num2) {
          return num1 - num2
        }
      }
      return a < b ? -1 : 1
    }
  }
  if(tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length
  }
  return str1 < str2 ? -1 : 1
};
goog.string.urlEncode = function(str) {
  return encodeURIComponent(String(str))
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>")
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if(opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;")
  }else {
    if(!goog.string.allRe_.test(str)) {
      return str
    }
    if(str.indexOf("&") != -1) {
      str = str.replace(goog.string.amperRe_, "&amp;")
    }
    if(str.indexOf("<") != -1) {
      str = str.replace(goog.string.ltRe_, "&lt;")
    }
    if(str.indexOf(">") != -1) {
      str = str.replace(goog.string.gtRe_, "&gt;")
    }
    if(str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, "&quot;")
    }
    return str
  }
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /\"/g;
goog.string.allRe_ = /[&<>\"]/;
goog.string.unescapeEntities = function(str) {
  if(goog.string.contains(str, "&")) {
    if("document" in goog.global) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var seen = {"&amp;":"&", "&lt;":"<", "&gt;":">", "&quot;":'"'};
  var div = document.createElement("div");
  return str.replace(goog.string.HTML_ENTITY_PATTERN_, function(s, entity) {
    var value = seen[s];
    if(value) {
      return value
    }
    if(entity.charAt(0) == "#") {
      var n = Number("0" + entity.substr(1));
      if(!isNaN(n)) {
        value = String.fromCharCode(n)
      }
    }
    if(!value) {
      div.innerHTML = s + " ";
      value = div.firstChild.nodeValue.slice(0, -1)
    }
    return seen[s] = value
  })
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return"&";
      case "lt":
        return"<";
      case "gt":
        return">";
      case "quot":
        return'"';
      default:
        if(entity.charAt(0) == "#") {
          var n = Number("0" + entity.substr(1));
          if(!isNaN(n)) {
            return String.fromCharCode(n)
          }
        }
        return s
    }
  })
};
goog.string.HTML_ENTITY_PATTERN_ = /&([^;\s<&]+);?/g;
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml)
};
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for(var i = 0;i < length;i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if(str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1)
    }
  }
  return str
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(str.length > chars) {
    str = str.substring(0, chars - 3) + "..."
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(opt_trailingChars && str.length > chars) {
    if(opt_trailingChars > chars) {
      opt_trailingChars = chars
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + "..." + str.substring(endPoint)
  }else {
    if(str.length > chars) {
      var half = Math.floor(chars / 2);
      var endPos = str.length - half;
      half += chars % 2;
      str = str.substring(0, half) + "..." + str.substring(endPos)
    }
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\b":"\\b", "\f":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  if(s.quote) {
    return s.quote()
  }else {
    var sb = ['"'];
    for(var i = 0;i < s.length;i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] || (cc > 31 && cc < 127 ? ch : goog.string.escapeChar(ch))
    }
    sb.push('"');
    return sb.join("")
  }
};
goog.string.escapeString = function(str) {
  var sb = [];
  for(var i = 0;i < str.length;i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i))
  }
  return sb.join("")
};
goog.string.escapeChar = function(c) {
  if(c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c]
  }
  if(c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c]
  }
  var rv = c;
  var cc = c.charCodeAt(0);
  if(cc > 31 && cc < 127) {
    rv = c
  }else {
    if(cc < 256) {
      rv = "\\x";
      if(cc < 16 || cc > 256) {
        rv += "0"
      }
    }else {
      rv = "\\u";
      if(cc < 4096) {
        rv += "0"
      }
    }
    rv += cc.toString(16).toUpperCase()
  }
  return goog.string.jsEscapeCache_[c] = rv
};
goog.string.toMap = function(s) {
  var rv = {};
  for(var i = 0;i < s.length;i++) {
    rv[s.charAt(i)] = true
  }
  return rv
};
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1
};
goog.string.countOf = function(s, ss) {
  return s && ss ? s.split(ss).length - 1 : 0
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  if(index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength)
  }
  return resultStr
};
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "");
  return s.replace(re, "")
};
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "")
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
};
goog.string.repeat = function(string, length) {
  return(new Array(length + 1)).join(string)
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf(".");
  if(index == -1) {
    index = s.length
  }
  return goog.string.repeat("0", Math.max(0, length - index)) + s
};
goog.string.makeSafe = function(obj) {
  return obj == null ? "" : String(obj)
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "")
};
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36)
};
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  var v1Subs = goog.string.trim(String(version1)).split(".");
  var v2Subs = goog.string.trim(String(version2)).split(".");
  var subCount = Math.max(v1Subs.length, v2Subs.length);
  for(var subIdx = 0;order == 0 && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "";
    var v2Sub = v2Subs[subIdx] || "";
    var v1CompParser = new RegExp("(\\d*)(\\D*)", "g");
    var v2CompParser = new RegExp("(\\d*)(\\D*)", "g");
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""];
      var v2Comp = v2CompParser.exec(v2Sub) || ["", "", ""];
      if(v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break
      }
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);
      order = goog.string.compareElements_(v1CompNum, v2CompNum) || goog.string.compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) || goog.string.compareElements_(v1Comp[2], v2Comp[2])
    }while(order == 0)
  }
  return order
};
goog.string.compareElements_ = function(left, right) {
  if(left < right) {
    return-1
  }else {
    if(left > right) {
      return 1
    }
  }
  return 0
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(str) {
  var result = 0;
  for(var i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i);
    result %= goog.string.HASHCODE_MAX_
  }
  return result
};
goog.string.uniqueStringCounter_ = Math.random() * 2147483648 | 0;
goog.string.createUniqueString = function() {
  return"goog_" + goog.string.uniqueStringCounter_++
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  if(num == 0 && goog.string.isEmpty(str)) {
    return NaN
  }
  return num
};
goog.string.toCamelCase = function(str) {
  return String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase()
  })
};
goog.string.toSelectorCase = function(str) {
  return String(str).replace(/([A-Z])/g, "-$1").toLowerCase()
};
goog.string.toTitleCase = function(str, opt_delimiters) {
  var delimiters = goog.isString(opt_delimiters) ? goog.string.regExpEscape(opt_delimiters) : "\\s";
  delimiters = delimiters ? "|[" + delimiters + "]+" : "";
  var regexp = new RegExp("(^" + delimiters + ")([a-z])", "g");
  return str.replace(regexp, function(all, p1, p2) {
    return p1 + p2.toUpperCase()
  })
};
goog.string.parseInt = function(value) {
  if(isFinite(value)) {
    value = String(value)
  }
  if(goog.isString(value)) {
    return/^\s*-?0x/i.test(value) ? parseInt(value, 16) : parseInt(value, 10)
  }
  return NaN
};
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  if(Error.captureStackTrace) {
    Error.captureStackTrace(this, goog.debug.Error)
  }else {
    this.stack = (new Error).stack || ""
  }
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.provide("goog.asserts");
goog.provide("goog.asserts.AssertionError");
goog.require("goog.debug.Error");
goog.require("goog.string");
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift();
  this.messagePattern = messagePattern
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if(givenMessage) {
    message += ": " + givenMessage;
    var args = givenArgs
  }else {
    if(defaultMessage) {
      message += ": " + defaultMessage;
      args = defaultArgs
    }
  }
  throw new goog.asserts.AssertionError("" + message, args || []);
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return condition
};
goog.asserts.fail = function(opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1));
  }
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3))
  }
  return value
};
goog.provide("goog.array");
goog.provide("goog.array.ArrayLike");
goog.require("goog.asserts");
goog.NATIVE_ARRAY_PROTOTYPES = true;
goog.array.ArrayLike;
goog.array.peek = function(array) {
  return array[array.length - 1]
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? 0 : opt_fromIndex < 0 ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.indexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i < arr.length;i++) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  if(fromIndex < 0) {
    fromIndex = Math.max(0, arr.length + fromIndex)
  }
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.lastIndexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i >= 0;i--) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;--i) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = [];
  var resLength = 0;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      var val = arr2[i];
      if(f.call(opt_obj, val, i, arr)) {
        res[resLength++] = val
      }
    }
  }
  return res
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = new Array(l);
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      res[i] = f.call(opt_obj, arr2[i], i, arr)
    }
  }
  return res
};
goog.array.reduce = function(arr, f, val, opt_obj) {
  if(arr.reduce) {
    if(opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduce(f, val)
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if(arr.reduceRight) {
    if(opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduceRight(f, val)
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return true
    }
  }
  return false
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return false
    }
  }
  return true
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;i--) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0
};
goog.array.isEmpty = function(arr) {
  return arr.length == 0
};
goog.array.clear = function(arr) {
  if(!goog.isArray(arr)) {
    for(var i = arr.length - 1;i >= 0;i--) {
      delete arr[i]
    }
  }
  arr.length = 0
};
goog.array.insert = function(arr, obj) {
  if(!goog.array.contains(arr, obj)) {
    arr.push(obj)
  }
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj)
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd)
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if(arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj)
  }else {
    goog.array.insertAt(arr, obj, i)
  }
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if(rv = i >= 0) {
    goog.array.removeAt(arr, i)
  }
  return rv
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if(i >= 0) {
    goog.array.removeAt(arr, i);
    return true
  }
  return false
};
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments)
};
goog.array.toArray = function(object) {
  var length = object.length;
  if(length > 0) {
    var rv = new Array(length);
    for(var i = 0;i < length;i++) {
      rv[i] = object[i]
    }
    return rv
  }
  return[]
};
goog.array.clone = goog.array.toArray;
goog.array.extend = function(arr1, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    var isArrayLike;
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && arr2.hasOwnProperty("callee")) {
      arr1.push.apply(arr1, arr2)
    }else {
      if(isArrayLike) {
        var len1 = arr1.length;
        var len2 = arr2.length;
        for(var j = 0;j < len2;j++) {
          arr1[len1 + j] = arr2[j]
        }
      }else {
        arr1.push(arr2)
      }
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1))
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);
  if(arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start)
  }else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end)
  }
};
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;
  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while(cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
    if(!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current
    }
  }
  returnArray.length = cursorInsert
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, false, target)
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true, undefined, opt_obj)
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  var left = 0;
  var right = arr.length;
  var found;
  while(left < right) {
    var middle = left + right >> 1;
    var compareResult;
    if(isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr)
    }else {
      compareResult = compareFn(opt_target, arr[middle])
    }
    if(compareResult > 0) {
      left = middle + 1
    }else {
      right = middle;
      found = !compareResult
    }
  }
  return found ? left : ~left
};
goog.array.sort = function(arr, opt_compareFn) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.sort.call(arr, opt_compareFn || goog.array.defaultCompare)
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for(var i = 0;i < arr.length;i++) {
    arr[i] = {index:i, value:arr[i]}
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index
  }
  goog.array.sort(arr, stableCompareFn);
  for(var i = 0;i < arr.length;i++) {
    arr[i] = arr[i].value
  }
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key])
  })
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for(var i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if(compareResult > 0 || compareResult == 0 && opt_strict) {
      return false
    }
  }
  return true
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if(!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return false
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for(var i = 0;i < l;i++) {
    if(!equalsFn(arr1[i], arr2[i])) {
      return false
    }
  }
  return true
};
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn)
};
goog.array.compare3 = function(arr1, arr2, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  var l = Math.min(arr1.length, arr2.length);
  for(var i = 0;i < l;i++) {
    var result = compare(arr1[i], arr2[i]);
    if(result != 0) {
      return result
    }
  }
  return goog.array.defaultCompare(arr1.length, arr2.length)
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if(index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true
  }
  return false
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return index >= 0 ? goog.array.removeAt(array, index) : false
};
goog.array.bucket = function(array, sorter) {
  var buckets = {};
  for(var i = 0;i < array.length;i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if(goog.isDef(key)) {
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value)
    }
  }
  return buckets
};
goog.array.repeat = function(value, n) {
  var array = [];
  for(var i = 0;i < n;i++) {
    array[i] = value
  }
  return array
};
goog.array.flatten = function(var_args) {
  var result = [];
  for(var i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    if(goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element))
    }else {
      result.push(element)
    }
  }
  return result
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);
  if(array.length) {
    n %= array.length;
    if(n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n))
    }else {
      if(n < 0) {
        goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n))
      }
    }
  }
  return array
};
goog.array.zip = function(var_args) {
  if(!arguments.length) {
    return[]
  }
  var result = [];
  for(var i = 0;true;i++) {
    var value = [];
    for(var j = 0;j < arguments.length;j++) {
      var arr = arguments[j];
      if(i >= arr.length) {
        return result
      }
      value.push(arr[i])
    }
    result.push(value)
  }
};
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;
  for(var i = arr.length - 1;i > 0;i--) {
    var j = Math.floor(randFn() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp
  }
};
goog.provide("goog.object");
goog.object.forEach = function(obj, f, opt_obj) {
  for(var key in obj) {
    f.call(opt_obj, obj[key], key, obj)
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key]
    }
  }
  return res
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj)
  }
  return res
};
goog.object.some = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      return true
    }
  }
  return false
};
goog.object.every = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(!f.call(opt_obj, obj[key], key, obj)) {
      return false
    }
  }
  return true
};
goog.object.getCount = function(obj) {
  var rv = 0;
  for(var key in obj) {
    rv++
  }
  return rv
};
goog.object.getAnyKey = function(obj) {
  for(var key in obj) {
    return key
  }
};
goog.object.getAnyValue = function(obj) {
  for(var key in obj) {
    return obj[key]
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val)
};
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = obj[key]
  }
  return res
};
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = key
  }
  return res
};
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;
  for(var i = isArrayLike ? 0 : 1;i < keys.length;i++) {
    obj = obj[keys[i]];
    if(!goog.isDef(obj)) {
      break
    }
  }
  return obj
};
goog.object.containsKey = function(obj, key) {
  return key in obj
};
goog.object.containsValue = function(obj, val) {
  for(var key in obj) {
    if(obj[key] == val) {
      return true
    }
  }
  return false
};
goog.object.findKey = function(obj, f, opt_this) {
  for(var key in obj) {
    if(f.call(opt_this, obj[key], key, obj)) {
      return key
    }
  }
  return undefined
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key]
};
goog.object.isEmpty = function(obj) {
  for(var key in obj) {
    return false
  }
  return true
};
goog.object.clear = function(obj) {
  for(var i in obj) {
    delete obj[i]
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  if(rv = key in obj) {
    delete obj[key]
  }
  return rv
};
goog.object.add = function(obj, key, val) {
  if(key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val)
};
goog.object.get = function(obj, key, opt_val) {
  if(key in obj) {
    return obj[key]
  }
  return opt_val
};
goog.object.set = function(obj, key, value) {
  obj[key] = value
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value
};
goog.object.clone = function(obj) {
  var res = {};
  for(var key in obj) {
    res[key] = obj[key]
  }
  return res
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key])
    }
    return clone
  }
  return obj
};
goog.object.transpose = function(obj) {
  var transposed = {};
  for(var key in obj) {
    transposed[obj[key]] = key
  }
  return transposed
};
goog.object.PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.object.extend = function(target, var_args) {
  var key, source;
  for(var i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for(key in source) {
      target[key] = source[key]
    }
    for(var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if(Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key]
      }
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0])
  }
  if(argLength % 2) {
    throw Error("Uneven number of arguments");
  }
  var rv = {};
  for(var i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1]
  }
  return rv
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0])
  }
  var rv = {};
  for(var i = 0;i < argLength;i++) {
    rv[arguments[i]] = true
  }
  return rv
};
goog.provide("goog.string.format");
goog.require("goog.string");
goog.string.format = function(formatString, var_args) {
  var args = Array.prototype.slice.call(arguments);
  var template = args.shift();
  if(typeof template == "undefined") {
    throw Error("[goog.string.format] Template required");
  }
  var formatRe = /%([0\-\ \+]*)(\d+)?(\.(\d+))?([%sfdiu])/g;
  function replacerDemuxer(match, flags, width, dotp, precision, type, offset, wholeString) {
    if(type == "%") {
      return"%"
    }
    var value = args.shift();
    if(typeof value == "undefined") {
      throw Error("[goog.string.format] Not enough arguments");
    }
    arguments[0] = value;
    return goog.string.format.demuxes_[type].apply(null, arguments)
  }
  return template.replace(formatRe, replacerDemuxer)
};
goog.string.format.demuxes_ = {};
goog.string.format.demuxes_["s"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value;
  if(isNaN(width) || width == "" || replacement.length >= width) {
    return replacement
  }
  if(flags.indexOf("-", 0) > -1) {
    replacement = replacement + goog.string.repeat(" ", width - replacement.length)
  }else {
    replacement = goog.string.repeat(" ", width - replacement.length) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["f"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value.toString();
  if(!(isNaN(precision) || precision == "")) {
    replacement = value.toFixed(precision)
  }
  var sign;
  if(value < 0) {
    sign = "-"
  }else {
    if(flags.indexOf("+") >= 0) {
      sign = "+"
    }else {
      if(flags.indexOf(" ") >= 0) {
        sign = " "
      }else {
        sign = ""
      }
    }
  }
  if(value >= 0) {
    replacement = sign + replacement
  }
  if(isNaN(width) || replacement.length >= width) {
    return replacement
  }
  replacement = isNaN(precision) ? Math.abs(value).toString() : Math.abs(value).toFixed(precision);
  var padCount = width - replacement.length - sign.length;
  if(flags.indexOf("-", 0) >= 0) {
    replacement = sign + replacement + goog.string.repeat(" ", padCount)
  }else {
    var paddingChar = flags.indexOf("0", 0) >= 0 ? "0" : " ";
    replacement = sign + goog.string.repeat(paddingChar, padCount) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["d"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  return goog.string.format.demuxes_["f"](parseInt(value, 10), flags, width, dotp, 0, type, offset, wholeString)
};
goog.string.format.demuxes_["i"] = goog.string.format.demuxes_["d"];
goog.string.format.demuxes_["u"] = goog.string.format.demuxes_["d"];
goog.provide("goog.string.StringBuffer");
goog.string.StringBuffer = function(opt_a1, var_args) {
  if(opt_a1 != null) {
    this.append.apply(this, arguments)
  }
};
goog.string.StringBuffer.prototype.buffer_ = "";
goog.string.StringBuffer.prototype.set = function(s) {
  this.buffer_ = "" + s
};
goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
  this.buffer_ += a1;
  if(opt_a2 != null) {
    for(var i = 1;i < arguments.length;i++) {
      this.buffer_ += arguments[i]
    }
  }
  return this
};
goog.string.StringBuffer.prototype.clear = function() {
  this.buffer_ = ""
};
goog.string.StringBuffer.prototype.getLength = function() {
  return this.buffer_.length
};
goog.string.StringBuffer.prototype.toString = function() {
  return this.buffer_
};
goog.provide("cljs.core");
goog.require("goog.array");
goog.require("goog.object");
goog.require("goog.string.format");
goog.require("goog.string.StringBuffer");
goog.require("goog.string");
cljs.core._STAR_unchecked_if_STAR_ = false;
cljs.core._STAR_print_fn_STAR_ = function _STAR_print_fn_STAR_(_) {
  throw new Error("No *print-fn* fn set for evaluation environment");
};
cljs.core.set_print_fn_BANG_ = function set_print_fn_BANG_(f) {
  return cljs.core._STAR_print_fn_STAR_ = f
};
goog.exportSymbol("cljs.core.set_print_fn_BANG_", cljs.core.set_print_fn_BANG_);
cljs.core._STAR_flush_on_newline_STAR_ = true;
cljs.core._STAR_print_readably_STAR_ = true;
cljs.core._STAR_print_meta_STAR_ = false;
cljs.core._STAR_print_dup_STAR_ = false;
cljs.core.pr_opts = function pr_opts() {
  return cljs.core.PersistentArrayMap.fromArray(["\ufdd0:flush-on-newline", cljs.core._STAR_flush_on_newline_STAR_, "\ufdd0:readably", cljs.core._STAR_print_readably_STAR_, "\ufdd0:meta", cljs.core._STAR_print_meta_STAR_, "\ufdd0:dup", cljs.core._STAR_print_dup_STAR_], true)
};
cljs.core.truth_ = function truth_(x) {
  return x != null && x !== false
};
cljs.core.not_native = null;
cljs.core.identical_QMARK_ = function identical_QMARK_(x, y) {
  return x === y
};
cljs.core.nil_QMARK_ = function nil_QMARK_(x) {
  return x == null
};
cljs.core.array_QMARK_ = function array_QMARK_(x) {
  return x instanceof Array
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return typeof n === "number"
};
cljs.core.not = function not(x) {
  if(cljs.core.truth_(x)) {
    return false
  }else {
    return true
  }
};
cljs.core.string_QMARK_ = function string_QMARK_(x) {
  var and__3941__auto__ = goog.isString(x);
  if(and__3941__auto__) {
    return!(x.charAt(0) === "\ufdd0")
  }else {
    return and__3941__auto__
  }
};
cljs.core.type_satisfies_ = function type_satisfies_(p, x) {
  var x__$1 = x == null ? null : x;
  if(p[goog.typeOf(x__$1)]) {
    return true
  }else {
    if(p["_"]) {
      return true
    }else {
      if("\ufdd0:else") {
        return false
      }else {
        return null
      }
    }
  }
};
cljs.core.is_proto_ = function is_proto_(x) {
  return x.constructor.prototype === x
};
cljs.core._STAR_main_cli_fn_STAR_ = null;
cljs.core.type = function type(x) {
  if(x == null) {
    return null
  }else {
    return x.constructor
  }
};
cljs.core.missing_protocol = function missing_protocol(proto, obj) {
  var ty = cljs.core.type.call(null, obj);
  var ty__$1 = cljs.core.truth_(function() {
    var and__3941__auto__ = ty;
    if(cljs.core.truth_(and__3941__auto__)) {
      return ty.cljs$lang$type
    }else {
      return and__3941__auto__
    }
  }()) ? ty.cljs$lang$ctorStr : goog.typeOf(obj);
  return new Error(["No protocol method ", proto, " defined for type ", ty__$1, ": ", obj].join(""))
};
cljs.core.aclone = function aclone(array_like) {
  return array_like.slice()
};
cljs.core.array = function array(var_args) {
  return Array.prototype.slice.call(arguments)
};
cljs.core.make_array = function() {
  var make_array = null;
  var make_array__1 = function(size) {
    return new Array(size)
  };
  var make_array__2 = function(type, size) {
    return make_array.call(null, size)
  };
  make_array = function(type, size) {
    switch(arguments.length) {
      case 1:
        return make_array__1.call(this, type);
      case 2:
        return make_array__2.call(this, type, size)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  make_array.cljs$core$IFn$_invoke$arity$1 = make_array__1;
  make_array.cljs$core$IFn$_invoke$arity$2 = make_array__2;
  return make_array
}();
cljs.core.aget = function() {
  var aget = null;
  var aget__2 = function(array, i) {
    return array[i]
  };
  var aget__3 = function() {
    var G__7039__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__7039 = function(array, i, var_args) {
      var idxs = null;
      if(arguments.length > 2) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7039__delegate.call(this, array, i, idxs)
    };
    G__7039.cljs$lang$maxFixedArity = 2;
    G__7039.cljs$lang$applyTo = function(arglist__7040) {
      var array = cljs.core.first(arglist__7040);
      arglist__7040 = cljs.core.next(arglist__7040);
      var i = cljs.core.first(arglist__7040);
      var idxs = cljs.core.rest(arglist__7040);
      return G__7039__delegate(array, i, idxs)
    };
    G__7039.cljs$core$IFn$_invoke$arity$variadic = G__7039__delegate;
    return G__7039
  }();
  aget = function(array, i, var_args) {
    var idxs = var_args;
    switch(arguments.length) {
      case 2:
        return aget__2.call(this, array, i);
      default:
        return aget__3.cljs$core$IFn$_invoke$arity$variadic(array, i, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  aget.cljs$lang$maxFixedArity = 2;
  aget.cljs$lang$applyTo = aget__3.cljs$lang$applyTo;
  aget.cljs$core$IFn$_invoke$arity$2 = aget__2;
  aget.cljs$core$IFn$_invoke$arity$variadic = aget__3.cljs$core$IFn$_invoke$arity$variadic;
  return aget
}();
cljs.core.aset = function aset(array, i, val) {
  return array[i] = val
};
cljs.core.alength = function alength(array) {
  return array.length
};
cljs.core.into_array = function() {
  var into_array = null;
  var into_array__1 = function(aseq) {
    return into_array.call(null, null, aseq)
  };
  var into_array__2 = function(type, aseq) {
    return cljs.core.reduce.call(null, function(a, x) {
      a.push(x);
      return a
    }, [], aseq)
  };
  into_array = function(type, aseq) {
    switch(arguments.length) {
      case 1:
        return into_array__1.call(this, type);
      case 2:
        return into_array__2.call(this, type, aseq)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  into_array.cljs$core$IFn$_invoke$arity$1 = into_array__1;
  into_array.cljs$core$IFn$_invoke$arity$2 = into_array__2;
  return into_array
}();
cljs.core.Fn = {};
cljs.core.IFn = {};
cljs.core._invoke = function() {
  var _invoke = null;
  var _invoke__1 = function(this$) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      var x__6521__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__6521__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      var x__6521__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__6521__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      var x__6521__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__6521__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      var x__6521__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__6521__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      var x__6521__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__6521__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      var x__6521__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__6521__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      var x__6521__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__6521__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      var x__6521__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__6521__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      var x__6521__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__6521__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      var x__6521__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__6521__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      var x__6521__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__6521__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      var x__6521__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__6521__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      var x__6521__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__6521__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      var x__6521__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__6521__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      var x__6521__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__6521__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      var x__6521__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__6521__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      var x__6521__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__6521__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      var x__6521__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__6521__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      var x__6521__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__6521__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      var x__6521__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__6521__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      var x__6521__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__6521__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
  };
  _invoke = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    switch(arguments.length) {
      case 1:
        return _invoke__1.call(this, this$);
      case 2:
        return _invoke__2.call(this, this$, a);
      case 3:
        return _invoke__3.call(this, this$, a, b);
      case 4:
        return _invoke__4.call(this, this$, a, b, c);
      case 5:
        return _invoke__5.call(this, this$, a, b, c, d);
      case 6:
        return _invoke__6.call(this, this$, a, b, c, d, e);
      case 7:
        return _invoke__7.call(this, this$, a, b, c, d, e, f);
      case 8:
        return _invoke__8.call(this, this$, a, b, c, d, e, f, g);
      case 9:
        return _invoke__9.call(this, this$, a, b, c, d, e, f, g, h);
      case 10:
        return _invoke__10.call(this, this$, a, b, c, d, e, f, g, h, i);
      case 11:
        return _invoke__11.call(this, this$, a, b, c, d, e, f, g, h, i, j);
      case 12:
        return _invoke__12.call(this, this$, a, b, c, d, e, f, g, h, i, j, k);
      case 13:
        return _invoke__13.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l);
      case 14:
        return _invoke__14.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m);
      case 15:
        return _invoke__15.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n);
      case 16:
        return _invoke__16.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
      case 17:
        return _invoke__17.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
      case 18:
        return _invoke__18.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
      case 19:
        return _invoke__19.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s);
      case 20:
        return _invoke__20.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t);
      case 21:
        return _invoke__21.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _invoke.cljs$core$IFn$_invoke$arity$1 = _invoke__1;
  _invoke.cljs$core$IFn$_invoke$arity$2 = _invoke__2;
  _invoke.cljs$core$IFn$_invoke$arity$3 = _invoke__3;
  _invoke.cljs$core$IFn$_invoke$arity$4 = _invoke__4;
  _invoke.cljs$core$IFn$_invoke$arity$5 = _invoke__5;
  _invoke.cljs$core$IFn$_invoke$arity$6 = _invoke__6;
  _invoke.cljs$core$IFn$_invoke$arity$7 = _invoke__7;
  _invoke.cljs$core$IFn$_invoke$arity$8 = _invoke__8;
  _invoke.cljs$core$IFn$_invoke$arity$9 = _invoke__9;
  _invoke.cljs$core$IFn$_invoke$arity$10 = _invoke__10;
  _invoke.cljs$core$IFn$_invoke$arity$11 = _invoke__11;
  _invoke.cljs$core$IFn$_invoke$arity$12 = _invoke__12;
  _invoke.cljs$core$IFn$_invoke$arity$13 = _invoke__13;
  _invoke.cljs$core$IFn$_invoke$arity$14 = _invoke__14;
  _invoke.cljs$core$IFn$_invoke$arity$15 = _invoke__15;
  _invoke.cljs$core$IFn$_invoke$arity$16 = _invoke__16;
  _invoke.cljs$core$IFn$_invoke$arity$17 = _invoke__17;
  _invoke.cljs$core$IFn$_invoke$arity$18 = _invoke__18;
  _invoke.cljs$core$IFn$_invoke$arity$19 = _invoke__19;
  _invoke.cljs$core$IFn$_invoke$arity$20 = _invoke__20;
  _invoke.cljs$core$IFn$_invoke$arity$21 = _invoke__21;
  return _invoke
}();
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    var x__6521__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._count[goog.typeOf(x__6521__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._count["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ICounted.-count", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IEmptyableCollection = {};
cljs.core._empty = function _empty(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    var x__6521__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._empty[goog.typeOf(x__6521__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._empty["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IEmptyableCollection.-empty", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ICollection = {};
cljs.core._conj = function _conj(coll, o) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    var x__6521__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._conj[goog.typeOf(x__6521__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._conj["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ICollection.-conj", coll);
        }
      }
    }().call(null, coll, o)
  }
};
cljs.core.IIndexed = {};
cljs.core._nth = function() {
  var _nth = null;
  var _nth__2 = function(coll, n) {
    if(function() {
      var and__3941__auto__ = coll;
      if(and__3941__auto__) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3941__auto__
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      var x__6521__auto__ = coll == null ? null : coll;
      return function() {
        var or__3943__auto__ = cljs.core._nth[goog.typeOf(x__6521__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._nth["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3941__auto__ = coll;
      if(and__3941__auto__) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3941__auto__
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      var x__6521__auto__ = coll == null ? null : coll;
      return function() {
        var or__3943__auto__ = cljs.core._nth[goog.typeOf(x__6521__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._nth["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n, not_found)
    }
  };
  _nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return _nth__2.call(this, coll, n);
      case 3:
        return _nth__3.call(this, coll, n, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _nth.cljs$core$IFn$_invoke$arity$2 = _nth__2;
  _nth.cljs$core$IFn$_invoke$arity$3 = _nth__3;
  return _nth
}();
cljs.core.ASeq = {};
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    var x__6521__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._first[goog.typeOf(x__6521__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._first["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    var x__6521__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._rest[goog.typeOf(x__6521__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._rest["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.INext = {};
cljs.core._next = function _next(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$INext$_next$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$INext$_next$arity$1(coll)
  }else {
    var x__6521__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._next[goog.typeOf(x__6521__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._next["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "INext.-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ILookup = {};
cljs.core._lookup = function() {
  var _lookup = null;
  var _lookup__2 = function(o, k) {
    if(function() {
      var and__3941__auto__ = o;
      if(and__3941__auto__) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3941__auto__
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      var x__6521__auto__ = o == null ? null : o;
      return function() {
        var or__3943__auto__ = cljs.core._lookup[goog.typeOf(x__6521__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._lookup["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3941__auto__ = o;
      if(and__3941__auto__) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3941__auto__
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      var x__6521__auto__ = o == null ? null : o;
      return function() {
        var or__3943__auto__ = cljs.core._lookup[goog.typeOf(x__6521__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._lookup["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k, not_found)
    }
  };
  _lookup = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return _lookup__2.call(this, o, k);
      case 3:
        return _lookup__3.call(this, o, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _lookup.cljs$core$IFn$_invoke$arity$2 = _lookup__2;
  _lookup.cljs$core$IFn$_invoke$arity$3 = _lookup__3;
  return _lookup
}();
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    var x__6521__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._contains_key_QMARK_[goog.typeOf(x__6521__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._contains_key_QMARK_["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    var x__6521__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._assoc[goog.typeOf(x__6521__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._assoc["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-assoc", coll);
        }
      }
    }().call(null, coll, k, v)
  }
};
cljs.core.IMap = {};
cljs.core._dissoc = function _dissoc(coll, k) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    var x__6521__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._dissoc[goog.typeOf(x__6521__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._dissoc["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMap.-dissoc", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core.IMapEntry = {};
cljs.core._key = function _key(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    var x__6521__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._key[goog.typeOf(x__6521__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._key["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    var x__6521__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._val[goog.typeOf(x__6521__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._val["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-val", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISet = {};
cljs.core._disjoin = function _disjoin(coll, v) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    var x__6521__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._disjoin[goog.typeOf(x__6521__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._disjoin["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ISet.-disjoin", coll);
        }
      }
    }().call(null, coll, v)
  }
};
cljs.core.IStack = {};
cljs.core._peek = function _peek(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    var x__6521__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._peek[goog.typeOf(x__6521__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._peek["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    var x__6521__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._pop[goog.typeOf(x__6521__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._pop["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-pop", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IVector = {};
cljs.core._assoc_n = function _assoc_n(coll, n, val) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    var x__6521__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._assoc_n[goog.typeOf(x__6521__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._assoc_n["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IVector.-assoc-n", coll);
        }
      }
    }().call(null, coll, n, val)
  }
};
cljs.core.IDeref = {};
cljs.core._deref = function _deref(o) {
  if(function() {
    var and__3941__auto__ = o;
    if(and__3941__auto__) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    var x__6521__auto__ = o == null ? null : o;
    return function() {
      var or__3943__auto__ = cljs.core._deref[goog.typeOf(x__6521__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._deref["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IDeref.-deref", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IDerefWithTimeout = {};
cljs.core._deref_with_timeout = function _deref_with_timeout(o, msec, timeout_val) {
  if(function() {
    var and__3941__auto__ = o;
    if(and__3941__auto__) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3941__auto__
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    var x__6521__auto__ = o == null ? null : o;
    return function() {
      var or__3943__auto__ = cljs.core._deref_with_timeout[goog.typeOf(x__6521__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._deref_with_timeout["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IDerefWithTimeout.-deref-with-timeout", o);
        }
      }
    }().call(null, o, msec, timeout_val)
  }
};
cljs.core.IMeta = {};
cljs.core._meta = function _meta(o) {
  if(function() {
    var and__3941__auto__ = o;
    if(and__3941__auto__) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    var x__6521__auto__ = o == null ? null : o;
    return function() {
      var or__3943__auto__ = cljs.core._meta[goog.typeOf(x__6521__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._meta["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMeta.-meta", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IWithMeta = {};
cljs.core._with_meta = function _with_meta(o, meta) {
  if(function() {
    var and__3941__auto__ = o;
    if(and__3941__auto__) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    var x__6521__auto__ = o == null ? null : o;
    return function() {
      var or__3943__auto__ = cljs.core._with_meta[goog.typeOf(x__6521__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._with_meta["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IWithMeta.-with-meta", o);
        }
      }
    }().call(null, o, meta)
  }
};
cljs.core.IReduce = {};
cljs.core._reduce = function() {
  var _reduce = null;
  var _reduce__2 = function(coll, f) {
    if(function() {
      var and__3941__auto__ = coll;
      if(and__3941__auto__) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3941__auto__
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      var x__6521__auto__ = coll == null ? null : coll;
      return function() {
        var or__3943__auto__ = cljs.core._reduce[goog.typeOf(x__6521__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._reduce["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3941__auto__ = coll;
      if(and__3941__auto__) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3941__auto__
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      var x__6521__auto__ = coll == null ? null : coll;
      return function() {
        var or__3943__auto__ = cljs.core._reduce[goog.typeOf(x__6521__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._reduce["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f, start)
    }
  };
  _reduce = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return _reduce__2.call(this, coll, f);
      case 3:
        return _reduce__3.call(this, coll, f, start)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _reduce.cljs$core$IFn$_invoke$arity$2 = _reduce__2;
  _reduce.cljs$core$IFn$_invoke$arity$3 = _reduce__3;
  return _reduce
}();
cljs.core.IKVReduce = {};
cljs.core._kv_reduce = function _kv_reduce(coll, f, init) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    var x__6521__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._kv_reduce[goog.typeOf(x__6521__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._kv_reduce["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IKVReduce.-kv-reduce", coll);
        }
      }
    }().call(null, coll, f, init)
  }
};
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(function() {
    var and__3941__auto__ = o;
    if(and__3941__auto__) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    var x__6521__auto__ = o == null ? null : o;
    return function() {
      var or__3943__auto__ = cljs.core._equiv[goog.typeOf(x__6521__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._equiv["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IEquiv.-equiv", o);
        }
      }
    }().call(null, o, other)
  }
};
cljs.core.IHash = {};
cljs.core._hash = function _hash(o) {
  if(function() {
    var and__3941__auto__ = o;
    if(and__3941__auto__) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    var x__6521__auto__ = o == null ? null : o;
    return function() {
      var or__3943__auto__ = cljs.core._hash[goog.typeOf(x__6521__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._hash["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IHash.-hash", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISeqable = {};
cljs.core._seq = function _seq(o) {
  if(function() {
    var and__3941__auto__ = o;
    if(and__3941__auto__) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    var x__6521__auto__ = o == null ? null : o;
    return function() {
      var or__3943__auto__ = cljs.core._seq[goog.typeOf(x__6521__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._seq["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeqable.-seq", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISequential = {};
cljs.core.IList = {};
cljs.core.IRecord = {};
cljs.core.IReversible = {};
cljs.core._rseq = function _rseq(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    var x__6521__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._rseq[goog.typeOf(x__6521__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._rseq["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IReversible.-rseq", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISorted = {};
cljs.core._sorted_seq = function _sorted_seq(coll, ascending_QMARK_) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    var x__6521__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._sorted_seq[goog.typeOf(x__6521__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._sorted_seq["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    var x__6521__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._sorted_seq_from[goog.typeOf(x__6521__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._sorted_seq_from["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    var x__6521__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._entry_key[goog.typeOf(x__6521__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._entry_key["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    var x__6521__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._comparator[goog.typeOf(x__6521__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._comparator["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-comparator", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IWriter = {};
cljs.core._write = function _write(writer, s) {
  if(function() {
    var and__3941__auto__ = writer;
    if(and__3941__auto__) {
      return writer.cljs$core$IWriter$_write$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return writer.cljs$core$IWriter$_write$arity$2(writer, s)
  }else {
    var x__6521__auto__ = writer == null ? null : writer;
    return function() {
      var or__3943__auto__ = cljs.core._write[goog.typeOf(x__6521__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._write["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IWriter.-write", writer);
        }
      }
    }().call(null, writer, s)
  }
};
cljs.core._flush = function _flush(writer) {
  if(function() {
    var and__3941__auto__ = writer;
    if(and__3941__auto__) {
      return writer.cljs$core$IWriter$_flush$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return writer.cljs$core$IWriter$_flush$arity$1(writer)
  }else {
    var x__6521__auto__ = writer == null ? null : writer;
    return function() {
      var or__3943__auto__ = cljs.core._flush[goog.typeOf(x__6521__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._flush["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IWriter.-flush", writer);
        }
      }
    }().call(null, writer)
  }
};
cljs.core.IPrintWithWriter = {};
cljs.core._pr_writer = function _pr_writer(o, writer, opts) {
  if(function() {
    var and__3941__auto__ = o;
    if(and__3941__auto__) {
      return o.cljs$core$IPrintWithWriter$_pr_writer$arity$3
    }else {
      return and__3941__auto__
    }
  }()) {
    return o.cljs$core$IPrintWithWriter$_pr_writer$arity$3(o, writer, opts)
  }else {
    var x__6521__auto__ = o == null ? null : o;
    return function() {
      var or__3943__auto__ = cljs.core._pr_writer[goog.typeOf(x__6521__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._pr_writer["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IPrintWithWriter.-pr-writer", o);
        }
      }
    }().call(null, o, writer, opts)
  }
};
cljs.core.IPending = {};
cljs.core._realized_QMARK_ = function _realized_QMARK_(d) {
  if(function() {
    var and__3941__auto__ = d;
    if(and__3941__auto__) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    var x__6521__auto__ = d == null ? null : d;
    return function() {
      var or__3943__auto__ = cljs.core._realized_QMARK_[goog.typeOf(x__6521__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._realized_QMARK_["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IPending.-realized?", d);
        }
      }
    }().call(null, d)
  }
};
cljs.core.IWatchable = {};
cljs.core._notify_watches = function _notify_watches(this$, oldval, newval) {
  if(function() {
    var and__3941__auto__ = this$;
    if(and__3941__auto__) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3941__auto__
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    var x__6521__auto__ = this$ == null ? null : this$;
    return function() {
      var or__3943__auto__ = cljs.core._notify_watches[goog.typeOf(x__6521__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._notify_watches["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3941__auto__ = this$;
    if(and__3941__auto__) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3941__auto__
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    var x__6521__auto__ = this$ == null ? null : this$;
    return function() {
      var or__3943__auto__ = cljs.core._add_watch[goog.typeOf(x__6521__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._add_watch["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3941__auto__ = this$;
    if(and__3941__auto__) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    var x__6521__auto__ = this$ == null ? null : this$;
    return function() {
      var or__3943__auto__ = cljs.core._remove_watch[goog.typeOf(x__6521__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._remove_watch["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-remove-watch", this$);
        }
      }
    }().call(null, this$, key)
  }
};
cljs.core.IEditableCollection = {};
cljs.core._as_transient = function _as_transient(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    var x__6521__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._as_transient[goog.typeOf(x__6521__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._as_transient["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IEditableCollection.-as-transient", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ITransientCollection = {};
cljs.core._conj_BANG_ = function _conj_BANG_(tcoll, val) {
  if(function() {
    var and__3941__auto__ = tcoll;
    if(and__3941__auto__) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    var x__6521__auto__ = tcoll == null ? null : tcoll;
    return function() {
      var or__3943__auto__ = cljs.core._conj_BANG_[goog.typeOf(x__6521__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._conj_BANG_["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3941__auto__ = tcoll;
    if(and__3941__auto__) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    var x__6521__auto__ = tcoll == null ? null : tcoll;
    return function() {
      var or__3943__auto__ = cljs.core._persistent_BANG_[goog.typeOf(x__6521__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._persistent_BANG_["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-persistent!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientAssociative = {};
cljs.core._assoc_BANG_ = function _assoc_BANG_(tcoll, key, val) {
  if(function() {
    var and__3941__auto__ = tcoll;
    if(and__3941__auto__) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3941__auto__
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    var x__6521__auto__ = tcoll == null ? null : tcoll;
    return function() {
      var or__3943__auto__ = cljs.core._assoc_BANG_[goog.typeOf(x__6521__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._assoc_BANG_["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientAssociative.-assoc!", tcoll);
        }
      }
    }().call(null, tcoll, key, val)
  }
};
cljs.core.ITransientMap = {};
cljs.core._dissoc_BANG_ = function _dissoc_BANG_(tcoll, key) {
  if(function() {
    var and__3941__auto__ = tcoll;
    if(and__3941__auto__) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    var x__6521__auto__ = tcoll == null ? null : tcoll;
    return function() {
      var or__3943__auto__ = cljs.core._dissoc_BANG_[goog.typeOf(x__6521__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._dissoc_BANG_["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientMap.-dissoc!", tcoll);
        }
      }
    }().call(null, tcoll, key)
  }
};
cljs.core.ITransientVector = {};
cljs.core._assoc_n_BANG_ = function _assoc_n_BANG_(tcoll, n, val) {
  if(function() {
    var and__3941__auto__ = tcoll;
    if(and__3941__auto__) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3941__auto__
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    var x__6521__auto__ = tcoll == null ? null : tcoll;
    return function() {
      var or__3943__auto__ = cljs.core._assoc_n_BANG_[goog.typeOf(x__6521__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._assoc_n_BANG_["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3941__auto__ = tcoll;
    if(and__3941__auto__) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    var x__6521__auto__ = tcoll == null ? null : tcoll;
    return function() {
      var or__3943__auto__ = cljs.core._pop_BANG_[goog.typeOf(x__6521__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._pop_BANG_["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-pop!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientSet = {};
cljs.core._disjoin_BANG_ = function _disjoin_BANG_(tcoll, v) {
  if(function() {
    var and__3941__auto__ = tcoll;
    if(and__3941__auto__) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    var x__6521__auto__ = tcoll == null ? null : tcoll;
    return function() {
      var or__3943__auto__ = cljs.core._disjoin_BANG_[goog.typeOf(x__6521__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._disjoin_BANG_["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientSet.-disjoin!", tcoll);
        }
      }
    }().call(null, tcoll, v)
  }
};
cljs.core.IComparable = {};
cljs.core._compare = function _compare(x, y) {
  if(function() {
    var and__3941__auto__ = x;
    if(and__3941__auto__) {
      return x.cljs$core$IComparable$_compare$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return x.cljs$core$IComparable$_compare$arity$2(x, y)
  }else {
    var x__6521__auto__ = x == null ? null : x;
    return function() {
      var or__3943__auto__ = cljs.core._compare[goog.typeOf(x__6521__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._compare["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IComparable.-compare", x);
        }
      }
    }().call(null, x, y)
  }
};
cljs.core.IChunk = {};
cljs.core._drop_first = function _drop_first(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IChunk$_drop_first$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IChunk$_drop_first$arity$1(coll)
  }else {
    var x__6521__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._drop_first[goog.typeOf(x__6521__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._drop_first["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunk.-drop-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedSeq = {};
cljs.core._chunked_first = function _chunked_first(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1(coll)
  }else {
    var x__6521__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._chunked_first[goog.typeOf(x__6521__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._chunked_first["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._chunked_rest = function _chunked_rest(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }else {
    var x__6521__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._chunked_rest[goog.typeOf(x__6521__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._chunked_rest["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedNext = {};
cljs.core._chunked_next = function _chunked_next(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IChunkedNext$_chunked_next$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }else {
    var x__6521__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._chunked_next[goog.typeOf(x__6521__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._chunked_next["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedNext.-chunked-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.INamed = {};
cljs.core._name = function _name(x) {
  if(function() {
    var and__3941__auto__ = x;
    if(and__3941__auto__) {
      return x.cljs$core$INamed$_name$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return x.cljs$core$INamed$_name$arity$1(x)
  }else {
    var x__6521__auto__ = x == null ? null : x;
    return function() {
      var or__3943__auto__ = cljs.core._name[goog.typeOf(x__6521__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._name["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "INamed.-name", x);
        }
      }
    }().call(null, x)
  }
};
cljs.core._namespace = function _namespace(x) {
  if(function() {
    var and__3941__auto__ = x;
    if(and__3941__auto__) {
      return x.cljs$core$INamed$_namespace$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return x.cljs$core$INamed$_namespace$arity$1(x)
  }else {
    var x__6521__auto__ = x == null ? null : x;
    return function() {
      var or__3943__auto__ = cljs.core._namespace[goog.typeOf(x__6521__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._namespace["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "INamed.-namespace", x);
        }
      }
    }().call(null, x)
  }
};
goog.provide("cljs.core.StringBufferWriter");
cljs.core.StringBufferWriter = function(sb) {
  this.sb = sb;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1073741824
};
cljs.core.StringBufferWriter.cljs$lang$type = true;
cljs.core.StringBufferWriter.cljs$lang$ctorStr = "cljs.core/StringBufferWriter";
cljs.core.StringBufferWriter.cljs$lang$ctorPrWriter = function(this__6461__auto__, writer__6462__auto__, opt__6463__auto__) {
  return cljs.core._write.call(null, writer__6462__auto__, "cljs.core/StringBufferWriter")
};
cljs.core.StringBufferWriter.prototype.cljs$core$IWriter$_write$arity$2 = function(_, s) {
  var self__ = this;
  return self__.sb.append(s)
};
cljs.core.StringBufferWriter.prototype.cljs$core$IWriter$_flush$arity$1 = function(_) {
  var self__ = this;
  return null
};
cljs.core.pr_str_STAR_ = function pr_str_STAR_(obj) {
  var sb = new goog.string.StringBuffer;
  var writer = new cljs.core.StringBufferWriter(sb);
  cljs.core._pr_writer.call(null, obj, writer, cljs.core.pr_opts.call(null));
  cljs.core._flush.call(null, writer);
  return[cljs.core.str(sb)].join("")
};
cljs.core.instance_QMARK_ = function instance_QMARK_(t, o) {
  return o instanceof t
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  return x instanceof cljs.core.Symbol
};
goog.provide("cljs.core.Symbol");
cljs.core.Symbol = function(ns, name, str, _hash, _meta) {
  this.ns = ns;
  this.name = name;
  this.str = str;
  this._hash = _hash;
  this._meta = _meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2154168321
};
cljs.core.Symbol.cljs$lang$type = true;
cljs.core.Symbol.cljs$lang$ctorStr = "cljs.core/Symbol";
cljs.core.Symbol.cljs$lang$ctorPrWriter = function(this__6461__auto__, writer__6462__auto__, opt__6463__auto__) {
  return cljs.core._write.call(null, writer__6462__auto__, "cljs.core/Symbol")
};
cljs.core.Symbol.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(o, writer, _) {
  var self__ = this;
  return cljs.core._write.call(null, writer, self__.str)
};
cljs.core.Symbol.prototype.cljs$core$INamed$ = true;
cljs.core.Symbol.prototype.cljs$core$INamed$_name$arity$1 = function(_) {
  var self__ = this;
  return self__.name
};
cljs.core.Symbol.prototype.cljs$core$INamed$_namespace$arity$1 = function(_) {
  var self__ = this;
  return self__.ns
};
cljs.core.Symbol.prototype.cljs$core$IHash$_hash$arity$1 = function(_) {
  var self__ = this;
  if(self__._hash === -1) {
    self__._hash = cljs.core.hash_combine.call(null, cljs.core.hash.call(null, self__.ns), cljs.core.hash.call(null, self__.name));
    return self__._hash
  }else {
    return self__._hash
  }
};
cljs.core.Symbol.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(_, new_meta) {
  var self__ = this;
  return new cljs.core.Symbol(self__.ns, self__.name, self__.str, self__._hash, new_meta)
};
cljs.core.Symbol.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var self__ = this;
  return self__._meta
};
cljs.core.Symbol.prototype.call = function() {
  var G__7042 = null;
  var G__7042__2 = function(self__, coll) {
    var self__ = this;
    var self____$1 = this;
    var sym = self____$1;
    return cljs.core._lookup.call(null, coll, sym, null)
  };
  var G__7042__3 = function(self__, coll, not_found) {
    var self__ = this;
    var self____$1 = this;
    var sym = self____$1;
    return cljs.core._lookup.call(null, coll, sym, not_found)
  };
  G__7042 = function(self__, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7042__2.call(this, self__, coll);
      case 3:
        return G__7042__3.call(this, self__, coll, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__7042
}();
cljs.core.Symbol.prototype.apply = function(self__, args7041) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args7041.slice()))
};
cljs.core.Symbol.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var self__ = this;
  if(other instanceof cljs.core.Symbol) {
    return self__.str === other.str
  }else {
    return false
  }
};
cljs.core.Symbol.prototype.toString = function() {
  var self__ = this;
  var _ = this;
  return self__.str
};
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__1 = function(name) {
    if(name instanceof cljs.core.Symbol) {
      return name
    }else {
      return symbol.call(null, null, name)
    }
  };
  var symbol__2 = function(ns, name) {
    var sym_str = !(ns == null) ? [cljs.core.str(ns), cljs.core.str("/"), cljs.core.str(name)].join("") : name;
    return new cljs.core.Symbol(ns, name, sym_str, -1, null)
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__1.call(this, ns);
      case 2:
        return symbol__2.call(this, ns, name)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  symbol.cljs$core$IFn$_invoke$arity$1 = symbol__1;
  symbol.cljs$core$IFn$_invoke$arity$2 = symbol__2;
  return symbol
}();
cljs.core.seq = function seq(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__7044 = coll;
      if(G__7044) {
        if(function() {
          var or__3943__auto__ = G__7044.cljs$lang$protocol_mask$partition0$ & 8388608;
          if(or__3943__auto__) {
            return or__3943__auto__
          }else {
            return G__7044.cljs$core$ISeqable$
          }
        }()) {
          return true
        }else {
          return false
        }
      }else {
        return false
      }
    }()) {
      return cljs.core._seq.call(null, coll)
    }else {
      if(coll instanceof Array) {
        if(coll.length === 0) {
          return null
        }else {
          return new cljs.core.IndexedSeq(coll, 0)
        }
      }else {
        if(cljs.core.string_QMARK_.call(null, coll)) {
          if(coll.length === 0) {
            return null
          }else {
            return new cljs.core.IndexedSeq(coll, 0)
          }
        }else {
          if(cljs.core.type_satisfies_.call(null, cljs.core.ILookup, coll)) {
            return cljs.core._seq.call(null, coll)
          }else {
            if("\ufdd0:else") {
              throw new Error([cljs.core.str(coll), cljs.core.str("is not ISeqable")].join(""));
            }else {
              return null
            }
          }
        }
      }
    }
  }
};
cljs.core.first = function first(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__7046 = coll;
      if(G__7046) {
        if(function() {
          var or__3943__auto__ = G__7046.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3943__auto__) {
            return or__3943__auto__
          }else {
            return G__7046.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          return false
        }
      }else {
        return false
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s = cljs.core.seq.call(null, coll);
      if(s == null) {
        return null
      }else {
        return cljs.core._first.call(null, s)
      }
    }
  }
};
cljs.core.rest = function rest(coll) {
  if(!(coll == null)) {
    if(function() {
      var G__7048 = coll;
      if(G__7048) {
        if(function() {
          var or__3943__auto__ = G__7048.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3943__auto__) {
            return or__3943__auto__
          }else {
            return G__7048.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          return false
        }
      }else {
        return false
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s = cljs.core.seq.call(null, coll);
      if(!(s == null)) {
        return cljs.core._rest.call(null, s)
      }else {
        return cljs.core.List.EMPTY
      }
    }
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.next = function next(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__7050 = coll;
      if(G__7050) {
        if(function() {
          var or__3943__auto__ = G__7050.cljs$lang$protocol_mask$partition0$ & 128;
          if(or__3943__auto__) {
            return or__3943__auto__
          }else {
            return G__7050.cljs$core$INext$
          }
        }()) {
          return true
        }else {
          return false
        }
      }else {
        return false
      }
    }()) {
      return cljs.core._next.call(null, coll)
    }else {
      return cljs.core.seq.call(null, cljs.core.rest.call(null, coll))
    }
  }
};
cljs.core._EQ_ = function() {
  var _EQ_ = null;
  var _EQ___1 = function(x) {
    return true
  };
  var _EQ___2 = function(x, y) {
    var or__3943__auto__ = x === y;
    if(or__3943__auto__) {
      return or__3943__auto__
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__7051__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__7052 = y;
            var G__7053 = cljs.core.first.call(null, more);
            var G__7054 = cljs.core.next.call(null, more);
            x = G__7052;
            y = G__7053;
            more = G__7054;
            continue
          }else {
            return _EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7051 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7051__delegate.call(this, x, y, more)
    };
    G__7051.cljs$lang$maxFixedArity = 2;
    G__7051.cljs$lang$applyTo = function(arglist__7055) {
      var x = cljs.core.first(arglist__7055);
      arglist__7055 = cljs.core.next(arglist__7055);
      var y = cljs.core.first(arglist__7055);
      var more = cljs.core.rest(arglist__7055);
      return G__7051__delegate(x, y, more)
    };
    G__7051.cljs$core$IFn$_invoke$arity$variadic = G__7051__delegate;
    return G__7051
  }();
  _EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ___1.call(this, x);
      case 2:
        return _EQ___2.call(this, x, y);
      default:
        return _EQ___3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _EQ_.cljs$lang$maxFixedArity = 2;
  _EQ_.cljs$lang$applyTo = _EQ___3.cljs$lang$applyTo;
  _EQ_.cljs$core$IFn$_invoke$arity$1 = _EQ___1;
  _EQ_.cljs$core$IFn$_invoke$arity$2 = _EQ___2;
  _EQ_.cljs$core$IFn$_invoke$arity$variadic = _EQ___3.cljs$core$IFn$_invoke$arity$variadic;
  return _EQ_
}();
cljs.core.IHash["null"] = true;
cljs.core._hash["null"] = function(o) {
  return 0
};
cljs.core.INext["null"] = true;
cljs.core._next["null"] = function(_) {
  return null
};
cljs.core.IKVReduce["null"] = true;
cljs.core._kv_reduce["null"] = function(_, f, init) {
  return init
};
cljs.core.ISet["null"] = true;
cljs.core._disjoin["null"] = function(_, v) {
  return null
};
cljs.core.ICounted["null"] = true;
cljs.core._count["null"] = function(_) {
  return 0
};
cljs.core.IStack["null"] = true;
cljs.core._peek["null"] = function(_) {
  return null
};
cljs.core._pop["null"] = function(_) {
  return null
};
cljs.core.IEquiv["null"] = true;
cljs.core._equiv["null"] = function(_, o) {
  return o == null
};
cljs.core.IWithMeta["null"] = true;
cljs.core._with_meta["null"] = function(_, meta) {
  return null
};
cljs.core.IMeta["null"] = true;
cljs.core._meta["null"] = function(_) {
  return null
};
cljs.core.IEmptyableCollection["null"] = true;
cljs.core._empty["null"] = function(_) {
  return null
};
cljs.core.IMap["null"] = true;
cljs.core._dissoc["null"] = function(_, k) {
  return null
};
Date.prototype.cljs$core$IEquiv$ = true;
Date.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var and__3941__auto__ = other instanceof Date;
  if(and__3941__auto__) {
    return o.toString() === other.toString()
  }else {
    return and__3941__auto__
  }
};
cljs.core.IHash["number"] = true;
cljs.core._hash["number"] = function(o) {
  return Math.floor(o) % 2147483647
};
cljs.core.IEquiv["number"] = true;
cljs.core._equiv["number"] = function(x, o) {
  return x === o
};
cljs.core.IHash["boolean"] = true;
cljs.core._hash["boolean"] = function(o) {
  if(o === true) {
    return 1
  }else {
    return 0
  }
};
cljs.core.IMeta["function"] = true;
cljs.core._meta["function"] = function(_) {
  return null
};
cljs.core.Fn["function"] = true;
cljs.core.IHash["_"] = true;
cljs.core._hash["_"] = function(o) {
  return goog.getUid(o)
};
cljs.core.inc = function inc(x) {
  return x + 1
};
goog.provide("cljs.core.Reduced");
cljs.core.Reduced = function(val) {
  this.val = val;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32768
};
cljs.core.Reduced.cljs$lang$type = true;
cljs.core.Reduced.cljs$lang$ctorStr = "cljs.core/Reduced";
cljs.core.Reduced.cljs$lang$ctorPrWriter = function(this__6461__auto__, writer__6462__auto__, opt__6463__auto__) {
  return cljs.core._write.call(null, writer__6462__auto__, "cljs.core/Reduced")
};
cljs.core.Reduced.prototype.cljs$core$IDeref$_deref$arity$1 = function(o) {
  var self__ = this;
  return self__.val
};
cljs.core.reduced = function reduced(x) {
  return new cljs.core.Reduced(x)
};
cljs.core.reduced_QMARK_ = function reduced_QMARK_(r) {
  return r instanceof cljs.core.Reduced
};
cljs.core.ci_reduce = function() {
  var ci_reduce = null;
  var ci_reduce__2 = function(cicoll, f) {
    var cnt = cljs.core._count.call(null, cicoll);
    if(cnt === 0) {
      return f.call(null)
    }else {
      var val = cljs.core._nth.call(null, cicoll, 0);
      var n = 1;
      while(true) {
        if(n < cnt) {
          var nval = f.call(null, val, cljs.core._nth.call(null, cicoll, n));
          if(cljs.core.reduced_QMARK_.call(null, nval)) {
            return cljs.core.deref.call(null, nval)
          }else {
            var G__7056 = nval;
            var G__7057 = n + 1;
            val = G__7056;
            n = G__7057;
            continue
          }
        }else {
          return val
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var cnt = cljs.core._count.call(null, cicoll);
    var val__$1 = val;
    var n = 0;
    while(true) {
      if(n < cnt) {
        var nval = f.call(null, val__$1, cljs.core._nth.call(null, cicoll, n));
        if(cljs.core.reduced_QMARK_.call(null, nval)) {
          return cljs.core.deref.call(null, nval)
        }else {
          var G__7058 = nval;
          var G__7059 = n + 1;
          val__$1 = G__7058;
          n = G__7059;
          continue
        }
      }else {
        return val__$1
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var cnt = cljs.core._count.call(null, cicoll);
    var val__$1 = val;
    var n = idx;
    while(true) {
      if(n < cnt) {
        var nval = f.call(null, val__$1, cljs.core._nth.call(null, cicoll, n));
        if(cljs.core.reduced_QMARK_.call(null, nval)) {
          return cljs.core.deref.call(null, nval)
        }else {
          var G__7060 = nval;
          var G__7061 = n + 1;
          val__$1 = G__7060;
          n = G__7061;
          continue
        }
      }else {
        return val__$1
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__2.call(this, cicoll, f);
      case 3:
        return ci_reduce__3.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__4.call(this, cicoll, f, val, idx)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  ci_reduce.cljs$core$IFn$_invoke$arity$2 = ci_reduce__2;
  ci_reduce.cljs$core$IFn$_invoke$arity$3 = ci_reduce__3;
  ci_reduce.cljs$core$IFn$_invoke$arity$4 = ci_reduce__4;
  return ci_reduce
}();
cljs.core.array_reduce = function() {
  var array_reduce = null;
  var array_reduce__2 = function(arr, f) {
    var cnt = arr.length;
    if(arr.length === 0) {
      return f.call(null)
    }else {
      var val = arr[0];
      var n = 1;
      while(true) {
        if(n < cnt) {
          var nval = f.call(null, val, arr[n]);
          if(cljs.core.reduced_QMARK_.call(null, nval)) {
            return cljs.core.deref.call(null, nval)
          }else {
            var G__7062 = nval;
            var G__7063 = n + 1;
            val = G__7062;
            n = G__7063;
            continue
          }
        }else {
          return val
        }
        break
      }
    }
  };
  var array_reduce__3 = function(arr, f, val) {
    var cnt = arr.length;
    var val__$1 = val;
    var n = 0;
    while(true) {
      if(n < cnt) {
        var nval = f.call(null, val__$1, arr[n]);
        if(cljs.core.reduced_QMARK_.call(null, nval)) {
          return cljs.core.deref.call(null, nval)
        }else {
          var G__7064 = nval;
          var G__7065 = n + 1;
          val__$1 = G__7064;
          n = G__7065;
          continue
        }
      }else {
        return val__$1
      }
      break
    }
  };
  var array_reduce__4 = function(arr, f, val, idx) {
    var cnt = arr.length;
    var val__$1 = val;
    var n = idx;
    while(true) {
      if(n < cnt) {
        var nval = f.call(null, val__$1, arr[n]);
        if(cljs.core.reduced_QMARK_.call(null, nval)) {
          return cljs.core.deref.call(null, nval)
        }else {
          var G__7066 = nval;
          var G__7067 = n + 1;
          val__$1 = G__7066;
          n = G__7067;
          continue
        }
      }else {
        return val__$1
      }
      break
    }
  };
  array_reduce = function(arr, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return array_reduce__2.call(this, arr, f);
      case 3:
        return array_reduce__3.call(this, arr, f, val);
      case 4:
        return array_reduce__4.call(this, arr, f, val, idx)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  array_reduce.cljs$core$IFn$_invoke$arity$2 = array_reduce__2;
  array_reduce.cljs$core$IFn$_invoke$arity$3 = array_reduce__3;
  array_reduce.cljs$core$IFn$_invoke$arity$4 = array_reduce__4;
  return array_reduce
}();
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__7069 = x;
  if(G__7069) {
    if(function() {
      var or__3943__auto__ = G__7069.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        return G__7069.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__7069.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__7069)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__7069)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__7071 = x;
  if(G__7071) {
    if(function() {
      var or__3943__auto__ = G__7071.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        return G__7071.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__7071.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__7071)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__7071)
  }
};
goog.provide("cljs.core.IndexedSeq");
cljs.core.IndexedSeq = function(arr, i) {
  this.arr = arr;
  this.i = i;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 166199550
};
cljs.core.IndexedSeq.cljs$lang$type = true;
cljs.core.IndexedSeq.cljs$lang$ctorStr = "cljs.core/IndexedSeq";
cljs.core.IndexedSeq.cljs$lang$ctorPrWriter = function(this__6461__auto__, writer__6462__auto__, opt__6463__auto__) {
  return cljs.core._write.call(null, writer__6462__auto__, "cljs.core/IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$INext$_next$arity$1 = function(_) {
  var self__ = this;
  if(self__.i + 1 < self__.arr.length) {
    return new cljs.core.IndexedSeq(self__.arr, self__.i + 1)
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var self__ = this;
  var c = coll.cljs$core$ICounted$_count$arity$1(coll);
  if(c > 0) {
    return new cljs.core.RSeq(coll, c - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.IndexedSeq.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var self__ = this;
  return cljs.core.array_reduce.call(null, self__.arr, f, self__.arr[self__.i], self__.i + 1)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var self__ = this;
  return cljs.core.array_reduce.call(null, self__.arr, f, start, self__.i)
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var self__ = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var self__ = this;
  return self__.arr.length - self__.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var self__ = this;
  return self__.arr[self__.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var self__ = this;
  if(self__.i + 1 < self__.arr.length) {
    return new cljs.core.IndexedSeq(self__.arr, self__.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var self__ = this;
  var i__$1 = n + self__.i;
  if(i__$1 < self__.arr.length) {
    return self__.arr[i__$1]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var self__ = this;
  var i__$1 = n + self__.i;
  if(i__$1 < self__.arr.length) {
    return self__.arr[i__$1]
  }else {
    return not_found
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.List.EMPTY
};
cljs.core.prim_seq = function() {
  var prim_seq = null;
  var prim_seq__1 = function(prim) {
    return prim_seq.call(null, prim, 0)
  };
  var prim_seq__2 = function(prim, i) {
    if(i < prim.length) {
      return new cljs.core.IndexedSeq(prim, i)
    }else {
      return null
    }
  };
  prim_seq = function(prim, i) {
    switch(arguments.length) {
      case 1:
        return prim_seq__1.call(this, prim);
      case 2:
        return prim_seq__2.call(this, prim, i)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  prim_seq.cljs$core$IFn$_invoke$arity$1 = prim_seq__1;
  prim_seq.cljs$core$IFn$_invoke$arity$2 = prim_seq__2;
  return prim_seq
}();
cljs.core.array_seq = function() {
  var array_seq = null;
  var array_seq__1 = function(array) {
    return cljs.core.prim_seq.call(null, array, 0)
  };
  var array_seq__2 = function(array, i) {
    return cljs.core.prim_seq.call(null, array, i)
  };
  array_seq = function(array, i) {
    switch(arguments.length) {
      case 1:
        return array_seq__1.call(this, array);
      case 2:
        return array_seq__2.call(this, array, i)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  array_seq.cljs$core$IFn$_invoke$arity$1 = array_seq__1;
  array_seq.cljs$core$IFn$_invoke$arity$2 = array_seq__2;
  return array_seq
}();
cljs.core.ICounted["array"] = true;
cljs.core._count["array"] = function(a) {
  return a.length
};
goog.provide("cljs.core.RSeq");
cljs.core.RSeq = function(ci, i, meta) {
  this.ci = ci;
  this.i = i;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850574
};
cljs.core.RSeq.cljs$lang$type = true;
cljs.core.RSeq.cljs$lang$ctorStr = "cljs.core/RSeq";
cljs.core.RSeq.cljs$lang$ctorPrWriter = function(this__6461__auto__, writer__6462__auto__, opt__6463__auto__) {
  return cljs.core._write.call(null, writer__6462__auto__, "cljs.core/RSeq")
};
cljs.core.RSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.RSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.RSeq.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.RSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return coll
};
cljs.core.RSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return self__.i + 1
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core._nth.call(null, self__.ci, self__.i)
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  if(self__.i > 0) {
    return new cljs.core.RSeq(self__.ci, self__.i - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.RSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var self__ = this;
  return new cljs.core.RSeq(self__.ci, self__.i, new_meta)
};
cljs.core.RSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.RSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, self__.meta)
};
cljs.core.second = function second(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.ffirst = function ffirst(coll) {
  return cljs.core.first.call(null, cljs.core.first.call(null, coll))
};
cljs.core.nfirst = function nfirst(coll) {
  return cljs.core.next.call(null, cljs.core.first.call(null, coll))
};
cljs.core.fnext = function fnext(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.nnext = function nnext(coll) {
  return cljs.core.next.call(null, cljs.core.next.call(null, coll))
};
cljs.core.last = function last(s) {
  while(true) {
    var sn = cljs.core.next.call(null, s);
    if(!(sn == null)) {
      var G__7072 = sn;
      s = G__7072;
      continue
    }else {
      return cljs.core.first.call(null, s)
    }
    break
  }
};
cljs.core.IEquiv["_"] = true;
cljs.core._equiv["_"] = function(x, o) {
  return x === o
};
cljs.core.conj = function() {
  var conj = null;
  var conj__2 = function(coll, x) {
    if(!(coll == null)) {
      return cljs.core._conj.call(null, coll, x)
    }else {
      return cljs.core.list.call(null, x)
    }
  };
  var conj__3 = function() {
    var G__7073__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__7074 = conj.call(null, coll, x);
          var G__7075 = cljs.core.first.call(null, xs);
          var G__7076 = cljs.core.next.call(null, xs);
          coll = G__7074;
          x = G__7075;
          xs = G__7076;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__7073 = function(coll, x, var_args) {
      var xs = null;
      if(arguments.length > 2) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7073__delegate.call(this, coll, x, xs)
    };
    G__7073.cljs$lang$maxFixedArity = 2;
    G__7073.cljs$lang$applyTo = function(arglist__7077) {
      var coll = cljs.core.first(arglist__7077);
      arglist__7077 = cljs.core.next(arglist__7077);
      var x = cljs.core.first(arglist__7077);
      var xs = cljs.core.rest(arglist__7077);
      return G__7073__delegate(coll, x, xs)
    };
    G__7073.cljs$core$IFn$_invoke$arity$variadic = G__7073__delegate;
    return G__7073
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__2.call(this, coll, x);
      default:
        return conj__3.cljs$core$IFn$_invoke$arity$variadic(coll, x, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__3.cljs$lang$applyTo;
  conj.cljs$core$IFn$_invoke$arity$2 = conj__2;
  conj.cljs$core$IFn$_invoke$arity$variadic = conj__3.cljs$core$IFn$_invoke$arity$variadic;
  return conj
}();
cljs.core.empty = function empty(coll) {
  return cljs.core._empty.call(null, coll)
};
cljs.core.accumulating_seq_count = function accumulating_seq_count(coll) {
  var s = cljs.core.seq.call(null, coll);
  var acc = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s)) {
      return acc + cljs.core._count.call(null, s)
    }else {
      var G__7078 = cljs.core.next.call(null, s);
      var G__7079 = acc + 1;
      s = G__7078;
      acc = G__7079;
      continue
    }
    break
  }
};
cljs.core.count = function count(coll) {
  if(cljs.core.counted_QMARK_.call(null, coll)) {
    return cljs.core._count.call(null, coll)
  }else {
    return cljs.core.accumulating_seq_count.call(null, coll)
  }
};
cljs.core.linear_traversal_nth = function() {
  var linear_traversal_nth = null;
  var linear_traversal_nth__2 = function(coll, n) {
    while(true) {
      if(coll == null) {
        throw new Error("Index out of bounds");
      }else {
        if(n === 0) {
          if(cljs.core.seq.call(null, coll)) {
            return cljs.core.first.call(null, coll)
          }else {
            throw new Error("Index out of bounds");
          }
        }else {
          if(cljs.core.indexed_QMARK_.call(null, coll)) {
            return cljs.core._nth.call(null, coll, n)
          }else {
            if(cljs.core.seq.call(null, coll)) {
              var G__7080 = cljs.core.next.call(null, coll);
              var G__7081 = n - 1;
              coll = G__7080;
              n = G__7081;
              continue
            }else {
              if("\ufdd0:else") {
                throw new Error("Index out of bounds");
              }else {
                return null
              }
            }
          }
        }
      }
      break
    }
  };
  var linear_traversal_nth__3 = function(coll, n, not_found) {
    while(true) {
      if(coll == null) {
        return not_found
      }else {
        if(n === 0) {
          if(cljs.core.seq.call(null, coll)) {
            return cljs.core.first.call(null, coll)
          }else {
            return not_found
          }
        }else {
          if(cljs.core.indexed_QMARK_.call(null, coll)) {
            return cljs.core._nth.call(null, coll, n, not_found)
          }else {
            if(cljs.core.seq.call(null, coll)) {
              var G__7082 = cljs.core.next.call(null, coll);
              var G__7083 = n - 1;
              var G__7084 = not_found;
              coll = G__7082;
              n = G__7083;
              not_found = G__7084;
              continue
            }else {
              if("\ufdd0:else") {
                return not_found
              }else {
                return null
              }
            }
          }
        }
      }
      break
    }
  };
  linear_traversal_nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return linear_traversal_nth__2.call(this, coll, n);
      case 3:
        return linear_traversal_nth__3.call(this, coll, n, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  linear_traversal_nth.cljs$core$IFn$_invoke$arity$2 = linear_traversal_nth__2;
  linear_traversal_nth.cljs$core$IFn$_invoke$arity$3 = linear_traversal_nth__3;
  return linear_traversal_nth
}();
cljs.core.nth = function() {
  var nth = null;
  var nth__2 = function(coll, n) {
    if(coll == null) {
      return null
    }else {
      if(function() {
        var G__7087 = coll;
        if(G__7087) {
          if(function() {
            var or__3943__auto__ = G__7087.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3943__auto__) {
              return or__3943__auto__
            }else {
              return G__7087.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            return false
          }
        }else {
          return false
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n))
      }else {
        if(coll instanceof Array) {
          if(n < coll.length) {
            return coll[n]
          }else {
            return null
          }
        }else {
          if(cljs.core.string_QMARK_.call(null, coll)) {
            if(n < coll.length) {
              return coll[n]
            }else {
              return null
            }
          }else {
            if("\ufdd0:else") {
              return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n))
            }else {
              return null
            }
          }
        }
      }
    }
  };
  var nth__3 = function(coll, n, not_found) {
    if(!(coll == null)) {
      if(function() {
        var G__7088 = coll;
        if(G__7088) {
          if(function() {
            var or__3943__auto__ = G__7088.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3943__auto__) {
              return or__3943__auto__
            }else {
              return G__7088.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            return false
          }
        }else {
          return false
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n), not_found)
      }else {
        if(coll instanceof Array) {
          if(n < coll.length) {
            return coll[n]
          }else {
            return not_found
          }
        }else {
          if(cljs.core.string_QMARK_.call(null, coll)) {
            if(n < coll.length) {
              return coll[n]
            }else {
              return not_found
            }
          }else {
            if("\ufdd0:else") {
              return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n), not_found)
            }else {
              return null
            }
          }
        }
      }
    }else {
      return not_found
    }
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__2.call(this, coll, n);
      case 3:
        return nth__3.call(this, coll, n, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  nth.cljs$core$IFn$_invoke$arity$2 = nth__2;
  nth.cljs$core$IFn$_invoke$arity$3 = nth__3;
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__2 = function(o, k) {
    if(o == null) {
      return null
    }else {
      if(function() {
        var G__7091 = o;
        if(G__7091) {
          if(function() {
            var or__3943__auto__ = G__7091.cljs$lang$protocol_mask$partition0$ & 256;
            if(or__3943__auto__) {
              return or__3943__auto__
            }else {
              return G__7091.cljs$core$ILookup$
            }
          }()) {
            return true
          }else {
            return false
          }
        }else {
          return false
        }
      }()) {
        return cljs.core._lookup.call(null, o, k)
      }else {
        if(o instanceof Array) {
          if(k < o.length) {
            return o[k]
          }else {
            return null
          }
        }else {
          if(cljs.core.string_QMARK_.call(null, o)) {
            if(k < o.length) {
              return o[k]
            }else {
              return null
            }
          }else {
            if(cljs.core.type_satisfies_.call(null, cljs.core.ILookup, o)) {
              return cljs.core._lookup.call(null, o, k)
            }else {
              if("\ufdd0:else") {
                return null
              }else {
                return null
              }
            }
          }
        }
      }
    }
  };
  var get__3 = function(o, k, not_found) {
    if(!(o == null)) {
      if(function() {
        var G__7092 = o;
        if(G__7092) {
          if(function() {
            var or__3943__auto__ = G__7092.cljs$lang$protocol_mask$partition0$ & 256;
            if(or__3943__auto__) {
              return or__3943__auto__
            }else {
              return G__7092.cljs$core$ILookup$
            }
          }()) {
            return true
          }else {
            return false
          }
        }else {
          return false
        }
      }()) {
        return cljs.core._lookup.call(null, o, k, not_found)
      }else {
        if(o instanceof Array) {
          if(k < o.length) {
            return o[k]
          }else {
            return not_found
          }
        }else {
          if(cljs.core.string_QMARK_.call(null, o)) {
            if(k < o.length) {
              return o[k]
            }else {
              return not_found
            }
          }else {
            if(cljs.core.type_satisfies_.call(null, cljs.core.ILookup, o)) {
              return cljs.core._lookup.call(null, o, k, not_found)
            }else {
              if("\ufdd0:else") {
                return not_found
              }else {
                return null
              }
            }
          }
        }
      }
    }else {
      return not_found
    }
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__2.call(this, o, k);
      case 3:
        return get__3.call(this, o, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  get.cljs$core$IFn$_invoke$arity$2 = get__2;
  get.cljs$core$IFn$_invoke$arity$3 = get__3;
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__3 = function(coll, k, v) {
    if(!(coll == null)) {
      return cljs.core._assoc.call(null, coll, k, v)
    }else {
      return cljs.core.hash_map.call(null, k, v)
    }
  };
  var assoc__4 = function() {
    var G__7093__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__7094 = ret;
          var G__7095 = cljs.core.first.call(null, kvs);
          var G__7096 = cljs.core.second.call(null, kvs);
          var G__7097 = cljs.core.nnext.call(null, kvs);
          coll = G__7094;
          k = G__7095;
          v = G__7096;
          kvs = G__7097;
          continue
        }else {
          return ret
        }
        break
      }
    };
    var G__7093 = function(coll, k, v, var_args) {
      var kvs = null;
      if(arguments.length > 3) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7093__delegate.call(this, coll, k, v, kvs)
    };
    G__7093.cljs$lang$maxFixedArity = 3;
    G__7093.cljs$lang$applyTo = function(arglist__7098) {
      var coll = cljs.core.first(arglist__7098);
      arglist__7098 = cljs.core.next(arglist__7098);
      var k = cljs.core.first(arglist__7098);
      arglist__7098 = cljs.core.next(arglist__7098);
      var v = cljs.core.first(arglist__7098);
      var kvs = cljs.core.rest(arglist__7098);
      return G__7093__delegate(coll, k, v, kvs)
    };
    G__7093.cljs$core$IFn$_invoke$arity$variadic = G__7093__delegate;
    return G__7093
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__3.call(this, coll, k, v);
      default:
        return assoc__4.cljs$core$IFn$_invoke$arity$variadic(coll, k, v, cljs.core.array_seq(arguments, 3))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__4.cljs$lang$applyTo;
  assoc.cljs$core$IFn$_invoke$arity$3 = assoc__3;
  assoc.cljs$core$IFn$_invoke$arity$variadic = assoc__4.cljs$core$IFn$_invoke$arity$variadic;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__1 = function(coll) {
    return coll
  };
  var dissoc__2 = function(coll, k) {
    return cljs.core._dissoc.call(null, coll, k)
  };
  var dissoc__3 = function() {
    var G__7099__delegate = function(coll, k, ks) {
      while(true) {
        var ret = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__7100 = ret;
          var G__7101 = cljs.core.first.call(null, ks);
          var G__7102 = cljs.core.next.call(null, ks);
          coll = G__7100;
          k = G__7101;
          ks = G__7102;
          continue
        }else {
          return ret
        }
        break
      }
    };
    var G__7099 = function(coll, k, var_args) {
      var ks = null;
      if(arguments.length > 2) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7099__delegate.call(this, coll, k, ks)
    };
    G__7099.cljs$lang$maxFixedArity = 2;
    G__7099.cljs$lang$applyTo = function(arglist__7103) {
      var coll = cljs.core.first(arglist__7103);
      arglist__7103 = cljs.core.next(arglist__7103);
      var k = cljs.core.first(arglist__7103);
      var ks = cljs.core.rest(arglist__7103);
      return G__7099__delegate(coll, k, ks)
    };
    G__7099.cljs$core$IFn$_invoke$arity$variadic = G__7099__delegate;
    return G__7099
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__1.call(this, coll);
      case 2:
        return dissoc__2.call(this, coll, k);
      default:
        return dissoc__3.cljs$core$IFn$_invoke$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__3.cljs$lang$applyTo;
  dissoc.cljs$core$IFn$_invoke$arity$1 = dissoc__1;
  dissoc.cljs$core$IFn$_invoke$arity$2 = dissoc__2;
  dissoc.cljs$core$IFn$_invoke$arity$variadic = dissoc__3.cljs$core$IFn$_invoke$arity$variadic;
  return dissoc
}();
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  var or__3943__auto__ = goog.isFunction(f);
  if(or__3943__auto__) {
    return or__3943__auto__
  }else {
    var G__7105 = f;
    if(G__7105) {
      if(cljs.core.truth_(function() {
        var or__3943__auto____$1 = null;
        if(cljs.core.truth_(or__3943__auto____$1)) {
          return or__3943__auto____$1
        }else {
          return G__7105.cljs$core$Fn$
        }
      }())) {
        return true
      }else {
        if(!G__7105.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.Fn, G__7105)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.Fn, G__7105)
    }
  }
};
cljs.core.with_meta = function with_meta(o, meta) {
  if(function() {
    var and__3941__auto__ = cljs.core.fn_QMARK_.call(null, o);
    if(and__3941__auto__) {
      return!function() {
        var G__7111 = o;
        if(G__7111) {
          if(function() {
            var or__3943__auto__ = G__7111.cljs$lang$protocol_mask$partition0$ & 262144;
            if(or__3943__auto__) {
              return or__3943__auto__
            }else {
              return G__7111.cljs$core$IWithMeta$
            }
          }()) {
            return true
          }else {
            if(!G__7111.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IWithMeta, G__7111)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IWithMeta, G__7111)
        }
      }()
    }else {
      return and__3941__auto__
    }
  }()) {
    return with_meta.call(null, function() {
      if(void 0 === cljs.core.t7112) {
        goog.provide("cljs.core.t7112");
        cljs.core.t7112 = function(meta, o, with_meta, meta7113) {
          this.meta = meta;
          this.o = o;
          this.with_meta = with_meta;
          this.meta7113 = meta7113;
          this.cljs$lang$protocol_mask$partition1$ = 0;
          this.cljs$lang$protocol_mask$partition0$ = 393217
        };
        cljs.core.t7112.cljs$lang$type = true;
        cljs.core.t7112.cljs$lang$ctorStr = "cljs.core/t7112";
        cljs.core.t7112.cljs$lang$ctorPrWriter = function(this__6461__auto__, writer__6462__auto__, opt__6463__auto__) {
          return cljs.core._write.call(null, writer__6462__auto__, "cljs.core/t7112")
        };
        cljs.core.t7112.prototype.call = function() {
          var G__7116__delegate = function(self__, args) {
            var self____$1 = this;
            var _ = self____$1;
            return cljs.core.apply.call(null, self__.o, args)
          };
          var G__7116 = function(self__, var_args) {
            var self__ = this;
            var args = null;
            if(arguments.length > 1) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
            }
            return G__7116__delegate.call(this, self__, args)
          };
          G__7116.cljs$lang$maxFixedArity = 1;
          G__7116.cljs$lang$applyTo = function(arglist__7117) {
            var self__ = cljs.core.first(arglist__7117);
            var args = cljs.core.rest(arglist__7117);
            return G__7116__delegate(self__, args)
          };
          G__7116.cljs$core$IFn$_invoke$arity$variadic = G__7116__delegate;
          return G__7116
        }();
        cljs.core.t7112.prototype.apply = function(self__, args7115) {
          var self__ = this;
          return self__.call.apply(self__, [self__].concat(args7115.slice()))
        };
        cljs.core.t7112.prototype.cljs$core$Fn$ = true;
        cljs.core.t7112.prototype.cljs$core$IMeta$_meta$arity$1 = function(_7114) {
          var self__ = this;
          return self__.meta7113
        };
        cljs.core.t7112.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(_7114, meta7113__$1) {
          var self__ = this;
          return new cljs.core.t7112(self__.meta, self__.o, self__.with_meta, meta7113__$1)
        }
      }else {
      }
      return new cljs.core.t7112(meta, o, with_meta, null)
    }(), meta)
  }else {
    return cljs.core._with_meta.call(null, o, meta)
  }
};
cljs.core.meta = function meta(o) {
  if(function() {
    var G__7119 = o;
    if(G__7119) {
      if(function() {
        var or__3943__auto__ = G__7119.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          return G__7119.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__7119.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__7119)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__7119)
    }
  }()) {
    return cljs.core._meta.call(null, o)
  }else {
    return null
  }
};
cljs.core.peek = function peek(coll) {
  return cljs.core._peek.call(null, coll)
};
cljs.core.pop = function pop(coll) {
  return cljs.core._pop.call(null, coll)
};
cljs.core.disj = function() {
  var disj = null;
  var disj__1 = function(coll) {
    return coll
  };
  var disj__2 = function(coll, k) {
    return cljs.core._disjoin.call(null, coll, k)
  };
  var disj__3 = function() {
    var G__7120__delegate = function(coll, k, ks) {
      while(true) {
        var ret = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__7121 = ret;
          var G__7122 = cljs.core.first.call(null, ks);
          var G__7123 = cljs.core.next.call(null, ks);
          coll = G__7121;
          k = G__7122;
          ks = G__7123;
          continue
        }else {
          return ret
        }
        break
      }
    };
    var G__7120 = function(coll, k, var_args) {
      var ks = null;
      if(arguments.length > 2) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7120__delegate.call(this, coll, k, ks)
    };
    G__7120.cljs$lang$maxFixedArity = 2;
    G__7120.cljs$lang$applyTo = function(arglist__7124) {
      var coll = cljs.core.first(arglist__7124);
      arglist__7124 = cljs.core.next(arglist__7124);
      var k = cljs.core.first(arglist__7124);
      var ks = cljs.core.rest(arglist__7124);
      return G__7120__delegate(coll, k, ks)
    };
    G__7120.cljs$core$IFn$_invoke$arity$variadic = G__7120__delegate;
    return G__7120
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__1.call(this, coll);
      case 2:
        return disj__2.call(this, coll, k);
      default:
        return disj__3.cljs$core$IFn$_invoke$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__3.cljs$lang$applyTo;
  disj.cljs$core$IFn$_invoke$arity$1 = disj__1;
  disj.cljs$core$IFn$_invoke$arity$2 = disj__2;
  disj.cljs$core$IFn$_invoke$arity$variadic = disj__3.cljs$core$IFn$_invoke$arity$variadic;
  return disj
}();
cljs.core.string_hash_cache = {};
cljs.core.string_hash_cache_count = 0;
cljs.core.add_to_string_hash_cache = function add_to_string_hash_cache(k) {
  var h = goog.string.hashCode(k);
  cljs.core.string_hash_cache[k] = h;
  cljs.core.string_hash_cache_count = cljs.core.string_hash_cache_count + 1;
  return h
};
cljs.core.check_string_hash_cache = function check_string_hash_cache(k) {
  if(cljs.core.string_hash_cache_count > 255) {
    cljs.core.string_hash_cache = {};
    cljs.core.string_hash_cache_count = 0
  }else {
  }
  var h = cljs.core.string_hash_cache[k];
  if(typeof h === "number") {
    return h
  }else {
    return cljs.core.add_to_string_hash_cache.call(null, k)
  }
};
cljs.core.hash = function() {
  var hash = null;
  var hash__1 = function(o) {
    return hash.call(null, o, true)
  };
  var hash__2 = function(o, check_cache) {
    if(function() {
      var and__3941__auto__ = goog.isString(o);
      if(and__3941__auto__) {
        return check_cache
      }else {
        return and__3941__auto__
      }
    }()) {
      return cljs.core.check_string_hash_cache.call(null, o)
    }else {
      return cljs.core._hash.call(null, o)
    }
  };
  hash = function(o, check_cache) {
    switch(arguments.length) {
      case 1:
        return hash__1.call(this, o);
      case 2:
        return hash__2.call(this, o, check_cache)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  hash.cljs$core$IFn$_invoke$arity$1 = hash__1;
  hash.cljs$core$IFn$_invoke$arity$2 = hash__2;
  return hash
}();
cljs.core.empty_QMARK_ = function empty_QMARK_(coll) {
  var or__3943__auto__ = coll == null;
  if(or__3943__auto__) {
    return or__3943__auto__
  }else {
    return cljs.core.not.call(null, cljs.core.seq.call(null, coll))
  }
};
cljs.core.coll_QMARK_ = function coll_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__7126 = x;
    if(G__7126) {
      if(function() {
        var or__3943__auto__ = G__7126.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          return G__7126.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__7126.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__7126)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__7126)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__7128 = x;
    if(G__7128) {
      if(function() {
        var or__3943__auto__ = G__7128.cljs$lang$protocol_mask$partition0$ & 4096;
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          return G__7128.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__7128.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__7128)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__7128)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__7130 = x;
  if(G__7130) {
    if(function() {
      var or__3943__auto__ = G__7130.cljs$lang$protocol_mask$partition0$ & 512;
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        return G__7130.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__7130.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__7130)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__7130)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__7132 = x;
  if(G__7132) {
    if(function() {
      var or__3943__auto__ = G__7132.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        return G__7132.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__7132.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__7132)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__7132)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__7134 = x;
  if(G__7134) {
    if(function() {
      var or__3943__auto__ = G__7134.cljs$lang$protocol_mask$partition0$ & 524288;
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        return G__7134.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__7134.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7134)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7134)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__7136 = x;
    if(G__7136) {
      if(function() {
        var or__3943__auto__ = G__7136.cljs$lang$protocol_mask$partition0$ & 1024;
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          return G__7136.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__7136.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__7136)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__7136)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__7138 = x;
  if(G__7138) {
    if(function() {
      var or__3943__auto__ = G__7138.cljs$lang$protocol_mask$partition0$ & 16384;
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        return G__7138.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__7138.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__7138)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__7138)
  }
};
cljs.core.chunked_seq_QMARK_ = function chunked_seq_QMARK_(x) {
  var or__3943__auto__ = x instanceof cljs.core.ChunkedCons;
  if(or__3943__auto__) {
    return or__3943__auto__
  }else {
    return x instanceof cljs.core.ChunkedSeq
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__7139__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__7139 = function(var_args) {
      var keyvals = null;
      if(arguments.length > 0) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__7139__delegate.call(this, keyvals)
    };
    G__7139.cljs$lang$maxFixedArity = 0;
    G__7139.cljs$lang$applyTo = function(arglist__7140) {
      var keyvals = cljs.core.seq(arglist__7140);
      return G__7139__delegate(keyvals)
    };
    G__7139.cljs$core$IFn$_invoke$arity$variadic = G__7139__delegate;
    return G__7139
  }();
  js_obj = function(var_args) {
    var keyvals = var_args;
    switch(arguments.length) {
      case 0:
        return js_obj__0.call(this);
      default:
        return js_obj__1.cljs$core$IFn$_invoke$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  js_obj.cljs$lang$maxFixedArity = 0;
  js_obj.cljs$lang$applyTo = js_obj__1.cljs$lang$applyTo;
  js_obj.cljs$core$IFn$_invoke$arity$0 = js_obj__0;
  js_obj.cljs$core$IFn$_invoke$arity$variadic = js_obj__1.cljs$core$IFn$_invoke$arity$variadic;
  return js_obj
}();
cljs.core.js_keys = function js_keys(obj) {
  var keys = [];
  goog.object.forEach(obj, function(val, key, obj__$1) {
    return keys.push(key)
  });
  return keys
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__$1 = i;
  var j__$1 = j;
  var len__$1 = len;
  while(true) {
    if(len__$1 === 0) {
      return to
    }else {
      to[j__$1] = from[i__$1];
      var G__7141 = i__$1 + 1;
      var G__7142 = j__$1 + 1;
      var G__7143 = len__$1 - 1;
      i__$1 = G__7141;
      j__$1 = G__7142;
      len__$1 = G__7143;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__$1 = i + (len - 1);
  var j__$1 = j + (len - 1);
  var len__$1 = len;
  while(true) {
    if(len__$1 === 0) {
      return to
    }else {
      to[j__$1] = from[i__$1];
      var G__7144 = i__$1 - 1;
      var G__7145 = j__$1 - 1;
      var G__7146 = len__$1 - 1;
      i__$1 = G__7144;
      j__$1 = G__7145;
      len__$1 = G__7146;
      continue
    }
    break
  }
};
cljs.core.lookup_sentinel = {};
cljs.core.false_QMARK_ = function false_QMARK_(x) {
  return x === false
};
cljs.core.true_QMARK_ = function true_QMARK_(x) {
  return x === true
};
cljs.core.undefined_QMARK_ = function undefined_QMARK_(x) {
  return void 0 === x
};
cljs.core.seq_QMARK_ = function seq_QMARK_(s) {
  if(s == null) {
    return false
  }else {
    var G__7148 = s;
    if(G__7148) {
      if(function() {
        var or__3943__auto__ = G__7148.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          return G__7148.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__7148.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7148)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7148)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__7150 = s;
  if(G__7150) {
    if(function() {
      var or__3943__auto__ = G__7150.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        return G__7150.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__7150.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__7150)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__7150)
  }
};
cljs.core.boolean$ = function boolean$(x) {
  if(cljs.core.truth_(x)) {
    return true
  }else {
    return false
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3941__auto__ = goog.isString(x);
  if(and__3941__auto__) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3941__auto__
  }
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3943__auto__ = cljs.core.fn_QMARK_.call(null, f);
  if(or__3943__auto__) {
    return or__3943__auto__
  }else {
    var G__7152 = f;
    if(G__7152) {
      if(function() {
        var or__3943__auto____$1 = G__7152.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          return G__7152.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__7152.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__7152)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__7152)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3941__auto__ = typeof n === "number";
  if(and__3941__auto__) {
    var and__3941__auto____$1 = !isNaN(n);
    if(and__3941__auto____$1) {
      var and__3941__auto____$2 = !(n === Infinity);
      if(and__3941__auto____$2) {
        return parseFloat(n) === parseInt(n, 10)
      }else {
        return and__3941__auto____$2
      }
    }else {
      return and__3941__auto____$1
    }
  }else {
    return and__3941__auto__
  }
};
cljs.core.contains_QMARK_ = function contains_QMARK_(coll, v) {
  if(cljs.core.get.call(null, coll, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return false
  }else {
    return true
  }
};
cljs.core.find = function find(coll, k) {
  if(function() {
    var and__3941__auto__ = !(coll == null);
    if(and__3941__auto__) {
      var and__3941__auto____$1 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3941__auto____$1) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3941__auto____$1
      }
    }else {
      return and__3941__auto__
    }
  }()) {
    return cljs.core.PersistentVector.fromArray([k, cljs.core.get.call(null, coll, k)], true)
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___1 = function(x) {
    return true
  };
  var distinct_QMARK___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var distinct_QMARK___3 = function() {
    var G__7153__delegate = function(x, y, more) {
      if(!cljs.core._EQ_.call(null, x, y)) {
        var s = cljs.core.PersistentHashSet.fromArray([y, null, x, null], true);
        var xs = more;
        while(true) {
          var x__$1 = cljs.core.first.call(null, xs);
          var etc = cljs.core.next.call(null, xs);
          if(cljs.core.truth_(xs)) {
            if(cljs.core.contains_QMARK_.call(null, s, x__$1)) {
              return false
            }else {
              var G__7154 = cljs.core.conj.call(null, s, x__$1);
              var G__7155 = etc;
              s = G__7154;
              xs = G__7155;
              continue
            }
          }else {
            return true
          }
          break
        }
      }else {
        return false
      }
    };
    var G__7153 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7153__delegate.call(this, x, y, more)
    };
    G__7153.cljs$lang$maxFixedArity = 2;
    G__7153.cljs$lang$applyTo = function(arglist__7156) {
      var x = cljs.core.first(arglist__7156);
      arglist__7156 = cljs.core.next(arglist__7156);
      var y = cljs.core.first(arglist__7156);
      var more = cljs.core.rest(arglist__7156);
      return G__7153__delegate(x, y, more)
    };
    G__7153.cljs$core$IFn$_invoke$arity$variadic = G__7153__delegate;
    return G__7153
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___1.call(this, x);
      case 2:
        return distinct_QMARK___2.call(this, x, y);
      default:
        return distinct_QMARK___3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___3.cljs$lang$applyTo;
  distinct_QMARK_.cljs$core$IFn$_invoke$arity$1 = distinct_QMARK___1;
  distinct_QMARK_.cljs$core$IFn$_invoke$arity$2 = distinct_QMARK___2;
  distinct_QMARK_.cljs$core$IFn$_invoke$arity$variadic = distinct_QMARK___3.cljs$core$IFn$_invoke$arity$variadic;
  return distinct_QMARK_
}();
cljs.core.compare = function compare(x, y) {
  if(x === y) {
    return 0
  }else {
    if(x == null) {
      return-1
    }else {
      if(y == null) {
        return 1
      }else {
        if(cljs.core.type.call(null, x) === cljs.core.type.call(null, y)) {
          if(function() {
            var G__7158 = x;
            if(G__7158) {
              if(function() {
                var or__3943__auto__ = G__7158.cljs$lang$protocol_mask$partition1$ & 2048;
                if(or__3943__auto__) {
                  return or__3943__auto__
                }else {
                  return G__7158.cljs$core$IComparable$
                }
              }()) {
                return true
              }else {
                return false
              }
            }else {
              return false
            }
          }()) {
            return cljs.core._compare.call(null, x, y)
          }else {
            return goog.array.defaultCompare(x, y)
          }
        }else {
          if("\ufdd0:else") {
            throw new Error("compare on non-nil objects of different types");
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.compare_indexed = function() {
  var compare_indexed = null;
  var compare_indexed__2 = function(xs, ys) {
    var xl = cljs.core.count.call(null, xs);
    var yl = cljs.core.count.call(null, ys);
    if(xl < yl) {
      return-1
    }else {
      if(xl > yl) {
        return 1
      }else {
        if("\ufdd0:else") {
          return compare_indexed.call(null, xs, ys, xl, 0)
        }else {
          return null
        }
      }
    }
  };
  var compare_indexed__4 = function(xs, ys, len, n) {
    while(true) {
      var d = cljs.core.compare.call(null, cljs.core.nth.call(null, xs, n), cljs.core.nth.call(null, ys, n));
      if(function() {
        var and__3941__auto__ = d === 0;
        if(and__3941__auto__) {
          return n + 1 < len
        }else {
          return and__3941__auto__
        }
      }()) {
        var G__7159 = xs;
        var G__7160 = ys;
        var G__7161 = len;
        var G__7162 = n + 1;
        xs = G__7159;
        ys = G__7160;
        len = G__7161;
        n = G__7162;
        continue
      }else {
        return d
      }
      break
    }
  };
  compare_indexed = function(xs, ys, len, n) {
    switch(arguments.length) {
      case 2:
        return compare_indexed__2.call(this, xs, ys);
      case 4:
        return compare_indexed__4.call(this, xs, ys, len, n)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  compare_indexed.cljs$core$IFn$_invoke$arity$2 = compare_indexed__2;
  compare_indexed.cljs$core$IFn$_invoke$arity$4 = compare_indexed__4;
  return compare_indexed
}();
cljs.core.fn__GT_comparator = function fn__GT_comparator(f) {
  if(cljs.core._EQ_.call(null, f, cljs.core.compare)) {
    return cljs.core.compare
  }else {
    return function(x, y) {
      var r = f.call(null, x, y);
      if(typeof r === "number") {
        return r
      }else {
        if(cljs.core.truth_(r)) {
          return-1
        }else {
          if(cljs.core.truth_(f.call(null, y, x))) {
            return 1
          }else {
            return 0
          }
        }
      }
    }
  }
};
cljs.core.sort = function() {
  var sort = null;
  var sort__1 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__2 = function(comp, coll) {
    if(cljs.core.seq.call(null, coll)) {
      var a = cljs.core.to_array.call(null, coll);
      goog.array.stableSort(a, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__1.call(this, comp);
      case 2:
        return sort__2.call(this, comp, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  sort.cljs$core$IFn$_invoke$arity$1 = sort__1;
  sort.cljs$core$IFn$_invoke$arity$2 = sort__2;
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__2 = function(keyfn, coll) {
    return sort_by.call(null, keyfn, cljs.core.compare, coll)
  };
  var sort_by__3 = function(keyfn, comp, coll) {
    return cljs.core.sort.call(null, function(x, y) {
      return cljs.core.fn__GT_comparator.call(null, comp).call(null, keyfn.call(null, x), keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__2.call(this, keyfn, comp);
      case 3:
        return sort_by__3.call(this, keyfn, comp, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  sort_by.cljs$core$IFn$_invoke$arity$2 = sort_by__2;
  sort_by.cljs$core$IFn$_invoke$arity$3 = sort_by__3;
  return sort_by
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__2 = function(f, coll) {
    var temp__4090__auto__ = cljs.core.seq.call(null, coll);
    if(temp__4090__auto__) {
      var s = temp__4090__auto__;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s), cljs.core.next.call(null, s))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__$1 = val;
    var coll__$1 = cljs.core.seq.call(null, coll);
    while(true) {
      if(coll__$1) {
        var nval = f.call(null, val__$1, cljs.core.first.call(null, coll__$1));
        if(cljs.core.reduced_QMARK_.call(null, nval)) {
          return cljs.core.deref.call(null, nval)
        }else {
          var G__7163 = nval;
          var G__7164 = cljs.core.next.call(null, coll__$1);
          val__$1 = G__7163;
          coll__$1 = G__7164;
          continue
        }
      }else {
        return val__$1
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__2.call(this, f, val);
      case 3:
        return seq_reduce__3.call(this, f, val, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  seq_reduce.cljs$core$IFn$_invoke$arity$2 = seq_reduce__2;
  seq_reduce.cljs$core$IFn$_invoke$arity$3 = seq_reduce__3;
  return seq_reduce
}();
cljs.core.shuffle = function shuffle(coll) {
  var a = cljs.core.to_array.call(null, coll);
  goog.array.shuffle(a);
  return cljs.core.vec.call(null, a)
};
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__7167 = coll;
      if(G__7167) {
        if(function() {
          var or__3943__auto__ = G__7167.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3943__auto__) {
            return or__3943__auto__
          }else {
            return G__7167.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          return false
        }
      }else {
        return false
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      if(coll instanceof Array) {
        return cljs.core.array_reduce.call(null, coll, f)
      }else {
        if(cljs.core.string_QMARK_.call(null, coll)) {
          return cljs.core.array_reduce.call(null, coll, f)
        }else {
          if(cljs.core.type_satisfies_.call(null, cljs.core.IReduce, coll)) {
            return cljs.core._reduce.call(null, coll, f)
          }else {
            if("\ufdd0:else") {
              return cljs.core.seq_reduce.call(null, f, coll)
            }else {
              return null
            }
          }
        }
      }
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__7168 = coll;
      if(G__7168) {
        if(function() {
          var or__3943__auto__ = G__7168.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3943__auto__) {
            return or__3943__auto__
          }else {
            return G__7168.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          return false
        }
      }else {
        return false
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f, val)
    }else {
      if(coll instanceof Array) {
        return cljs.core.array_reduce.call(null, coll, f, val)
      }else {
        if(cljs.core.string_QMARK_.call(null, coll)) {
          return cljs.core.array_reduce.call(null, coll, f, val)
        }else {
          if(cljs.core.type_satisfies_.call(null, cljs.core.IReduce, coll)) {
            return cljs.core._reduce.call(null, coll, f, val)
          }else {
            if("\ufdd0:else") {
              return cljs.core.seq_reduce.call(null, f, val, coll)
            }else {
              return null
            }
          }
        }
      }
    }
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__2.call(this, f, val);
      case 3:
        return reduce__3.call(this, f, val, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  reduce.cljs$core$IFn$_invoke$arity$2 = reduce__2;
  reduce.cljs$core$IFn$_invoke$arity$3 = reduce__3;
  return reduce
}();
cljs.core.reduce_kv = function reduce_kv(f, init, coll) {
  return cljs.core._kv_reduce.call(null, coll, f, init)
};
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___0 = function() {
    return 0
  };
  var _PLUS___1 = function(x) {
    return x
  };
  var _PLUS___2 = function(x, y) {
    return x + y
  };
  var _PLUS___3 = function() {
    var G__7169__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__7169 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7169__delegate.call(this, x, y, more)
    };
    G__7169.cljs$lang$maxFixedArity = 2;
    G__7169.cljs$lang$applyTo = function(arglist__7170) {
      var x = cljs.core.first(arglist__7170);
      arglist__7170 = cljs.core.next(arglist__7170);
      var y = cljs.core.first(arglist__7170);
      var more = cljs.core.rest(arglist__7170);
      return G__7169__delegate(x, y, more)
    };
    G__7169.cljs$core$IFn$_invoke$arity$variadic = G__7169__delegate;
    return G__7169
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___0.call(this);
      case 1:
        return _PLUS___1.call(this, x);
      case 2:
        return _PLUS___2.call(this, x, y);
      default:
        return _PLUS___3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___3.cljs$lang$applyTo;
  _PLUS_.cljs$core$IFn$_invoke$arity$0 = _PLUS___0;
  _PLUS_.cljs$core$IFn$_invoke$arity$1 = _PLUS___1;
  _PLUS_.cljs$core$IFn$_invoke$arity$2 = _PLUS___2;
  _PLUS_.cljs$core$IFn$_invoke$arity$variadic = _PLUS___3.cljs$core$IFn$_invoke$arity$variadic;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___1 = function(x) {
    return-x
  };
  var ___2 = function(x, y) {
    return x - y
  };
  var ___3 = function() {
    var G__7171__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__7171 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7171__delegate.call(this, x, y, more)
    };
    G__7171.cljs$lang$maxFixedArity = 2;
    G__7171.cljs$lang$applyTo = function(arglist__7172) {
      var x = cljs.core.first(arglist__7172);
      arglist__7172 = cljs.core.next(arglist__7172);
      var y = cljs.core.first(arglist__7172);
      var more = cljs.core.rest(arglist__7172);
      return G__7171__delegate(x, y, more)
    };
    G__7171.cljs$core$IFn$_invoke$arity$variadic = G__7171__delegate;
    return G__7171
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___1.call(this, x);
      case 2:
        return ___2.call(this, x, y);
      default:
        return ___3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___3.cljs$lang$applyTo;
  _.cljs$core$IFn$_invoke$arity$1 = ___1;
  _.cljs$core$IFn$_invoke$arity$2 = ___2;
  _.cljs$core$IFn$_invoke$arity$variadic = ___3.cljs$core$IFn$_invoke$arity$variadic;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___0 = function() {
    return 1
  };
  var _STAR___1 = function(x) {
    return x
  };
  var _STAR___2 = function(x, y) {
    return x * y
  };
  var _STAR___3 = function() {
    var G__7173__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__7173 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7173__delegate.call(this, x, y, more)
    };
    G__7173.cljs$lang$maxFixedArity = 2;
    G__7173.cljs$lang$applyTo = function(arglist__7174) {
      var x = cljs.core.first(arglist__7174);
      arglist__7174 = cljs.core.next(arglist__7174);
      var y = cljs.core.first(arglist__7174);
      var more = cljs.core.rest(arglist__7174);
      return G__7173__delegate(x, y, more)
    };
    G__7173.cljs$core$IFn$_invoke$arity$variadic = G__7173__delegate;
    return G__7173
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___0.call(this);
      case 1:
        return _STAR___1.call(this, x);
      case 2:
        return _STAR___2.call(this, x, y);
      default:
        return _STAR___3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___3.cljs$lang$applyTo;
  _STAR_.cljs$core$IFn$_invoke$arity$0 = _STAR___0;
  _STAR_.cljs$core$IFn$_invoke$arity$1 = _STAR___1;
  _STAR_.cljs$core$IFn$_invoke$arity$2 = _STAR___2;
  _STAR_.cljs$core$IFn$_invoke$arity$variadic = _STAR___3.cljs$core$IFn$_invoke$arity$variadic;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___1 = function(x) {
    return _SLASH_.call(null, 1, x)
  };
  var _SLASH___2 = function(x, y) {
    return x / y
  };
  var _SLASH___3 = function() {
    var G__7175__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__7175 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7175__delegate.call(this, x, y, more)
    };
    G__7175.cljs$lang$maxFixedArity = 2;
    G__7175.cljs$lang$applyTo = function(arglist__7176) {
      var x = cljs.core.first(arglist__7176);
      arglist__7176 = cljs.core.next(arglist__7176);
      var y = cljs.core.first(arglist__7176);
      var more = cljs.core.rest(arglist__7176);
      return G__7175__delegate(x, y, more)
    };
    G__7175.cljs$core$IFn$_invoke$arity$variadic = G__7175__delegate;
    return G__7175
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___1.call(this, x);
      case 2:
        return _SLASH___2.call(this, x, y);
      default:
        return _SLASH___3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___3.cljs$lang$applyTo;
  _SLASH_.cljs$core$IFn$_invoke$arity$1 = _SLASH___1;
  _SLASH_.cljs$core$IFn$_invoke$arity$2 = _SLASH___2;
  _SLASH_.cljs$core$IFn$_invoke$arity$variadic = _SLASH___3.cljs$core$IFn$_invoke$arity$variadic;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___1 = function(x) {
    return true
  };
  var _LT___2 = function(x, y) {
    return x < y
  };
  var _LT___3 = function() {
    var G__7177__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.next.call(null, more)) {
            var G__7178 = y;
            var G__7179 = cljs.core.first.call(null, more);
            var G__7180 = cljs.core.next.call(null, more);
            x = G__7178;
            y = G__7179;
            more = G__7180;
            continue
          }else {
            return y < cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7177 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7177__delegate.call(this, x, y, more)
    };
    G__7177.cljs$lang$maxFixedArity = 2;
    G__7177.cljs$lang$applyTo = function(arglist__7181) {
      var x = cljs.core.first(arglist__7181);
      arglist__7181 = cljs.core.next(arglist__7181);
      var y = cljs.core.first(arglist__7181);
      var more = cljs.core.rest(arglist__7181);
      return G__7177__delegate(x, y, more)
    };
    G__7177.cljs$core$IFn$_invoke$arity$variadic = G__7177__delegate;
    return G__7177
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___1.call(this, x);
      case 2:
        return _LT___2.call(this, x, y);
      default:
        return _LT___3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___3.cljs$lang$applyTo;
  _LT_.cljs$core$IFn$_invoke$arity$1 = _LT___1;
  _LT_.cljs$core$IFn$_invoke$arity$2 = _LT___2;
  _LT_.cljs$core$IFn$_invoke$arity$variadic = _LT___3.cljs$core$IFn$_invoke$arity$variadic;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___1 = function(x) {
    return true
  };
  var _LT__EQ___2 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___3 = function() {
    var G__7182__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.next.call(null, more)) {
            var G__7183 = y;
            var G__7184 = cljs.core.first.call(null, more);
            var G__7185 = cljs.core.next.call(null, more);
            x = G__7183;
            y = G__7184;
            more = G__7185;
            continue
          }else {
            return y <= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7182 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7182__delegate.call(this, x, y, more)
    };
    G__7182.cljs$lang$maxFixedArity = 2;
    G__7182.cljs$lang$applyTo = function(arglist__7186) {
      var x = cljs.core.first(arglist__7186);
      arglist__7186 = cljs.core.next(arglist__7186);
      var y = cljs.core.first(arglist__7186);
      var more = cljs.core.rest(arglist__7186);
      return G__7182__delegate(x, y, more)
    };
    G__7182.cljs$core$IFn$_invoke$arity$variadic = G__7182__delegate;
    return G__7182
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___1.call(this, x);
      case 2:
        return _LT__EQ___2.call(this, x, y);
      default:
        return _LT__EQ___3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___3.cljs$lang$applyTo;
  _LT__EQ_.cljs$core$IFn$_invoke$arity$1 = _LT__EQ___1;
  _LT__EQ_.cljs$core$IFn$_invoke$arity$2 = _LT__EQ___2;
  _LT__EQ_.cljs$core$IFn$_invoke$arity$variadic = _LT__EQ___3.cljs$core$IFn$_invoke$arity$variadic;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___1 = function(x) {
    return true
  };
  var _GT___2 = function(x, y) {
    return x > y
  };
  var _GT___3 = function() {
    var G__7187__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.next.call(null, more)) {
            var G__7188 = y;
            var G__7189 = cljs.core.first.call(null, more);
            var G__7190 = cljs.core.next.call(null, more);
            x = G__7188;
            y = G__7189;
            more = G__7190;
            continue
          }else {
            return y > cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7187 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7187__delegate.call(this, x, y, more)
    };
    G__7187.cljs$lang$maxFixedArity = 2;
    G__7187.cljs$lang$applyTo = function(arglist__7191) {
      var x = cljs.core.first(arglist__7191);
      arglist__7191 = cljs.core.next(arglist__7191);
      var y = cljs.core.first(arglist__7191);
      var more = cljs.core.rest(arglist__7191);
      return G__7187__delegate(x, y, more)
    };
    G__7187.cljs$core$IFn$_invoke$arity$variadic = G__7187__delegate;
    return G__7187
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___1.call(this, x);
      case 2:
        return _GT___2.call(this, x, y);
      default:
        return _GT___3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___3.cljs$lang$applyTo;
  _GT_.cljs$core$IFn$_invoke$arity$1 = _GT___1;
  _GT_.cljs$core$IFn$_invoke$arity$2 = _GT___2;
  _GT_.cljs$core$IFn$_invoke$arity$variadic = _GT___3.cljs$core$IFn$_invoke$arity$variadic;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___1 = function(x) {
    return true
  };
  var _GT__EQ___2 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___3 = function() {
    var G__7192__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.next.call(null, more)) {
            var G__7193 = y;
            var G__7194 = cljs.core.first.call(null, more);
            var G__7195 = cljs.core.next.call(null, more);
            x = G__7193;
            y = G__7194;
            more = G__7195;
            continue
          }else {
            return y >= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7192 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7192__delegate.call(this, x, y, more)
    };
    G__7192.cljs$lang$maxFixedArity = 2;
    G__7192.cljs$lang$applyTo = function(arglist__7196) {
      var x = cljs.core.first(arglist__7196);
      arglist__7196 = cljs.core.next(arglist__7196);
      var y = cljs.core.first(arglist__7196);
      var more = cljs.core.rest(arglist__7196);
      return G__7192__delegate(x, y, more)
    };
    G__7192.cljs$core$IFn$_invoke$arity$variadic = G__7192__delegate;
    return G__7192
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___1.call(this, x);
      case 2:
        return _GT__EQ___2.call(this, x, y);
      default:
        return _GT__EQ___3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___3.cljs$lang$applyTo;
  _GT__EQ_.cljs$core$IFn$_invoke$arity$1 = _GT__EQ___1;
  _GT__EQ_.cljs$core$IFn$_invoke$arity$2 = _GT__EQ___2;
  _GT__EQ_.cljs$core$IFn$_invoke$arity$variadic = _GT__EQ___3.cljs$core$IFn$_invoke$arity$variadic;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__1 = function(x) {
    return x
  };
  var max__2 = function(x, y) {
    return x > y ? x : y
  };
  var max__3 = function() {
    var G__7197__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__7197 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7197__delegate.call(this, x, y, more)
    };
    G__7197.cljs$lang$maxFixedArity = 2;
    G__7197.cljs$lang$applyTo = function(arglist__7198) {
      var x = cljs.core.first(arglist__7198);
      arglist__7198 = cljs.core.next(arglist__7198);
      var y = cljs.core.first(arglist__7198);
      var more = cljs.core.rest(arglist__7198);
      return G__7197__delegate(x, y, more)
    };
    G__7197.cljs$core$IFn$_invoke$arity$variadic = G__7197__delegate;
    return G__7197
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__1.call(this, x);
      case 2:
        return max__2.call(this, x, y);
      default:
        return max__3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__3.cljs$lang$applyTo;
  max.cljs$core$IFn$_invoke$arity$1 = max__1;
  max.cljs$core$IFn$_invoke$arity$2 = max__2;
  max.cljs$core$IFn$_invoke$arity$variadic = max__3.cljs$core$IFn$_invoke$arity$variadic;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__1 = function(x) {
    return x
  };
  var min__2 = function(x, y) {
    return x < y ? x : y
  };
  var min__3 = function() {
    var G__7199__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__7199 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7199__delegate.call(this, x, y, more)
    };
    G__7199.cljs$lang$maxFixedArity = 2;
    G__7199.cljs$lang$applyTo = function(arglist__7200) {
      var x = cljs.core.first(arglist__7200);
      arglist__7200 = cljs.core.next(arglist__7200);
      var y = cljs.core.first(arglist__7200);
      var more = cljs.core.rest(arglist__7200);
      return G__7199__delegate(x, y, more)
    };
    G__7199.cljs$core$IFn$_invoke$arity$variadic = G__7199__delegate;
    return G__7199
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__1.call(this, x);
      case 2:
        return min__2.call(this, x, y);
      default:
        return min__3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__3.cljs$lang$applyTo;
  min.cljs$core$IFn$_invoke$arity$1 = min__1;
  min.cljs$core$IFn$_invoke$arity$2 = min__2;
  min.cljs$core$IFn$_invoke$arity$variadic = min__3.cljs$core$IFn$_invoke$arity$variadic;
  return min
}();
cljs.core.byte$ = function byte$(x) {
  return x
};
cljs.core.char$ = function char$(x) {
  if(typeof x === "number") {
    return String.fromCharCode(x)
  }else {
    if(function() {
      var and__3941__auto__ = cljs.core.string_QMARK_.call(null, x);
      if(and__3941__auto__) {
        return x.length === 1
      }else {
        return and__3941__auto__
      }
    }()) {
      return x
    }else {
      if("\ufdd0:else") {
        throw new Error("Argument to char must be a character or number");
      }else {
        return null
      }
    }
  }
};
cljs.core.short$ = function short$(x) {
  return x
};
cljs.core.float$ = function float$(x) {
  return x
};
cljs.core.double$ = function double$(x) {
  return x
};
cljs.core.unchecked_byte = function unchecked_byte(x) {
  return x
};
cljs.core.unchecked_char = function unchecked_char(x) {
  return x
};
cljs.core.unchecked_short = function unchecked_short(x) {
  return x
};
cljs.core.unchecked_float = function unchecked_float(x) {
  return x
};
cljs.core.unchecked_double = function unchecked_double(x) {
  return x
};
cljs.core.unchecked_add = function() {
  var unchecked_add = null;
  var unchecked_add__0 = function() {
    return 0
  };
  var unchecked_add__1 = function(x) {
    return x
  };
  var unchecked_add__2 = function(x, y) {
    return x + y
  };
  var unchecked_add__3 = function() {
    var G__7201__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, unchecked_add, x + y, more)
    };
    var G__7201 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7201__delegate.call(this, x, y, more)
    };
    G__7201.cljs$lang$maxFixedArity = 2;
    G__7201.cljs$lang$applyTo = function(arglist__7202) {
      var x = cljs.core.first(arglist__7202);
      arglist__7202 = cljs.core.next(arglist__7202);
      var y = cljs.core.first(arglist__7202);
      var more = cljs.core.rest(arglist__7202);
      return G__7201__delegate(x, y, more)
    };
    G__7201.cljs$core$IFn$_invoke$arity$variadic = G__7201__delegate;
    return G__7201
  }();
  unchecked_add = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return unchecked_add__0.call(this);
      case 1:
        return unchecked_add__1.call(this, x);
      case 2:
        return unchecked_add__2.call(this, x, y);
      default:
        return unchecked_add__3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  unchecked_add.cljs$lang$maxFixedArity = 2;
  unchecked_add.cljs$lang$applyTo = unchecked_add__3.cljs$lang$applyTo;
  unchecked_add.cljs$core$IFn$_invoke$arity$0 = unchecked_add__0;
  unchecked_add.cljs$core$IFn$_invoke$arity$1 = unchecked_add__1;
  unchecked_add.cljs$core$IFn$_invoke$arity$2 = unchecked_add__2;
  unchecked_add.cljs$core$IFn$_invoke$arity$variadic = unchecked_add__3.cljs$core$IFn$_invoke$arity$variadic;
  return unchecked_add
}();
cljs.core.unchecked_add_int = function() {
  var unchecked_add_int = null;
  var unchecked_add_int__0 = function() {
    return 0
  };
  var unchecked_add_int__1 = function(x) {
    return x
  };
  var unchecked_add_int__2 = function(x, y) {
    return x + y
  };
  var unchecked_add_int__3 = function() {
    var G__7203__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, unchecked_add_int, x + y, more)
    };
    var G__7203 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7203__delegate.call(this, x, y, more)
    };
    G__7203.cljs$lang$maxFixedArity = 2;
    G__7203.cljs$lang$applyTo = function(arglist__7204) {
      var x = cljs.core.first(arglist__7204);
      arglist__7204 = cljs.core.next(arglist__7204);
      var y = cljs.core.first(arglist__7204);
      var more = cljs.core.rest(arglist__7204);
      return G__7203__delegate(x, y, more)
    };
    G__7203.cljs$core$IFn$_invoke$arity$variadic = G__7203__delegate;
    return G__7203
  }();
  unchecked_add_int = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return unchecked_add_int__0.call(this);
      case 1:
        return unchecked_add_int__1.call(this, x);
      case 2:
        return unchecked_add_int__2.call(this, x, y);
      default:
        return unchecked_add_int__3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  unchecked_add_int.cljs$lang$maxFixedArity = 2;
  unchecked_add_int.cljs$lang$applyTo = unchecked_add_int__3.cljs$lang$applyTo;
  unchecked_add_int.cljs$core$IFn$_invoke$arity$0 = unchecked_add_int__0;
  unchecked_add_int.cljs$core$IFn$_invoke$arity$1 = unchecked_add_int__1;
  unchecked_add_int.cljs$core$IFn$_invoke$arity$2 = unchecked_add_int__2;
  unchecked_add_int.cljs$core$IFn$_invoke$arity$variadic = unchecked_add_int__3.cljs$core$IFn$_invoke$arity$variadic;
  return unchecked_add_int
}();
cljs.core.unchecked_dec = function unchecked_dec(x) {
  return x - 1
};
cljs.core.unchecked_dec_int = function unchecked_dec_int(x) {
  return x - 1
};
cljs.core.unchecked_divide_int = function() {
  var unchecked_divide_int = null;
  var unchecked_divide_int__1 = function(x) {
    return unchecked_divide_int.call(null, 1, x)
  };
  var unchecked_divide_int__2 = function(x, y) {
    return x / y
  };
  var unchecked_divide_int__3 = function() {
    var G__7205__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, unchecked_divide_int, unchecked_divide_int.call(null, x, y), more)
    };
    var G__7205 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7205__delegate.call(this, x, y, more)
    };
    G__7205.cljs$lang$maxFixedArity = 2;
    G__7205.cljs$lang$applyTo = function(arglist__7206) {
      var x = cljs.core.first(arglist__7206);
      arglist__7206 = cljs.core.next(arglist__7206);
      var y = cljs.core.first(arglist__7206);
      var more = cljs.core.rest(arglist__7206);
      return G__7205__delegate(x, y, more)
    };
    G__7205.cljs$core$IFn$_invoke$arity$variadic = G__7205__delegate;
    return G__7205
  }();
  unchecked_divide_int = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return unchecked_divide_int__1.call(this, x);
      case 2:
        return unchecked_divide_int__2.call(this, x, y);
      default:
        return unchecked_divide_int__3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  unchecked_divide_int.cljs$lang$maxFixedArity = 2;
  unchecked_divide_int.cljs$lang$applyTo = unchecked_divide_int__3.cljs$lang$applyTo;
  unchecked_divide_int.cljs$core$IFn$_invoke$arity$1 = unchecked_divide_int__1;
  unchecked_divide_int.cljs$core$IFn$_invoke$arity$2 = unchecked_divide_int__2;
  unchecked_divide_int.cljs$core$IFn$_invoke$arity$variadic = unchecked_divide_int__3.cljs$core$IFn$_invoke$arity$variadic;
  return unchecked_divide_int
}();
cljs.core.unchecked_inc = function unchecked_inc(x) {
  return x + 1
};
cljs.core.unchecked_inc_int = function unchecked_inc_int(x) {
  return x + 1
};
cljs.core.unchecked_multiply = function() {
  var unchecked_multiply = null;
  var unchecked_multiply__0 = function() {
    return 1
  };
  var unchecked_multiply__1 = function(x) {
    return x
  };
  var unchecked_multiply__2 = function(x, y) {
    return x * y
  };
  var unchecked_multiply__3 = function() {
    var G__7207__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, unchecked_multiply, x * y, more)
    };
    var G__7207 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7207__delegate.call(this, x, y, more)
    };
    G__7207.cljs$lang$maxFixedArity = 2;
    G__7207.cljs$lang$applyTo = function(arglist__7208) {
      var x = cljs.core.first(arglist__7208);
      arglist__7208 = cljs.core.next(arglist__7208);
      var y = cljs.core.first(arglist__7208);
      var more = cljs.core.rest(arglist__7208);
      return G__7207__delegate(x, y, more)
    };
    G__7207.cljs$core$IFn$_invoke$arity$variadic = G__7207__delegate;
    return G__7207
  }();
  unchecked_multiply = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return unchecked_multiply__0.call(this);
      case 1:
        return unchecked_multiply__1.call(this, x);
      case 2:
        return unchecked_multiply__2.call(this, x, y);
      default:
        return unchecked_multiply__3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  unchecked_multiply.cljs$lang$maxFixedArity = 2;
  unchecked_multiply.cljs$lang$applyTo = unchecked_multiply__3.cljs$lang$applyTo;
  unchecked_multiply.cljs$core$IFn$_invoke$arity$0 = unchecked_multiply__0;
  unchecked_multiply.cljs$core$IFn$_invoke$arity$1 = unchecked_multiply__1;
  unchecked_multiply.cljs$core$IFn$_invoke$arity$2 = unchecked_multiply__2;
  unchecked_multiply.cljs$core$IFn$_invoke$arity$variadic = unchecked_multiply__3.cljs$core$IFn$_invoke$arity$variadic;
  return unchecked_multiply
}();
cljs.core.unchecked_multiply_int = function() {
  var unchecked_multiply_int = null;
  var unchecked_multiply_int__0 = function() {
    return 1
  };
  var unchecked_multiply_int__1 = function(x) {
    return x
  };
  var unchecked_multiply_int__2 = function(x, y) {
    return x * y
  };
  var unchecked_multiply_int__3 = function() {
    var G__7209__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, unchecked_multiply_int, x * y, more)
    };
    var G__7209 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7209__delegate.call(this, x, y, more)
    };
    G__7209.cljs$lang$maxFixedArity = 2;
    G__7209.cljs$lang$applyTo = function(arglist__7210) {
      var x = cljs.core.first(arglist__7210);
      arglist__7210 = cljs.core.next(arglist__7210);
      var y = cljs.core.first(arglist__7210);
      var more = cljs.core.rest(arglist__7210);
      return G__7209__delegate(x, y, more)
    };
    G__7209.cljs$core$IFn$_invoke$arity$variadic = G__7209__delegate;
    return G__7209
  }();
  unchecked_multiply_int = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return unchecked_multiply_int__0.call(this);
      case 1:
        return unchecked_multiply_int__1.call(this, x);
      case 2:
        return unchecked_multiply_int__2.call(this, x, y);
      default:
        return unchecked_multiply_int__3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  unchecked_multiply_int.cljs$lang$maxFixedArity = 2;
  unchecked_multiply_int.cljs$lang$applyTo = unchecked_multiply_int__3.cljs$lang$applyTo;
  unchecked_multiply_int.cljs$core$IFn$_invoke$arity$0 = unchecked_multiply_int__0;
  unchecked_multiply_int.cljs$core$IFn$_invoke$arity$1 = unchecked_multiply_int__1;
  unchecked_multiply_int.cljs$core$IFn$_invoke$arity$2 = unchecked_multiply_int__2;
  unchecked_multiply_int.cljs$core$IFn$_invoke$arity$variadic = unchecked_multiply_int__3.cljs$core$IFn$_invoke$arity$variadic;
  return unchecked_multiply_int
}();
cljs.core.unchecked_negate = function unchecked_negate(x) {
  return-x
};
cljs.core.unchecked_negate_int = function unchecked_negate_int(x) {
  return-x
};
cljs.core.unchecked_remainder_int = function unchecked_remainder_int(x, n) {
  return cljs.core.mod.call(null, x, n)
};
cljs.core.unchecked_substract = function() {
  var unchecked_substract = null;
  var unchecked_substract__1 = function(x) {
    return-x
  };
  var unchecked_substract__2 = function(x, y) {
    return x - y
  };
  var unchecked_substract__3 = function() {
    var G__7211__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, unchecked_substract, x - y, more)
    };
    var G__7211 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7211__delegate.call(this, x, y, more)
    };
    G__7211.cljs$lang$maxFixedArity = 2;
    G__7211.cljs$lang$applyTo = function(arglist__7212) {
      var x = cljs.core.first(arglist__7212);
      arglist__7212 = cljs.core.next(arglist__7212);
      var y = cljs.core.first(arglist__7212);
      var more = cljs.core.rest(arglist__7212);
      return G__7211__delegate(x, y, more)
    };
    G__7211.cljs$core$IFn$_invoke$arity$variadic = G__7211__delegate;
    return G__7211
  }();
  unchecked_substract = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return unchecked_substract__1.call(this, x);
      case 2:
        return unchecked_substract__2.call(this, x, y);
      default:
        return unchecked_substract__3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  unchecked_substract.cljs$lang$maxFixedArity = 2;
  unchecked_substract.cljs$lang$applyTo = unchecked_substract__3.cljs$lang$applyTo;
  unchecked_substract.cljs$core$IFn$_invoke$arity$1 = unchecked_substract__1;
  unchecked_substract.cljs$core$IFn$_invoke$arity$2 = unchecked_substract__2;
  unchecked_substract.cljs$core$IFn$_invoke$arity$variadic = unchecked_substract__3.cljs$core$IFn$_invoke$arity$variadic;
  return unchecked_substract
}();
cljs.core.unchecked_substract_int = function() {
  var unchecked_substract_int = null;
  var unchecked_substract_int__1 = function(x) {
    return-x
  };
  var unchecked_substract_int__2 = function(x, y) {
    return x - y
  };
  var unchecked_substract_int__3 = function() {
    var G__7213__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, unchecked_substract_int, x - y, more)
    };
    var G__7213 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7213__delegate.call(this, x, y, more)
    };
    G__7213.cljs$lang$maxFixedArity = 2;
    G__7213.cljs$lang$applyTo = function(arglist__7214) {
      var x = cljs.core.first(arglist__7214);
      arglist__7214 = cljs.core.next(arglist__7214);
      var y = cljs.core.first(arglist__7214);
      var more = cljs.core.rest(arglist__7214);
      return G__7213__delegate(x, y, more)
    };
    G__7213.cljs$core$IFn$_invoke$arity$variadic = G__7213__delegate;
    return G__7213
  }();
  unchecked_substract_int = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return unchecked_substract_int__1.call(this, x);
      case 2:
        return unchecked_substract_int__2.call(this, x, y);
      default:
        return unchecked_substract_int__3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  unchecked_substract_int.cljs$lang$maxFixedArity = 2;
  unchecked_substract_int.cljs$lang$applyTo = unchecked_substract_int__3.cljs$lang$applyTo;
  unchecked_substract_int.cljs$core$IFn$_invoke$arity$1 = unchecked_substract_int__1;
  unchecked_substract_int.cljs$core$IFn$_invoke$arity$2 = unchecked_substract_int__2;
  unchecked_substract_int.cljs$core$IFn$_invoke$arity$variadic = unchecked_substract_int__3.cljs$core$IFn$_invoke$arity$variadic;
  return unchecked_substract_int
}();
cljs.core.fix = function fix(q) {
  if(q >= 0) {
    return Math.floor.call(null, q)
  }else {
    return Math.ceil.call(null, q)
  }
};
cljs.core.int$ = function int$(x) {
  return x | 0
};
cljs.core.unchecked_int = function unchecked_int(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.long$ = function long$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.unchecked_long = function unchecked_long(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.booleans = function booleans(x) {
  return x
};
cljs.core.bytes = function bytes(x) {
  return x
};
cljs.core.chars = function chars(x) {
  return x
};
cljs.core.shorts = function shorts(x) {
  return x
};
cljs.core.ints = function ints(x) {
  return x
};
cljs.core.floats = function floats(x) {
  return x
};
cljs.core.doubles = function doubles(x) {
  return x
};
cljs.core.longs = function longs(x) {
  return x
};
cljs.core.js_mod = function js_mod(n, d) {
  return n % d
};
cljs.core.mod = function mod(n, d) {
  return(n % d + d) % d
};
cljs.core.quot = function quot(n, d) {
  var rem = n % d;
  return cljs.core.fix.call(null, (n - rem) / d)
};
cljs.core.rem = function rem(n, d) {
  var q = cljs.core.quot.call(null, n, d);
  return n - d * q
};
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return Math.random.call(null)
  };
  var rand__1 = function(n) {
    return n * rand.call(null)
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  rand.cljs$core$IFn$_invoke$arity$0 = rand__0;
  rand.cljs$core$IFn$_invoke$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return cljs.core.fix.call(null, cljs.core.rand.call(null, n))
};
cljs.core.bit_xor = function bit_xor(x, y) {
  return x ^ y
};
cljs.core.bit_and = function bit_and(x, y) {
  return x & y
};
cljs.core.bit_or = function bit_or(x, y) {
  return x | y
};
cljs.core.bit_and_not = function bit_and_not(x, y) {
  return x & ~y
};
cljs.core.bit_clear = function bit_clear(x, n) {
  return x & ~(1 << n)
};
cljs.core.bit_flip = function bit_flip(x, n) {
  return x ^ 1 << n
};
cljs.core.bit_not = function bit_not(x) {
  return~x
};
cljs.core.bit_set = function bit_set(x, n) {
  return x | 1 << n
};
cljs.core.bit_test = function bit_test(x, n) {
  return(x & 1 << n) != 0
};
cljs.core.bit_shift_left = function bit_shift_left(x, n) {
  return x << n
};
cljs.core.bit_shift_right = function bit_shift_right(x, n) {
  return x >> n
};
cljs.core.bit_shift_right_zero_fill = function bit_shift_right_zero_fill(x, n) {
  return x >>> n
};
cljs.core.bit_count = function bit_count(v) {
  var v__$1 = v - (v >> 1 & 1431655765);
  var v__$2 = (v__$1 & 858993459) + (v__$1 >> 2 & 858993459);
  return(v__$2 + (v__$2 >> 4) & 252645135) * 16843009 >> 24
};
cljs.core._EQ__EQ_ = function() {
  var _EQ__EQ_ = null;
  var _EQ__EQ___1 = function(x) {
    return true
  };
  var _EQ__EQ___2 = function(x, y) {
    return cljs.core._equiv.call(null, x, y)
  };
  var _EQ__EQ___3 = function() {
    var G__7215__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__7216 = y;
            var G__7217 = cljs.core.first.call(null, more);
            var G__7218 = cljs.core.next.call(null, more);
            x = G__7216;
            y = G__7217;
            more = G__7218;
            continue
          }else {
            return _EQ__EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7215 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7215__delegate.call(this, x, y, more)
    };
    G__7215.cljs$lang$maxFixedArity = 2;
    G__7215.cljs$lang$applyTo = function(arglist__7219) {
      var x = cljs.core.first(arglist__7219);
      arglist__7219 = cljs.core.next(arglist__7219);
      var y = cljs.core.first(arglist__7219);
      var more = cljs.core.rest(arglist__7219);
      return G__7215__delegate(x, y, more)
    };
    G__7215.cljs$core$IFn$_invoke$arity$variadic = G__7215__delegate;
    return G__7215
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___1.call(this, x);
      case 2:
        return _EQ__EQ___2.call(this, x, y);
      default:
        return _EQ__EQ___3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___3.cljs$lang$applyTo;
  _EQ__EQ_.cljs$core$IFn$_invoke$arity$1 = _EQ__EQ___1;
  _EQ__EQ_.cljs$core$IFn$_invoke$arity$2 = _EQ__EQ___2;
  _EQ__EQ_.cljs$core$IFn$_invoke$arity$variadic = _EQ__EQ___3.cljs$core$IFn$_invoke$arity$variadic;
  return _EQ__EQ_
}();
cljs.core.pos_QMARK_ = function pos_QMARK_(n) {
  return n > 0
};
cljs.core.zero_QMARK_ = function zero_QMARK_(n) {
  return n === 0
};
cljs.core.neg_QMARK_ = function neg_QMARK_(x) {
  return x < 0
};
cljs.core.nthnext = function nthnext(coll, n) {
  var n__$1 = n;
  var xs = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3941__auto__ = xs;
      if(and__3941__auto__) {
        return n__$1 > 0
      }else {
        return and__3941__auto__
      }
    }())) {
      var G__7220 = n__$1 - 1;
      var G__7221 = cljs.core.next.call(null, xs);
      n__$1 = G__7220;
      xs = G__7221;
      continue
    }else {
      return xs
    }
    break
  }
};
cljs.core.str_STAR_ = function() {
  var str_STAR_ = null;
  var str_STAR___0 = function() {
    return""
  };
  var str_STAR___1 = function(x) {
    if(x == null) {
      return""
    }else {
      if("\ufdd0:else") {
        return x.toString()
      }else {
        return null
      }
    }
  };
  var str_STAR___2 = function() {
    var G__7222__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__7223 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__7224 = cljs.core.next.call(null, more);
            sb = G__7223;
            more = G__7224;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__7222 = function(x, var_args) {
      var ys = null;
      if(arguments.length > 1) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__7222__delegate.call(this, x, ys)
    };
    G__7222.cljs$lang$maxFixedArity = 1;
    G__7222.cljs$lang$applyTo = function(arglist__7225) {
      var x = cljs.core.first(arglist__7225);
      var ys = cljs.core.rest(arglist__7225);
      return G__7222__delegate(x, ys)
    };
    G__7222.cljs$core$IFn$_invoke$arity$variadic = G__7222__delegate;
    return G__7222
  }();
  str_STAR_ = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str_STAR___0.call(this);
      case 1:
        return str_STAR___1.call(this, x);
      default:
        return str_STAR___2.cljs$core$IFn$_invoke$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  str_STAR_.cljs$lang$maxFixedArity = 1;
  str_STAR_.cljs$lang$applyTo = str_STAR___2.cljs$lang$applyTo;
  str_STAR_.cljs$core$IFn$_invoke$arity$0 = str_STAR___0;
  str_STAR_.cljs$core$IFn$_invoke$arity$1 = str_STAR___1;
  str_STAR_.cljs$core$IFn$_invoke$arity$variadic = str_STAR___2.cljs$core$IFn$_invoke$arity$variadic;
  return str_STAR_
}();
cljs.core.str = function() {
  var str = null;
  var str__0 = function() {
    return""
  };
  var str__1 = function(x) {
    if(cljs.core.keyword_QMARK_.call(null, x)) {
      return cljs.core.str_STAR_.call(null, ":", x.substring(2, x.length))
    }else {
      if(x == null) {
        return""
      }else {
        if("\ufdd0:else") {
          return x.toString()
        }else {
          return null
        }
      }
    }
  };
  var str__2 = function() {
    var G__7226__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__7227 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__7228 = cljs.core.next.call(null, more);
            sb = G__7227;
            more = G__7228;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__7226 = function(x, var_args) {
      var ys = null;
      if(arguments.length > 1) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__7226__delegate.call(this, x, ys)
    };
    G__7226.cljs$lang$maxFixedArity = 1;
    G__7226.cljs$lang$applyTo = function(arglist__7229) {
      var x = cljs.core.first(arglist__7229);
      var ys = cljs.core.rest(arglist__7229);
      return G__7226__delegate(x, ys)
    };
    G__7226.cljs$core$IFn$_invoke$arity$variadic = G__7226__delegate;
    return G__7226
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__0.call(this);
      case 1:
        return str__1.call(this, x);
      default:
        return str__2.cljs$core$IFn$_invoke$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__2.cljs$lang$applyTo;
  str.cljs$core$IFn$_invoke$arity$0 = str__0;
  str.cljs$core$IFn$_invoke$arity$1 = str__1;
  str.cljs$core$IFn$_invoke$arity$variadic = str__2.cljs$core$IFn$_invoke$arity$variadic;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__2 = function(s, start) {
    return s.substring(start)
  };
  var subs__3 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__2.call(this, s, start);
      case 3:
        return subs__3.call(this, s, start, end)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  subs.cljs$core$IFn$_invoke$arity$2 = subs__2;
  subs.cljs$core$IFn$_invoke$arity$3 = subs__3;
  return subs
}();
cljs.core.format = function() {
  var format__delegate = function(fmt, args) {
    var args__$1 = cljs.core.map.call(null, function(x) {
      if(function() {
        var or__3943__auto__ = cljs.core.keyword_QMARK_.call(null, x);
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          return x instanceof cljs.core.Symbol
        }
      }()) {
        return[cljs.core.str(x)].join("")
      }else {
        return x
      }
    }, args);
    return cljs.core.apply.call(null, goog.string.format, fmt, args__$1)
  };
  var format = function(fmt, var_args) {
    var args = null;
    if(arguments.length > 1) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return format__delegate.call(this, fmt, args)
  };
  format.cljs$lang$maxFixedArity = 1;
  format.cljs$lang$applyTo = function(arglist__7230) {
    var fmt = cljs.core.first(arglist__7230);
    var args = cljs.core.rest(arglist__7230);
    return format__delegate(fmt, args)
  };
  format.cljs$core$IFn$_invoke$arity$variadic = format__delegate;
  return format
}();
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__1 = function(name) {
    if(cljs.core.keyword_QMARK_.call(null, name)) {
      return name
    }else {
      if(name instanceof cljs.core.Symbol) {
        return cljs.core.str_STAR_.call(null, "\ufdd0", ":", cljs.core.subs.call(null, name, 2))
      }else {
        if("\ufdd0:else") {
          return cljs.core.str_STAR_.call(null, "\ufdd0", ":", name)
        }else {
          return null
        }
      }
    }
  };
  var keyword__2 = function(ns, name) {
    return keyword.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__1.call(this, ns);
      case 2:
        return keyword__2.call(this, ns, name)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  keyword.cljs$core$IFn$_invoke$arity$1 = keyword__1;
  keyword.cljs$core$IFn$_invoke$arity$2 = keyword__2;
  return keyword
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.sequential_QMARK_.call(null, y) ? function() {
    var xs = cljs.core.seq.call(null, x);
    var ys = cljs.core.seq.call(null, y);
    while(true) {
      if(xs == null) {
        return ys == null
      }else {
        if(ys == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs), cljs.core.first.call(null, ys))) {
            var G__7231 = cljs.core.next.call(null, xs);
            var G__7232 = cljs.core.next.call(null, ys);
            xs = G__7231;
            ys = G__7232;
            continue
          }else {
            if("\ufdd0:else") {
              return false
            }else {
              return null
            }
          }
        }
      }
      break
    }
  }() : null)
};
cljs.core.hash_combine = function hash_combine(seed, hash) {
  return seed ^ hash + 2654435769 + (seed << 6) + (seed >> 2)
};
cljs.core.hash_coll = function hash_coll(coll) {
  return cljs.core.reduce.call(null, function(p1__7233_SHARP_, p2__7234_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__7233_SHARP_, cljs.core.hash.call(null, p2__7234_SHARP_, false))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll), false), cljs.core.next.call(null, coll))
};
cljs.core.hash_imap = function hash_imap(m) {
  var h = 0;
  var s = cljs.core.seq.call(null, m);
  while(true) {
    if(s) {
      var e = cljs.core.first.call(null, s);
      var G__7235 = (h + (cljs.core.hash.call(null, cljs.core.key.call(null, e)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e)))) % 4503599627370496;
      var G__7236 = cljs.core.next.call(null, s);
      h = G__7235;
      s = G__7236;
      continue
    }else {
      return h
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h = 0;
  var s__$1 = cljs.core.seq.call(null, s);
  while(true) {
    if(s__$1) {
      var e = cljs.core.first.call(null, s__$1);
      var G__7237 = (h + cljs.core.hash.call(null, e)) % 4503599627370496;
      var G__7238 = cljs.core.next.call(null, s__$1);
      h = G__7237;
      s__$1 = G__7238;
      continue
    }else {
      return h
    }
    break
  }
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var seq__7245_7251 = cljs.core.seq.call(null, fn_map);
  var chunk__7246_7252 = null;
  var count__7247_7253 = 0;
  var i__7248_7254 = 0;
  while(true) {
    if(i__7248_7254 < count__7247_7253) {
      var vec__7249_7255 = cljs.core._nth.call(null, chunk__7246_7252, i__7248_7254);
      var key_name_7256 = cljs.core.nth.call(null, vec__7249_7255, 0, null);
      var f_7257 = cljs.core.nth.call(null, vec__7249_7255, 1, null);
      var str_name_7258 = cljs.core.name.call(null, key_name_7256);
      obj[str_name_7258] = f_7257;
      var G__7259 = seq__7245_7251;
      var G__7260 = chunk__7246_7252;
      var G__7261 = count__7247_7253;
      var G__7262 = i__7248_7254 + 1;
      seq__7245_7251 = G__7259;
      chunk__7246_7252 = G__7260;
      count__7247_7253 = G__7261;
      i__7248_7254 = G__7262;
      continue
    }else {
      var temp__4092__auto___7263 = cljs.core.seq.call(null, seq__7245_7251);
      if(temp__4092__auto___7263) {
        var seq__7245_7264__$1 = temp__4092__auto___7263;
        if(cljs.core.chunked_seq_QMARK_.call(null, seq__7245_7264__$1)) {
          var c__6652__auto___7265 = cljs.core.chunk_first.call(null, seq__7245_7264__$1);
          var G__7266 = cljs.core.chunk_rest.call(null, seq__7245_7264__$1);
          var G__7267 = c__6652__auto___7265;
          var G__7268 = cljs.core.count.call(null, c__6652__auto___7265);
          var G__7269 = 0;
          seq__7245_7251 = G__7266;
          chunk__7246_7252 = G__7267;
          count__7247_7253 = G__7268;
          i__7248_7254 = G__7269;
          continue
        }else {
          var vec__7250_7270 = cljs.core.first.call(null, seq__7245_7264__$1);
          var key_name_7271 = cljs.core.nth.call(null, vec__7250_7270, 0, null);
          var f_7272 = cljs.core.nth.call(null, vec__7250_7270, 1, null);
          var str_name_7273 = cljs.core.name.call(null, key_name_7271);
          obj[str_name_7273] = f_7272;
          var G__7274 = cljs.core.next.call(null, seq__7245_7264__$1);
          var G__7275 = null;
          var G__7276 = 0;
          var G__7277 = 0;
          seq__7245_7251 = G__7274;
          chunk__7246_7252 = G__7275;
          count__7247_7253 = G__7276;
          i__7248_7254 = G__7277;
          continue
        }
      }else {
      }
    }
    break
  }
  return obj
};
goog.provide("cljs.core.List");
cljs.core.List = function(meta, first, rest, count, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.count = count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413358
};
cljs.core.List.cljs$lang$type = true;
cljs.core.List.cljs$lang$ctorStr = "cljs.core/List";
cljs.core.List.cljs$lang$ctorPrWriter = function(this__6461__auto__, writer__6462__auto__, opt__6463__auto__) {
  return cljs.core._write.call(null, writer__6462__auto__, "cljs.core/List")
};
cljs.core.List.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__6347__auto__ = self__.__hash;
  if(!(h__6347__auto__ == null)) {
    return h__6347__auto__
  }else {
    var h__6347__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__6347__auto____$1;
    return h__6347__auto____$1
  }
};
cljs.core.List.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var self__ = this;
  if(self__.count === 1) {
    return null
  }else {
    return self__.rest
  }
};
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return new cljs.core.List(self__.meta, o, coll, self__.count + 1, null)
};
cljs.core.List.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return self__.count
};
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var self__ = this;
  return self__.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var self__ = this;
  return coll.cljs$core$ISeq$_rest$arity$1(coll)
};
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  return self__.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  if(self__.count === 1) {
    return cljs.core.List.EMPTY
  }else {
    return self__.rest
  }
};
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.List(meta__$1, self__.first, self__.rest, self__.count, self__.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.List.EMPTY
};
goog.provide("cljs.core.EmptyList");
cljs.core.EmptyList = function(meta) {
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413326
};
cljs.core.EmptyList.cljs$lang$type = true;
cljs.core.EmptyList.cljs$lang$ctorStr = "cljs.core/EmptyList";
cljs.core.EmptyList.cljs$lang$ctorPrWriter = function(this__6461__auto__, writer__6462__auto__, opt__6463__auto__) {
  return cljs.core._write.call(null, writer__6462__auto__, "cljs.core/EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var self__ = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return new cljs.core.List(self__.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var self__ = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var self__ = this;
  throw new Error("Can't pop empty list");
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.List.EMPTY
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.EmptyList(meta__$1)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return coll
};
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__7279 = coll;
  if(G__7279) {
    if(function() {
      var or__3943__auto__ = G__7279.cljs$lang$protocol_mask$partition0$ & 134217728;
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        return G__7279.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__7279.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__7279)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__7279)
  }
};
cljs.core.rseq = function rseq(coll) {
  return cljs.core._rseq.call(null, coll)
};
cljs.core.reverse = function reverse(coll) {
  if(cljs.core.reversible_QMARK_.call(null, coll)) {
    return cljs.core.rseq.call(null, coll)
  }else {
    return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
  }
};
cljs.core.list = function() {
  var list__delegate = function(xs) {
    var arr = xs instanceof cljs.core.IndexedSeq ? xs.arr : function() {
      var arr = [];
      var xs__$1 = xs;
      while(true) {
        if(!(xs__$1 == null)) {
          arr.push(cljs.core._first.call(null, xs__$1));
          var G__7280 = cljs.core._next.call(null, xs__$1);
          xs__$1 = G__7280;
          continue
        }else {
          return arr
        }
        break
      }
    }();
    var i = arr.length;
    var r = cljs.core.List.EMPTY;
    while(true) {
      if(i > 0) {
        var G__7281 = i - 1;
        var G__7282 = cljs.core._conj.call(null, r, arr[i - 1]);
        i = G__7281;
        r = G__7282;
        continue
      }else {
        return r
      }
      break
    }
  };
  var list = function(var_args) {
    var xs = null;
    if(arguments.length > 0) {
      xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return list__delegate.call(this, xs)
  };
  list.cljs$lang$maxFixedArity = 0;
  list.cljs$lang$applyTo = function(arglist__7283) {
    var xs = cljs.core.seq(arglist__7283);
    return list__delegate(xs)
  };
  list.cljs$core$IFn$_invoke$arity$variadic = list__delegate;
  return list
}();
goog.provide("cljs.core.Cons");
cljs.core.Cons = function(meta, first, rest, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65405164
};
cljs.core.Cons.cljs$lang$type = true;
cljs.core.Cons.cljs$lang$ctorStr = "cljs.core/Cons";
cljs.core.Cons.cljs$lang$ctorPrWriter = function(this__6461__auto__, writer__6462__auto__, opt__6463__auto__) {
  return cljs.core._write.call(null, writer__6462__auto__, "cljs.core/Cons")
};
cljs.core.Cons.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__6347__auto__ = self__.__hash;
  if(!(h__6347__auto__ == null)) {
    return h__6347__auto__
  }else {
    var h__6347__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__6347__auto____$1;
    return h__6347__auto____$1
  }
};
cljs.core.Cons.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var self__ = this;
  if(self__.rest == null) {
    return null
  }else {
    return cljs.core._seq.call(null, self__.rest)
  }
};
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return new cljs.core.Cons(null, o, coll, self__.__hash)
};
cljs.core.Cons.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  return self__.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  if(self__.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return self__.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.Cons(meta__$1, self__.first, self__.rest, self__.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, self__.meta)
};
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3943__auto__ = coll == null;
    if(or__3943__auto__) {
      return or__3943__auto__
    }else {
      var G__7285 = coll;
      if(G__7285) {
        if(function() {
          var or__3943__auto____$1 = G__7285.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            return G__7285.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          return false
        }
      }else {
        return false
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__7287 = x;
  if(G__7287) {
    if(function() {
      var or__3943__auto__ = G__7287.cljs$lang$protocol_mask$partition0$ & 33554432;
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        return G__7287.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__7287.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__7287)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__7287)
  }
};
cljs.core.ICounted["string"] = true;
cljs.core._count["string"] = function(s) {
  return s.length
};
cljs.core.IHash["string"] = true;
cljs.core._hash["string"] = function(o) {
  return goog.string.hashCode(o)
};
goog.provide("cljs.core.Keyword");
cljs.core.Keyword = function(k) {
  this.k = k;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1
};
cljs.core.Keyword.cljs$lang$type = true;
cljs.core.Keyword.cljs$lang$ctorStr = "cljs.core/Keyword";
cljs.core.Keyword.cljs$lang$ctorPrWriter = function(this__6461__auto__, writer__6462__auto__, opt__6463__auto__) {
  return cljs.core._write.call(null, writer__6462__auto__, "cljs.core/Keyword")
};
cljs.core.Keyword.prototype.call = function() {
  var G__7289 = null;
  var G__7289__2 = function(self__, coll) {
    var self__ = this;
    var self____$1 = this;
    var _ = self____$1;
    if(coll == null) {
      return null
    }else {
      var strobj = coll.strobj;
      if(strobj == null) {
        return cljs.core._lookup.call(null, coll, self__.k, null)
      }else {
        return strobj[self__.k]
      }
    }
  };
  var G__7289__3 = function(self__, coll, not_found) {
    var self__ = this;
    var self____$1 = this;
    var _ = self____$1;
    if(coll == null) {
      return not_found
    }else {
      return cljs.core._lookup.call(null, coll, self__.k, not_found)
    }
  };
  G__7289 = function(self__, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7289__2.call(this, self__, coll);
      case 3:
        return G__7289__3.call(this, self__, coll, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__7289
}();
cljs.core.Keyword.prototype.apply = function(self__, args7288) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args7288.slice()))
};
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__7291 = null;
  var G__7291__2 = function(self__, coll) {
    var self____$1 = this;
    var this$ = self____$1;
    return cljs.core.get.call(null, coll, this$.toString())
  };
  var G__7291__3 = function(self__, coll, not_found) {
    var self____$1 = this;
    var this$ = self____$1;
    return cljs.core.get.call(null, coll, this$.toString(), not_found)
  };
  G__7291 = function(self__, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7291__2.call(this, self__, coll);
      case 3:
        return G__7291__3.call(this, self__, coll, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__7291
}();
String.prototype.apply = function(self__, args7290) {
  return self__.call.apply(self__, [self__].concat(args7290.slice()))
};
String.prototype.apply = function(s, args) {
  if(args.length < 2) {
    return cljs.core.get.call(null, args[0], s)
  }else {
    return cljs.core.get.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x = lazy_seq.x;
  if(lazy_seq.realized) {
    return x
  }else {
    lazy_seq.x = x.call(null);
    lazy_seq.realized = true;
    return lazy_seq.x
  }
};
goog.provide("cljs.core.LazySeq");
cljs.core.LazySeq = function(meta, realized, x, __hash) {
  this.meta = meta;
  this.realized = realized;
  this.x = x;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850700
};
cljs.core.LazySeq.cljs$lang$type = true;
cljs.core.LazySeq.cljs$lang$ctorStr = "cljs.core/LazySeq";
cljs.core.LazySeq.cljs$lang$ctorPrWriter = function(this__6461__auto__, writer__6462__auto__, opt__6463__auto__) {
  return cljs.core._write.call(null, writer__6462__auto__, "cljs.core/LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__6347__auto__ = self__.__hash;
  if(!(h__6347__auto__ == null)) {
    return h__6347__auto__
  }else {
    var h__6347__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__6347__auto____$1;
    return h__6347__auto____$1
  }
};
cljs.core.LazySeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core._seq.call(null, coll.cljs$core$ISeq$_rest$arity$1(coll))
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.LazySeq(meta__$1, self__.realized, self__.x, self__.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, self__.meta)
};
goog.provide("cljs.core.ChunkBuffer");
cljs.core.ChunkBuffer = function(buf, end) {
  this.buf = buf;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2
};
cljs.core.ChunkBuffer.cljs$lang$type = true;
cljs.core.ChunkBuffer.cljs$lang$ctorStr = "cljs.core/ChunkBuffer";
cljs.core.ChunkBuffer.cljs$lang$ctorPrWriter = function(this__6461__auto__, writer__6462__auto__, opt__6463__auto__) {
  return cljs.core._write.call(null, writer__6462__auto__, "cljs.core/ChunkBuffer")
};
cljs.core.ChunkBuffer.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var self__ = this;
  return self__.end
};
cljs.core.ChunkBuffer.prototype.add = function(o) {
  var self__ = this;
  var _ = this;
  self__.buf[self__.end] = o;
  return self__.end = self__.end + 1
};
cljs.core.ChunkBuffer.prototype.chunk = function(o) {
  var self__ = this;
  var _ = this;
  var ret = new cljs.core.ArrayChunk(self__.buf, 0, self__.end);
  self__.buf = null;
  return ret
};
cljs.core.chunk_buffer = function chunk_buffer(capacity) {
  return new cljs.core.ChunkBuffer(new Array(capacity), 0)
};
goog.provide("cljs.core.ArrayChunk");
cljs.core.ArrayChunk = function(arr, off, end) {
  this.arr = arr;
  this.off = off;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 524306
};
cljs.core.ArrayChunk.cljs$lang$type = true;
cljs.core.ArrayChunk.cljs$lang$ctorStr = "cljs.core/ArrayChunk";
cljs.core.ArrayChunk.cljs$lang$ctorPrWriter = function(this__6461__auto__, writer__6462__auto__, opt__6463__auto__) {
  return cljs.core._write.call(null, writer__6462__auto__, "cljs.core/ArrayChunk")
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var self__ = this;
  return cljs.core.array_reduce.call(null, self__.arr, f, self__.arr[self__.off], self__.off + 1)
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var self__ = this;
  return cljs.core.array_reduce.call(null, self__.arr, f, start, self__.off)
};
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$ = true;
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$_drop_first$arity$1 = function(coll) {
  var self__ = this;
  if(self__.off === self__.end) {
    throw new Error("-drop-first of empty chunk");
  }else {
    return new cljs.core.ArrayChunk(self__.arr, self__.off + 1, self__.end)
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, i) {
  var self__ = this;
  return self__.arr[self__.off + i]
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, i, not_found) {
  var self__ = this;
  if(function() {
    var and__3941__auto__ = i >= 0;
    if(and__3941__auto__) {
      return i < self__.end - self__.off
    }else {
      return and__3941__auto__
    }
  }()) {
    return self__.arr[self__.off + i]
  }else {
    return not_found
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var self__ = this;
  return self__.end - self__.off
};
cljs.core.array_chunk = function() {
  var array_chunk = null;
  var array_chunk__1 = function(arr) {
    return new cljs.core.ArrayChunk(arr, 0, arr.length)
  };
  var array_chunk__2 = function(arr, off) {
    return new cljs.core.ArrayChunk(arr, off, arr.length)
  };
  var array_chunk__3 = function(arr, off, end) {
    return new cljs.core.ArrayChunk(arr, off, end)
  };
  array_chunk = function(arr, off, end) {
    switch(arguments.length) {
      case 1:
        return array_chunk__1.call(this, arr);
      case 2:
        return array_chunk__2.call(this, arr, off);
      case 3:
        return array_chunk__3.call(this, arr, off, end)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  array_chunk.cljs$core$IFn$_invoke$arity$1 = array_chunk__1;
  array_chunk.cljs$core$IFn$_invoke$arity$2 = array_chunk__2;
  array_chunk.cljs$core$IFn$_invoke$arity$3 = array_chunk__3;
  return array_chunk
}();
goog.provide("cljs.core.ChunkedCons");
cljs.core.ChunkedCons = function(chunk, more, meta, __hash) {
  this.chunk = chunk;
  this.more = more;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition0$ = 31850604;
  this.cljs$lang$protocol_mask$partition1$ = 1536
};
cljs.core.ChunkedCons.cljs$lang$type = true;
cljs.core.ChunkedCons.cljs$lang$ctorStr = "cljs.core/ChunkedCons";
cljs.core.ChunkedCons.cljs$lang$ctorPrWriter = function(this__6461__auto__, writer__6462__auto__, opt__6463__auto__) {
  return cljs.core._write.call(null, writer__6462__auto__, "cljs.core/ChunkedCons")
};
cljs.core.ChunkedCons.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__6347__auto__ = self__.__hash;
  if(!(h__6347__auto__ == null)) {
    return h__6347__auto__
  }else {
    var h__6347__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__6347__auto____$1;
    return h__6347__auto____$1
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$ICollection$_conj$arity$2 = function(this$, o) {
  var self__ = this;
  return cljs.core.cons.call(null, o, this$)
};
cljs.core.ChunkedCons.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return coll
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core._nth.call(null, self__.chunk, 0)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  if(cljs.core._count.call(null, self__.chunk) > 1) {
    return new cljs.core.ChunkedCons(cljs.core._drop_first.call(null, self__.chunk), self__.more, self__.meta, null)
  }else {
    if(self__.more == null) {
      return cljs.core.List.EMPTY
    }else {
      return self__.more
    }
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var self__ = this;
  if(self__.more == null) {
    return null
  }else {
    return self__.more
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedCons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var self__ = this;
  return new cljs.core.ChunkedCons(self__.chunk, self__.more, m, self__.__hash)
};
cljs.core.ChunkedCons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.ChunkedCons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, self__.meta)
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var self__ = this;
  return self__.chunk
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var self__ = this;
  if(self__.more == null) {
    return cljs.core.List.EMPTY
  }else {
    return self__.more
  }
};
cljs.core.chunk_cons = function chunk_cons(chunk, rest) {
  if(cljs.core._count.call(null, chunk) === 0) {
    return rest
  }else {
    return new cljs.core.ChunkedCons(chunk, rest, null, null)
  }
};
cljs.core.chunk_append = function chunk_append(b, x) {
  return b.add(x)
};
cljs.core.chunk = function chunk(b) {
  return b.chunk()
};
cljs.core.chunk_first = function chunk_first(s) {
  return cljs.core._chunked_first.call(null, s)
};
cljs.core.chunk_rest = function chunk_rest(s) {
  return cljs.core._chunked_rest.call(null, s)
};
cljs.core.chunk_next = function chunk_next(s) {
  if(function() {
    var G__7293 = s;
    if(G__7293) {
      if(function() {
        var or__3943__auto__ = G__7293.cljs$lang$protocol_mask$partition1$ & 1024;
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          return G__7293.cljs$core$IChunkedNext$
        }
      }()) {
        return true
      }else {
        return false
      }
    }else {
      return false
    }
  }()) {
    return cljs.core._chunked_next.call(null, s)
  }else {
    return cljs.core.seq.call(null, cljs.core._chunked_rest.call(null, s))
  }
};
cljs.core.to_array = function to_array(s) {
  var ary = [];
  var s__$1 = s;
  while(true) {
    if(cljs.core.seq.call(null, s__$1)) {
      ary.push(cljs.core.first.call(null, s__$1));
      var G__7294 = cljs.core.next.call(null, s__$1);
      s__$1 = G__7294;
      continue
    }else {
      return ary
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret = new Array(cljs.core.count.call(null, coll));
  var i_7295 = 0;
  var xs_7296 = cljs.core.seq.call(null, coll);
  while(true) {
    if(xs_7296) {
      ret[i_7295] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs_7296));
      var G__7297 = i_7295 + 1;
      var G__7298 = cljs.core.next.call(null, xs_7296);
      i_7295 = G__7297;
      xs_7296 = G__7298;
      continue
    }else {
    }
    break
  }
  return ret
};
cljs.core.int_array = function() {
  var int_array = null;
  var int_array__1 = function(size_or_seq) {
    if(typeof size_or_seq === "number") {
      return int_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0:else") {
          throw new Error("int-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var int_array__2 = function(size, init_val_or_seq) {
    var a = new Array(size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s = cljs.core.seq.call(null, init_val_or_seq);
      var i = 0;
      var s__$1 = s;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3941__auto__ = s__$1;
          if(and__3941__auto__) {
            return i < size
          }else {
            return and__3941__auto__
          }
        }())) {
          a[i] = cljs.core.first.call(null, s__$1);
          var G__7299 = i + 1;
          var G__7300 = cljs.core.next.call(null, s__$1);
          i = G__7299;
          s__$1 = G__7300;
          continue
        }else {
          return a
        }
        break
      }
    }else {
      var n__6699__auto___7301 = size;
      var i_7302 = 0;
      while(true) {
        if(i_7302 < n__6699__auto___7301) {
          a[i_7302] = init_val_or_seq;
          var G__7303 = i_7302 + 1;
          i_7302 = G__7303;
          continue
        }else {
        }
        break
      }
      return a
    }
  };
  int_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return int_array__1.call(this, size);
      case 2:
        return int_array__2.call(this, size, init_val_or_seq)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  int_array.cljs$core$IFn$_invoke$arity$1 = int_array__1;
  int_array.cljs$core$IFn$_invoke$arity$2 = int_array__2;
  return int_array
}();
cljs.core.long_array = function() {
  var long_array = null;
  var long_array__1 = function(size_or_seq) {
    if(typeof size_or_seq === "number") {
      return long_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0:else") {
          throw new Error("long-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var long_array__2 = function(size, init_val_or_seq) {
    var a = new Array(size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s = cljs.core.seq.call(null, init_val_or_seq);
      var i = 0;
      var s__$1 = s;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3941__auto__ = s__$1;
          if(and__3941__auto__) {
            return i < size
          }else {
            return and__3941__auto__
          }
        }())) {
          a[i] = cljs.core.first.call(null, s__$1);
          var G__7304 = i + 1;
          var G__7305 = cljs.core.next.call(null, s__$1);
          i = G__7304;
          s__$1 = G__7305;
          continue
        }else {
          return a
        }
        break
      }
    }else {
      var n__6699__auto___7306 = size;
      var i_7307 = 0;
      while(true) {
        if(i_7307 < n__6699__auto___7306) {
          a[i_7307] = init_val_or_seq;
          var G__7308 = i_7307 + 1;
          i_7307 = G__7308;
          continue
        }else {
        }
        break
      }
      return a
    }
  };
  long_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return long_array__1.call(this, size);
      case 2:
        return long_array__2.call(this, size, init_val_or_seq)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  long_array.cljs$core$IFn$_invoke$arity$1 = long_array__1;
  long_array.cljs$core$IFn$_invoke$arity$2 = long_array__2;
  return long_array
}();
cljs.core.double_array = function() {
  var double_array = null;
  var double_array__1 = function(size_or_seq) {
    if(typeof size_or_seq === "number") {
      return double_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0:else") {
          throw new Error("double-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var double_array__2 = function(size, init_val_or_seq) {
    var a = new Array(size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s = cljs.core.seq.call(null, init_val_or_seq);
      var i = 0;
      var s__$1 = s;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3941__auto__ = s__$1;
          if(and__3941__auto__) {
            return i < size
          }else {
            return and__3941__auto__
          }
        }())) {
          a[i] = cljs.core.first.call(null, s__$1);
          var G__7309 = i + 1;
          var G__7310 = cljs.core.next.call(null, s__$1);
          i = G__7309;
          s__$1 = G__7310;
          continue
        }else {
          return a
        }
        break
      }
    }else {
      var n__6699__auto___7311 = size;
      var i_7312 = 0;
      while(true) {
        if(i_7312 < n__6699__auto___7311) {
          a[i_7312] = init_val_or_seq;
          var G__7313 = i_7312 + 1;
          i_7312 = G__7313;
          continue
        }else {
        }
        break
      }
      return a
    }
  };
  double_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return double_array__1.call(this, size);
      case 2:
        return double_array__2.call(this, size, init_val_or_seq)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  double_array.cljs$core$IFn$_invoke$arity$1 = double_array__1;
  double_array.cljs$core$IFn$_invoke$arity$2 = double_array__2;
  return double_array
}();
cljs.core.object_array = function() {
  var object_array = null;
  var object_array__1 = function(size_or_seq) {
    if(typeof size_or_seq === "number") {
      return object_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0:else") {
          throw new Error("object-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var object_array__2 = function(size, init_val_or_seq) {
    var a = new Array(size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s = cljs.core.seq.call(null, init_val_or_seq);
      var i = 0;
      var s__$1 = s;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3941__auto__ = s__$1;
          if(and__3941__auto__) {
            return i < size
          }else {
            return and__3941__auto__
          }
        }())) {
          a[i] = cljs.core.first.call(null, s__$1);
          var G__7314 = i + 1;
          var G__7315 = cljs.core.next.call(null, s__$1);
          i = G__7314;
          s__$1 = G__7315;
          continue
        }else {
          return a
        }
        break
      }
    }else {
      var n__6699__auto___7316 = size;
      var i_7317 = 0;
      while(true) {
        if(i_7317 < n__6699__auto___7316) {
          a[i_7317] = init_val_or_seq;
          var G__7318 = i_7317 + 1;
          i_7317 = G__7318;
          continue
        }else {
        }
        break
      }
      return a
    }
  };
  object_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return object_array__1.call(this, size);
      case 2:
        return object_array__2.call(this, size, init_val_or_seq)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  object_array.cljs$core$IFn$_invoke$arity$1 = object_array__1;
  object_array.cljs$core$IFn$_invoke$arity$2 = object_array__2;
  return object_array
}();
cljs.core.bounded_count = function bounded_count(s, n) {
  if(cljs.core.counted_QMARK_.call(null, s)) {
    return cljs.core.count.call(null, s)
  }else {
    var s__$1 = s;
    var i = n;
    var sum = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3941__auto__ = i > 0;
        if(and__3941__auto__) {
          return cljs.core.seq.call(null, s__$1)
        }else {
          return and__3941__auto__
        }
      }())) {
        var G__7319 = cljs.core.next.call(null, s__$1);
        var G__7320 = i - 1;
        var G__7321 = sum + 1;
        s__$1 = G__7319;
        i = G__7320;
        sum = G__7321;
        continue
      }else {
        return sum
      }
      break
    }
  }
};
cljs.core.spread = function spread(arglist) {
  if(arglist == null) {
    return null
  }else {
    if(cljs.core.next.call(null, arglist) == null) {
      return cljs.core.seq.call(null, cljs.core.first.call(null, arglist))
    }else {
      if("\ufdd0:else") {
        return cljs.core.cons.call(null, cljs.core.first.call(null, arglist), spread.call(null, cljs.core.next.call(null, arglist)))
      }else {
        return null
      }
    }
  }
};
cljs.core.concat = function() {
  var concat = null;
  var concat__0 = function() {
    return new cljs.core.LazySeq(null, false, function() {
      return null
    }, null)
  };
  var concat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    }, null)
  };
  var concat__2 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s = cljs.core.seq.call(null, x);
      if(s) {
        if(cljs.core.chunked_seq_QMARK_.call(null, s)) {
          return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, s), concat.call(null, cljs.core.chunk_rest.call(null, s), y))
        }else {
          return cljs.core.cons.call(null, cljs.core.first.call(null, s), concat.call(null, cljs.core.rest.call(null, s), y))
        }
      }else {
        return y
      }
    }, null)
  };
  var concat__3 = function() {
    var G__7322__delegate = function(x, y, zs) {
      var cat = function cat(xys, zs__$1) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__$1 = cljs.core.seq.call(null, xys);
          if(xys__$1) {
            if(cljs.core.chunked_seq_QMARK_.call(null, xys__$1)) {
              return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, xys__$1), cat.call(null, cljs.core.chunk_rest.call(null, xys__$1), zs__$1))
            }else {
              return cljs.core.cons.call(null, cljs.core.first.call(null, xys__$1), cat.call(null, cljs.core.rest.call(null, xys__$1), zs__$1))
            }
          }else {
            if(cljs.core.truth_(zs__$1)) {
              return cat.call(null, cljs.core.first.call(null, zs__$1), cljs.core.next.call(null, zs__$1))
            }else {
              return null
            }
          }
        }, null)
      };
      return cat.call(null, concat.call(null, x, y), zs)
    };
    var G__7322 = function(x, y, var_args) {
      var zs = null;
      if(arguments.length > 2) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7322__delegate.call(this, x, y, zs)
    };
    G__7322.cljs$lang$maxFixedArity = 2;
    G__7322.cljs$lang$applyTo = function(arglist__7323) {
      var x = cljs.core.first(arglist__7323);
      arglist__7323 = cljs.core.next(arglist__7323);
      var y = cljs.core.first(arglist__7323);
      var zs = cljs.core.rest(arglist__7323);
      return G__7322__delegate(x, y, zs)
    };
    G__7322.cljs$core$IFn$_invoke$arity$variadic = G__7322__delegate;
    return G__7322
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__0.call(this);
      case 1:
        return concat__1.call(this, x);
      case 2:
        return concat__2.call(this, x, y);
      default:
        return concat__3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__3.cljs$lang$applyTo;
  concat.cljs$core$IFn$_invoke$arity$0 = concat__0;
  concat.cljs$core$IFn$_invoke$arity$1 = concat__1;
  concat.cljs$core$IFn$_invoke$arity$2 = concat__2;
  concat.cljs$core$IFn$_invoke$arity$variadic = concat__3.cljs$core$IFn$_invoke$arity$variadic;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___1 = function(args) {
    return cljs.core.seq.call(null, args)
  };
  var list_STAR___2 = function(a, args) {
    return cljs.core.cons.call(null, a, args)
  };
  var list_STAR___3 = function(a, b, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, args))
  };
  var list_STAR___4 = function(a, b, c, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, args)))
  };
  var list_STAR___5 = function() {
    var G__7324__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__7324 = function(a, b, c, d, var_args) {
      var more = null;
      if(arguments.length > 4) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__7324__delegate.call(this, a, b, c, d, more)
    };
    G__7324.cljs$lang$maxFixedArity = 4;
    G__7324.cljs$lang$applyTo = function(arglist__7325) {
      var a = cljs.core.first(arglist__7325);
      arglist__7325 = cljs.core.next(arglist__7325);
      var b = cljs.core.first(arglist__7325);
      arglist__7325 = cljs.core.next(arglist__7325);
      var c = cljs.core.first(arglist__7325);
      arglist__7325 = cljs.core.next(arglist__7325);
      var d = cljs.core.first(arglist__7325);
      var more = cljs.core.rest(arglist__7325);
      return G__7324__delegate(a, b, c, d, more)
    };
    G__7324.cljs$core$IFn$_invoke$arity$variadic = G__7324__delegate;
    return G__7324
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___1.call(this, a);
      case 2:
        return list_STAR___2.call(this, a, b);
      case 3:
        return list_STAR___3.call(this, a, b, c);
      case 4:
        return list_STAR___4.call(this, a, b, c, d);
      default:
        return list_STAR___5.cljs$core$IFn$_invoke$arity$variadic(a, b, c, d, cljs.core.array_seq(arguments, 4))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___5.cljs$lang$applyTo;
  list_STAR_.cljs$core$IFn$_invoke$arity$1 = list_STAR___1;
  list_STAR_.cljs$core$IFn$_invoke$arity$2 = list_STAR___2;
  list_STAR_.cljs$core$IFn$_invoke$arity$3 = list_STAR___3;
  list_STAR_.cljs$core$IFn$_invoke$arity$4 = list_STAR___4;
  list_STAR_.cljs$core$IFn$_invoke$arity$variadic = list_STAR___5.cljs$core$IFn$_invoke$arity$variadic;
  return list_STAR_
}();
cljs.core.transient$ = function transient$(coll) {
  return cljs.core._as_transient.call(null, coll)
};
cljs.core.persistent_BANG_ = function persistent_BANG_(tcoll) {
  return cljs.core._persistent_BANG_.call(null, tcoll)
};
cljs.core.conj_BANG_ = function conj_BANG_(tcoll, val) {
  return cljs.core._conj_BANG_.call(null, tcoll, val)
};
cljs.core.assoc_BANG_ = function assoc_BANG_(tcoll, key, val) {
  return cljs.core._assoc_BANG_.call(null, tcoll, key, val)
};
cljs.core.dissoc_BANG_ = function dissoc_BANG_(tcoll, key) {
  return cljs.core._dissoc_BANG_.call(null, tcoll, key)
};
cljs.core.pop_BANG_ = function pop_BANG_(tcoll) {
  return cljs.core._pop_BANG_.call(null, tcoll)
};
cljs.core.disj_BANG_ = function disj_BANG_(tcoll, val) {
  return cljs.core._disjoin_BANG_.call(null, tcoll, val)
};
cljs.core.apply_to = function apply_to(f, argc, args) {
  var args__$1 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a = cljs.core._first.call(null, args__$1);
    var args__$2 = cljs.core._rest.call(null, args__$1);
    if(argc === 1) {
      if(f.cljs$core$IFn$_invoke$arity$1) {
        return f.cljs$core$IFn$_invoke$arity$1(a)
      }else {
        return f.call(null, a)
      }
    }else {
      var b = cljs.core._first.call(null, args__$2);
      var args__$3 = cljs.core._rest.call(null, args__$2);
      if(argc === 2) {
        if(f.cljs$core$IFn$_invoke$arity$2) {
          return f.cljs$core$IFn$_invoke$arity$2(a, b)
        }else {
          return f.call(null, a, b)
        }
      }else {
        var c = cljs.core._first.call(null, args__$3);
        var args__$4 = cljs.core._rest.call(null, args__$3);
        if(argc === 3) {
          if(f.cljs$core$IFn$_invoke$arity$3) {
            return f.cljs$core$IFn$_invoke$arity$3(a, b, c)
          }else {
            return f.call(null, a, b, c)
          }
        }else {
          var d = cljs.core._first.call(null, args__$4);
          var args__$5 = cljs.core._rest.call(null, args__$4);
          if(argc === 4) {
            if(f.cljs$core$IFn$_invoke$arity$4) {
              return f.cljs$core$IFn$_invoke$arity$4(a, b, c, d)
            }else {
              return f.call(null, a, b, c, d)
            }
          }else {
            var e = cljs.core._first.call(null, args__$5);
            var args__$6 = cljs.core._rest.call(null, args__$5);
            if(argc === 5) {
              if(f.cljs$core$IFn$_invoke$arity$5) {
                return f.cljs$core$IFn$_invoke$arity$5(a, b, c, d, e)
              }else {
                return f.call(null, a, b, c, d, e)
              }
            }else {
              var f__$1 = cljs.core._first.call(null, args__$6);
              var args__$7 = cljs.core._rest.call(null, args__$6);
              if(argc === 6) {
                if(f__$1.cljs$core$IFn$_invoke$arity$6) {
                  return f__$1.cljs$core$IFn$_invoke$arity$6(a, b, c, d, e, f__$1)
                }else {
                  return f__$1.call(null, a, b, c, d, e, f__$1)
                }
              }else {
                var g = cljs.core._first.call(null, args__$7);
                var args__$8 = cljs.core._rest.call(null, args__$7);
                if(argc === 7) {
                  if(f__$1.cljs$core$IFn$_invoke$arity$7) {
                    return f__$1.cljs$core$IFn$_invoke$arity$7(a, b, c, d, e, f__$1, g)
                  }else {
                    return f__$1.call(null, a, b, c, d, e, f__$1, g)
                  }
                }else {
                  var h = cljs.core._first.call(null, args__$8);
                  var args__$9 = cljs.core._rest.call(null, args__$8);
                  if(argc === 8) {
                    if(f__$1.cljs$core$IFn$_invoke$arity$8) {
                      return f__$1.cljs$core$IFn$_invoke$arity$8(a, b, c, d, e, f__$1, g, h)
                    }else {
                      return f__$1.call(null, a, b, c, d, e, f__$1, g, h)
                    }
                  }else {
                    var i = cljs.core._first.call(null, args__$9);
                    var args__$10 = cljs.core._rest.call(null, args__$9);
                    if(argc === 9) {
                      if(f__$1.cljs$core$IFn$_invoke$arity$9) {
                        return f__$1.cljs$core$IFn$_invoke$arity$9(a, b, c, d, e, f__$1, g, h, i)
                      }else {
                        return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i)
                      }
                    }else {
                      var j = cljs.core._first.call(null, args__$10);
                      var args__$11 = cljs.core._rest.call(null, args__$10);
                      if(argc === 10) {
                        if(f__$1.cljs$core$IFn$_invoke$arity$10) {
                          return f__$1.cljs$core$IFn$_invoke$arity$10(a, b, c, d, e, f__$1, g, h, i, j)
                        }else {
                          return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j)
                        }
                      }else {
                        var k = cljs.core._first.call(null, args__$11);
                        var args__$12 = cljs.core._rest.call(null, args__$11);
                        if(argc === 11) {
                          if(f__$1.cljs$core$IFn$_invoke$arity$11) {
                            return f__$1.cljs$core$IFn$_invoke$arity$11(a, b, c, d, e, f__$1, g, h, i, j, k)
                          }else {
                            return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k)
                          }
                        }else {
                          var l = cljs.core._first.call(null, args__$12);
                          var args__$13 = cljs.core._rest.call(null, args__$12);
                          if(argc === 12) {
                            if(f__$1.cljs$core$IFn$_invoke$arity$12) {
                              return f__$1.cljs$core$IFn$_invoke$arity$12(a, b, c, d, e, f__$1, g, h, i, j, k, l)
                            }else {
                              return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k, l)
                            }
                          }else {
                            var m = cljs.core._first.call(null, args__$13);
                            var args__$14 = cljs.core._rest.call(null, args__$13);
                            if(argc === 13) {
                              if(f__$1.cljs$core$IFn$_invoke$arity$13) {
                                return f__$1.cljs$core$IFn$_invoke$arity$13(a, b, c, d, e, f__$1, g, h, i, j, k, l, m)
                              }else {
                                return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k, l, m)
                              }
                            }else {
                              var n = cljs.core._first.call(null, args__$14);
                              var args__$15 = cljs.core._rest.call(null, args__$14);
                              if(argc === 14) {
                                if(f__$1.cljs$core$IFn$_invoke$arity$14) {
                                  return f__$1.cljs$core$IFn$_invoke$arity$14(a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n)
                                }else {
                                  return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n)
                                }
                              }else {
                                var o = cljs.core._first.call(null, args__$15);
                                var args__$16 = cljs.core._rest.call(null, args__$15);
                                if(argc === 15) {
                                  if(f__$1.cljs$core$IFn$_invoke$arity$15) {
                                    return f__$1.cljs$core$IFn$_invoke$arity$15(a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o)
                                  }else {
                                    return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o)
                                  }
                                }else {
                                  var p = cljs.core._first.call(null, args__$16);
                                  var args__$17 = cljs.core._rest.call(null, args__$16);
                                  if(argc === 16) {
                                    if(f__$1.cljs$core$IFn$_invoke$arity$16) {
                                      return f__$1.cljs$core$IFn$_invoke$arity$16(a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p)
                                    }else {
                                      return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p)
                                    }
                                  }else {
                                    var q = cljs.core._first.call(null, args__$17);
                                    var args__$18 = cljs.core._rest.call(null, args__$17);
                                    if(argc === 17) {
                                      if(f__$1.cljs$core$IFn$_invoke$arity$17) {
                                        return f__$1.cljs$core$IFn$_invoke$arity$17(a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p, q)
                                      }else {
                                        return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p, q)
                                      }
                                    }else {
                                      var r = cljs.core._first.call(null, args__$18);
                                      var args__$19 = cljs.core._rest.call(null, args__$18);
                                      if(argc === 18) {
                                        if(f__$1.cljs$core$IFn$_invoke$arity$18) {
                                          return f__$1.cljs$core$IFn$_invoke$arity$18(a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p, q, r)
                                        }else {
                                          return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p, q, r)
                                        }
                                      }else {
                                        var s = cljs.core._first.call(null, args__$19);
                                        var args__$20 = cljs.core._rest.call(null, args__$19);
                                        if(argc === 19) {
                                          if(f__$1.cljs$core$IFn$_invoke$arity$19) {
                                            return f__$1.cljs$core$IFn$_invoke$arity$19(a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p, q, r, s)
                                          }else {
                                            return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p, q, r, s)
                                          }
                                        }else {
                                          var t = cljs.core._first.call(null, args__$20);
                                          var args__$21 = cljs.core._rest.call(null, args__$20);
                                          if(argc === 20) {
                                            if(f__$1.cljs$core$IFn$_invoke$arity$20) {
                                              return f__$1.cljs$core$IFn$_invoke$arity$20(a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p, q, r, s, t)
                                            }else {
                                              return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p, q, r, s, t)
                                            }
                                          }else {
                                            throw new Error("Only up to 20 arguments supported on functions");
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
cljs.core.apply = function() {
  var apply = null;
  var apply__2 = function(f, args) {
    var fixed_arity = f.cljs$lang$maxFixedArity;
    if(f.cljs$lang$applyTo) {
      var bc = cljs.core.bounded_count.call(null, args, fixed_arity + 1);
      if(bc <= fixed_arity) {
        return cljs.core.apply_to.call(null, f, bc, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity = f.cljs$lang$maxFixedArity;
    if(f.cljs$lang$applyTo) {
      var bc = cljs.core.bounded_count.call(null, arglist, fixed_arity + 1);
      if(bc <= fixed_arity) {
        return cljs.core.apply_to.call(null, f, bc, arglist)
      }else {
        return f.cljs$lang$applyTo(arglist)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity = f.cljs$lang$maxFixedArity;
    if(f.cljs$lang$applyTo) {
      var bc = cljs.core.bounded_count.call(null, arglist, fixed_arity + 1);
      if(bc <= fixed_arity) {
        return cljs.core.apply_to.call(null, f, bc, arglist)
      }else {
        return f.cljs$lang$applyTo(arglist)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity = f.cljs$lang$maxFixedArity;
    if(f.cljs$lang$applyTo) {
      var bc = cljs.core.bounded_count.call(null, arglist, fixed_arity + 1);
      if(bc <= fixed_arity) {
        return cljs.core.apply_to.call(null, f, bc, arglist)
      }else {
        return f.cljs$lang$applyTo(arglist)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist))
    }
  };
  var apply__6 = function() {
    var G__7326__delegate = function(f, a, b, c, d, args) {
      var arglist = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity = f.cljs$lang$maxFixedArity;
      if(f.cljs$lang$applyTo) {
        var bc = cljs.core.bounded_count.call(null, arglist, fixed_arity + 1);
        if(bc <= fixed_arity) {
          return cljs.core.apply_to.call(null, f, bc, arglist)
        }else {
          return f.cljs$lang$applyTo(arglist)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist))
      }
    };
    var G__7326 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(arguments.length > 5) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__7326__delegate.call(this, f, a, b, c, d, args)
    };
    G__7326.cljs$lang$maxFixedArity = 5;
    G__7326.cljs$lang$applyTo = function(arglist__7327) {
      var f = cljs.core.first(arglist__7327);
      arglist__7327 = cljs.core.next(arglist__7327);
      var a = cljs.core.first(arglist__7327);
      arglist__7327 = cljs.core.next(arglist__7327);
      var b = cljs.core.first(arglist__7327);
      arglist__7327 = cljs.core.next(arglist__7327);
      var c = cljs.core.first(arglist__7327);
      arglist__7327 = cljs.core.next(arglist__7327);
      var d = cljs.core.first(arglist__7327);
      var args = cljs.core.rest(arglist__7327);
      return G__7326__delegate(f, a, b, c, d, args)
    };
    G__7326.cljs$core$IFn$_invoke$arity$variadic = G__7326__delegate;
    return G__7326
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__2.call(this, f, a);
      case 3:
        return apply__3.call(this, f, a, b);
      case 4:
        return apply__4.call(this, f, a, b, c);
      case 5:
        return apply__5.call(this, f, a, b, c, d);
      default:
        return apply__6.cljs$core$IFn$_invoke$arity$variadic(f, a, b, c, d, cljs.core.array_seq(arguments, 5))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__6.cljs$lang$applyTo;
  apply.cljs$core$IFn$_invoke$arity$2 = apply__2;
  apply.cljs$core$IFn$_invoke$arity$3 = apply__3;
  apply.cljs$core$IFn$_invoke$arity$4 = apply__4;
  apply.cljs$core$IFn$_invoke$arity$5 = apply__5;
  apply.cljs$core$IFn$_invoke$arity$variadic = apply__6.cljs$core$IFn$_invoke$arity$variadic;
  return apply
}();
cljs.core.vary_meta = function() {
  var vary_meta__delegate = function(obj, f, args) {
    return cljs.core.with_meta.call(null, obj, cljs.core.apply.call(null, f, cljs.core.meta.call(null, obj), args))
  };
  var vary_meta = function(obj, f, var_args) {
    var args = null;
    if(arguments.length > 2) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return vary_meta__delegate.call(this, obj, f, args)
  };
  vary_meta.cljs$lang$maxFixedArity = 2;
  vary_meta.cljs$lang$applyTo = function(arglist__7328) {
    var obj = cljs.core.first(arglist__7328);
    arglist__7328 = cljs.core.next(arglist__7328);
    var f = cljs.core.first(arglist__7328);
    var args = cljs.core.rest(arglist__7328);
    return vary_meta__delegate(obj, f, args)
  };
  vary_meta.cljs$core$IFn$_invoke$arity$variadic = vary_meta__delegate;
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___1 = function(x) {
    return false
  };
  var not_EQ___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var not_EQ___3 = function() {
    var G__7329__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__7329 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7329__delegate.call(this, x, y, more)
    };
    G__7329.cljs$lang$maxFixedArity = 2;
    G__7329.cljs$lang$applyTo = function(arglist__7330) {
      var x = cljs.core.first(arglist__7330);
      arglist__7330 = cljs.core.next(arglist__7330);
      var y = cljs.core.first(arglist__7330);
      var more = cljs.core.rest(arglist__7330);
      return G__7329__delegate(x, y, more)
    };
    G__7329.cljs$core$IFn$_invoke$arity$variadic = G__7329__delegate;
    return G__7329
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___1.call(this, x);
      case 2:
        return not_EQ___2.call(this, x, y);
      default:
        return not_EQ___3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___3.cljs$lang$applyTo;
  not_EQ_.cljs$core$IFn$_invoke$arity$1 = not_EQ___1;
  not_EQ_.cljs$core$IFn$_invoke$arity$2 = not_EQ___2;
  not_EQ_.cljs$core$IFn$_invoke$arity$variadic = not_EQ___3.cljs$core$IFn$_invoke$arity$variadic;
  return not_EQ_
}();
cljs.core.not_empty = function not_empty(coll) {
  if(cljs.core.seq.call(null, coll)) {
    return coll
  }else {
    return null
  }
};
cljs.core.every_QMARK_ = function every_QMARK_(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll) == null) {
      return true
    }else {
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, coll)))) {
        var G__7331 = pred;
        var G__7332 = cljs.core.next.call(null, coll);
        pred = G__7331;
        coll = G__7332;
        continue
      }else {
        if("\ufdd0:else") {
          return false
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.not_every_QMARK_ = function not_every_QMARK_(pred, coll) {
  return!cljs.core.every_QMARK_.call(null, pred, coll)
};
cljs.core.some = function some(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll)) {
      var or__3943__auto__ = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3943__auto__)) {
        return or__3943__auto__
      }else {
        var G__7333 = pred;
        var G__7334 = cljs.core.next.call(null, coll);
        pred = G__7333;
        coll = G__7334;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.not_any_QMARK_ = function not_any_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.some.call(null, pred, coll))
};
cljs.core.even_QMARK_ = function even_QMARK_(n) {
  if(cljs.core.integer_QMARK_.call(null, n)) {
    return(n & 1) === 0
  }else {
    throw new Error([cljs.core.str("Argument must be an integer: "), cljs.core.str(n)].join(""));
  }
};
cljs.core.odd_QMARK_ = function odd_QMARK_(n) {
  return!cljs.core.even_QMARK_.call(null, n)
};
cljs.core.identity = function identity(x) {
  return x
};
cljs.core.complement = function complement(f) {
  return function() {
    var G__7335 = null;
    var G__7335__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__7335__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__7335__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__7335__3 = function() {
      var G__7336__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__7336 = function(x, y, var_args) {
        var zs = null;
        if(arguments.length > 2) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__7336__delegate.call(this, x, y, zs)
      };
      G__7336.cljs$lang$maxFixedArity = 2;
      G__7336.cljs$lang$applyTo = function(arglist__7337) {
        var x = cljs.core.first(arglist__7337);
        arglist__7337 = cljs.core.next(arglist__7337);
        var y = cljs.core.first(arglist__7337);
        var zs = cljs.core.rest(arglist__7337);
        return G__7336__delegate(x, y, zs)
      };
      G__7336.cljs$core$IFn$_invoke$arity$variadic = G__7336__delegate;
      return G__7336
    }();
    G__7335 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__7335__0.call(this);
        case 1:
          return G__7335__1.call(this, x);
        case 2:
          return G__7335__2.call(this, x, y);
        default:
          return G__7335__3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw new Error("Invalid arity: " + arguments.length);
    };
    G__7335.cljs$lang$maxFixedArity = 2;
    G__7335.cljs$lang$applyTo = G__7335__3.cljs$lang$applyTo;
    return G__7335
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__7338__delegate = function(args) {
      return x
    };
    var G__7338 = function(var_args) {
      var args = null;
      if(arguments.length > 0) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__7338__delegate.call(this, args)
    };
    G__7338.cljs$lang$maxFixedArity = 0;
    G__7338.cljs$lang$applyTo = function(arglist__7339) {
      var args = cljs.core.seq(arglist__7339);
      return G__7338__delegate(args)
    };
    G__7338.cljs$core$IFn$_invoke$arity$variadic = G__7338__delegate;
    return G__7338
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__0 = function() {
    return cljs.core.identity
  };
  var comp__1 = function(f) {
    return f
  };
  var comp__2 = function(f, g) {
    return function() {
      var G__7340 = null;
      var G__7340__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__7340__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__7340__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__7340__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__7340__4 = function() {
        var G__7341__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__7341 = function(x, y, z, var_args) {
          var args = null;
          if(arguments.length > 3) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7341__delegate.call(this, x, y, z, args)
        };
        G__7341.cljs$lang$maxFixedArity = 3;
        G__7341.cljs$lang$applyTo = function(arglist__7342) {
          var x = cljs.core.first(arglist__7342);
          arglist__7342 = cljs.core.next(arglist__7342);
          var y = cljs.core.first(arglist__7342);
          arglist__7342 = cljs.core.next(arglist__7342);
          var z = cljs.core.first(arglist__7342);
          var args = cljs.core.rest(arglist__7342);
          return G__7341__delegate(x, y, z, args)
        };
        G__7341.cljs$core$IFn$_invoke$arity$variadic = G__7341__delegate;
        return G__7341
      }();
      G__7340 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__7340__0.call(this);
          case 1:
            return G__7340__1.call(this, x);
          case 2:
            return G__7340__2.call(this, x, y);
          case 3:
            return G__7340__3.call(this, x, y, z);
          default:
            return G__7340__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      G__7340.cljs$lang$maxFixedArity = 3;
      G__7340.cljs$lang$applyTo = G__7340__4.cljs$lang$applyTo;
      return G__7340
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__7343 = null;
      var G__7343__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__7343__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__7343__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__7343__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__7343__4 = function() {
        var G__7344__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__7344 = function(x, y, z, var_args) {
          var args = null;
          if(arguments.length > 3) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7344__delegate.call(this, x, y, z, args)
        };
        G__7344.cljs$lang$maxFixedArity = 3;
        G__7344.cljs$lang$applyTo = function(arglist__7345) {
          var x = cljs.core.first(arglist__7345);
          arglist__7345 = cljs.core.next(arglist__7345);
          var y = cljs.core.first(arglist__7345);
          arglist__7345 = cljs.core.next(arglist__7345);
          var z = cljs.core.first(arglist__7345);
          var args = cljs.core.rest(arglist__7345);
          return G__7344__delegate(x, y, z, args)
        };
        G__7344.cljs$core$IFn$_invoke$arity$variadic = G__7344__delegate;
        return G__7344
      }();
      G__7343 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__7343__0.call(this);
          case 1:
            return G__7343__1.call(this, x);
          case 2:
            return G__7343__2.call(this, x, y);
          case 3:
            return G__7343__3.call(this, x, y, z);
          default:
            return G__7343__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      G__7343.cljs$lang$maxFixedArity = 3;
      G__7343.cljs$lang$applyTo = G__7343__4.cljs$lang$applyTo;
      return G__7343
    }()
  };
  var comp__4 = function() {
    var G__7346__delegate = function(f1, f2, f3, fs) {
      var fs__$1 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__7347__delegate = function(args) {
          var ret = cljs.core.apply.call(null, cljs.core.first.call(null, fs__$1), args);
          var fs__$2 = cljs.core.next.call(null, fs__$1);
          while(true) {
            if(fs__$2) {
              var G__7348 = cljs.core.first.call(null, fs__$2).call(null, ret);
              var G__7349 = cljs.core.next.call(null, fs__$2);
              ret = G__7348;
              fs__$2 = G__7349;
              continue
            }else {
              return ret
            }
            break
          }
        };
        var G__7347 = function(var_args) {
          var args = null;
          if(arguments.length > 0) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__7347__delegate.call(this, args)
        };
        G__7347.cljs$lang$maxFixedArity = 0;
        G__7347.cljs$lang$applyTo = function(arglist__7350) {
          var args = cljs.core.seq(arglist__7350);
          return G__7347__delegate(args)
        };
        G__7347.cljs$core$IFn$_invoke$arity$variadic = G__7347__delegate;
        return G__7347
      }()
    };
    var G__7346 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(arguments.length > 3) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7346__delegate.call(this, f1, f2, f3, fs)
    };
    G__7346.cljs$lang$maxFixedArity = 3;
    G__7346.cljs$lang$applyTo = function(arglist__7351) {
      var f1 = cljs.core.first(arglist__7351);
      arglist__7351 = cljs.core.next(arglist__7351);
      var f2 = cljs.core.first(arglist__7351);
      arglist__7351 = cljs.core.next(arglist__7351);
      var f3 = cljs.core.first(arglist__7351);
      var fs = cljs.core.rest(arglist__7351);
      return G__7346__delegate(f1, f2, f3, fs)
    };
    G__7346.cljs$core$IFn$_invoke$arity$variadic = G__7346__delegate;
    return G__7346
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__0.call(this);
      case 1:
        return comp__1.call(this, f1);
      case 2:
        return comp__2.call(this, f1, f2);
      case 3:
        return comp__3.call(this, f1, f2, f3);
      default:
        return comp__4.cljs$core$IFn$_invoke$arity$variadic(f1, f2, f3, cljs.core.array_seq(arguments, 3))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__4.cljs$lang$applyTo;
  comp.cljs$core$IFn$_invoke$arity$0 = comp__0;
  comp.cljs$core$IFn$_invoke$arity$1 = comp__1;
  comp.cljs$core$IFn$_invoke$arity$2 = comp__2;
  comp.cljs$core$IFn$_invoke$arity$3 = comp__3;
  comp.cljs$core$IFn$_invoke$arity$variadic = comp__4.cljs$core$IFn$_invoke$arity$variadic;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__2 = function(f, arg1) {
    return function() {
      var G__7352__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__7352 = function(var_args) {
        var args = null;
        if(arguments.length > 0) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7352__delegate.call(this, args)
      };
      G__7352.cljs$lang$maxFixedArity = 0;
      G__7352.cljs$lang$applyTo = function(arglist__7353) {
        var args = cljs.core.seq(arglist__7353);
        return G__7352__delegate(args)
      };
      G__7352.cljs$core$IFn$_invoke$arity$variadic = G__7352__delegate;
      return G__7352
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__7354__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__7354 = function(var_args) {
        var args = null;
        if(arguments.length > 0) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7354__delegate.call(this, args)
      };
      G__7354.cljs$lang$maxFixedArity = 0;
      G__7354.cljs$lang$applyTo = function(arglist__7355) {
        var args = cljs.core.seq(arglist__7355);
        return G__7354__delegate(args)
      };
      G__7354.cljs$core$IFn$_invoke$arity$variadic = G__7354__delegate;
      return G__7354
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__7356__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__7356 = function(var_args) {
        var args = null;
        if(arguments.length > 0) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7356__delegate.call(this, args)
      };
      G__7356.cljs$lang$maxFixedArity = 0;
      G__7356.cljs$lang$applyTo = function(arglist__7357) {
        var args = cljs.core.seq(arglist__7357);
        return G__7356__delegate(args)
      };
      G__7356.cljs$core$IFn$_invoke$arity$variadic = G__7356__delegate;
      return G__7356
    }()
  };
  var partial__5 = function() {
    var G__7358__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__7359__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__7359 = function(var_args) {
          var args = null;
          if(arguments.length > 0) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__7359__delegate.call(this, args)
        };
        G__7359.cljs$lang$maxFixedArity = 0;
        G__7359.cljs$lang$applyTo = function(arglist__7360) {
          var args = cljs.core.seq(arglist__7360);
          return G__7359__delegate(args)
        };
        G__7359.cljs$core$IFn$_invoke$arity$variadic = G__7359__delegate;
        return G__7359
      }()
    };
    var G__7358 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(arguments.length > 4) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__7358__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__7358.cljs$lang$maxFixedArity = 4;
    G__7358.cljs$lang$applyTo = function(arglist__7361) {
      var f = cljs.core.first(arglist__7361);
      arglist__7361 = cljs.core.next(arglist__7361);
      var arg1 = cljs.core.first(arglist__7361);
      arglist__7361 = cljs.core.next(arglist__7361);
      var arg2 = cljs.core.first(arglist__7361);
      arglist__7361 = cljs.core.next(arglist__7361);
      var arg3 = cljs.core.first(arglist__7361);
      var more = cljs.core.rest(arglist__7361);
      return G__7358__delegate(f, arg1, arg2, arg3, more)
    };
    G__7358.cljs$core$IFn$_invoke$arity$variadic = G__7358__delegate;
    return G__7358
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return partial__2.call(this, f, arg1);
      case 3:
        return partial__3.call(this, f, arg1, arg2);
      case 4:
        return partial__4.call(this, f, arg1, arg2, arg3);
      default:
        return partial__5.cljs$core$IFn$_invoke$arity$variadic(f, arg1, arg2, arg3, cljs.core.array_seq(arguments, 4))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__5.cljs$lang$applyTo;
  partial.cljs$core$IFn$_invoke$arity$2 = partial__2;
  partial.cljs$core$IFn$_invoke$arity$3 = partial__3;
  partial.cljs$core$IFn$_invoke$arity$4 = partial__4;
  partial.cljs$core$IFn$_invoke$arity$variadic = partial__5.cljs$core$IFn$_invoke$arity$variadic;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__2 = function(f, x) {
    return function() {
      var G__7362 = null;
      var G__7362__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__7362__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__7362__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__7362__4 = function() {
        var G__7363__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__7363 = function(a, b, c, var_args) {
          var ds = null;
          if(arguments.length > 3) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7363__delegate.call(this, a, b, c, ds)
        };
        G__7363.cljs$lang$maxFixedArity = 3;
        G__7363.cljs$lang$applyTo = function(arglist__7364) {
          var a = cljs.core.first(arglist__7364);
          arglist__7364 = cljs.core.next(arglist__7364);
          var b = cljs.core.first(arglist__7364);
          arglist__7364 = cljs.core.next(arglist__7364);
          var c = cljs.core.first(arglist__7364);
          var ds = cljs.core.rest(arglist__7364);
          return G__7363__delegate(a, b, c, ds)
        };
        G__7363.cljs$core$IFn$_invoke$arity$variadic = G__7363__delegate;
        return G__7363
      }();
      G__7362 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__7362__1.call(this, a);
          case 2:
            return G__7362__2.call(this, a, b);
          case 3:
            return G__7362__3.call(this, a, b, c);
          default:
            return G__7362__4.cljs$core$IFn$_invoke$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      G__7362.cljs$lang$maxFixedArity = 3;
      G__7362.cljs$lang$applyTo = G__7362__4.cljs$lang$applyTo;
      return G__7362
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__7365 = null;
      var G__7365__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__7365__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__7365__4 = function() {
        var G__7366__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__7366 = function(a, b, c, var_args) {
          var ds = null;
          if(arguments.length > 3) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7366__delegate.call(this, a, b, c, ds)
        };
        G__7366.cljs$lang$maxFixedArity = 3;
        G__7366.cljs$lang$applyTo = function(arglist__7367) {
          var a = cljs.core.first(arglist__7367);
          arglist__7367 = cljs.core.next(arglist__7367);
          var b = cljs.core.first(arglist__7367);
          arglist__7367 = cljs.core.next(arglist__7367);
          var c = cljs.core.first(arglist__7367);
          var ds = cljs.core.rest(arglist__7367);
          return G__7366__delegate(a, b, c, ds)
        };
        G__7366.cljs$core$IFn$_invoke$arity$variadic = G__7366__delegate;
        return G__7366
      }();
      G__7365 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__7365__2.call(this, a, b);
          case 3:
            return G__7365__3.call(this, a, b, c);
          default:
            return G__7365__4.cljs$core$IFn$_invoke$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      G__7365.cljs$lang$maxFixedArity = 3;
      G__7365.cljs$lang$applyTo = G__7365__4.cljs$lang$applyTo;
      return G__7365
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__7368 = null;
      var G__7368__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__7368__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__7368__4 = function() {
        var G__7369__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__7369 = function(a, b, c, var_args) {
          var ds = null;
          if(arguments.length > 3) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7369__delegate.call(this, a, b, c, ds)
        };
        G__7369.cljs$lang$maxFixedArity = 3;
        G__7369.cljs$lang$applyTo = function(arglist__7370) {
          var a = cljs.core.first(arglist__7370);
          arglist__7370 = cljs.core.next(arglist__7370);
          var b = cljs.core.first(arglist__7370);
          arglist__7370 = cljs.core.next(arglist__7370);
          var c = cljs.core.first(arglist__7370);
          var ds = cljs.core.rest(arglist__7370);
          return G__7369__delegate(a, b, c, ds)
        };
        G__7369.cljs$core$IFn$_invoke$arity$variadic = G__7369__delegate;
        return G__7369
      }();
      G__7368 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__7368__2.call(this, a, b);
          case 3:
            return G__7368__3.call(this, a, b, c);
          default:
            return G__7368__4.cljs$core$IFn$_invoke$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      G__7368.cljs$lang$maxFixedArity = 3;
      G__7368.cljs$lang$applyTo = G__7368__4.cljs$lang$applyTo;
      return G__7368
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__2.call(this, f, x);
      case 3:
        return fnil__3.call(this, f, x, y);
      case 4:
        return fnil__4.call(this, f, x, y, z)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  fnil.cljs$core$IFn$_invoke$arity$2 = fnil__2;
  fnil.cljs$core$IFn$_invoke$arity$3 = fnil__3;
  fnil.cljs$core$IFn$_invoke$arity$4 = fnil__4;
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi = function mapi(idx, coll__$1) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto__ = cljs.core.seq.call(null, coll__$1);
      if(temp__4092__auto__) {
        var s = temp__4092__auto__;
        if(cljs.core.chunked_seq_QMARK_.call(null, s)) {
          var c = cljs.core.chunk_first.call(null, s);
          var size = cljs.core.count.call(null, c);
          var b = cljs.core.chunk_buffer.call(null, size);
          var n__6699__auto___7371 = size;
          var i_7372 = 0;
          while(true) {
            if(i_7372 < n__6699__auto___7371) {
              cljs.core.chunk_append.call(null, b, f.call(null, idx + i_7372, cljs.core._nth.call(null, c, i_7372)));
              var G__7373 = i_7372 + 1;
              i_7372 = G__7373;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b), mapi.call(null, idx + size, cljs.core.chunk_rest.call(null, s)))
        }else {
          return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s)), mapi.call(null, idx + 1, cljs.core.rest.call(null, s)))
        }
      }else {
        return null
      }
    }, null)
  };
  return mapi.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__4092__auto__ = cljs.core.seq.call(null, coll);
    if(temp__4092__auto__) {
      var s = temp__4092__auto__;
      if(cljs.core.chunked_seq_QMARK_.call(null, s)) {
        var c = cljs.core.chunk_first.call(null, s);
        var size = cljs.core.count.call(null, c);
        var b = cljs.core.chunk_buffer.call(null, size);
        var n__6699__auto___7374 = size;
        var i_7375 = 0;
        while(true) {
          if(i_7375 < n__6699__auto___7374) {
            var x_7376 = f.call(null, cljs.core._nth.call(null, c, i_7375));
            if(x_7376 == null) {
            }else {
              cljs.core.chunk_append.call(null, b, x_7376)
            }
            var G__7377 = i_7375 + 1;
            i_7375 = G__7377;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b), keep.call(null, f, cljs.core.chunk_rest.call(null, s)))
      }else {
        var x = f.call(null, cljs.core.first.call(null, s));
        if(x == null) {
          return keep.call(null, f, cljs.core.rest.call(null, s))
        }else {
          return cljs.core.cons.call(null, x, keep.call(null, f, cljs.core.rest.call(null, s)))
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi = function keepi(idx, coll__$1) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto__ = cljs.core.seq.call(null, coll__$1);
      if(temp__4092__auto__) {
        var s = temp__4092__auto__;
        if(cljs.core.chunked_seq_QMARK_.call(null, s)) {
          var c = cljs.core.chunk_first.call(null, s);
          var size = cljs.core.count.call(null, c);
          var b = cljs.core.chunk_buffer.call(null, size);
          var n__6699__auto___7384 = size;
          var i_7385 = 0;
          while(true) {
            if(i_7385 < n__6699__auto___7384) {
              var x_7386 = f.call(null, idx + i_7385, cljs.core._nth.call(null, c, i_7385));
              if(x_7386 == null) {
              }else {
                cljs.core.chunk_append.call(null, b, x_7386)
              }
              var G__7387 = i_7385 + 1;
              i_7385 = G__7387;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b), keepi.call(null, idx + size, cljs.core.chunk_rest.call(null, s)))
        }else {
          var x = f.call(null, idx, cljs.core.first.call(null, s));
          if(x == null) {
            return keepi.call(null, idx + 1, cljs.core.rest.call(null, s))
          }else {
            return cljs.core.cons.call(null, x, keepi.call(null, idx + 1, cljs.core.rest.call(null, s)))
          }
        }
      }else {
        return null
      }
    }, null)
  };
  return keepi.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__1 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__0 = function() {
        return true
      };
      var ep1__1 = function(x) {
        return cljs.core.boolean$.call(null, p.call(null, x))
      };
      var ep1__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto__ = p.call(null, x);
          if(cljs.core.truth_(and__3941__auto__)) {
            return p.call(null, y)
          }else {
            return and__3941__auto__
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto__ = p.call(null, x);
          if(cljs.core.truth_(and__3941__auto__)) {
            var and__3941__auto____$1 = p.call(null, y);
            if(cljs.core.truth_(and__3941__auto____$1)) {
              return p.call(null, z)
            }else {
              return and__3941__auto____$1
            }
          }else {
            return and__3941__auto__
          }
        }())
      };
      var ep1__4 = function() {
        var G__7394__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3941__auto__ = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3941__auto__)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3941__auto__
            }
          }())
        };
        var G__7394 = function(x, y, z, var_args) {
          var args = null;
          if(arguments.length > 3) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7394__delegate.call(this, x, y, z, args)
        };
        G__7394.cljs$lang$maxFixedArity = 3;
        G__7394.cljs$lang$applyTo = function(arglist__7395) {
          var x = cljs.core.first(arglist__7395);
          arglist__7395 = cljs.core.next(arglist__7395);
          var y = cljs.core.first(arglist__7395);
          arglist__7395 = cljs.core.next(arglist__7395);
          var z = cljs.core.first(arglist__7395);
          var args = cljs.core.rest(arglist__7395);
          return G__7394__delegate(x, y, z, args)
        };
        G__7394.cljs$core$IFn$_invoke$arity$variadic = G__7394__delegate;
        return G__7394
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__0.call(this);
          case 1:
            return ep1__1.call(this, x);
          case 2:
            return ep1__2.call(this, x, y);
          case 3:
            return ep1__3.call(this, x, y, z);
          default:
            return ep1__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__4.cljs$lang$applyTo;
      ep1.cljs$core$IFn$_invoke$arity$0 = ep1__0;
      ep1.cljs$core$IFn$_invoke$arity$1 = ep1__1;
      ep1.cljs$core$IFn$_invoke$arity$2 = ep1__2;
      ep1.cljs$core$IFn$_invoke$arity$3 = ep1__3;
      ep1.cljs$core$IFn$_invoke$arity$variadic = ep1__4.cljs$core$IFn$_invoke$arity$variadic;
      return ep1
    }()
  };
  var every_pred__2 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__0 = function() {
        return true
      };
      var ep2__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto__ = p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto__)) {
            return p2.call(null, x)
          }else {
            return and__3941__auto__
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto__ = p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto__)) {
            var and__3941__auto____$1 = p1.call(null, y);
            if(cljs.core.truth_(and__3941__auto____$1)) {
              var and__3941__auto____$2 = p2.call(null, x);
              if(cljs.core.truth_(and__3941__auto____$2)) {
                return p2.call(null, y)
              }else {
                return and__3941__auto____$2
              }
            }else {
              return and__3941__auto____$1
            }
          }else {
            return and__3941__auto__
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto__ = p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto__)) {
            var and__3941__auto____$1 = p1.call(null, y);
            if(cljs.core.truth_(and__3941__auto____$1)) {
              var and__3941__auto____$2 = p1.call(null, z);
              if(cljs.core.truth_(and__3941__auto____$2)) {
                var and__3941__auto____$3 = p2.call(null, x);
                if(cljs.core.truth_(and__3941__auto____$3)) {
                  var and__3941__auto____$4 = p2.call(null, y);
                  if(cljs.core.truth_(and__3941__auto____$4)) {
                    return p2.call(null, z)
                  }else {
                    return and__3941__auto____$4
                  }
                }else {
                  return and__3941__auto____$3
                }
              }else {
                return and__3941__auto____$2
              }
            }else {
              return and__3941__auto____$1
            }
          }else {
            return and__3941__auto__
          }
        }())
      };
      var ep2__4 = function() {
        var G__7396__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3941__auto__ = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3941__auto__)) {
              return cljs.core.every_QMARK_.call(null, function(p1__7378_SHARP_) {
                var and__3941__auto____$1 = p1.call(null, p1__7378_SHARP_);
                if(cljs.core.truth_(and__3941__auto____$1)) {
                  return p2.call(null, p1__7378_SHARP_)
                }else {
                  return and__3941__auto____$1
                }
              }, args)
            }else {
              return and__3941__auto__
            }
          }())
        };
        var G__7396 = function(x, y, z, var_args) {
          var args = null;
          if(arguments.length > 3) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7396__delegate.call(this, x, y, z, args)
        };
        G__7396.cljs$lang$maxFixedArity = 3;
        G__7396.cljs$lang$applyTo = function(arglist__7397) {
          var x = cljs.core.first(arglist__7397);
          arglist__7397 = cljs.core.next(arglist__7397);
          var y = cljs.core.first(arglist__7397);
          arglist__7397 = cljs.core.next(arglist__7397);
          var z = cljs.core.first(arglist__7397);
          var args = cljs.core.rest(arglist__7397);
          return G__7396__delegate(x, y, z, args)
        };
        G__7396.cljs$core$IFn$_invoke$arity$variadic = G__7396__delegate;
        return G__7396
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__0.call(this);
          case 1:
            return ep2__1.call(this, x);
          case 2:
            return ep2__2.call(this, x, y);
          case 3:
            return ep2__3.call(this, x, y, z);
          default:
            return ep2__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__4.cljs$lang$applyTo;
      ep2.cljs$core$IFn$_invoke$arity$0 = ep2__0;
      ep2.cljs$core$IFn$_invoke$arity$1 = ep2__1;
      ep2.cljs$core$IFn$_invoke$arity$2 = ep2__2;
      ep2.cljs$core$IFn$_invoke$arity$3 = ep2__3;
      ep2.cljs$core$IFn$_invoke$arity$variadic = ep2__4.cljs$core$IFn$_invoke$arity$variadic;
      return ep2
    }()
  };
  var every_pred__3 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__0 = function() {
        return true
      };
      var ep3__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto__ = p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto__)) {
            var and__3941__auto____$1 = p2.call(null, x);
            if(cljs.core.truth_(and__3941__auto____$1)) {
              return p3.call(null, x)
            }else {
              return and__3941__auto____$1
            }
          }else {
            return and__3941__auto__
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto__ = p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto__)) {
            var and__3941__auto____$1 = p2.call(null, x);
            if(cljs.core.truth_(and__3941__auto____$1)) {
              var and__3941__auto____$2 = p3.call(null, x);
              if(cljs.core.truth_(and__3941__auto____$2)) {
                var and__3941__auto____$3 = p1.call(null, y);
                if(cljs.core.truth_(and__3941__auto____$3)) {
                  var and__3941__auto____$4 = p2.call(null, y);
                  if(cljs.core.truth_(and__3941__auto____$4)) {
                    return p3.call(null, y)
                  }else {
                    return and__3941__auto____$4
                  }
                }else {
                  return and__3941__auto____$3
                }
              }else {
                return and__3941__auto____$2
              }
            }else {
              return and__3941__auto____$1
            }
          }else {
            return and__3941__auto__
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto__ = p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto__)) {
            var and__3941__auto____$1 = p2.call(null, x);
            if(cljs.core.truth_(and__3941__auto____$1)) {
              var and__3941__auto____$2 = p3.call(null, x);
              if(cljs.core.truth_(and__3941__auto____$2)) {
                var and__3941__auto____$3 = p1.call(null, y);
                if(cljs.core.truth_(and__3941__auto____$3)) {
                  var and__3941__auto____$4 = p2.call(null, y);
                  if(cljs.core.truth_(and__3941__auto____$4)) {
                    var and__3941__auto____$5 = p3.call(null, y);
                    if(cljs.core.truth_(and__3941__auto____$5)) {
                      var and__3941__auto____$6 = p1.call(null, z);
                      if(cljs.core.truth_(and__3941__auto____$6)) {
                        var and__3941__auto____$7 = p2.call(null, z);
                        if(cljs.core.truth_(and__3941__auto____$7)) {
                          return p3.call(null, z)
                        }else {
                          return and__3941__auto____$7
                        }
                      }else {
                        return and__3941__auto____$6
                      }
                    }else {
                      return and__3941__auto____$5
                    }
                  }else {
                    return and__3941__auto____$4
                  }
                }else {
                  return and__3941__auto____$3
                }
              }else {
                return and__3941__auto____$2
              }
            }else {
              return and__3941__auto____$1
            }
          }else {
            return and__3941__auto__
          }
        }())
      };
      var ep3__4 = function() {
        var G__7398__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3941__auto__ = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3941__auto__)) {
              return cljs.core.every_QMARK_.call(null, function(p1__7379_SHARP_) {
                var and__3941__auto____$1 = p1.call(null, p1__7379_SHARP_);
                if(cljs.core.truth_(and__3941__auto____$1)) {
                  var and__3941__auto____$2 = p2.call(null, p1__7379_SHARP_);
                  if(cljs.core.truth_(and__3941__auto____$2)) {
                    return p3.call(null, p1__7379_SHARP_)
                  }else {
                    return and__3941__auto____$2
                  }
                }else {
                  return and__3941__auto____$1
                }
              }, args)
            }else {
              return and__3941__auto__
            }
          }())
        };
        var G__7398 = function(x, y, z, var_args) {
          var args = null;
          if(arguments.length > 3) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7398__delegate.call(this, x, y, z, args)
        };
        G__7398.cljs$lang$maxFixedArity = 3;
        G__7398.cljs$lang$applyTo = function(arglist__7399) {
          var x = cljs.core.first(arglist__7399);
          arglist__7399 = cljs.core.next(arglist__7399);
          var y = cljs.core.first(arglist__7399);
          arglist__7399 = cljs.core.next(arglist__7399);
          var z = cljs.core.first(arglist__7399);
          var args = cljs.core.rest(arglist__7399);
          return G__7398__delegate(x, y, z, args)
        };
        G__7398.cljs$core$IFn$_invoke$arity$variadic = G__7398__delegate;
        return G__7398
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__0.call(this);
          case 1:
            return ep3__1.call(this, x);
          case 2:
            return ep3__2.call(this, x, y);
          case 3:
            return ep3__3.call(this, x, y, z);
          default:
            return ep3__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__4.cljs$lang$applyTo;
      ep3.cljs$core$IFn$_invoke$arity$0 = ep3__0;
      ep3.cljs$core$IFn$_invoke$arity$1 = ep3__1;
      ep3.cljs$core$IFn$_invoke$arity$2 = ep3__2;
      ep3.cljs$core$IFn$_invoke$arity$3 = ep3__3;
      ep3.cljs$core$IFn$_invoke$arity$variadic = ep3__4.cljs$core$IFn$_invoke$arity$variadic;
      return ep3
    }()
  };
  var every_pred__4 = function() {
    var G__7400__delegate = function(p1, p2, p3, ps) {
      var ps__$1 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__7380_SHARP_) {
            return p1__7380_SHARP_.call(null, x)
          }, ps__$1)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__7381_SHARP_) {
            var and__3941__auto__ = p1__7381_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3941__auto__)) {
              return p1__7381_SHARP_.call(null, y)
            }else {
              return and__3941__auto__
            }
          }, ps__$1)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__7382_SHARP_) {
            var and__3941__auto__ = p1__7382_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3941__auto__)) {
              var and__3941__auto____$1 = p1__7382_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3941__auto____$1)) {
                return p1__7382_SHARP_.call(null, z)
              }else {
                return and__3941__auto____$1
              }
            }else {
              return and__3941__auto__
            }
          }, ps__$1)
        };
        var epn__4 = function() {
          var G__7401__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3941__auto__ = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3941__auto__)) {
                return cljs.core.every_QMARK_.call(null, function(p1__7383_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__7383_SHARP_, args)
                }, ps__$1)
              }else {
                return and__3941__auto__
              }
            }())
          };
          var G__7401 = function(x, y, z, var_args) {
            var args = null;
            if(arguments.length > 3) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__7401__delegate.call(this, x, y, z, args)
          };
          G__7401.cljs$lang$maxFixedArity = 3;
          G__7401.cljs$lang$applyTo = function(arglist__7402) {
            var x = cljs.core.first(arglist__7402);
            arglist__7402 = cljs.core.next(arglist__7402);
            var y = cljs.core.first(arglist__7402);
            arglist__7402 = cljs.core.next(arglist__7402);
            var z = cljs.core.first(arglist__7402);
            var args = cljs.core.rest(arglist__7402);
            return G__7401__delegate(x, y, z, args)
          };
          G__7401.cljs$core$IFn$_invoke$arity$variadic = G__7401__delegate;
          return G__7401
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__0.call(this);
            case 1:
              return epn__1.call(this, x);
            case 2:
              return epn__2.call(this, x, y);
            case 3:
              return epn__3.call(this, x, y, z);
            default:
              return epn__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw new Error("Invalid arity: " + arguments.length);
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__4.cljs$lang$applyTo;
        epn.cljs$core$IFn$_invoke$arity$0 = epn__0;
        epn.cljs$core$IFn$_invoke$arity$1 = epn__1;
        epn.cljs$core$IFn$_invoke$arity$2 = epn__2;
        epn.cljs$core$IFn$_invoke$arity$3 = epn__3;
        epn.cljs$core$IFn$_invoke$arity$variadic = epn__4.cljs$core$IFn$_invoke$arity$variadic;
        return epn
      }()
    };
    var G__7400 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(arguments.length > 3) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7400__delegate.call(this, p1, p2, p3, ps)
    };
    G__7400.cljs$lang$maxFixedArity = 3;
    G__7400.cljs$lang$applyTo = function(arglist__7403) {
      var p1 = cljs.core.first(arglist__7403);
      arglist__7403 = cljs.core.next(arglist__7403);
      var p2 = cljs.core.first(arglist__7403);
      arglist__7403 = cljs.core.next(arglist__7403);
      var p3 = cljs.core.first(arglist__7403);
      var ps = cljs.core.rest(arglist__7403);
      return G__7400__delegate(p1, p2, p3, ps)
    };
    G__7400.cljs$core$IFn$_invoke$arity$variadic = G__7400__delegate;
    return G__7400
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__1.call(this, p1);
      case 2:
        return every_pred__2.call(this, p1, p2);
      case 3:
        return every_pred__3.call(this, p1, p2, p3);
      default:
        return every_pred__4.cljs$core$IFn$_invoke$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__4.cljs$lang$applyTo;
  every_pred.cljs$core$IFn$_invoke$arity$1 = every_pred__1;
  every_pred.cljs$core$IFn$_invoke$arity$2 = every_pred__2;
  every_pred.cljs$core$IFn$_invoke$arity$3 = every_pred__3;
  every_pred.cljs$core$IFn$_invoke$arity$variadic = every_pred__4.cljs$core$IFn$_invoke$arity$variadic;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__1 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__0 = function() {
        return null
      };
      var sp1__1 = function(x) {
        return p.call(null, x)
      };
      var sp1__2 = function(x, y) {
        var or__3943__auto__ = p.call(null, x);
        if(cljs.core.truth_(or__3943__auto__)) {
          return or__3943__auto__
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3943__auto__ = p.call(null, x);
        if(cljs.core.truth_(or__3943__auto__)) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = p.call(null, y);
          if(cljs.core.truth_(or__3943__auto____$1)) {
            return or__3943__auto____$1
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__7405__delegate = function(x, y, z, args) {
          var or__3943__auto__ = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3943__auto__)) {
            return or__3943__auto__
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__7405 = function(x, y, z, var_args) {
          var args = null;
          if(arguments.length > 3) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7405__delegate.call(this, x, y, z, args)
        };
        G__7405.cljs$lang$maxFixedArity = 3;
        G__7405.cljs$lang$applyTo = function(arglist__7406) {
          var x = cljs.core.first(arglist__7406);
          arglist__7406 = cljs.core.next(arglist__7406);
          var y = cljs.core.first(arglist__7406);
          arglist__7406 = cljs.core.next(arglist__7406);
          var z = cljs.core.first(arglist__7406);
          var args = cljs.core.rest(arglist__7406);
          return G__7405__delegate(x, y, z, args)
        };
        G__7405.cljs$core$IFn$_invoke$arity$variadic = G__7405__delegate;
        return G__7405
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__0.call(this);
          case 1:
            return sp1__1.call(this, x);
          case 2:
            return sp1__2.call(this, x, y);
          case 3:
            return sp1__3.call(this, x, y, z);
          default:
            return sp1__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__4.cljs$lang$applyTo;
      sp1.cljs$core$IFn$_invoke$arity$0 = sp1__0;
      sp1.cljs$core$IFn$_invoke$arity$1 = sp1__1;
      sp1.cljs$core$IFn$_invoke$arity$2 = sp1__2;
      sp1.cljs$core$IFn$_invoke$arity$3 = sp1__3;
      sp1.cljs$core$IFn$_invoke$arity$variadic = sp1__4.cljs$core$IFn$_invoke$arity$variadic;
      return sp1
    }()
  };
  var some_fn__2 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__0 = function() {
        return null
      };
      var sp2__1 = function(x) {
        var or__3943__auto__ = p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto__)) {
          return or__3943__auto__
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3943__auto__ = p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto__)) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = p1.call(null, y);
          if(cljs.core.truth_(or__3943__auto____$1)) {
            return or__3943__auto____$1
          }else {
            var or__3943__auto____$2 = p2.call(null, x);
            if(cljs.core.truth_(or__3943__auto____$2)) {
              return or__3943__auto____$2
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3943__auto__ = p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto__)) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = p1.call(null, y);
          if(cljs.core.truth_(or__3943__auto____$1)) {
            return or__3943__auto____$1
          }else {
            var or__3943__auto____$2 = p1.call(null, z);
            if(cljs.core.truth_(or__3943__auto____$2)) {
              return or__3943__auto____$2
            }else {
              var or__3943__auto____$3 = p2.call(null, x);
              if(cljs.core.truth_(or__3943__auto____$3)) {
                return or__3943__auto____$3
              }else {
                var or__3943__auto____$4 = p2.call(null, y);
                if(cljs.core.truth_(or__3943__auto____$4)) {
                  return or__3943__auto____$4
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__7407__delegate = function(x, y, z, args) {
          var or__3943__auto__ = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3943__auto__)) {
            return or__3943__auto__
          }else {
            return cljs.core.some.call(null, function(p1__7388_SHARP_) {
              var or__3943__auto____$1 = p1.call(null, p1__7388_SHARP_);
              if(cljs.core.truth_(or__3943__auto____$1)) {
                return or__3943__auto____$1
              }else {
                return p2.call(null, p1__7388_SHARP_)
              }
            }, args)
          }
        };
        var G__7407 = function(x, y, z, var_args) {
          var args = null;
          if(arguments.length > 3) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7407__delegate.call(this, x, y, z, args)
        };
        G__7407.cljs$lang$maxFixedArity = 3;
        G__7407.cljs$lang$applyTo = function(arglist__7408) {
          var x = cljs.core.first(arglist__7408);
          arglist__7408 = cljs.core.next(arglist__7408);
          var y = cljs.core.first(arglist__7408);
          arglist__7408 = cljs.core.next(arglist__7408);
          var z = cljs.core.first(arglist__7408);
          var args = cljs.core.rest(arglist__7408);
          return G__7407__delegate(x, y, z, args)
        };
        G__7407.cljs$core$IFn$_invoke$arity$variadic = G__7407__delegate;
        return G__7407
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__0.call(this);
          case 1:
            return sp2__1.call(this, x);
          case 2:
            return sp2__2.call(this, x, y);
          case 3:
            return sp2__3.call(this, x, y, z);
          default:
            return sp2__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__4.cljs$lang$applyTo;
      sp2.cljs$core$IFn$_invoke$arity$0 = sp2__0;
      sp2.cljs$core$IFn$_invoke$arity$1 = sp2__1;
      sp2.cljs$core$IFn$_invoke$arity$2 = sp2__2;
      sp2.cljs$core$IFn$_invoke$arity$3 = sp2__3;
      sp2.cljs$core$IFn$_invoke$arity$variadic = sp2__4.cljs$core$IFn$_invoke$arity$variadic;
      return sp2
    }()
  };
  var some_fn__3 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__0 = function() {
        return null
      };
      var sp3__1 = function(x) {
        var or__3943__auto__ = p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto__)) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = p2.call(null, x);
          if(cljs.core.truth_(or__3943__auto____$1)) {
            return or__3943__auto____$1
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3943__auto__ = p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto__)) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = p2.call(null, x);
          if(cljs.core.truth_(or__3943__auto____$1)) {
            return or__3943__auto____$1
          }else {
            var or__3943__auto____$2 = p3.call(null, x);
            if(cljs.core.truth_(or__3943__auto____$2)) {
              return or__3943__auto____$2
            }else {
              var or__3943__auto____$3 = p1.call(null, y);
              if(cljs.core.truth_(or__3943__auto____$3)) {
                return or__3943__auto____$3
              }else {
                var or__3943__auto____$4 = p2.call(null, y);
                if(cljs.core.truth_(or__3943__auto____$4)) {
                  return or__3943__auto____$4
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3943__auto__ = p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto__)) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = p2.call(null, x);
          if(cljs.core.truth_(or__3943__auto____$1)) {
            return or__3943__auto____$1
          }else {
            var or__3943__auto____$2 = p3.call(null, x);
            if(cljs.core.truth_(or__3943__auto____$2)) {
              return or__3943__auto____$2
            }else {
              var or__3943__auto____$3 = p1.call(null, y);
              if(cljs.core.truth_(or__3943__auto____$3)) {
                return or__3943__auto____$3
              }else {
                var or__3943__auto____$4 = p2.call(null, y);
                if(cljs.core.truth_(or__3943__auto____$4)) {
                  return or__3943__auto____$4
                }else {
                  var or__3943__auto____$5 = p3.call(null, y);
                  if(cljs.core.truth_(or__3943__auto____$5)) {
                    return or__3943__auto____$5
                  }else {
                    var or__3943__auto____$6 = p1.call(null, z);
                    if(cljs.core.truth_(or__3943__auto____$6)) {
                      return or__3943__auto____$6
                    }else {
                      var or__3943__auto____$7 = p2.call(null, z);
                      if(cljs.core.truth_(or__3943__auto____$7)) {
                        return or__3943__auto____$7
                      }else {
                        return p3.call(null, z)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
      var sp3__4 = function() {
        var G__7409__delegate = function(x, y, z, args) {
          var or__3943__auto__ = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3943__auto__)) {
            return or__3943__auto__
          }else {
            return cljs.core.some.call(null, function(p1__7389_SHARP_) {
              var or__3943__auto____$1 = p1.call(null, p1__7389_SHARP_);
              if(cljs.core.truth_(or__3943__auto____$1)) {
                return or__3943__auto____$1
              }else {
                var or__3943__auto____$2 = p2.call(null, p1__7389_SHARP_);
                if(cljs.core.truth_(or__3943__auto____$2)) {
                  return or__3943__auto____$2
                }else {
                  return p3.call(null, p1__7389_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__7409 = function(x, y, z, var_args) {
          var args = null;
          if(arguments.length > 3) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7409__delegate.call(this, x, y, z, args)
        };
        G__7409.cljs$lang$maxFixedArity = 3;
        G__7409.cljs$lang$applyTo = function(arglist__7410) {
          var x = cljs.core.first(arglist__7410);
          arglist__7410 = cljs.core.next(arglist__7410);
          var y = cljs.core.first(arglist__7410);
          arglist__7410 = cljs.core.next(arglist__7410);
          var z = cljs.core.first(arglist__7410);
          var args = cljs.core.rest(arglist__7410);
          return G__7409__delegate(x, y, z, args)
        };
        G__7409.cljs$core$IFn$_invoke$arity$variadic = G__7409__delegate;
        return G__7409
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__0.call(this);
          case 1:
            return sp3__1.call(this, x);
          case 2:
            return sp3__2.call(this, x, y);
          case 3:
            return sp3__3.call(this, x, y, z);
          default:
            return sp3__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__4.cljs$lang$applyTo;
      sp3.cljs$core$IFn$_invoke$arity$0 = sp3__0;
      sp3.cljs$core$IFn$_invoke$arity$1 = sp3__1;
      sp3.cljs$core$IFn$_invoke$arity$2 = sp3__2;
      sp3.cljs$core$IFn$_invoke$arity$3 = sp3__3;
      sp3.cljs$core$IFn$_invoke$arity$variadic = sp3__4.cljs$core$IFn$_invoke$arity$variadic;
      return sp3
    }()
  };
  var some_fn__4 = function() {
    var G__7411__delegate = function(p1, p2, p3, ps) {
      var ps__$1 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__7390_SHARP_) {
            return p1__7390_SHARP_.call(null, x)
          }, ps__$1)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__7391_SHARP_) {
            var or__3943__auto__ = p1__7391_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3943__auto__)) {
              return or__3943__auto__
            }else {
              return p1__7391_SHARP_.call(null, y)
            }
          }, ps__$1)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__7392_SHARP_) {
            var or__3943__auto__ = p1__7392_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3943__auto__)) {
              return or__3943__auto__
            }else {
              var or__3943__auto____$1 = p1__7392_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3943__auto____$1)) {
                return or__3943__auto____$1
              }else {
                return p1__7392_SHARP_.call(null, z)
              }
            }
          }, ps__$1)
        };
        var spn__4 = function() {
          var G__7412__delegate = function(x, y, z, args) {
            var or__3943__auto__ = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3943__auto__)) {
              return or__3943__auto__
            }else {
              return cljs.core.some.call(null, function(p1__7393_SHARP_) {
                return cljs.core.some.call(null, p1__7393_SHARP_, args)
              }, ps__$1)
            }
          };
          var G__7412 = function(x, y, z, var_args) {
            var args = null;
            if(arguments.length > 3) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__7412__delegate.call(this, x, y, z, args)
          };
          G__7412.cljs$lang$maxFixedArity = 3;
          G__7412.cljs$lang$applyTo = function(arglist__7413) {
            var x = cljs.core.first(arglist__7413);
            arglist__7413 = cljs.core.next(arglist__7413);
            var y = cljs.core.first(arglist__7413);
            arglist__7413 = cljs.core.next(arglist__7413);
            var z = cljs.core.first(arglist__7413);
            var args = cljs.core.rest(arglist__7413);
            return G__7412__delegate(x, y, z, args)
          };
          G__7412.cljs$core$IFn$_invoke$arity$variadic = G__7412__delegate;
          return G__7412
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__0.call(this);
            case 1:
              return spn__1.call(this, x);
            case 2:
              return spn__2.call(this, x, y);
            case 3:
              return spn__3.call(this, x, y, z);
            default:
              return spn__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw new Error("Invalid arity: " + arguments.length);
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__4.cljs$lang$applyTo;
        spn.cljs$core$IFn$_invoke$arity$0 = spn__0;
        spn.cljs$core$IFn$_invoke$arity$1 = spn__1;
        spn.cljs$core$IFn$_invoke$arity$2 = spn__2;
        spn.cljs$core$IFn$_invoke$arity$3 = spn__3;
        spn.cljs$core$IFn$_invoke$arity$variadic = spn__4.cljs$core$IFn$_invoke$arity$variadic;
        return spn
      }()
    };
    var G__7411 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(arguments.length > 3) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7411__delegate.call(this, p1, p2, p3, ps)
    };
    G__7411.cljs$lang$maxFixedArity = 3;
    G__7411.cljs$lang$applyTo = function(arglist__7414) {
      var p1 = cljs.core.first(arglist__7414);
      arglist__7414 = cljs.core.next(arglist__7414);
      var p2 = cljs.core.first(arglist__7414);
      arglist__7414 = cljs.core.next(arglist__7414);
      var p3 = cljs.core.first(arglist__7414);
      var ps = cljs.core.rest(arglist__7414);
      return G__7411__delegate(p1, p2, p3, ps)
    };
    G__7411.cljs$core$IFn$_invoke$arity$variadic = G__7411__delegate;
    return G__7411
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__1.call(this, p1);
      case 2:
        return some_fn__2.call(this, p1, p2);
      case 3:
        return some_fn__3.call(this, p1, p2, p3);
      default:
        return some_fn__4.cljs$core$IFn$_invoke$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__4.cljs$lang$applyTo;
  some_fn.cljs$core$IFn$_invoke$arity$1 = some_fn__1;
  some_fn.cljs$core$IFn$_invoke$arity$2 = some_fn__2;
  some_fn.cljs$core$IFn$_invoke$arity$3 = some_fn__3;
  some_fn.cljs$core$IFn$_invoke$arity$variadic = some_fn__4.cljs$core$IFn$_invoke$arity$variadic;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto__ = cljs.core.seq.call(null, coll);
      if(temp__4092__auto__) {
        var s = temp__4092__auto__;
        if(cljs.core.chunked_seq_QMARK_.call(null, s)) {
          var c = cljs.core.chunk_first.call(null, s);
          var size = cljs.core.count.call(null, c);
          var b = cljs.core.chunk_buffer.call(null, size);
          var n__6699__auto___7415 = size;
          var i_7416 = 0;
          while(true) {
            if(i_7416 < n__6699__auto___7415) {
              cljs.core.chunk_append.call(null, b, f.call(null, cljs.core._nth.call(null, c, i_7416)));
              var G__7417 = i_7416 + 1;
              i_7416 = G__7417;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b), map.call(null, f, cljs.core.chunk_rest.call(null, s)))
        }else {
          return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s)), map.call(null, f, cljs.core.rest.call(null, s)))
        }
      }else {
        return null
      }
    }, null)
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1 = cljs.core.seq.call(null, c1);
      var s2 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3941__auto__ = s1;
        if(and__3941__auto__) {
          return s2
        }else {
          return and__3941__auto__
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1), cljs.core.first.call(null, s2)), map.call(null, f, cljs.core.rest.call(null, s1), cljs.core.rest.call(null, s2)))
      }else {
        return null
      }
    }, null)
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1 = cljs.core.seq.call(null, c1);
      var s2 = cljs.core.seq.call(null, c2);
      var s3 = cljs.core.seq.call(null, c3);
      if(function() {
        var and__3941__auto__ = s1;
        if(and__3941__auto__) {
          var and__3941__auto____$1 = s2;
          if(and__3941__auto____$1) {
            return s3
          }else {
            return and__3941__auto____$1
          }
        }else {
          return and__3941__auto__
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1), cljs.core.first.call(null, s2), cljs.core.first.call(null, s3)), map.call(null, f, cljs.core.rest.call(null, s1), cljs.core.rest.call(null, s2), cljs.core.rest.call(null, s3)))
      }else {
        return null
      }
    }, null)
  };
  var map__5 = function() {
    var G__7418__delegate = function(f, c1, c2, c3, colls) {
      var step = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss), step.call(null, map.call(null, cljs.core.rest, ss)))
          }else {
            return null
          }
        }, null)
      };
      return map.call(null, function(p1__7404_SHARP_) {
        return cljs.core.apply.call(null, f, p1__7404_SHARP_)
      }, step.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__7418 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(arguments.length > 4) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__7418__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__7418.cljs$lang$maxFixedArity = 4;
    G__7418.cljs$lang$applyTo = function(arglist__7419) {
      var f = cljs.core.first(arglist__7419);
      arglist__7419 = cljs.core.next(arglist__7419);
      var c1 = cljs.core.first(arglist__7419);
      arglist__7419 = cljs.core.next(arglist__7419);
      var c2 = cljs.core.first(arglist__7419);
      arglist__7419 = cljs.core.next(arglist__7419);
      var c3 = cljs.core.first(arglist__7419);
      var colls = cljs.core.rest(arglist__7419);
      return G__7418__delegate(f, c1, c2, c3, colls)
    };
    G__7418.cljs$core$IFn$_invoke$arity$variadic = G__7418__delegate;
    return G__7418
  }();
  map = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__2.call(this, f, c1);
      case 3:
        return map__3.call(this, f, c1, c2);
      case 4:
        return map__4.call(this, f, c1, c2, c3);
      default:
        return map__5.cljs$core$IFn$_invoke$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__5.cljs$lang$applyTo;
  map.cljs$core$IFn$_invoke$arity$2 = map__2;
  map.cljs$core$IFn$_invoke$arity$3 = map__3;
  map.cljs$core$IFn$_invoke$arity$4 = map__4;
  map.cljs$core$IFn$_invoke$arity$variadic = map__5.cljs$core$IFn$_invoke$arity$variadic;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    if(n > 0) {
      var temp__4092__auto__ = cljs.core.seq.call(null, coll);
      if(temp__4092__auto__) {
        var s = temp__4092__auto__;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s), take.call(null, n - 1, cljs.core.rest.call(null, s)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.drop = function drop(n, coll) {
  var step = function(n__$1, coll__$1) {
    while(true) {
      var s = cljs.core.seq.call(null, coll__$1);
      if(cljs.core.truth_(function() {
        var and__3941__auto__ = n__$1 > 0;
        if(and__3941__auto__) {
          return s
        }else {
          return and__3941__auto__
        }
      }())) {
        var G__7420 = n__$1 - 1;
        var G__7421 = cljs.core.rest.call(null, s);
        n__$1 = G__7420;
        coll__$1 = G__7421;
        continue
      }else {
        return s
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step.call(null, n, coll)
  }, null)
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__1 = function(s) {
    return drop_last.call(null, 1, s)
  };
  var drop_last__2 = function(n, s) {
    return cljs.core.map.call(null, function(x, _) {
      return x
    }, s, cljs.core.drop.call(null, n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__1.call(this, n);
      case 2:
        return drop_last__2.call(this, n, s)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  drop_last.cljs$core$IFn$_invoke$arity$1 = drop_last__1;
  drop_last.cljs$core$IFn$_invoke$arity$2 = drop_last__2;
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s = cljs.core.seq.call(null, coll);
  var lead = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(lead) {
      var G__7422 = cljs.core.next.call(null, s);
      var G__7423 = cljs.core.next.call(null, lead);
      s = G__7422;
      lead = G__7423;
      continue
    }else {
      return s
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step = function(pred__$1, coll__$1) {
    while(true) {
      var s = cljs.core.seq.call(null, coll__$1);
      if(cljs.core.truth_(function() {
        var and__3941__auto__ = s;
        if(and__3941__auto__) {
          return pred__$1.call(null, cljs.core.first.call(null, s))
        }else {
          return and__3941__auto__
        }
      }())) {
        var G__7424 = pred__$1;
        var G__7425 = cljs.core.rest.call(null, s);
        pred__$1 = G__7424;
        coll__$1 = G__7425;
        continue
      }else {
        return s
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step.call(null, pred, coll)
  }, null)
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__4092__auto__ = cljs.core.seq.call(null, coll);
    if(temp__4092__auto__) {
      var s = temp__4092__auto__;
      return cljs.core.concat.call(null, s, cycle.call(null, s))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_at = function split_at(n, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take.call(null, n, coll), cljs.core.drop.call(null, n, coll)], true)
};
cljs.core.repeat = function() {
  var repeat = null;
  var repeat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    }, null)
  };
  var repeat__2 = function(n, x) {
    return cljs.core.take.call(null, n, repeat.call(null, x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__1.call(this, n);
      case 2:
        return repeat__2.call(this, n, x)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  repeat.cljs$core$IFn$_invoke$arity$1 = repeat__1;
  repeat.cljs$core$IFn$_invoke$arity$2 = repeat__2;
  return repeat
}();
cljs.core.replicate = function replicate(n, x) {
  return cljs.core.take.call(null, n, cljs.core.repeat.call(null, x))
};
cljs.core.repeatedly = function() {
  var repeatedly = null;
  var repeatedly__1 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, f.call(null), repeatedly.call(null, f))
    }, null)
  };
  var repeatedly__2 = function(n, f) {
    return cljs.core.take.call(null, n, repeatedly.call(null, f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__1.call(this, n);
      case 2:
        return repeatedly__2.call(this, n, f)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  repeatedly.cljs$core$IFn$_invoke$arity$1 = repeatedly__1;
  repeatedly.cljs$core$IFn$_invoke$arity$2 = repeatedly__2;
  return repeatedly
}();
cljs.core.iterate = function iterate(f, x) {
  return cljs.core.cons.call(null, x, new cljs.core.LazySeq(null, false, function() {
    return iterate.call(null, f, f.call(null, x))
  }, null))
};
cljs.core.interleave = function() {
  var interleave = null;
  var interleave__2 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1 = cljs.core.seq.call(null, c1);
      var s2 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3941__auto__ = s1;
        if(and__3941__auto__) {
          return s2
        }else {
          return and__3941__auto__
        }
      }()) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1), cljs.core.cons.call(null, cljs.core.first.call(null, s2), interleave.call(null, cljs.core.rest.call(null, s1), cljs.core.rest.call(null, s2))))
      }else {
        return null
      }
    }, null)
  };
  var interleave__3 = function() {
    var G__7426__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss)))
        }else {
          return null
        }
      }, null)
    };
    var G__7426 = function(c1, c2, var_args) {
      var colls = null;
      if(arguments.length > 2) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7426__delegate.call(this, c1, c2, colls)
    };
    G__7426.cljs$lang$maxFixedArity = 2;
    G__7426.cljs$lang$applyTo = function(arglist__7427) {
      var c1 = cljs.core.first(arglist__7427);
      arglist__7427 = cljs.core.next(arglist__7427);
      var c2 = cljs.core.first(arglist__7427);
      var colls = cljs.core.rest(arglist__7427);
      return G__7426__delegate(c1, c2, colls)
    };
    G__7426.cljs$core$IFn$_invoke$arity$variadic = G__7426__delegate;
    return G__7426
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__2.call(this, c1, c2);
      default:
        return interleave__3.cljs$core$IFn$_invoke$arity$variadic(c1, c2, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__3.cljs$lang$applyTo;
  interleave.cljs$core$IFn$_invoke$arity$2 = interleave__2;
  interleave.cljs$core$IFn$_invoke$arity$variadic = interleave__3.cljs$core$IFn$_invoke$arity$variadic;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop.call(null, 1, cljs.core.interleave.call(null, cljs.core.repeat.call(null, sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat = function cat(coll, colls__$1) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4090__auto__ = cljs.core.seq.call(null, coll);
      if(temp__4090__auto__) {
        var coll__$1 = temp__4090__auto__;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__$1), cat.call(null, cljs.core.rest.call(null, coll__$1), colls__$1))
      }else {
        if(cljs.core.seq.call(null, colls__$1)) {
          return cat.call(null, cljs.core.first.call(null, colls__$1), cljs.core.rest.call(null, colls__$1))
        }else {
          return null
        }
      }
    }, null)
  };
  return cat.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__7428__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__7428 = function(f, coll, var_args) {
      var colls = null;
      if(arguments.length > 2) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7428__delegate.call(this, f, coll, colls)
    };
    G__7428.cljs$lang$maxFixedArity = 2;
    G__7428.cljs$lang$applyTo = function(arglist__7429) {
      var f = cljs.core.first(arglist__7429);
      arglist__7429 = cljs.core.next(arglist__7429);
      var coll = cljs.core.first(arglist__7429);
      var colls = cljs.core.rest(arglist__7429);
      return G__7428__delegate(f, coll, colls)
    };
    G__7428.cljs$core$IFn$_invoke$arity$variadic = G__7428__delegate;
    return G__7428
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__2.call(this, f, coll);
      default:
        return mapcat__3.cljs$core$IFn$_invoke$arity$variadic(f, coll, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__3.cljs$lang$applyTo;
  mapcat.cljs$core$IFn$_invoke$arity$2 = mapcat__2;
  mapcat.cljs$core$IFn$_invoke$arity$variadic = mapcat__3.cljs$core$IFn$_invoke$arity$variadic;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__4092__auto__ = cljs.core.seq.call(null, coll);
    if(temp__4092__auto__) {
      var s = temp__4092__auto__;
      if(cljs.core.chunked_seq_QMARK_.call(null, s)) {
        var c = cljs.core.chunk_first.call(null, s);
        var size = cljs.core.count.call(null, c);
        var b = cljs.core.chunk_buffer.call(null, size);
        var n__6699__auto___7430 = size;
        var i_7431 = 0;
        while(true) {
          if(i_7431 < n__6699__auto___7430) {
            if(cljs.core.truth_(pred.call(null, cljs.core._nth.call(null, c, i_7431)))) {
              cljs.core.chunk_append.call(null, b, cljs.core._nth.call(null, c, i_7431))
            }else {
            }
            var G__7432 = i_7431 + 1;
            i_7431 = G__7432;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b), filter.call(null, pred, cljs.core.chunk_rest.call(null, s)))
      }else {
        var f = cljs.core.first.call(null, s);
        var r = cljs.core.rest.call(null, s);
        if(cljs.core.truth_(pred.call(null, f))) {
          return cljs.core.cons.call(null, f, filter.call(null, pred, r))
        }else {
          return filter.call(null, pred, r)
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.remove = function remove(pred, coll) {
  return cljs.core.filter.call(null, cljs.core.complement.call(null, pred), coll)
};
cljs.core.tree_seq = function tree_seq(branch_QMARK_, children, root) {
  var walk = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    }, null)
  };
  return walk.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__7433_SHARP_) {
    return!cljs.core.sequential_QMARK_.call(null, p1__7433_SHARP_)
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(!(to == null)) {
    if(function() {
      var G__7435 = to;
      if(G__7435) {
        if(function() {
          var or__3943__auto__ = G__7435.cljs$lang$protocol_mask$partition1$ & 4;
          if(or__3943__auto__) {
            return or__3943__auto__
          }else {
            return G__7435.cljs$core$IEditableCollection$
          }
        }()) {
          return true
        }else {
          return false
        }
      }else {
        return false
      }
    }()) {
      return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core.transient$.call(null, to), from))
    }else {
      return cljs.core.reduce.call(null, cljs.core._conj, to, from)
    }
  }else {
    return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, from)
  }
};
cljs.core.mapv = function() {
  var mapv = null;
  var mapv__2 = function(f, coll) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
      return cljs.core.conj_BANG_.call(null, v, f.call(null, o))
    }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
  };
  var mapv__3 = function(f, c1, c2) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2))
  };
  var mapv__4 = function(f, c1, c2, c3) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2, c3))
  };
  var mapv__5 = function() {
    var G__7436__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__7436 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(arguments.length > 4) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__7436__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__7436.cljs$lang$maxFixedArity = 4;
    G__7436.cljs$lang$applyTo = function(arglist__7437) {
      var f = cljs.core.first(arglist__7437);
      arglist__7437 = cljs.core.next(arglist__7437);
      var c1 = cljs.core.first(arglist__7437);
      arglist__7437 = cljs.core.next(arglist__7437);
      var c2 = cljs.core.first(arglist__7437);
      arglist__7437 = cljs.core.next(arglist__7437);
      var c3 = cljs.core.first(arglist__7437);
      var colls = cljs.core.rest(arglist__7437);
      return G__7436__delegate(f, c1, c2, c3, colls)
    };
    G__7436.cljs$core$IFn$_invoke$arity$variadic = G__7436__delegate;
    return G__7436
  }();
  mapv = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapv__2.call(this, f, c1);
      case 3:
        return mapv__3.call(this, f, c1, c2);
      case 4:
        return mapv__4.call(this, f, c1, c2, c3);
      default:
        return mapv__5.cljs$core$IFn$_invoke$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  mapv.cljs$lang$maxFixedArity = 4;
  mapv.cljs$lang$applyTo = mapv__5.cljs$lang$applyTo;
  mapv.cljs$core$IFn$_invoke$arity$2 = mapv__2;
  mapv.cljs$core$IFn$_invoke$arity$3 = mapv__3;
  mapv.cljs$core$IFn$_invoke$arity$4 = mapv__4;
  mapv.cljs$core$IFn$_invoke$arity$variadic = mapv__5.cljs$core$IFn$_invoke$arity$variadic;
  return mapv
}();
cljs.core.filterv = function filterv(pred, coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
    if(cljs.core.truth_(pred.call(null, o))) {
      return cljs.core.conj_BANG_.call(null, v, o)
    }else {
      return v
    }
  }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.partition = function() {
  var partition = null;
  var partition__2 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto__ = cljs.core.seq.call(null, coll);
      if(temp__4092__auto__) {
        var s = temp__4092__auto__;
        var p = cljs.core.take.call(null, n, s);
        if(n === cljs.core.count.call(null, p)) {
          return cljs.core.cons.call(null, p, partition.call(null, n, step, cljs.core.drop.call(null, step, s)))
        }else {
          return null
        }
      }else {
        return null
      }
    }, null)
  };
  var partition__4 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto__ = cljs.core.seq.call(null, coll);
      if(temp__4092__auto__) {
        var s = temp__4092__auto__;
        var p = cljs.core.take.call(null, n, s);
        if(n === cljs.core.count.call(null, p)) {
          return cljs.core.cons.call(null, p, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p, pad)))
        }
      }else {
        return null
      }
    }, null)
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__2.call(this, n, step);
      case 3:
        return partition__3.call(this, n, step, pad);
      case 4:
        return partition__4.call(this, n, step, pad, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  partition.cljs$core$IFn$_invoke$arity$2 = partition__2;
  partition.cljs$core$IFn$_invoke$arity$3 = partition__3;
  partition.cljs$core$IFn$_invoke$arity$4 = partition__4;
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__2 = function(m, ks) {
    return get_in.call(null, m, ks, null)
  };
  var get_in__3 = function(m, ks, not_found) {
    var sentinel = cljs.core.lookup_sentinel;
    var m__$1 = m;
    var ks__$1 = cljs.core.seq.call(null, ks);
    while(true) {
      if(ks__$1) {
        if(!function() {
          var G__7439 = m__$1;
          if(G__7439) {
            if(function() {
              var or__3943__auto__ = G__7439.cljs$lang$protocol_mask$partition0$ & 256;
              if(or__3943__auto__) {
                return or__3943__auto__
              }else {
                return G__7439.cljs$core$ILookup$
              }
            }()) {
              return true
            }else {
              if(!G__7439.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.ILookup, G__7439)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.ILookup, G__7439)
          }
        }()) {
          return not_found
        }else {
          var m__$2 = cljs.core.get.call(null, m__$1, cljs.core.first.call(null, ks__$1), sentinel);
          if(sentinel === m__$2) {
            return not_found
          }else {
            var G__7440 = sentinel;
            var G__7441 = m__$2;
            var G__7442 = cljs.core.next.call(null, ks__$1);
            sentinel = G__7440;
            m__$1 = G__7441;
            ks__$1 = G__7442;
            continue
          }
        }
      }else {
        return m__$1
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__2.call(this, m, ks);
      case 3:
        return get_in__3.call(this, m, ks, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  get_in.cljs$core$IFn$_invoke$arity$2 = get_in__2;
  get_in.cljs$core$IFn$_invoke$arity$3 = get_in__3;
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__7443, v) {
  var vec__7445 = p__7443;
  var k = cljs.core.nth.call(null, vec__7445, 0, null);
  var ks = cljs.core.nthnext.call(null, vec__7445, 1);
  if(cljs.core.truth_(ks)) {
    return cljs.core.assoc.call(null, m, k, assoc_in.call(null, cljs.core.get.call(null, m, k), ks, v))
  }else {
    return cljs.core.assoc.call(null, m, k, v)
  }
};
cljs.core.update_in = function() {
  var update_in = null;
  var update_in__3 = function(m, p__7446, f) {
    var vec__7456 = p__7446;
    var k = cljs.core.nth.call(null, vec__7456, 0, null);
    var ks = cljs.core.nthnext.call(null, vec__7456, 1);
    if(cljs.core.truth_(ks)) {
      return cljs.core.assoc.call(null, m, k, update_in.call(null, cljs.core.get.call(null, m, k), ks, f))
    }else {
      return cljs.core.assoc.call(null, m, k, f.call(null, cljs.core.get.call(null, m, k)))
    }
  };
  var update_in__4 = function(m, p__7447, f, a) {
    var vec__7457 = p__7447;
    var k = cljs.core.nth.call(null, vec__7457, 0, null);
    var ks = cljs.core.nthnext.call(null, vec__7457, 1);
    if(cljs.core.truth_(ks)) {
      return cljs.core.assoc.call(null, m, k, update_in.call(null, cljs.core.get.call(null, m, k), ks, f, a))
    }else {
      return cljs.core.assoc.call(null, m, k, f.call(null, cljs.core.get.call(null, m, k), a))
    }
  };
  var update_in__5 = function(m, p__7448, f, a, b) {
    var vec__7458 = p__7448;
    var k = cljs.core.nth.call(null, vec__7458, 0, null);
    var ks = cljs.core.nthnext.call(null, vec__7458, 1);
    if(cljs.core.truth_(ks)) {
      return cljs.core.assoc.call(null, m, k, update_in.call(null, cljs.core.get.call(null, m, k), ks, f, a, b))
    }else {
      return cljs.core.assoc.call(null, m, k, f.call(null, cljs.core.get.call(null, m, k), a, b))
    }
  };
  var update_in__6 = function(m, p__7449, f, a, b, c) {
    var vec__7459 = p__7449;
    var k = cljs.core.nth.call(null, vec__7459, 0, null);
    var ks = cljs.core.nthnext.call(null, vec__7459, 1);
    if(cljs.core.truth_(ks)) {
      return cljs.core.assoc.call(null, m, k, update_in.call(null, cljs.core.get.call(null, m, k), ks, f, a, b, c))
    }else {
      return cljs.core.assoc.call(null, m, k, f.call(null, cljs.core.get.call(null, m, k), a, b, c))
    }
  };
  var update_in__7 = function() {
    var G__7461__delegate = function(m, p__7450, f, a, b, c, args) {
      var vec__7460 = p__7450;
      var k = cljs.core.nth.call(null, vec__7460, 0, null);
      var ks = cljs.core.nthnext.call(null, vec__7460, 1);
      if(cljs.core.truth_(ks)) {
        return cljs.core.assoc.call(null, m, k, cljs.core.apply.call(null, update_in, cljs.core.get.call(null, m, k), ks, f, a, b, c, args))
      }else {
        return cljs.core.assoc.call(null, m, k, cljs.core.apply.call(null, f, cljs.core.get.call(null, m, k), a, b, c, args))
      }
    };
    var G__7461 = function(m, p__7450, f, a, b, c, var_args) {
      var args = null;
      if(arguments.length > 6) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 6), 0)
      }
      return G__7461__delegate.call(this, m, p__7450, f, a, b, c, args)
    };
    G__7461.cljs$lang$maxFixedArity = 6;
    G__7461.cljs$lang$applyTo = function(arglist__7462) {
      var m = cljs.core.first(arglist__7462);
      arglist__7462 = cljs.core.next(arglist__7462);
      var p__7450 = cljs.core.first(arglist__7462);
      arglist__7462 = cljs.core.next(arglist__7462);
      var f = cljs.core.first(arglist__7462);
      arglist__7462 = cljs.core.next(arglist__7462);
      var a = cljs.core.first(arglist__7462);
      arglist__7462 = cljs.core.next(arglist__7462);
      var b = cljs.core.first(arglist__7462);
      arglist__7462 = cljs.core.next(arglist__7462);
      var c = cljs.core.first(arglist__7462);
      var args = cljs.core.rest(arglist__7462);
      return G__7461__delegate(m, p__7450, f, a, b, c, args)
    };
    G__7461.cljs$core$IFn$_invoke$arity$variadic = G__7461__delegate;
    return G__7461
  }();
  update_in = function(m, p__7450, f, a, b, c, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 3:
        return update_in__3.call(this, m, p__7450, f);
      case 4:
        return update_in__4.call(this, m, p__7450, f, a);
      case 5:
        return update_in__5.call(this, m, p__7450, f, a, b);
      case 6:
        return update_in__6.call(this, m, p__7450, f, a, b, c);
      default:
        return update_in__7.cljs$core$IFn$_invoke$arity$variadic(m, p__7450, f, a, b, c, cljs.core.array_seq(arguments, 6))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  update_in.cljs$lang$maxFixedArity = 6;
  update_in.cljs$lang$applyTo = update_in__7.cljs$lang$applyTo;
  update_in.cljs$core$IFn$_invoke$arity$3 = update_in__3;
  update_in.cljs$core$IFn$_invoke$arity$4 = update_in__4;
  update_in.cljs$core$IFn$_invoke$arity$5 = update_in__5;
  update_in.cljs$core$IFn$_invoke$arity$6 = update_in__6;
  update_in.cljs$core$IFn$_invoke$arity$variadic = update_in__7.cljs$core$IFn$_invoke$arity$variadic;
  return update_in
}();
goog.provide("cljs.core.VectorNode");
cljs.core.VectorNode = function(edit, arr) {
  this.edit = edit;
  this.arr = arr
};
cljs.core.VectorNode.cljs$lang$type = true;
cljs.core.VectorNode.cljs$lang$ctorStr = "cljs.core/VectorNode";
cljs.core.VectorNode.cljs$lang$ctorPrWriter = function(this__6464__auto__, writer__6465__auto__, opts__6466__auto__) {
  return cljs.core._write.call(null, writer__6465__auto__, "cljs.core/VectorNode")
};
cljs.core.pv_fresh_node = function pv_fresh_node(edit) {
  return new cljs.core.VectorNode(edit, new Array(32))
};
cljs.core.pv_aget = function pv_aget(node, idx) {
  return node.arr[idx]
};
cljs.core.pv_aset = function pv_aset(node, idx, val) {
  return node.arr[idx] = val
};
cljs.core.pv_clone_node = function pv_clone_node(node) {
  return new cljs.core.VectorNode(node.edit, node.arr.slice())
};
cljs.core.tail_off = function tail_off(pv) {
  var cnt = pv.cnt;
  if(cnt < 32) {
    return 0
  }else {
    return cnt - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll = level;
  var ret = node;
  while(true) {
    if(ll === 0) {
      return ret
    }else {
      var embed = ret;
      var r = cljs.core.pv_fresh_node.call(null, edit);
      var _ = cljs.core.pv_aset.call(null, r, 0, embed);
      var G__7463 = ll - 5;
      var G__7464 = r;
      ll = G__7463;
      ret = G__7464;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret = cljs.core.pv_clone_node.call(null, parent);
  var subidx = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret, subidx, tailnode);
    return ret
  }else {
    var child = cljs.core.pv_aget.call(null, parent, subidx);
    if(!(child == null)) {
      var node_to_insert = push_tail.call(null, pv, level - 5, child, tailnode);
      cljs.core.pv_aset.call(null, ret, subidx, node_to_insert);
      return ret
    }else {
      var node_to_insert = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret, subidx, node_to_insert);
      return ret
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3941__auto__ = 0 <= i;
    if(and__3941__auto__) {
      return i < pv.cnt
    }else {
      return and__3941__auto__
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node = pv.root;
      var level = pv.shift;
      while(true) {
        if(level > 0) {
          var G__7465 = cljs.core.pv_aget.call(null, node, i >>> level & 31);
          var G__7466 = level - 5;
          node = G__7465;
          level = G__7466;
          continue
        }else {
          return node.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret, i & 31, val);
    return ret
  }else {
    var subidx = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret, subidx, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx), i, val));
    return ret
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx));
    if(function() {
      var and__3941__auto__ = new_child == null;
      if(and__3941__auto__) {
        return subidx === 0
      }else {
        return and__3941__auto__
      }
    }()) {
      return null
    }else {
      var ret = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret, subidx, new_child);
      return ret
    }
  }else {
    if(subidx === 0) {
      return null
    }else {
      if("\ufdd0:else") {
        var ret = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret, subidx, null);
        return ret
      }else {
        return null
      }
    }
  }
};
goog.provide("cljs.core.PersistentVector");
cljs.core.PersistentVector = function(meta, cnt, shift, root, tail, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 4;
  this.cljs$lang$protocol_mask$partition0$ = 167668511
};
cljs.core.PersistentVector.cljs$lang$type = true;
cljs.core.PersistentVector.cljs$lang$ctorStr = "cljs.core/PersistentVector";
cljs.core.PersistentVector.cljs$lang$ctorPrWriter = function(this__6461__auto__, writer__6462__auto__, opt__6463__auto__) {
  return cljs.core._write.call(null, writer__6462__auto__, "cljs.core/PersistentVector")
};
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var self__ = this;
  return new cljs.core.TransientVector(self__.cnt, self__.shift, cljs.core.tv_editable_root.call(null, self__.root), cljs.core.tv_editable_tail.call(null, self__.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__6347__auto__ = self__.__hash;
  if(!(h__6347__auto__ == null)) {
    return h__6347__auto__
  }else {
    var h__6347__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__6347__auto____$1;
    return h__6347__auto____$1
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var self__ = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var self__ = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var self__ = this;
  if(function() {
    var and__3941__auto__ = 0 <= k;
    if(and__3941__auto__) {
      return k < self__.cnt
    }else {
      return and__3941__auto__
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail = self__.tail.slice();
      new_tail[k & 31] = v;
      return new cljs.core.PersistentVector(self__.meta, self__.cnt, self__.shift, self__.root, new_tail, null)
    }else {
      return new cljs.core.PersistentVector(self__.meta, self__.cnt, self__.shift, cljs.core.do_assoc.call(null, coll, self__.shift, self__.root, k, v), self__.tail, null)
    }
  }else {
    if(k === self__.cnt) {
      return coll.cljs$core$ICollection$_conj$arity$2(coll, v)
    }else {
      if("\ufdd0:else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(self__.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.call = function() {
  var G__7468 = null;
  var G__7468__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$2(coll, k)
  };
  var G__7468__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, not_found)
  };
  G__7468 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7468__2.call(this, self__, k);
      case 3:
        return G__7468__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__7468
}();
cljs.core.PersistentVector.prototype.apply = function(self__, args7467) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args7467.slice()))
};
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var self__ = this;
  var step_init = [0, init];
  var i = 0;
  while(true) {
    if(i < self__.cnt) {
      var arr = cljs.core.array_for.call(null, v, i);
      var len = arr.length;
      var init__$1 = function() {
        var j = 0;
        var init__$1 = step_init[1];
        while(true) {
          if(j < len) {
            var init__$2 = f.call(null, init__$1, j + i, arr[j]);
            if(cljs.core.reduced_QMARK_.call(null, init__$2)) {
              return init__$2
            }else {
              var G__7469 = j + 1;
              var G__7470 = init__$2;
              j = G__7469;
              init__$1 = G__7470;
              continue
            }
          }else {
            step_init[0] = len;
            step_init[1] = init__$1;
            return init__$1
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__$1)) {
        return cljs.core.deref.call(null, init__$1)
      }else {
        var G__7471 = i + step_init[0];
        i = G__7471;
        continue
      }
    }else {
      return step_init[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  if(self__.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail = self__.tail.slice();
    new_tail.push(o);
    return new cljs.core.PersistentVector(self__.meta, self__.cnt + 1, self__.shift, self__.root, new_tail, null)
  }else {
    var root_overflow_QMARK_ = self__.cnt >>> 5 > 1 << self__.shift;
    var new_shift = root_overflow_QMARK_ ? self__.shift + 5 : self__.shift;
    var new_root = root_overflow_QMARK_ ? function() {
      var n_r = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r, 0, self__.root);
      cljs.core.pv_aset.call(null, n_r, 1, cljs.core.new_path.call(null, null, self__.shift, new cljs.core.VectorNode(null, self__.tail)));
      return n_r
    }() : cljs.core.push_tail.call(null, coll, self__.shift, self__.root, new cljs.core.VectorNode(null, self__.tail));
    return new cljs.core.PersistentVector(self__.meta, self__.cnt + 1, new_shift, new_root, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var self__ = this;
  if(self__.cnt > 0) {
    return new cljs.core.RSeq(coll, self__.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var self__ = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var self__ = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var self__ = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var self__ = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  if(self__.cnt === 0) {
    return null
  }else {
    if(self__.cnt < 32) {
      return cljs.core.array_seq.call(null, self__.tail)
    }else {
      if("\ufdd0:else") {
        return cljs.core.chunked_seq.call(null, coll, 0, 0)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return self__.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var self__ = this;
  if(self__.cnt > 0) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, self__.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var self__ = this;
  if(self__.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === self__.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, self__.meta)
    }else {
      if(1 < self__.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(self__.meta, self__.cnt - 1, self__.shift, self__.root, self__.tail.slice(0, -1), null)
      }else {
        if("\ufdd0:else") {
          var new_tail = cljs.core.array_for.call(null, coll, self__.cnt - 2);
          var nr = cljs.core.pop_tail.call(null, coll, self__.shift, self__.root);
          var new_root = nr == null ? cljs.core.PersistentVector.EMPTY_NODE : nr;
          var cnt_1 = self__.cnt - 1;
          if(function() {
            var and__3941__auto__ = 5 < self__.shift;
            if(and__3941__auto__) {
              return cljs.core.pv_aget.call(null, new_root, 1) == null
            }else {
              return and__3941__auto__
            }
          }()) {
            return new cljs.core.PersistentVector(self__.meta, cnt_1, self__.shift - 5, cljs.core.pv_aget.call(null, new_root, 0), new_tail, null)
          }else {
            return new cljs.core.PersistentVector(self__.meta, cnt_1, self__.shift, new_root, new_tail, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var self__ = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.PersistentVector(meta__$1, self__.cnt, self__.shift, self__.root, self__.tail, self__.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var self__ = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var self__ = this;
  if(function() {
    var and__3941__auto__ = 0 <= n;
    if(and__3941__auto__) {
      return n < self__.cnt
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, self__.meta)
};
cljs.core.PersistentVector.EMPTY_NODE = new cljs.core.VectorNode(null, new Array(32));
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs, no_clone) {
  var l = xs.length;
  var xs__$1 = no_clone ? xs : xs.slice();
  if(l < 32) {
    return new cljs.core.PersistentVector(null, l, 5, cljs.core.PersistentVector.EMPTY_NODE, xs__$1, null)
  }else {
    var node = xs__$1.slice(0, 32);
    var v = new cljs.core.PersistentVector(null, 32, 5, cljs.core.PersistentVector.EMPTY_NODE, node, null);
    var i = 32;
    var out = cljs.core._as_transient.call(null, v);
    while(true) {
      if(i < l) {
        var G__7472 = i + 1;
        var G__7473 = cljs.core.conj_BANG_.call(null, out, xs__$1[i]);
        i = G__7472;
        out = G__7473;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out)
      }
      break
    }
  }
};
cljs.core.vec = function vec(coll) {
  return cljs.core._persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core._as_transient.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.vector = function() {
  var vector__delegate = function(args) {
    return cljs.core.vec.call(null, args)
  };
  var vector = function(var_args) {
    var args = null;
    if(arguments.length > 0) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return vector__delegate.call(this, args)
  };
  vector.cljs$lang$maxFixedArity = 0;
  vector.cljs$lang$applyTo = function(arglist__7474) {
    var args = cljs.core.seq(arglist__7474);
    return vector__delegate(args)
  };
  vector.cljs$core$IFn$_invoke$arity$variadic = vector__delegate;
  return vector
}();
goog.provide("cljs.core.ChunkedSeq");
cljs.core.ChunkedSeq = function(vec, node, i, off, meta, __hash) {
  this.vec = vec;
  this.node = node;
  this.i = i;
  this.off = off;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition0$ = 31719660;
  this.cljs$lang$protocol_mask$partition1$ = 1536
};
cljs.core.ChunkedSeq.cljs$lang$type = true;
cljs.core.ChunkedSeq.cljs$lang$ctorStr = "cljs.core/ChunkedSeq";
cljs.core.ChunkedSeq.cljs$lang$ctorPrWriter = function(this__6461__auto__, writer__6462__auto__, opt__6463__auto__) {
  return cljs.core._write.call(null, writer__6462__auto__, "cljs.core/ChunkedSeq")
};
cljs.core.ChunkedSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__6347__auto__ = self__.__hash;
  if(!(h__6347__auto__ == null)) {
    return h__6347__auto__
  }else {
    var h__6347__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__6347__auto____$1;
    return h__6347__auto____$1
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var self__ = this;
  if(self__.off + 1 < self__.node.length) {
    var s = cljs.core.chunked_seq.call(null, self__.vec, self__.node, self__.i, self__.off + 1);
    if(s == null) {
      return null
    }else {
      return s
    }
  }else {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ChunkedSeq.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return coll
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  return self__.node[self__.off]
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  if(self__.off + 1 < self__.node.length) {
    var s = cljs.core.chunked_seq.call(null, self__.vec, self__.node, self__.i, self__.off + 1);
    if(s == null) {
      return cljs.core.List.EMPTY
    }else {
      return s
    }
  }else {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var self__ = this;
  var l = self__.node.length;
  var s = self__.i + l < cljs.core._count.call(null, self__.vec) ? cljs.core.chunked_seq.call(null, self__.vec, self__.i + l, 0) : null;
  if(s == null) {
    return null
  }else {
    return s
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var self__ = this;
  return cljs.core.chunked_seq.call(null, self__.vec, self__.node, self__.i, self__.off, m)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, self__.meta)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.array_chunk.call(null, self__.node, self__.off)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var self__ = this;
  var l = self__.node.length;
  var s = self__.i + l < cljs.core._count.call(null, self__.vec) ? cljs.core.chunked_seq.call(null, self__.vec, self__.i + l, 0) : null;
  if(s == null) {
    return cljs.core.List.EMPTY
  }else {
    return s
  }
};
cljs.core.chunked_seq = function() {
  var chunked_seq = null;
  var chunked_seq__3 = function(vec, i, off) {
    return new cljs.core.ChunkedSeq(vec, cljs.core.array_for.call(null, vec, i), i, off, null, null)
  };
  var chunked_seq__4 = function(vec, node, i, off) {
    return new cljs.core.ChunkedSeq(vec, node, i, off, null, null)
  };
  var chunked_seq__5 = function(vec, node, i, off, meta) {
    return new cljs.core.ChunkedSeq(vec, node, i, off, meta, null)
  };
  chunked_seq = function(vec, node, i, off, meta) {
    switch(arguments.length) {
      case 3:
        return chunked_seq__3.call(this, vec, node, i);
      case 4:
        return chunked_seq__4.call(this, vec, node, i, off);
      case 5:
        return chunked_seq__5.call(this, vec, node, i, off, meta)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  chunked_seq.cljs$core$IFn$_invoke$arity$3 = chunked_seq__3;
  chunked_seq.cljs$core$IFn$_invoke$arity$4 = chunked_seq__4;
  chunked_seq.cljs$core$IFn$_invoke$arity$5 = chunked_seq__5;
  return chunked_seq
}();
goog.provide("cljs.core.Subvec");
cljs.core.Subvec = function(meta, v, start, end, __hash) {
  this.meta = meta;
  this.v = v;
  this.start = start;
  this.end = end;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Subvec.cljs$lang$type = true;
cljs.core.Subvec.cljs$lang$ctorStr = "cljs.core/Subvec";
cljs.core.Subvec.cljs$lang$ctorPrWriter = function(this__6461__auto__, writer__6462__auto__, opt__6463__auto__) {
  return cljs.core._write.call(null, writer__6462__auto__, "cljs.core/Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__6347__auto__ = self__.__hash;
  if(!(h__6347__auto__ == null)) {
    return h__6347__auto__
  }else {
    var h__6347__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__6347__auto____$1;
    return h__6347__auto____$1
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var self__ = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var self__ = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var self__ = this;
  var v_pos = self__.start + key;
  return cljs.core.build_subvec.call(null, self__.meta, cljs.core.assoc.call(null, self__.v, v_pos, val), self__.start, self__.end > v_pos + 1 ? self__.end : v_pos + 1, null)
};
cljs.core.Subvec.prototype.call = function() {
  var G__7476 = null;
  var G__7476__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$2(coll, k)
  };
  var G__7476__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, not_found)
  };
  G__7476 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7476__2.call(this, self__, k);
      case 3:
        return G__7476__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__7476
}();
cljs.core.Subvec.prototype.apply = function(self__, args7475) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args7475.slice()))
};
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return cljs.core.build_subvec.call(null, self__.meta, cljs.core._assoc_n.call(null, self__.v, self__.end, o), self__.start, self__.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var self__ = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start__$1) {
  var self__ = this;
  return cljs.core.ci_reduce.call(null, coll, f, start__$1)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  var subvec_seq = function subvec_seq(i) {
    if(i === self__.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, self__.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }, null))
    }
  };
  return subvec_seq.call(null, self__.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return self__.end - self__.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core._nth.call(null, self__.v, self__.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var self__ = this;
  if(self__.start === self__.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return cljs.core.build_subvec.call(null, self__.meta, self__.v, self__.start, self__.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var self__ = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return cljs.core.build_subvec.call(null, meta__$1, self__.v, self__.start, self__.end, self__.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var self__ = this;
  return cljs.core._nth.call(null, self__.v, self__.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var self__ = this;
  return cljs.core._nth.call(null, self__.v, self__.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, self__.meta)
};
cljs.core.build_subvec = function build_subvec(meta, v, start, end, __hash) {
  while(true) {
    if(v instanceof cljs.core.Subvec) {
      var G__7477 = meta;
      var G__7478 = v.v;
      var G__7479 = v.start + start;
      var G__7480 = v.start + end;
      var G__7481 = __hash;
      meta = G__7477;
      v = G__7478;
      start = G__7479;
      end = G__7480;
      __hash = G__7481;
      continue
    }else {
      var c = cljs.core.count.call(null, v);
      if(function() {
        var or__3943__auto__ = start < 0;
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = end < 0;
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            var or__3943__auto____$2 = start > c;
            if(or__3943__auto____$2) {
              return or__3943__auto____$2
            }else {
              return end > c
            }
          }
        }
      }()) {
        throw new Error("Index out of bounds");
      }else {
      }
      return new cljs.core.Subvec(meta, v, start, end, __hash)
    }
    break
  }
};
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__2 = function(v, start) {
    return subvec.call(null, v, start, cljs.core.count.call(null, v))
  };
  var subvec__3 = function(v, start, end) {
    return cljs.core.build_subvec.call(null, null, v, start, end, null)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__2.call(this, v, start);
      case 3:
        return subvec__3.call(this, v, start, end)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  subvec.cljs$core$IFn$_invoke$arity$2 = subvec__2;
  subvec.cljs$core$IFn$_invoke$arity$3 = subvec__3;
  return subvec
}();
cljs.core.tv_ensure_editable = function tv_ensure_editable(edit, node) {
  if(edit === node.edit) {
    return node
  }else {
    return new cljs.core.VectorNode(edit, node.arr.slice())
  }
};
cljs.core.tv_editable_root = function tv_editable_root(node) {
  return new cljs.core.VectorNode({}, node.arr.slice())
};
cljs.core.tv_editable_tail = function tv_editable_tail(tl) {
  var ret = new Array(32);
  cljs.core.array_copy.call(null, tl, 0, ret, 0, tl.length);
  return ret
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret, subidx, level === 5 ? tail_node : function() {
    var child = cljs.core.pv_aget.call(null, ret, subidx);
    if(!(child == null)) {
      return tv_push_tail.call(null, tv, level - 5, child, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__$1 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__$1, subidx));
    if(function() {
      var and__3941__auto__ = new_child == null;
      if(and__3941__auto__) {
        return subidx === 0
      }else {
        return and__3941__auto__
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__$1, subidx, new_child);
      return node__$1
    }
  }else {
    if(subidx === 0) {
      return null
    }else {
      if("\ufdd0:else") {
        cljs.core.pv_aset.call(null, node__$1, subidx, null);
        return node__$1
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3941__auto__ = 0 <= i;
    if(and__3941__auto__) {
      return i < tv.cnt
    }else {
      return and__3941__auto__
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root = tv.root;
      var node = root;
      var level = tv.shift;
      while(true) {
        if(level > 0) {
          var G__7482 = cljs.core.tv_ensure_editable.call(null, root.edit, cljs.core.pv_aget.call(null, node, i >>> level & 31));
          var G__7483 = level - 5;
          node = G__7482;
          level = G__7483;
          continue
        }else {
          return node.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in transient vector of length "), cljs.core.str(tv.cnt)].join(""));
  }
};
goog.provide("cljs.core.TransientVector");
cljs.core.TransientVector = function(cnt, shift, root, tail) {
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.cljs$lang$protocol_mask$partition0$ = 275;
  this.cljs$lang$protocol_mask$partition1$ = 88
};
cljs.core.TransientVector.cljs$lang$type = true;
cljs.core.TransientVector.cljs$lang$ctorStr = "cljs.core/TransientVector";
cljs.core.TransientVector.cljs$lang$ctorPrWriter = function(this__6461__auto__, writer__6462__auto__, opt__6463__auto__) {
  return cljs.core._write.call(null, writer__6462__auto__, "cljs.core/TransientVector")
};
cljs.core.TransientVector.prototype.call = function() {
  var G__7485 = null;
  var G__7485__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$2(coll, k)
  };
  var G__7485__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, not_found)
  };
  G__7485 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7485__2.call(this, self__, k);
      case 3:
        return G__7485__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__7485
}();
cljs.core.TransientVector.prototype.apply = function(self__, args7484) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args7484.slice()))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var self__ = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var self__ = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var self__ = this;
  if(self__.root.edit) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var self__ = this;
  if(function() {
    var and__3941__auto__ = 0 <= n;
    if(and__3941__auto__) {
      return n < self__.cnt
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  if(self__.root.edit) {
    return self__.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var self__ = this;
  if(self__.root.edit) {
    if(function() {
      var and__3941__auto__ = 0 <= n;
      if(and__3941__auto__) {
        return n < self__.cnt
      }else {
        return and__3941__auto__
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        self__.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root = function go(level, node) {
          var node__$1 = cljs.core.tv_ensure_editable.call(null, self__.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__$1, n & 31, val);
            return node__$1
          }else {
            var subidx = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__$1, subidx, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__$1, subidx)));
            return node__$1
          }
        }.call(null, self__.shift, self__.root);
        self__.root = new_root;
        return tcoll
      }
    }else {
      if(n === self__.cnt) {
        return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
      }else {
        if("\ufdd0:else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(self__.cnt)].join(""));
        }else {
          return null
        }
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_pop_BANG_$arity$1 = function(tcoll) {
  var self__ = this;
  if(self__.root.edit) {
    if(self__.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === self__.cnt) {
        self__.cnt = 0;
        return tcoll
      }else {
        if((self__.cnt - 1 & 31) > 0) {
          self__.cnt = self__.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0:else") {
            var new_tail = cljs.core.editable_array_for.call(null, tcoll, self__.cnt - 2);
            var new_root = function() {
              var nr = cljs.core.tv_pop_tail.call(null, tcoll, self__.shift, self__.root);
              if(!(nr == null)) {
                return nr
              }else {
                return new cljs.core.VectorNode(self__.root.edit, new Array(32))
              }
            }();
            if(function() {
              var and__3941__auto__ = 5 < self__.shift;
              if(and__3941__auto__) {
                return cljs.core.pv_aget.call(null, new_root, 1) == null
              }else {
                return and__3941__auto__
              }
            }()) {
              var new_root__$1 = cljs.core.tv_ensure_editable.call(null, self__.root.edit, cljs.core.pv_aget.call(null, new_root, 0));
              self__.root = new_root__$1;
              self__.shift = self__.shift - 5;
              self__.cnt = self__.cnt - 1;
              self__.tail = new_tail;
              return tcoll
            }else {
              self__.root = new_root;
              self__.cnt = self__.cnt - 1;
              self__.tail = new_tail;
              return tcoll
            }
          }else {
            return null
          }
        }
      }
    }
  }else {
    throw new Error("pop! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var self__ = this;
  return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var self__ = this;
  if(self__.root.edit) {
    if(self__.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      self__.tail[self__.cnt & 31] = o;
      self__.cnt = self__.cnt + 1;
      return tcoll
    }else {
      var tail_node = new cljs.core.VectorNode(self__.root.edit, self__.tail);
      var new_tail = new Array(32);
      new_tail[0] = o;
      self__.tail = new_tail;
      if(self__.cnt >>> 5 > 1 << self__.shift) {
        var new_root_array = new Array(32);
        var new_shift = self__.shift + 5;
        new_root_array[0] = self__.root;
        new_root_array[1] = cljs.core.new_path.call(null, self__.root.edit, self__.shift, tail_node);
        self__.root = new cljs.core.VectorNode(self__.root.edit, new_root_array);
        self__.shift = new_shift;
        self__.cnt = self__.cnt + 1;
        return tcoll
      }else {
        var new_root = cljs.core.tv_push_tail.call(null, tcoll, self__.shift, self__.root, tail_node);
        self__.root = new_root;
        self__.cnt = self__.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var self__ = this;
  if(self__.root.edit) {
    self__.root.edit = null;
    var len = self__.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail = new Array(len);
    cljs.core.array_copy.call(null, self__.tail, 0, trimmed_tail, 0, len);
    return new cljs.core.PersistentVector(null, self__.cnt, self__.shift, self__.root, trimmed_tail, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
goog.provide("cljs.core.PersistentQueueSeq");
cljs.core.PersistentQueueSeq = function(meta, front, rear, __hash) {
  this.meta = meta;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.PersistentQueueSeq.cljs$lang$type = true;
cljs.core.PersistentQueueSeq.cljs$lang$ctorStr = "cljs.core/PersistentQueueSeq";
cljs.core.PersistentQueueSeq.cljs$lang$ctorPrWriter = function(this__6461__auto__, writer__6462__auto__, opt__6463__auto__) {
  return cljs.core._write.call(null, writer__6462__auto__, "cljs.core/PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__6347__auto__ = self__.__hash;
  if(!(h__6347__auto__ == null)) {
    return h__6347__auto__
  }else {
    var h__6347__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__6347__auto____$1;
    return h__6347__auto____$1
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.first.call(null, self__.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  var temp__4090__auto__ = cljs.core.next.call(null, self__.front);
  if(temp__4090__auto__) {
    var f1 = temp__4090__auto__;
    return new cljs.core.PersistentQueueSeq(self__.meta, f1, self__.rear, null)
  }else {
    if(self__.rear == null) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      return new cljs.core.PersistentQueueSeq(self__.meta, self__.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.PersistentQueueSeq(meta__$1, self__.front, self__.rear, self__.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, self__.meta)
};
goog.provide("cljs.core.PersistentQueue");
cljs.core.PersistentQueue = function(meta, count, front, rear, __hash) {
  this.meta = meta;
  this.count = count;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31858766
};
cljs.core.PersistentQueue.cljs$lang$type = true;
cljs.core.PersistentQueue.cljs$lang$ctorStr = "cljs.core/PersistentQueue";
cljs.core.PersistentQueue.cljs$lang$ctorPrWriter = function(this__6461__auto__, writer__6462__auto__, opt__6463__auto__) {
  return cljs.core._write.call(null, writer__6462__auto__, "cljs.core/PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__6347__auto__ = self__.__hash;
  if(!(h__6347__auto__ == null)) {
    return h__6347__auto__
  }else {
    var h__6347__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__6347__auto____$1;
    return h__6347__auto____$1
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  if(cljs.core.truth_(self__.front)) {
    return new cljs.core.PersistentQueue(self__.meta, self__.count + 1, self__.front, cljs.core.conj.call(null, function() {
      var or__3943__auto__ = self__.rear;
      if(cljs.core.truth_(or__3943__auto__)) {
        return or__3943__auto__
      }else {
        return cljs.core.PersistentVector.EMPTY
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(self__.meta, self__.count + 1, cljs.core.conj.call(null, self__.front, o), cljs.core.PersistentVector.EMPTY, null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  var rear__$1 = cljs.core.seq.call(null, self__.rear);
  if(cljs.core.truth_(function() {
    var or__3943__auto__ = self__.front;
    if(cljs.core.truth_(or__3943__auto__)) {
      return or__3943__auto__
    }else {
      return rear__$1
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, self__.front, cljs.core.seq.call(null, rear__$1), null)
  }else {
    return null
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return self__.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.first.call(null, self__.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var self__ = this;
  if(cljs.core.truth_(self__.front)) {
    var temp__4090__auto__ = cljs.core.next.call(null, self__.front);
    if(temp__4090__auto__) {
      var f1 = temp__4090__auto__;
      return new cljs.core.PersistentQueue(self__.meta, self__.count - 1, f1, self__.rear, null)
    }else {
      return new cljs.core.PersistentQueue(self__.meta, self__.count - 1, cljs.core.seq.call(null, self__.rear), cljs.core.PersistentVector.EMPTY, null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.first.call(null, self__.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.PersistentQueue(meta__$1, self__.count, self__.front, self__.rear, self__.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.PersistentVector.EMPTY, 0);
goog.provide("cljs.core.NeverEquiv");
cljs.core.NeverEquiv = function() {
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2097152
};
cljs.core.NeverEquiv.cljs$lang$type = true;
cljs.core.NeverEquiv.cljs$lang$ctorStr = "cljs.core/NeverEquiv";
cljs.core.NeverEquiv.cljs$lang$ctorPrWriter = function(this__6461__auto__, writer__6462__auto__, opt__6463__auto__) {
  return cljs.core._write.call(null, writer__6462__auto__, "cljs.core/NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var self__ = this;
  return false
};
cljs.core.never_equiv = new cljs.core.NeverEquiv;
cljs.core.equiv_map = function equiv_map(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.map_QMARK_.call(null, y) ? cljs.core.count.call(null, x) === cljs.core.count.call(null, y) ? cljs.core.every_QMARK_.call(null, cljs.core.identity, cljs.core.map.call(null, function(xkv) {
    return cljs.core._EQ_.call(null, cljs.core.get.call(null, y, cljs.core.first.call(null, xkv), cljs.core.never_equiv), cljs.core.second.call(null, xkv))
  }, x)) : null : null)
};
cljs.core.scan_array = function scan_array(incr, k, array) {
  var len = array.length;
  var i = 0;
  while(true) {
    if(i < len) {
      if(k === array[i]) {
        return i
      }else {
        var G__7486 = i + incr;
        i = G__7486;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__$1 = cljs.core.hash.call(null, a);
  var b__$1 = cljs.core.hash.call(null, b);
  if(a__$1 < b__$1) {
    return-1
  }else {
    if(a__$1 > b__$1) {
      return 1
    }else {
      if("\ufdd0:else") {
        return 0
      }else {
        return null
      }
    }
  }
};
cljs.core.obj_map__GT_hash_map = function obj_map__GT_hash_map(m, k, v) {
  var ks = m.keys;
  var len = ks.length;
  var so = m.strobj;
  var mm = cljs.core.meta.call(null, m);
  var i = 0;
  var out = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i < len) {
      var k__$1 = ks[i];
      var G__7487 = i + 1;
      var G__7488 = cljs.core.assoc_BANG_.call(null, out, k__$1, so[k__$1]);
      i = G__7487;
      out = G__7488;
      continue
    }else {
      return cljs.core.with_meta.call(null, cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out, k, v)), mm)
    }
    break
  }
};
cljs.core.obj_clone = function obj_clone(obj, ks) {
  var new_obj = {};
  var l = ks.length;
  var i_7490 = 0;
  while(true) {
    if(i_7490 < l) {
      var k_7491 = ks[i_7490];
      new_obj[k_7491] = obj[k_7491];
      var G__7492 = i_7490 + 1;
      i_7490 = G__7492;
      continue
    }else {
    }
    break
  }
  return new_obj
};
goog.provide("cljs.core.ObjMap");
cljs.core.ObjMap = function(meta, keys, strobj, update_count, __hash) {
  this.meta = meta;
  this.keys = keys;
  this.strobj = strobj;
  this.update_count = update_count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 4;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.ObjMap.cljs$lang$type = true;
cljs.core.ObjMap.cljs$lang$ctorStr = "cljs.core/ObjMap";
cljs.core.ObjMap.cljs$lang$ctorPrWriter = function(this__6461__auto__, writer__6462__auto__, opt__6463__auto__) {
  return cljs.core._write.call(null, writer__6462__auto__, "cljs.core/ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__6347__auto__ = self__.__hash;
  if(!(h__6347__auto__ == null)) {
    return h__6347__auto__
  }else {
    var h__6347__auto____$1 = cljs.core.hash_imap.call(null, coll);
    self__.__hash = h__6347__auto____$1;
    return h__6347__auto____$1
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var self__ = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var self__ = this;
  if(function() {
    var and__3941__auto__ = goog.isString(k);
    if(and__3941__auto__) {
      return!(cljs.core.scan_array.call(null, 1, k, self__.keys) == null)
    }else {
      return and__3941__auto__
    }
  }()) {
    return self__.strobj[k]
  }else {
    return not_found
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var self__ = this;
  if(goog.isString(k)) {
    if(function() {
      var or__3943__auto__ = self__.update_count > cljs.core.ObjMap.HASHMAP_THRESHOLD;
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        return self__.keys.length >= cljs.core.ObjMap.HASHMAP_THRESHOLD
      }
    }()) {
      return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
    }else {
      if(!(cljs.core.scan_array.call(null, 1, k, self__.keys) == null)) {
        var new_strobj = cljs.core.obj_clone.call(null, self__.strobj, self__.keys);
        new_strobj[k] = v;
        return new cljs.core.ObjMap(self__.meta, self__.keys, new_strobj, self__.update_count + 1, null)
      }else {
        var new_strobj = cljs.core.obj_clone.call(null, self__.strobj, self__.keys);
        var new_keys = self__.keys.slice();
        new_strobj[k] = v;
        new_keys.push(k);
        return new cljs.core.ObjMap(self__.meta, new_keys, new_strobj, self__.update_count + 1, null)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var self__ = this;
  if(function() {
    var and__3941__auto__ = goog.isString(k);
    if(and__3941__auto__) {
      return!(cljs.core.scan_array.call(null, 1, k, self__.keys) == null)
    }else {
      return and__3941__auto__
    }
  }()) {
    return true
  }else {
    return false
  }
};
cljs.core.ObjMap.prototype.call = function() {
  var G__7494 = null;
  var G__7494__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$2(coll, k)
  };
  var G__7494__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, not_found)
  };
  G__7494 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7494__2.call(this, self__, k);
      case 3:
        return G__7494__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__7494
}();
cljs.core.ObjMap.prototype.apply = function(self__, args7493) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args7493.slice()))
};
cljs.core.ObjMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var self__ = this;
  var len = self__.keys.length;
  var keys__$1 = self__.keys.sort(cljs.core.obj_map_compare_keys);
  var init__$1 = init;
  while(true) {
    if(cljs.core.seq.call(null, keys__$1)) {
      var k = cljs.core.first.call(null, keys__$1);
      var init__$2 = f.call(null, init__$1, k, self__.strobj[k]);
      if(cljs.core.reduced_QMARK_.call(null, init__$2)) {
        return cljs.core.deref.call(null, init__$2)
      }else {
        var G__7495 = cljs.core.rest.call(null, keys__$1);
        var G__7496 = init__$2;
        keys__$1 = G__7495;
        init__$1 = G__7496;
        continue
      }
    }else {
      return init__$1
    }
    break
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var self__ = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  if(self__.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__7489_SHARP_) {
      return cljs.core.vector.call(null, p1__7489_SHARP_, self__.strobj[p1__7489_SHARP_])
    }, self__.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return self__.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.ObjMap(meta__$1, self__.keys, self__.strobj, self__.update_count, self__.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, self__.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var self__ = this;
  if(function() {
    var and__3941__auto__ = goog.isString(k);
    if(and__3941__auto__) {
      return!(cljs.core.scan_array.call(null, 1, k, self__.keys) == null)
    }else {
      return and__3941__auto__
    }
  }()) {
    var new_keys = self__.keys.slice();
    var new_strobj = cljs.core.obj_clone.call(null, self__.strobj, self__.keys);
    new_keys.splice(cljs.core.scan_array.call(null, 1, k, new_keys), 1);
    delete new_strobj[k];
    return new cljs.core.ObjMap(self__.meta, new_keys, new_strobj, self__.update_count + 1, null)
  }else {
    return coll
  }
};
cljs.core.ObjMap.EMPTY = new cljs.core.ObjMap(null, [], {}, 0, 0);
cljs.core.ObjMap.HASHMAP_THRESHOLD = 8;
cljs.core.ObjMap.fromObject = function(ks, obj) {
  return new cljs.core.ObjMap(null, ks, obj, 0, null)
};
cljs.core.array_map_index_of_nil_QMARK_ = function array_map_index_of_nil_QMARK_(arr, m, k) {
  var len = arr.length;
  var i = 0;
  while(true) {
    if(len <= i) {
      return-1
    }else {
      if(arr[i] == null) {
        return i
      }else {
        if("\ufdd0:else") {
          var G__7497 = i + 2;
          i = G__7497;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.array_map_index_of_symbol_QMARK_ = function array_map_index_of_symbol_QMARK_(arr, m, k) {
  var len = arr.length;
  var kstr = k.str;
  var i = 0;
  while(true) {
    if(len <= i) {
      return-1
    }else {
      if(function() {
        var k_SINGLEQUOTE_ = arr[i];
        var and__3941__auto__ = k_SINGLEQUOTE_ instanceof cljs.core.Symbol;
        if(and__3941__auto__) {
          return kstr === k_SINGLEQUOTE_.str
        }else {
          return and__3941__auto__
        }
      }()) {
        return i
      }else {
        if("\ufdd0:else") {
          var G__7498 = i + 2;
          i = G__7498;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.array_map_index_of_identical_QMARK_ = function array_map_index_of_identical_QMARK_(arr, m, k) {
  var len = arr.length;
  var i = 0;
  while(true) {
    if(len <= i) {
      return-1
    }else {
      if(k === arr[i]) {
        return i
      }else {
        if("\ufdd0:else") {
          var G__7499 = i + 2;
          i = G__7499;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.array_map_index_of_equiv_QMARK_ = function array_map_index_of_equiv_QMARK_(arr, m, k) {
  var len = arr.length;
  var i = 0;
  while(true) {
    if(len <= i) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, k, arr[i])) {
        return i
      }else {
        if("\ufdd0:else") {
          var G__7500 = i + 2;
          i = G__7500;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr = m.arr;
  if(function() {
    var or__3943__auto__ = goog.isString(k);
    if(or__3943__auto__) {
      return or__3943__auto__
    }else {
      return typeof k === "number"
    }
  }()) {
    return cljs.core.array_map_index_of_identical_QMARK_.call(null, arr, m, k)
  }else {
    if(k instanceof cljs.core.Symbol) {
      return cljs.core.array_map_index_of_symbol_QMARK_.call(null, arr, m, k)
    }else {
      if(k == null) {
        return cljs.core.array_map_index_of_nil_QMARK_.call(null, arr, m, k)
      }else {
        if("\ufdd0:else") {
          return cljs.core.array_map_index_of_equiv_QMARK_.call(null, arr, m, k)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.array_map_extend_kv = function array_map_extend_kv(m, k, v) {
  var arr = m.arr;
  var l = arr.length;
  var narr = new Array(l + 2);
  var i_7501 = 0;
  while(true) {
    if(i_7501 < l) {
      narr[i_7501] = arr[i_7501];
      var G__7502 = i_7501 + 1;
      i_7501 = G__7502;
      continue
    }else {
    }
    break
  }
  narr[l] = k;
  narr[l + 1] = v;
  return narr
};
goog.provide("cljs.core.PersistentArrayMap");
cljs.core.PersistentArrayMap = function(meta, cnt, arr, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.arr = arr;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 4;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentArrayMap.cljs$lang$type = true;
cljs.core.PersistentArrayMap.cljs$lang$ctorStr = "cljs.core/PersistentArrayMap";
cljs.core.PersistentArrayMap.cljs$lang$ctorPrWriter = function(this__6461__auto__, writer__6462__auto__, opt__6463__auto__) {
  return cljs.core._write.call(null, writer__6462__auto__, "cljs.core/PersistentArrayMap")
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var self__ = this;
  return new cljs.core.TransientArrayMap({}, self__.arr.length, self__.arr.slice())
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__6347__auto__ = self__.__hash;
  if(!(h__6347__auto__ == null)) {
    return h__6347__auto__
  }else {
    var h__6347__auto____$1 = cljs.core.hash_imap.call(null, coll);
    self__.__hash = h__6347__auto____$1;
    return h__6347__auto____$1
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var self__ = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var self__ = this;
  var idx = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx === -1) {
    return not_found
  }else {
    return self__.arr[idx + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var self__ = this;
  var idx = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx === -1) {
    if(self__.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      var arr__$1 = cljs.core.array_map_extend_kv.call(null, coll, k, v);
      return new cljs.core.PersistentArrayMap(self__.meta, self__.cnt + 1, arr__$1, null)
    }else {
      return cljs.core._with_meta.call(null, cljs.core._assoc.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll), k, v), self__.meta)
    }
  }else {
    if(v === self__.arr[idx + 1]) {
      return coll
    }else {
      if("\ufdd0:else") {
        var arr__$1 = function() {
          var G__7504 = self__.arr.slice();
          G__7504[idx + 1] = v;
          return G__7504
        }();
        return new cljs.core.PersistentArrayMap(self__.meta, self__.cnt, arr__$1, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var self__ = this;
  return!(cljs.core.array_map_index_of.call(null, coll, k) === -1)
};
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__7505 = null;
  var G__7505__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$2(coll, k)
  };
  var G__7505__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, not_found)
  };
  G__7505 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7505__2.call(this, self__, k);
      case 3:
        return G__7505__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__7505
}();
cljs.core.PersistentArrayMap.prototype.apply = function(self__, args7503) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args7503.slice()))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var self__ = this;
  var len = self__.arr.length;
  var i = 0;
  var init__$1 = init;
  while(true) {
    if(i < len) {
      var init__$2 = f.call(null, init__$1, self__.arr[i], self__.arr[i + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__$2)) {
        return cljs.core.deref.call(null, init__$2)
      }else {
        var G__7506 = i + 2;
        var G__7507 = init__$2;
        i = G__7506;
        init__$1 = G__7507;
        continue
      }
    }else {
      return init__$1
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var self__ = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  if(self__.cnt > 0) {
    var len = self__.arr.length;
    var array_map_seq = function(len) {
      return function array_map_seq(i) {
        return new cljs.core.LazySeq(null, false, function(len) {
          return function() {
            if(i < len) {
              return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([self__.arr[i], self__.arr[i + 1]], true), array_map_seq.call(null, i + 2))
            }else {
              return null
            }
          }
        }(len), null)
      }
    }(len);
    return array_map_seq.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return self__.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.PersistentArrayMap(meta__$1, self__.cnt, self__.arr, self__.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, self__.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var self__ = this;
  var idx = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx >= 0) {
    var len = self__.arr.length;
    var new_len = len - 2;
    if(new_len === 0) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      var new_arr = new Array(new_len);
      var s = 0;
      var d = 0;
      while(true) {
        if(s >= len) {
          return new cljs.core.PersistentArrayMap(self__.meta, self__.cnt - 1, new_arr, null)
        }else {
          if(cljs.core._EQ_.call(null, k, self__.arr[s])) {
            var G__7508 = s + 2;
            var G__7509 = d;
            s = G__7508;
            d = G__7509;
            continue
          }else {
            if("\ufdd0:else") {
              new_arr[d] = self__.arr[s];
              new_arr[d + 1] = self__.arr[s + 1];
              var G__7510 = s + 2;
              var G__7511 = d + 2;
              s = G__7510;
              d = G__7511;
              continue
            }else {
              return null
            }
          }
        }
        break
      }
    }
  }else {
    return coll
  }
};
cljs.core.PersistentArrayMap.EMPTY = new cljs.core.PersistentArrayMap(null, 0, [], null);
cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD = 8;
cljs.core.PersistentArrayMap.fromArray = function(arr, no_clone) {
  var arr__$1 = no_clone ? arr : arr.slice();
  var cnt = arr__$1.length / 2;
  return new cljs.core.PersistentArrayMap(null, cnt, arr__$1, null)
};
goog.provide("cljs.core.TransientArrayMap");
cljs.core.TransientArrayMap = function(editable_QMARK_, len, arr) {
  this.editable_QMARK_ = editable_QMARK_;
  this.len = len;
  this.arr = arr;
  this.cljs$lang$protocol_mask$partition1$ = 56;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientArrayMap.cljs$lang$type = true;
cljs.core.TransientArrayMap.cljs$lang$ctorStr = "cljs.core/TransientArrayMap";
cljs.core.TransientArrayMap.cljs$lang$ctorPrWriter = function(this__6461__auto__, writer__6462__auto__, opt__6463__auto__) {
  return cljs.core._write.call(null, writer__6462__auto__, "cljs.core/TransientArrayMap")
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var self__ = this;
  if(cljs.core.truth_(self__.editable_QMARK_)) {
    var idx = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx >= 0) {
      self__.arr[idx] = self__.arr[self__.len - 2];
      self__.arr[idx + 1] = self__.arr[self__.len - 1];
      var G__7512_7514 = self__.arr;
      G__7512_7514.pop();
      G__7512_7514.pop();
      self__.len = self__.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var self__ = this;
  if(cljs.core.truth_(self__.editable_QMARK_)) {
    var idx = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx === -1) {
      if(self__.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        self__.len = self__.len + 2;
        self__.arr.push(key);
        self__.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, self__.len, self__.arr), key, val)
      }
    }else {
      if(val === self__.arr[idx + 1]) {
        return tcoll
      }else {
        self__.arr[idx + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var self__ = this;
  if(cljs.core.truth_(self__.editable_QMARK_)) {
    if(function() {
      var G__7513 = o;
      if(G__7513) {
        if(function() {
          var or__3943__auto__ = G__7513.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3943__auto__) {
            return or__3943__auto__
          }else {
            return G__7513.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__7513.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__7513)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__7513)
      }
    }()) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es = cljs.core.seq.call(null, o);
      var tcoll__$1 = tcoll;
      while(true) {
        var temp__4090__auto__ = cljs.core.first.call(null, es);
        if(cljs.core.truth_(temp__4090__auto__)) {
          var e = temp__4090__auto__;
          var G__7515 = cljs.core.next.call(null, es);
          var G__7516 = tcoll__$1.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll__$1, cljs.core.key.call(null, e), cljs.core.val.call(null, e));
          es = G__7515;
          tcoll__$1 = G__7516;
          continue
        }else {
          return tcoll__$1
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var self__ = this;
  if(cljs.core.truth_(self__.editable_QMARK_)) {
    self__.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, self__.len, 2), self__.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var self__ = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var self__ = this;
  if(cljs.core.truth_(self__.editable_QMARK_)) {
    var idx = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx === -1) {
      return not_found
    }else {
      return self__.arr[idx + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var self__ = this;
  if(cljs.core.truth_(self__.editable_QMARK_)) {
    return cljs.core.quot.call(null, self__.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out = cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY);
  var i = 0;
  while(true) {
    if(i < len) {
      var G__7517 = cljs.core.assoc_BANG_.call(null, out, arr[i], arr[i + 1]);
      var G__7518 = i + 2;
      out = G__7517;
      i = G__7518;
      continue
    }else {
      return out
    }
    break
  }
};
goog.provide("cljs.core.Box");
cljs.core.Box = function(val) {
  this.val = val
};
cljs.core.Box.cljs$lang$type = true;
cljs.core.Box.cljs$lang$ctorStr = "cljs.core/Box";
cljs.core.Box.cljs$lang$ctorPrWriter = function(this__6464__auto__, writer__6465__auto__, opts__6466__auto__) {
  return cljs.core._write.call(null, writer__6465__auto__, "cljs.core/Box")
};
cljs.core.key_test = function key_test(key, other) {
  if(goog.isString(key)) {
    return key === other
  }else {
    return cljs.core._EQ_.call(null, key, other)
  }
};
cljs.core.mask = function mask(hash, shift) {
  return hash >>> shift & 31
};
cljs.core.clone_and_set = function() {
  var clone_and_set = null;
  var clone_and_set__3 = function(arr, i, a) {
    var G__7521 = arr.slice();
    G__7521[i] = a;
    return G__7521
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__7522 = arr.slice();
    G__7522[i] = a;
    G__7522[j] = b;
    return G__7522
  };
  clone_and_set = function(arr, i, a, j, b) {
    switch(arguments.length) {
      case 3:
        return clone_and_set__3.call(this, arr, i, a);
      case 5:
        return clone_and_set__5.call(this, arr, i, a, j, b)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  clone_and_set.cljs$core$IFn$_invoke$arity$3 = clone_and_set__3;
  clone_and_set.cljs$core$IFn$_invoke$arity$5 = clone_and_set__5;
  return clone_and_set
}();
cljs.core.remove_pair = function remove_pair(arr, i) {
  var new_arr = new Array(arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr, 2 * i, new_arr.length - 2 * i);
  return new_arr
};
cljs.core.bitmap_indexed_node_index = function bitmap_indexed_node_index(bitmap, bit) {
  return cljs.core.bit_count.call(null, bitmap & bit - 1)
};
cljs.core.bitpos = function bitpos(hash, shift) {
  return 1 << (hash >>> shift & 31)
};
cljs.core.edit_and_set = function() {
  var edit_and_set = null;
  var edit_and_set__4 = function(inode, edit, i, a) {
    var editable = inode.ensure_editable(edit);
    editable.arr[i] = a;
    return editable
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable = inode.ensure_editable(edit);
    editable.arr[i] = a;
    editable.arr[j] = b;
    return editable
  };
  edit_and_set = function(inode, edit, i, a, j, b) {
    switch(arguments.length) {
      case 4:
        return edit_and_set__4.call(this, inode, edit, i, a);
      case 6:
        return edit_and_set__6.call(this, inode, edit, i, a, j, b)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  edit_and_set.cljs$core$IFn$_invoke$arity$4 = edit_and_set__4;
  edit_and_set.cljs$core$IFn$_invoke$arity$6 = edit_and_set__6;
  return edit_and_set
}();
cljs.core.inode_kv_reduce = function inode_kv_reduce(arr, f, init) {
  var len = arr.length;
  var i = 0;
  var init__$1 = init;
  while(true) {
    if(i < len) {
      var init__$2 = function() {
        var k = arr[i];
        if(!(k == null)) {
          return f.call(null, init__$1, k, arr[i + 1])
        }else {
          var node = arr[i + 1];
          if(!(node == null)) {
            return node.kv_reduce(f, init__$1)
          }else {
            return init__$1
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__$2)) {
        return cljs.core.deref.call(null, init__$2)
      }else {
        var G__7523 = i + 2;
        var G__7524 = init__$2;
        i = G__7523;
        init__$1 = G__7524;
        continue
      }
    }else {
      return init__$1
    }
    break
  }
};
goog.provide("cljs.core.BitmapIndexedNode");
cljs.core.BitmapIndexedNode = function(edit, bitmap, arr) {
  this.edit = edit;
  this.bitmap = bitmap;
  this.arr = arr
};
cljs.core.BitmapIndexedNode.cljs$lang$type = true;
cljs.core.BitmapIndexedNode.cljs$lang$ctorStr = "cljs.core/BitmapIndexedNode";
cljs.core.BitmapIndexedNode.cljs$lang$ctorPrWriter = function(this__6461__auto__, writer__6462__auto__, opt__6463__auto__) {
  return cljs.core._write.call(null, writer__6462__auto__, "cljs.core/BitmapIndexedNode")
};
cljs.core.BitmapIndexedNode.prototype.edit_and_remove_pair = function(e, bit, i) {
  var self__ = this;
  var inode = this;
  if(self__.bitmap === bit) {
    return null
  }else {
    var editable = inode.ensure_editable(e);
    var earr = editable.arr;
    var len = earr.length;
    editable.bitmap = bit ^ editable.bitmap;
    cljs.core.array_copy.call(null, earr, 2 * (i + 1), earr, 2 * i, len - 2 * (i + 1));
    earr[len - 2] = null;
    earr[len - 1] = null;
    return editable
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit__$1, shift, hash, key, val, added_leaf_QMARK_) {
  var self__ = this;
  var inode = this;
  var bit = 1 << (hash >>> shift & 31);
  var idx = cljs.core.bitmap_indexed_node_index.call(null, self__.bitmap, bit);
  if((self__.bitmap & bit) === 0) {
    var n = cljs.core.bit_count.call(null, self__.bitmap);
    if(2 * n < self__.arr.length) {
      var editable = inode.ensure_editable(edit__$1);
      var earr = editable.arr;
      added_leaf_QMARK_.val = true;
      cljs.core.array_copy_downward.call(null, earr, 2 * idx, earr, 2 * (idx + 1), 2 * (n - idx));
      earr[2 * idx] = key;
      earr[2 * idx + 1] = val;
      editable.bitmap = editable.bitmap | bit;
      return editable
    }else {
      if(n >= 16) {
        var nodes = new Array(32);
        var jdx = hash >>> shift & 31;
        nodes[jdx] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit__$1, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i_7525 = 0;
        var j_7526 = 0;
        while(true) {
          if(i_7525 < 32) {
            if((self__.bitmap >>> i_7525 & 1) === 0) {
              var G__7527 = i_7525 + 1;
              var G__7528 = j_7526;
              i_7525 = G__7527;
              j_7526 = G__7528;
              continue
            }else {
              nodes[i_7525] = !(self__.arr[j_7526] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit__$1, shift + 5, cljs.core.hash.call(null, self__.arr[j_7526]), self__.arr[j_7526], self__.arr[j_7526 + 1], added_leaf_QMARK_) : self__.arr[j_7526 + 1];
              var G__7529 = i_7525 + 1;
              var G__7530 = j_7526 + 2;
              i_7525 = G__7529;
              j_7526 = G__7530;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit__$1, n + 1, nodes)
      }else {
        if("\ufdd0:else") {
          var new_arr = new Array(2 * (n + 4));
          cljs.core.array_copy.call(null, self__.arr, 0, new_arr, 0, 2 * idx);
          new_arr[2 * idx] = key;
          new_arr[2 * idx + 1] = val;
          cljs.core.array_copy.call(null, self__.arr, 2 * idx, new_arr, 2 * (idx + 1), 2 * (n - idx));
          added_leaf_QMARK_.val = true;
          var editable = inode.ensure_editable(edit__$1);
          editable.arr = new_arr;
          editable.bitmap = editable.bitmap | bit;
          return editable
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil = self__.arr[2 * idx];
    var val_or_node = self__.arr[2 * idx + 1];
    if(key_or_nil == null) {
      var n = val_or_node.inode_assoc_BANG_(edit__$1, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n === val_or_node) {
        return inode
      }else {
        return cljs.core.edit_and_set.call(null, inode, edit__$1, 2 * idx + 1, n)
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil)) {
        if(val === val_or_node) {
          return inode
        }else {
          return cljs.core.edit_and_set.call(null, inode, edit__$1, 2 * idx + 1, val)
        }
      }else {
        if("\ufdd0:else") {
          added_leaf_QMARK_.val = true;
          return cljs.core.edit_and_set.call(null, inode, edit__$1, 2 * idx, null, 2 * idx + 1, cljs.core.create_node.call(null, edit__$1, shift + 5, key_or_nil, val_or_node, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var self__ = this;
  var inode = this;
  return cljs.core.create_inode_seq.call(null, self__.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit__$1, shift, hash, key, removed_leaf_QMARK_) {
  var self__ = this;
  var inode = this;
  var bit = 1 << (hash >>> shift & 31);
  if((self__.bitmap & bit) === 0) {
    return inode
  }else {
    var idx = cljs.core.bitmap_indexed_node_index.call(null, self__.bitmap, bit);
    var key_or_nil = self__.arr[2 * idx];
    var val_or_node = self__.arr[2 * idx + 1];
    if(key_or_nil == null) {
      var n = val_or_node.inode_without_BANG_(edit__$1, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n === val_or_node) {
        return inode
      }else {
        if(!(n == null)) {
          return cljs.core.edit_and_set.call(null, inode, edit__$1, 2 * idx + 1, n)
        }else {
          if(self__.bitmap === bit) {
            return null
          }else {
            if("\ufdd0:else") {
              return inode.edit_and_remove_pair(edit__$1, bit, idx)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil)) {
        removed_leaf_QMARK_[0] = true;
        return inode.edit_and_remove_pair(edit__$1, bit, idx)
      }else {
        if("\ufdd0:else") {
          return inode
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var self__ = this;
  var inode = this;
  if(e === self__.edit) {
    return inode
  }else {
    var n = cljs.core.bit_count.call(null, self__.bitmap);
    var new_arr = new Array(n < 0 ? 4 : 2 * (n + 1));
    cljs.core.array_copy.call(null, self__.arr, 0, new_arr, 0, 2 * n);
    return new cljs.core.BitmapIndexedNode(e, self__.bitmap, new_arr)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var self__ = this;
  var inode = this;
  return cljs.core.inode_kv_reduce.call(null, self__.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var self__ = this;
  var inode = this;
  var bit = 1 << (hash >>> shift & 31);
  if((self__.bitmap & bit) === 0) {
    return not_found
  }else {
    var idx = cljs.core.bitmap_indexed_node_index.call(null, self__.bitmap, bit);
    var key_or_nil = self__.arr[2 * idx];
    var val_or_node = self__.arr[2 * idx + 1];
    if(key_or_nil == null) {
      return val_or_node.inode_find(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil)) {
        return cljs.core.PersistentVector.fromArray([key_or_nil, val_or_node], true)
      }else {
        if("\ufdd0:else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_without = function(shift, hash, key) {
  var self__ = this;
  var inode = this;
  var bit = 1 << (hash >>> shift & 31);
  if((self__.bitmap & bit) === 0) {
    return inode
  }else {
    var idx = cljs.core.bitmap_indexed_node_index.call(null, self__.bitmap, bit);
    var key_or_nil = self__.arr[2 * idx];
    var val_or_node = self__.arr[2 * idx + 1];
    if(key_or_nil == null) {
      var n = val_or_node.inode_without(shift + 5, hash, key);
      if(n === val_or_node) {
        return inode
      }else {
        if(!(n == null)) {
          return new cljs.core.BitmapIndexedNode(null, self__.bitmap, cljs.core.clone_and_set.call(null, self__.arr, 2 * idx + 1, n))
        }else {
          if(self__.bitmap === bit) {
            return null
          }else {
            if("\ufdd0:else") {
              return new cljs.core.BitmapIndexedNode(null, self__.bitmap ^ bit, cljs.core.remove_pair.call(null, self__.arr, idx))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil)) {
        return new cljs.core.BitmapIndexedNode(null, self__.bitmap ^ bit, cljs.core.remove_pair.call(null, self__.arr, idx))
      }else {
        if("\ufdd0:else") {
          return inode
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var self__ = this;
  var inode = this;
  var bit = 1 << (hash >>> shift & 31);
  var idx = cljs.core.bitmap_indexed_node_index.call(null, self__.bitmap, bit);
  if((self__.bitmap & bit) === 0) {
    var n = cljs.core.bit_count.call(null, self__.bitmap);
    if(n >= 16) {
      var nodes = new Array(32);
      var jdx = hash >>> shift & 31;
      nodes[jdx] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i_7531 = 0;
      var j_7532 = 0;
      while(true) {
        if(i_7531 < 32) {
          if((self__.bitmap >>> i_7531 & 1) === 0) {
            var G__7533 = i_7531 + 1;
            var G__7534 = j_7532;
            i_7531 = G__7533;
            j_7532 = G__7534;
            continue
          }else {
            nodes[i_7531] = !(self__.arr[j_7532] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, self__.arr[j_7532]), self__.arr[j_7532], self__.arr[j_7532 + 1], added_leaf_QMARK_) : self__.arr[j_7532 + 1];
            var G__7535 = i_7531 + 1;
            var G__7536 = j_7532 + 2;
            i_7531 = G__7535;
            j_7532 = G__7536;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n + 1, nodes)
    }else {
      var new_arr = new Array(2 * (n + 1));
      cljs.core.array_copy.call(null, self__.arr, 0, new_arr, 0, 2 * idx);
      new_arr[2 * idx] = key;
      new_arr[2 * idx + 1] = val;
      cljs.core.array_copy.call(null, self__.arr, 2 * idx, new_arr, 2 * (idx + 1), 2 * (n - idx));
      added_leaf_QMARK_.val = true;
      return new cljs.core.BitmapIndexedNode(null, self__.bitmap | bit, new_arr)
    }
  }else {
    var key_or_nil = self__.arr[2 * idx];
    var val_or_node = self__.arr[2 * idx + 1];
    if(key_or_nil == null) {
      var n = val_or_node.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n === val_or_node) {
        return inode
      }else {
        return new cljs.core.BitmapIndexedNode(null, self__.bitmap, cljs.core.clone_and_set.call(null, self__.arr, 2 * idx + 1, n))
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil)) {
        if(val === val_or_node) {
          return inode
        }else {
          return new cljs.core.BitmapIndexedNode(null, self__.bitmap, cljs.core.clone_and_set.call(null, self__.arr, 2 * idx + 1, val))
        }
      }else {
        if("\ufdd0:else") {
          added_leaf_QMARK_.val = true;
          return new cljs.core.BitmapIndexedNode(null, self__.bitmap, cljs.core.clone_and_set.call(null, self__.arr, 2 * idx, null, 2 * idx + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil, val_or_node, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var self__ = this;
  var inode = this;
  var bit = 1 << (hash >>> shift & 31);
  if((self__.bitmap & bit) === 0) {
    return not_found
  }else {
    var idx = cljs.core.bitmap_indexed_node_index.call(null, self__.bitmap, bit);
    var key_or_nil = self__.arr[2 * idx];
    var val_or_node = self__.arr[2 * idx + 1];
    if(key_or_nil == null) {
      return val_or_node.inode_lookup(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil)) {
        return val_or_node
      }else {
        if("\ufdd0:else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.EMPTY = new cljs.core.BitmapIndexedNode(null, 0, new Array(0));
cljs.core.pack_array_node = function pack_array_node(array_node, edit, idx) {
  var arr = array_node.arr;
  var len = 2 * (array_node.cnt - 1);
  var new_arr = new Array(len);
  var i = 0;
  var j = 1;
  var bitmap = 0;
  while(true) {
    if(i < len) {
      if(function() {
        var and__3941__auto__ = !(i === idx);
        if(and__3941__auto__) {
          return!(arr[i] == null)
        }else {
          return and__3941__auto__
        }
      }()) {
        new_arr[j] = arr[i];
        var G__7537 = i + 1;
        var G__7538 = j + 2;
        var G__7539 = bitmap | 1 << i;
        i = G__7537;
        j = G__7538;
        bitmap = G__7539;
        continue
      }else {
        var G__7540 = i + 1;
        var G__7541 = j;
        var G__7542 = bitmap;
        i = G__7540;
        j = G__7541;
        bitmap = G__7542;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap, new_arr)
    }
    break
  }
};
goog.provide("cljs.core.ArrayNode");
cljs.core.ArrayNode = function(edit, cnt, arr) {
  this.edit = edit;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.ArrayNode.cljs$lang$type = true;
cljs.core.ArrayNode.cljs$lang$ctorStr = "cljs.core/ArrayNode";
cljs.core.ArrayNode.cljs$lang$ctorPrWriter = function(this__6461__auto__, writer__6462__auto__, opt__6463__auto__) {
  return cljs.core._write.call(null, writer__6462__auto__, "cljs.core/ArrayNode")
};
cljs.core.ArrayNode.prototype.inode_assoc_BANG_ = function(edit__$1, shift, hash, key, val, added_leaf_QMARK_) {
  var self__ = this;
  var inode = this;
  var idx = hash >>> shift & 31;
  var node = self__.arr[idx];
  if(node == null) {
    var editable = cljs.core.edit_and_set.call(null, inode, edit__$1, idx, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit__$1, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable.cnt = editable.cnt + 1;
    return editable
  }else {
    var n = node.inode_assoc_BANG_(edit__$1, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n === node) {
      return inode
    }else {
      return cljs.core.edit_and_set.call(null, inode, edit__$1, idx, n)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var self__ = this;
  var inode = this;
  return cljs.core.create_array_node_seq.call(null, self__.arr)
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit__$1, shift, hash, key, removed_leaf_QMARK_) {
  var self__ = this;
  var inode = this;
  var idx = hash >>> shift & 31;
  var node = self__.arr[idx];
  if(node == null) {
    return inode
  }else {
    var n = node.inode_without_BANG_(edit__$1, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n === node) {
      return inode
    }else {
      if(n == null) {
        if(self__.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode, edit__$1, idx)
        }else {
          var editable = cljs.core.edit_and_set.call(null, inode, edit__$1, idx, n);
          editable.cnt = editable.cnt - 1;
          return editable
        }
      }else {
        if("\ufdd0:else") {
          return cljs.core.edit_and_set.call(null, inode, edit__$1, idx, n)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var self__ = this;
  var inode = this;
  if(e === self__.edit) {
    return inode
  }else {
    return new cljs.core.ArrayNode(e, self__.cnt, self__.arr.slice())
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var self__ = this;
  var inode = this;
  var len = self__.arr.length;
  var i = 0;
  var init__$1 = init;
  while(true) {
    if(i < len) {
      var node = self__.arr[i];
      if(!(node == null)) {
        var init__$2 = node.kv_reduce(f, init__$1);
        if(cljs.core.reduced_QMARK_.call(null, init__$2)) {
          return cljs.core.deref.call(null, init__$2)
        }else {
          var G__7543 = i + 1;
          var G__7544 = init__$2;
          i = G__7543;
          init__$1 = G__7544;
          continue
        }
      }else {
        var G__7545 = i + 1;
        var G__7546 = init__$1;
        i = G__7545;
        init__$1 = G__7546;
        continue
      }
    }else {
      return init__$1
    }
    break
  }
};
cljs.core.ArrayNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var self__ = this;
  var inode = this;
  var idx = hash >>> shift & 31;
  var node = self__.arr[idx];
  if(!(node == null)) {
    return node.inode_find(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var self__ = this;
  var inode = this;
  var idx = hash >>> shift & 31;
  var node = self__.arr[idx];
  if(!(node == null)) {
    var n = node.inode_without(shift + 5, hash, key);
    if(n === node) {
      return inode
    }else {
      if(n == null) {
        if(self__.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode, null, idx)
        }else {
          return new cljs.core.ArrayNode(null, self__.cnt - 1, cljs.core.clone_and_set.call(null, self__.arr, idx, n))
        }
      }else {
        if("\ufdd0:else") {
          return new cljs.core.ArrayNode(null, self__.cnt, cljs.core.clone_and_set.call(null, self__.arr, idx, n))
        }else {
          return null
        }
      }
    }
  }else {
    return inode
  }
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var self__ = this;
  var inode = this;
  var idx = hash >>> shift & 31;
  var node = self__.arr[idx];
  if(node == null) {
    return new cljs.core.ArrayNode(null, self__.cnt + 1, cljs.core.clone_and_set.call(null, self__.arr, idx, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n = node.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n === node) {
      return inode
    }else {
      return new cljs.core.ArrayNode(null, self__.cnt, cljs.core.clone_and_set.call(null, self__.arr, idx, n))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var self__ = this;
  var inode = this;
  var idx = hash >>> shift & 31;
  var node = self__.arr[idx];
  if(!(node == null)) {
    return node.inode_lookup(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim = 2 * cnt;
  var i = 0;
  while(true) {
    if(i < lim) {
      if(cljs.core.key_test.call(null, key, arr[i])) {
        return i
      }else {
        var G__7547 = i + 2;
        i = G__7547;
        continue
      }
    }else {
      return-1
    }
    break
  }
};
goog.provide("cljs.core.HashCollisionNode");
cljs.core.HashCollisionNode = function(edit, collision_hash, cnt, arr) {
  this.edit = edit;
  this.collision_hash = collision_hash;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.HashCollisionNode.cljs$lang$type = true;
cljs.core.HashCollisionNode.cljs$lang$ctorStr = "cljs.core/HashCollisionNode";
cljs.core.HashCollisionNode.cljs$lang$ctorPrWriter = function(this__6461__auto__, writer__6462__auto__, opt__6463__auto__) {
  return cljs.core._write.call(null, writer__6462__auto__, "cljs.core/HashCollisionNode")
};
cljs.core.HashCollisionNode.prototype.inode_assoc_BANG_ = function(edit__$1, shift, hash, key, val, added_leaf_QMARK_) {
  var self__ = this;
  var inode = this;
  if(hash === self__.collision_hash) {
    var idx = cljs.core.hash_collision_node_find_index.call(null, self__.arr, self__.cnt, key);
    if(idx === -1) {
      if(self__.arr.length > 2 * self__.cnt) {
        var editable = cljs.core.edit_and_set.call(null, inode, edit__$1, 2 * self__.cnt, key, 2 * self__.cnt + 1, val);
        added_leaf_QMARK_.val = true;
        editable.cnt = editable.cnt + 1;
        return editable
      }else {
        var len = self__.arr.length;
        var new_arr = new Array(len + 2);
        cljs.core.array_copy.call(null, self__.arr, 0, new_arr, 0, len);
        new_arr[len] = key;
        new_arr[len + 1] = val;
        added_leaf_QMARK_.val = true;
        return inode.ensure_editable_array(edit__$1, self__.cnt + 1, new_arr)
      }
    }else {
      if(self__.arr[idx + 1] === val) {
        return inode
      }else {
        return cljs.core.edit_and_set.call(null, inode, edit__$1, idx + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit__$1, 1 << (self__.collision_hash >>> shift & 31), [null, inode, null, null])).inode_assoc_BANG_(edit__$1, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var self__ = this;
  var inode = this;
  return cljs.core.create_inode_seq.call(null, self__.arr)
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit__$1, shift, hash, key, removed_leaf_QMARK_) {
  var self__ = this;
  var inode = this;
  var idx = cljs.core.hash_collision_node_find_index.call(null, self__.arr, self__.cnt, key);
  if(idx === -1) {
    return inode
  }else {
    removed_leaf_QMARK_[0] = true;
    if(self__.cnt === 1) {
      return null
    }else {
      var editable = inode.ensure_editable(edit__$1);
      var earr = editable.arr;
      earr[idx] = earr[2 * self__.cnt - 2];
      earr[idx + 1] = earr[2 * self__.cnt - 1];
      earr[2 * self__.cnt - 1] = null;
      earr[2 * self__.cnt - 2] = null;
      editable.cnt = editable.cnt - 1;
      return editable
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function(e) {
  var self__ = this;
  var inode = this;
  if(e === self__.edit) {
    return inode
  }else {
    var new_arr = new Array(2 * (self__.cnt + 1));
    cljs.core.array_copy.call(null, self__.arr, 0, new_arr, 0, 2 * self__.cnt);
    return new cljs.core.HashCollisionNode(e, self__.collision_hash, self__.cnt, new_arr)
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var self__ = this;
  var inode = this;
  return cljs.core.inode_kv_reduce.call(null, self__.arr, f, init)
};
cljs.core.HashCollisionNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var self__ = this;
  var inode = this;
  var idx = cljs.core.hash_collision_node_find_index.call(null, self__.arr, self__.cnt, key);
  if(idx < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, self__.arr[idx])) {
      return cljs.core.PersistentVector.fromArray([self__.arr[idx], self__.arr[idx + 1]], true)
    }else {
      if("\ufdd0:else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_without = function(shift, hash, key) {
  var self__ = this;
  var inode = this;
  var idx = cljs.core.hash_collision_node_find_index.call(null, self__.arr, self__.cnt, key);
  if(idx === -1) {
    return inode
  }else {
    if(self__.cnt === 1) {
      return null
    }else {
      if("\ufdd0:else") {
        return new cljs.core.HashCollisionNode(null, self__.collision_hash, self__.cnt - 1, cljs.core.remove_pair.call(null, self__.arr, cljs.core.quot.call(null, idx, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var self__ = this;
  var inode = this;
  if(hash === self__.collision_hash) {
    var idx = cljs.core.hash_collision_node_find_index.call(null, self__.arr, self__.cnt, key);
    if(idx === -1) {
      var len = self__.arr.length;
      var new_arr = new Array(len + 2);
      cljs.core.array_copy.call(null, self__.arr, 0, new_arr, 0, len);
      new_arr[len] = key;
      new_arr[len + 1] = val;
      added_leaf_QMARK_.val = true;
      return new cljs.core.HashCollisionNode(null, self__.collision_hash, self__.cnt + 1, new_arr)
    }else {
      if(cljs.core._EQ_.call(null, self__.arr[idx], val)) {
        return inode
      }else {
        return new cljs.core.HashCollisionNode(null, self__.collision_hash, self__.cnt, cljs.core.clone_and_set.call(null, self__.arr, idx + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (self__.collision_hash >>> shift & 31), [null, inode])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var self__ = this;
  var inode = this;
  var idx = cljs.core.hash_collision_node_find_index.call(null, self__.arr, self__.cnt, key);
  if(idx < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, self__.arr[idx])) {
      return self__.arr[idx + 1]
    }else {
      if("\ufdd0:else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable_array = function(e, count, array) {
  var self__ = this;
  var inode = this;
  if(e === self__.edit) {
    self__.arr = array;
    self__.cnt = count;
    return inode
  }else {
    return new cljs.core.HashCollisionNode(self__.edit, self__.collision_hash, count, array)
  }
};
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash = cljs.core.hash.call(null, key1);
    if(key1hash === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK_ = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash, key1, val1, added_leaf_QMARK_).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK_)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash = cljs.core.hash.call(null, key1);
    if(key1hash === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK_ = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash, key1, val1, added_leaf_QMARK_).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK_)
    }
  };
  create_node = function(edit, shift, key1, val1, key2hash, key2, val2) {
    switch(arguments.length) {
      case 6:
        return create_node__6.call(this, edit, shift, key1, val1, key2hash, key2);
      case 7:
        return create_node__7.call(this, edit, shift, key1, val1, key2hash, key2, val2)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  create_node.cljs$core$IFn$_invoke$arity$6 = create_node__6;
  create_node.cljs$core$IFn$_invoke$arity$7 = create_node__7;
  return create_node
}();
goog.provide("cljs.core.NodeSeq");
cljs.core.NodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.NodeSeq.cljs$lang$type = true;
cljs.core.NodeSeq.cljs$lang$ctorStr = "cljs.core/NodeSeq";
cljs.core.NodeSeq.cljs$lang$ctorPrWriter = function(this__6461__auto__, writer__6462__auto__, opt__6463__auto__) {
  return cljs.core._write.call(null, writer__6462__auto__, "cljs.core/NodeSeq")
};
cljs.core.NodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__6347__auto__ = self__.__hash;
  if(!(h__6347__auto__ == null)) {
    return h__6347__auto__
  }else {
    var h__6347__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__6347__auto____$1;
    return h__6347__auto____$1
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var self__ = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  if(self__.s == null) {
    return cljs.core.PersistentVector.fromArray([self__.nodes[self__.i], self__.nodes[self__.i + 1]], true)
  }else {
    return cljs.core.first.call(null, self__.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  if(self__.s == null) {
    return cljs.core.create_inode_seq.call(null, self__.nodes, self__.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, self__.nodes, self__.i, cljs.core.next.call(null, self__.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.NodeSeq(meta__$1, self__.nodes, self__.i, self__.s, self__.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, self__.meta)
};
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len = nodes.length;
      var j = i;
      while(true) {
        if(j < len) {
          if(!(nodes[j] == null)) {
            return new cljs.core.NodeSeq(null, nodes, j, null, null)
          }else {
            var temp__4090__auto__ = nodes[j + 1];
            if(cljs.core.truth_(temp__4090__auto__)) {
              var node = temp__4090__auto__;
              var temp__4090__auto____$1 = node.inode_seq();
              if(cljs.core.truth_(temp__4090__auto____$1)) {
                var node_seq = temp__4090__auto____$1;
                return new cljs.core.NodeSeq(null, nodes, j + 2, node_seq, null)
              }else {
                var G__7548 = j + 2;
                j = G__7548;
                continue
              }
            }else {
              var G__7549 = j + 2;
              j = G__7549;
              continue
            }
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.NodeSeq(null, nodes, i, s, null)
    }
  };
  create_inode_seq = function(nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_inode_seq__1.call(this, nodes);
      case 3:
        return create_inode_seq__3.call(this, nodes, i, s)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  create_inode_seq.cljs$core$IFn$_invoke$arity$1 = create_inode_seq__1;
  create_inode_seq.cljs$core$IFn$_invoke$arity$3 = create_inode_seq__3;
  return create_inode_seq
}();
goog.provide("cljs.core.ArrayNodeSeq");
cljs.core.ArrayNodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.ArrayNodeSeq.cljs$lang$type = true;
cljs.core.ArrayNodeSeq.cljs$lang$ctorStr = "cljs.core/ArrayNodeSeq";
cljs.core.ArrayNodeSeq.cljs$lang$ctorPrWriter = function(this__6461__auto__, writer__6462__auto__, opt__6463__auto__) {
  return cljs.core._write.call(null, writer__6462__auto__, "cljs.core/ArrayNodeSeq")
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__6347__auto__ = self__.__hash;
  if(!(h__6347__auto__ == null)) {
    return h__6347__auto__
  }else {
    var h__6347__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__6347__auto____$1;
    return h__6347__auto____$1
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var self__ = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.first.call(null, self__.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.create_array_node_seq.call(null, null, self__.nodes, self__.i, cljs.core.next.call(null, self__.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.ArrayNodeSeq(meta__$1, self__.nodes, self__.i, self__.s, self__.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, self__.meta)
};
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len = nodes.length;
      var j = i;
      while(true) {
        if(j < len) {
          var temp__4090__auto__ = nodes[j];
          if(cljs.core.truth_(temp__4090__auto__)) {
            var nj = temp__4090__auto__;
            var temp__4090__auto____$1 = nj.inode_seq();
            if(cljs.core.truth_(temp__4090__auto____$1)) {
              var ns = temp__4090__auto____$1;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j + 1, ns, null)
            }else {
              var G__7550 = j + 1;
              j = G__7550;
              continue
            }
          }else {
            var G__7551 = j + 1;
            j = G__7551;
            continue
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.ArrayNodeSeq(meta, nodes, i, s, null)
    }
  };
  create_array_node_seq = function(meta, nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_array_node_seq__1.call(this, meta);
      case 4:
        return create_array_node_seq__4.call(this, meta, nodes, i, s)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  create_array_node_seq.cljs$core$IFn$_invoke$arity$1 = create_array_node_seq__1;
  create_array_node_seq.cljs$core$IFn$_invoke$arity$4 = create_array_node_seq__4;
  return create_array_node_seq
}();
goog.provide("cljs.core.PersistentHashMap");
cljs.core.PersistentHashMap = function(meta, cnt, root, has_nil_QMARK_, nil_val, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.root = root;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 4;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentHashMap.cljs$lang$type = true;
cljs.core.PersistentHashMap.cljs$lang$ctorStr = "cljs.core/PersistentHashMap";
cljs.core.PersistentHashMap.cljs$lang$ctorPrWriter = function(this__6461__auto__, writer__6462__auto__, opt__6463__auto__) {
  return cljs.core._write.call(null, writer__6462__auto__, "cljs.core/PersistentHashMap")
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var self__ = this;
  return new cljs.core.TransientHashMap({}, self__.root, self__.cnt, self__.has_nil_QMARK_, self__.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__6347__auto__ = self__.__hash;
  if(!(h__6347__auto__ == null)) {
    return h__6347__auto__
  }else {
    var h__6347__auto____$1 = cljs.core.hash_imap.call(null, coll);
    self__.__hash = h__6347__auto____$1;
    return h__6347__auto____$1
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var self__ = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var self__ = this;
  if(k == null) {
    if(self__.has_nil_QMARK_) {
      return self__.nil_val
    }else {
      return not_found
    }
  }else {
    if(self__.root == null) {
      return not_found
    }else {
      if("\ufdd0:else") {
        return self__.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var self__ = this;
  if(k == null) {
    if(function() {
      var and__3941__auto__ = self__.has_nil_QMARK_;
      if(and__3941__auto__) {
        return v === self__.nil_val
      }else {
        return and__3941__auto__
      }
    }()) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(self__.meta, self__.has_nil_QMARK_ ? self__.cnt : self__.cnt + 1, self__.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK_ = new cljs.core.Box(false);
    var new_root = (self__.root == null ? cljs.core.BitmapIndexedNode.EMPTY : self__.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK_);
    if(new_root === self__.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(self__.meta, added_leaf_QMARK_.val ? self__.cnt + 1 : self__.cnt, new_root, self__.has_nil_QMARK_, self__.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var self__ = this;
  if(k == null) {
    return self__.has_nil_QMARK_
  }else {
    if(self__.root == null) {
      return false
    }else {
      if("\ufdd0:else") {
        return!(self__.root.inode_lookup(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__7553 = null;
  var G__7553__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$2(coll, k)
  };
  var G__7553__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, not_found)
  };
  G__7553 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7553__2.call(this, self__, k);
      case 3:
        return G__7553__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__7553
}();
cljs.core.PersistentHashMap.prototype.apply = function(self__, args7552) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args7552.slice()))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var self__ = this;
  var init__$1 = self__.has_nil_QMARK_ ? f.call(null, init, null, self__.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__$1)) {
    return cljs.core.deref.call(null, init__$1)
  }else {
    if(!(self__.root == null)) {
      return self__.root.kv_reduce(f, init__$1)
    }else {
      if("\ufdd0:else") {
        return init__$1
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var self__ = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  if(self__.cnt > 0) {
    var s = !(self__.root == null) ? self__.root.inode_seq() : null;
    if(self__.has_nil_QMARK_) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, self__.nil_val], true), s)
    }else {
      return s
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return self__.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.PersistentHashMap(meta__$1, self__.cnt, self__.root, self__.has_nil_QMARK_, self__.nil_val, self__.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, self__.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var self__ = this;
  if(k == null) {
    if(self__.has_nil_QMARK_) {
      return new cljs.core.PersistentHashMap(self__.meta, self__.cnt - 1, self__.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(self__.root == null) {
      return coll
    }else {
      if("\ufdd0:else") {
        var new_root = self__.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root === self__.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(self__.meta, self__.cnt - 1, new_root, self__.has_nil_QMARK_, self__.nil_val, null)
        }
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.EMPTY = new cljs.core.PersistentHashMap(null, 0, null, false, null, 0);
cljs.core.PersistentHashMap.fromArrays = function(ks, vs) {
  var len = ks.length;
  var i = 0;
  var out = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i < len) {
      var G__7554 = i + 1;
      var G__7555 = cljs.core.assoc_BANG_.call(null, out, ks[i], vs[i]);
      i = G__7554;
      out = G__7555;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out)
    }
    break
  }
};
goog.provide("cljs.core.TransientHashMap");
cljs.core.TransientHashMap = function(edit, root, count, has_nil_QMARK_, nil_val) {
  this.edit = edit;
  this.root = root;
  this.count = count;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.cljs$lang$protocol_mask$partition1$ = 56;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientHashMap.cljs$lang$type = true;
cljs.core.TransientHashMap.cljs$lang$ctorStr = "cljs.core/TransientHashMap";
cljs.core.TransientHashMap.cljs$lang$ctorPrWriter = function(this__6461__auto__, writer__6462__auto__, opt__6463__auto__) {
  return cljs.core._write.call(null, writer__6462__auto__, "cljs.core/TransientHashMap")
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var self__ = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var self__ = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var self__ = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var self__ = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var self__ = this;
  if(k == null) {
    if(self__.has_nil_QMARK_) {
      return self__.nil_val
    }else {
      return null
    }
  }else {
    if(self__.root == null) {
      return null
    }else {
      return self__.root.inode_lookup(0, cljs.core.hash.call(null, k), k)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var self__ = this;
  if(k == null) {
    if(self__.has_nil_QMARK_) {
      return self__.nil_val
    }else {
      return not_found
    }
  }else {
    if(self__.root == null) {
      return not_found
    }else {
      return self__.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  if(self__.edit) {
    return self__.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var self__ = this;
  var tcoll = this;
  if(self__.edit) {
    if(function() {
      var G__7556 = o;
      if(G__7556) {
        if(function() {
          var or__3943__auto__ = G__7556.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3943__auto__) {
            return or__3943__auto__
          }else {
            return G__7556.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__7556.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__7556)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__7556)
      }
    }()) {
      return tcoll.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es = cljs.core.seq.call(null, o);
      var tcoll__$1 = tcoll;
      while(true) {
        var temp__4090__auto__ = cljs.core.first.call(null, es);
        if(cljs.core.truth_(temp__4090__auto__)) {
          var e = temp__4090__auto__;
          var G__7557 = cljs.core.next.call(null, es);
          var G__7558 = tcoll__$1.assoc_BANG_(cljs.core.key.call(null, e), cljs.core.val.call(null, e));
          es = G__7557;
          tcoll__$1 = G__7558;
          continue
        }else {
          return tcoll__$1
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var self__ = this;
  var tcoll = this;
  if(self__.edit) {
    if(k == null) {
      if(self__.nil_val === v) {
      }else {
        self__.nil_val = v
      }
      if(self__.has_nil_QMARK_) {
      }else {
        self__.count = self__.count + 1;
        self__.has_nil_QMARK_ = true
      }
      return tcoll
    }else {
      var added_leaf_QMARK_ = new cljs.core.Box(false);
      var node = (self__.root == null ? cljs.core.BitmapIndexedNode.EMPTY : self__.root).inode_assoc_BANG_(self__.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK_);
      if(node === self__.root) {
      }else {
        self__.root = node
      }
      if(added_leaf_QMARK_.val) {
        self__.count = self__.count + 1
      }else {
      }
      return tcoll
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var self__ = this;
  var tcoll = this;
  if(self__.edit) {
    if(k == null) {
      if(self__.has_nil_QMARK_) {
        self__.has_nil_QMARK_ = false;
        self__.nil_val = null;
        self__.count = self__.count - 1;
        return tcoll
      }else {
        return tcoll
      }
    }else {
      if(self__.root == null) {
        return tcoll
      }else {
        var removed_leaf_QMARK_ = new cljs.core.Box(false);
        var node = self__.root.inode_without_BANG_(self__.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK_);
        if(node === self__.root) {
        }else {
          self__.root = node
        }
        if(cljs.core.truth_(removed_leaf_QMARK_[0])) {
          self__.count = self__.count - 1
        }else {
        }
        return tcoll
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var self__ = this;
  var tcoll = this;
  if(self__.edit) {
    self__.edit = null;
    return new cljs.core.PersistentHashMap(null, self__.count, self__.root, self__.has_nil_QMARK_, self__.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t = node;
  var stack__$1 = stack;
  while(true) {
    if(!(t == null)) {
      var G__7559 = ascending_QMARK_ ? t.left : t.right;
      var G__7560 = cljs.core.conj.call(null, stack__$1, t);
      t = G__7559;
      stack__$1 = G__7560;
      continue
    }else {
      return stack__$1
    }
    break
  }
};
goog.provide("cljs.core.PersistentTreeMapSeq");
cljs.core.PersistentTreeMapSeq = function(meta, stack, ascending_QMARK_, cnt, __hash) {
  this.meta = meta;
  this.stack = stack;
  this.ascending_QMARK_ = ascending_QMARK_;
  this.cnt = cnt;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850574
};
cljs.core.PersistentTreeMapSeq.cljs$lang$type = true;
cljs.core.PersistentTreeMapSeq.cljs$lang$ctorStr = "cljs.core/PersistentTreeMapSeq";
cljs.core.PersistentTreeMapSeq.cljs$lang$ctorPrWriter = function(this__6461__auto__, writer__6462__auto__, opt__6463__auto__) {
  return cljs.core._write.call(null, writer__6462__auto__, "cljs.core/PersistentTreeMapSeq")
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__6347__auto__ = self__.__hash;
  if(!(h__6347__auto__ == null)) {
    return h__6347__auto__
  }else {
    var h__6347__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__6347__auto____$1;
    return h__6347__auto____$1
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var self__ = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  if(self__.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return self__.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var self__ = this;
  return cljs.core.peek.call(null, self__.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var self__ = this;
  var t = cljs.core.first.call(null, self__.stack);
  var next_stack = cljs.core.tree_map_seq_push.call(null, self__.ascending_QMARK_ ? t.right : t.left, cljs.core.next.call(null, self__.stack), self__.ascending_QMARK_);
  if(!(next_stack == null)) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack, self__.ascending_QMARK_, self__.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.PersistentTreeMapSeq(meta__$1, self__.stack, self__.ascending_QMARK_, self__.cnt, self__.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, self__.meta)
};
cljs.core.create_tree_map_seq = function create_tree_map_seq(tree, ascending_QMARK_, cnt) {
  return new cljs.core.PersistentTreeMapSeq(null, cljs.core.tree_map_seq_push.call(null, tree, null, ascending_QMARK_), ascending_QMARK_, cnt, null)
};
cljs.core.balance_left = function balance_left(key, val, ins, right) {
  if(ins instanceof cljs.core.RedNode) {
    if(ins.left instanceof cljs.core.RedNode) {
      return new cljs.core.RedNode(ins.key, ins.val, ins.left.blacken(), new cljs.core.BlackNode(key, val, ins.right, right, null), null)
    }else {
      if(ins.right instanceof cljs.core.RedNode) {
        return new cljs.core.RedNode(ins.right.key, ins.right.val, new cljs.core.BlackNode(ins.key, ins.val, ins.left, ins.right.left, null), new cljs.core.BlackNode(key, val, ins.right.right, right, null), null)
      }else {
        if("\ufdd0:else") {
          return new cljs.core.BlackNode(key, val, ins, right, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, ins, right, null)
  }
};
cljs.core.balance_right = function balance_right(key, val, left, ins) {
  if(ins instanceof cljs.core.RedNode) {
    if(ins.right instanceof cljs.core.RedNode) {
      return new cljs.core.RedNode(ins.key, ins.val, new cljs.core.BlackNode(key, val, left, ins.left, null), ins.right.blacken(), null)
    }else {
      if(ins.left instanceof cljs.core.RedNode) {
        return new cljs.core.RedNode(ins.left.key, ins.left.val, new cljs.core.BlackNode(key, val, left, ins.left.left, null), new cljs.core.BlackNode(ins.key, ins.val, ins.left.right, ins.right, null), null)
      }else {
        if("\ufdd0:else") {
          return new cljs.core.BlackNode(key, val, left, ins, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, left, ins, null)
  }
};
cljs.core.balance_left_del = function balance_left_del(key, val, del, right) {
  if(del instanceof cljs.core.RedNode) {
    return new cljs.core.RedNode(key, val, del.blacken(), right, null)
  }else {
    if(right instanceof cljs.core.BlackNode) {
      return cljs.core.balance_right.call(null, key, val, del, right.redden())
    }else {
      if(function() {
        var and__3941__auto__ = right instanceof cljs.core.RedNode;
        if(and__3941__auto__) {
          return right.left instanceof cljs.core.BlackNode
        }else {
          return and__3941__auto__
        }
      }()) {
        return new cljs.core.RedNode(right.left.key, right.left.val, new cljs.core.BlackNode(key, val, del, right.left.left, null), cljs.core.balance_right.call(null, right.key, right.val, right.left.right, right.right.redden()), null)
      }else {
        if("\ufdd0:else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.balance_right_del = function balance_right_del(key, val, left, del) {
  if(del instanceof cljs.core.RedNode) {
    return new cljs.core.RedNode(key, val, left, del.blacken(), null)
  }else {
    if(left instanceof cljs.core.BlackNode) {
      return cljs.core.balance_left.call(null, key, val, left.redden(), del)
    }else {
      if(function() {
        var and__3941__auto__ = left instanceof cljs.core.RedNode;
        if(and__3941__auto__) {
          return left.right instanceof cljs.core.BlackNode
        }else {
          return and__3941__auto__
        }
      }()) {
        return new cljs.core.RedNode(left.right.key, left.right.val, cljs.core.balance_left.call(null, left.key, left.val, left.left.redden(), left.right.left), new cljs.core.BlackNode(key, val, left.right.right, del, null), null)
      }else {
        if("\ufdd0:else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_kv_reduce = function tree_map_kv_reduce(node, f, init) {
  var init__$1 = !(node.left == null) ? tree_map_kv_reduce.call(null, node.left, f, init) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__$1)) {
    return cljs.core.deref.call(null, init__$1)
  }else {
    var init__$2 = f.call(null, init__$1, node.key, node.val);
    if(cljs.core.reduced_QMARK_.call(null, init__$2)) {
      return cljs.core.deref.call(null, init__$2)
    }else {
      var init__$3 = !(node.right == null) ? tree_map_kv_reduce.call(null, node.right, f, init__$2) : init__$2;
      if(cljs.core.reduced_QMARK_.call(null, init__$3)) {
        return cljs.core.deref.call(null, init__$3)
      }else {
        return init__$3
      }
    }
  }
};
goog.provide("cljs.core.BlackNode");
cljs.core.BlackNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.BlackNode.cljs$lang$type = true;
cljs.core.BlackNode.cljs$lang$ctorStr = "cljs.core/BlackNode";
cljs.core.BlackNode.cljs$lang$ctorPrWriter = function(this__6461__auto__, writer__6462__auto__, opt__6463__auto__) {
  return cljs.core._write.call(null, writer__6462__auto__, "cljs.core/BlackNode")
};
cljs.core.BlackNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__6347__auto__ = self__.__hash;
  if(!(h__6347__auto__ == null)) {
    return h__6347__auto__
  }else {
    var h__6347__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__6347__auto____$1;
    return h__6347__auto____$1
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var self__ = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var self__ = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var self__ = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([self__.key, self__.val], true), k, v)
};
cljs.core.BlackNode.prototype.call = function() {
  var G__7562 = null;
  var G__7562__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var node = self____$1;
    return node.cljs$core$ILookup$_lookup$arity$2(node, k)
  };
  var G__7562__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var node = self____$1;
    return node.cljs$core$ILookup$_lookup$arity$3(node, k, not_found)
  };
  G__7562 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7562__2.call(this, self__, k);
      case 3:
        return G__7562__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__7562
}();
cljs.core.BlackNode.prototype.apply = function(self__, args7561) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args7561.slice()))
};
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var self__ = this;
  return cljs.core.PersistentVector.fromArray([self__.key, self__.val, o], true)
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var self__ = this;
  return self__.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var self__ = this;
  return self__.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var self__ = this;
  var node = this;
  return ins.balance_right(node)
};
cljs.core.BlackNode.prototype.redden = function() {
  var self__ = this;
  var node = this;
  return new cljs.core.RedNode(self__.key, self__.val, self__.left, self__.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var self__ = this;
  var node = this;
  return cljs.core.balance_right_del.call(null, self__.key, self__.val, self__.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key__$1, val__$1, left__$1, right__$1) {
  var self__ = this;
  var node = this;
  return new cljs.core.BlackNode(key__$1, val__$1, left__$1, right__$1, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var self__ = this;
  var node = this;
  return cljs.core.tree_map_kv_reduce.call(null, node, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var self__ = this;
  var node = this;
  return cljs.core.balance_left_del.call(null, self__.key, self__.val, del, self__.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var self__ = this;
  var node = this;
  return ins.balance_left(node)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var self__ = this;
  var node = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node, parent.right, null)
};
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var self__ = this;
  var node = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var self__ = this;
  var node = this;
  return node
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var self__ = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var self__ = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var self__ = this;
  return cljs.core.list.call(null, self__.key, self__.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var self__ = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var self__ = this;
  return self__.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var self__ = this;
  return cljs.core.PersistentVector.fromArray([self__.key], true)
};
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var self__ = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([self__.key, self__.val], true), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([self__.key, self__.val], true), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var self__ = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var self__ = this;
  if(n === 0) {
    return self__.key
  }else {
    if(n === 1) {
      return self__.val
    }else {
      if("\ufdd0:else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var self__ = this;
  if(n === 0) {
    return self__.key
  }else {
    if(n === 1) {
      return self__.val
    }else {
      if("\ufdd0:else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var self__ = this;
  return cljs.core.PersistentVector.EMPTY
};
goog.provide("cljs.core.RedNode");
cljs.core.RedNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.RedNode.cljs$lang$type = true;
cljs.core.RedNode.cljs$lang$ctorStr = "cljs.core/RedNode";
cljs.core.RedNode.cljs$lang$ctorPrWriter = function(this__6461__auto__, writer__6462__auto__, opt__6463__auto__) {
  return cljs.core._write.call(null, writer__6462__auto__, "cljs.core/RedNode")
};
cljs.core.RedNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__6347__auto__ = self__.__hash;
  if(!(h__6347__auto__ == null)) {
    return h__6347__auto__
  }else {
    var h__6347__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__6347__auto____$1;
    return h__6347__auto____$1
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var self__ = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var self__ = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var self__ = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([self__.key, self__.val], true), k, v)
};
cljs.core.RedNode.prototype.call = function() {
  var G__7564 = null;
  var G__7564__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var node = self____$1;
    return node.cljs$core$ILookup$_lookup$arity$2(node, k)
  };
  var G__7564__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var node = self____$1;
    return node.cljs$core$ILookup$_lookup$arity$3(node, k, not_found)
  };
  G__7564 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7564__2.call(this, self__, k);
      case 3:
        return G__7564__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__7564
}();
cljs.core.RedNode.prototype.apply = function(self__, args7563) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args7563.slice()))
};
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var self__ = this;
  return cljs.core.PersistentVector.fromArray([self__.key, self__.val, o], true)
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var self__ = this;
  return self__.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var self__ = this;
  return self__.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var self__ = this;
  var node = this;
  return new cljs.core.RedNode(self__.key, self__.val, self__.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var self__ = this;
  var node = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var self__ = this;
  var node = this;
  return new cljs.core.RedNode(self__.key, self__.val, self__.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key__$1, val__$1, left__$1, right__$1) {
  var self__ = this;
  var node = this;
  return new cljs.core.RedNode(key__$1, val__$1, left__$1, right__$1, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var self__ = this;
  var node = this;
  return cljs.core.tree_map_kv_reduce.call(null, node, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var self__ = this;
  var node = this;
  return new cljs.core.RedNode(self__.key, self__.val, del, self__.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var self__ = this;
  var node = this;
  return new cljs.core.RedNode(self__.key, self__.val, ins, self__.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var self__ = this;
  var node = this;
  if(self__.left instanceof cljs.core.RedNode) {
    return new cljs.core.RedNode(self__.key, self__.val, self__.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, self__.right, parent.right, null), null)
  }else {
    if(self__.right instanceof cljs.core.RedNode) {
      return new cljs.core.RedNode(self__.right.key, self__.right.val, new cljs.core.BlackNode(self__.key, self__.val, self__.left, self__.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, self__.right.right, parent.right, null), null)
    }else {
      if("\ufdd0:else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var self__ = this;
  var node = this;
  if(self__.right instanceof cljs.core.RedNode) {
    return new cljs.core.RedNode(self__.key, self__.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, self__.left, null), self__.right.blacken(), null)
  }else {
    if(self__.left instanceof cljs.core.RedNode) {
      return new cljs.core.RedNode(self__.left.key, self__.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, self__.left.left, null), new cljs.core.BlackNode(self__.key, self__.val, self__.left.right, self__.right, null), null)
    }else {
      if("\ufdd0:else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var self__ = this;
  var node = this;
  return new cljs.core.BlackNode(self__.key, self__.val, self__.left, self__.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var self__ = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var self__ = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var self__ = this;
  return cljs.core.list.call(null, self__.key, self__.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var self__ = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var self__ = this;
  return self__.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var self__ = this;
  return cljs.core.PersistentVector.fromArray([self__.key], true)
};
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var self__ = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([self__.key, self__.val], true), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([self__.key, self__.val], true), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var self__ = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var self__ = this;
  if(n === 0) {
    return self__.key
  }else {
    if(n === 1) {
      return self__.val
    }else {
      if("\ufdd0:else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var self__ = this;
  if(n === 0) {
    return self__.key
  }else {
    if(n === 1) {
      return self__.val
    }else {
      if("\ufdd0:else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var self__ = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c = comp.call(null, k, tree.key);
    if(c === 0) {
      found[0] = tree;
      return null
    }else {
      if(c < 0) {
        var ins = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(!(ins == null)) {
          return tree.add_left(ins)
        }else {
          return null
        }
      }else {
        if("\ufdd0:else") {
          var ins = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(!(ins == null)) {
            return tree.add_right(ins)
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_append = function tree_map_append(left, right) {
  if(left == null) {
    return right
  }else {
    if(right == null) {
      return left
    }else {
      if(left instanceof cljs.core.RedNode) {
        if(right instanceof cljs.core.RedNode) {
          var app = tree_map_append.call(null, left.right, right.left);
          if(app instanceof cljs.core.RedNode) {
            return new cljs.core.RedNode(app.key, app.val, new cljs.core.RedNode(left.key, left.val, left.left, app.left, null), new cljs.core.RedNode(right.key, right.val, app.right, right.right, null), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(right instanceof cljs.core.RedNode) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0:else") {
            var app = tree_map_append.call(null, left.right, right.left);
            if(app instanceof cljs.core.RedNode) {
              return new cljs.core.RedNode(app.key, app.val, new cljs.core.BlackNode(left.key, left.val, left.left, app.left, null), new cljs.core.BlackNode(right.key, right.val, app.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app, right.right, null))
            }
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.tree_map_remove = function tree_map_remove(comp, tree, k, found) {
  if(!(tree == null)) {
    var c = comp.call(null, k, tree.key);
    if(c === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c < 0) {
        var del = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3943__auto__ = !(del == null);
          if(or__3943__auto__) {
            return or__3943__auto__
          }else {
            return!(found[0] == null)
          }
        }()) {
          if(tree.left instanceof cljs.core.BlackNode) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0:else") {
          var del = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3943__auto__ = !(del == null);
            if(or__3943__auto__) {
              return or__3943__auto__
            }else {
              return!(found[0] == null)
            }
          }()) {
            if(tree.right instanceof cljs.core.BlackNode) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del, null)
            }
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }else {
    return null
  }
};
cljs.core.tree_map_replace = function tree_map_replace(comp, tree, k, v) {
  var tk = tree.key;
  var c = comp.call(null, k, tk);
  if(c === 0) {
    return tree.replace(tk, v, tree.left, tree.right)
  }else {
    if(c < 0) {
      return tree.replace(tk, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0:else") {
        return tree.replace(tk, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
      }else {
        return null
      }
    }
  }
};
goog.provide("cljs.core.PersistentTreeMap");
cljs.core.PersistentTreeMap = function(comp, tree, cnt, meta, __hash) {
  this.comp = comp;
  this.tree = tree;
  this.cnt = cnt;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 418776847
};
cljs.core.PersistentTreeMap.cljs$lang$type = true;
cljs.core.PersistentTreeMap.cljs$lang$ctorStr = "cljs.core/PersistentTreeMap";
cljs.core.PersistentTreeMap.cljs$lang$ctorPrWriter = function(this__6461__auto__, writer__6462__auto__, opt__6463__auto__) {
  return cljs.core._write.call(null, writer__6462__auto__, "cljs.core/PersistentTreeMap")
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__6347__auto__ = self__.__hash;
  if(!(h__6347__auto__ == null)) {
    return h__6347__auto__
  }else {
    var h__6347__auto____$1 = cljs.core.hash_imap.call(null, coll);
    self__.__hash = h__6347__auto____$1;
    return h__6347__auto____$1
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var self__ = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var self__ = this;
  var n = coll.entry_at(k);
  if(!(n == null)) {
    return n.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var self__ = this;
  var found = [null];
  var t = cljs.core.tree_map_add.call(null, self__.comp, self__.tree, k, v, found);
  if(t == null) {
    var found_node = cljs.core.nth.call(null, found, 0);
    if(cljs.core._EQ_.call(null, v, found_node.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(self__.comp, cljs.core.tree_map_replace.call(null, self__.comp, self__.tree, k, v), self__.cnt, self__.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(self__.comp, t.blacken(), self__.cnt + 1, self__.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var self__ = this;
  return!(coll.entry_at(k) == null)
};
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__7566 = null;
  var G__7566__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$2(coll, k)
  };
  var G__7566__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, not_found)
  };
  G__7566 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7566__2.call(this, self__, k);
      case 3:
        return G__7566__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__7566
}();
cljs.core.PersistentTreeMap.prototype.apply = function(self__, args7565) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args7565.slice()))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var self__ = this;
  if(!(self__.tree == null)) {
    return cljs.core.tree_map_kv_reduce.call(null, self__.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var self__ = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var self__ = this;
  if(self__.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, self__.tree, false, self__.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var self__ = this;
  var coll = this;
  var t = self__.tree;
  while(true) {
    if(!(t == null)) {
      var c = self__.comp.call(null, k, t.key);
      if(c === 0) {
        return t
      }else {
        if(c < 0) {
          var G__7567 = t.left;
          t = G__7567;
          continue
        }else {
          if("\ufdd0:else") {
            var G__7568 = t.right;
            t = G__7568;
            continue
          }else {
            return null
          }
        }
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var self__ = this;
  if(self__.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, self__.tree, ascending_QMARK_, self__.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var self__ = this;
  if(self__.cnt > 0) {
    var stack = null;
    var t = self__.tree;
    while(true) {
      if(!(t == null)) {
        var c = self__.comp.call(null, k, t.key);
        if(c === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack, t), ascending_QMARK_, -1, null)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c < 0) {
              var G__7569 = cljs.core.conj.call(null, stack, t);
              var G__7570 = t.left;
              stack = G__7569;
              t = G__7570;
              continue
            }else {
              var G__7571 = stack;
              var G__7572 = t.right;
              stack = G__7571;
              t = G__7572;
              continue
            }
          }else {
            if("\ufdd0:else") {
              if(c > 0) {
                var G__7573 = cljs.core.conj.call(null, stack, t);
                var G__7574 = t.right;
                stack = G__7573;
                t = G__7574;
                continue
              }else {
                var G__7575 = stack;
                var G__7576 = t.left;
                stack = G__7575;
                t = G__7576;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack == null) {
          return null
        }else {
          return new cljs.core.PersistentTreeMapSeq(null, stack, ascending_QMARK_, -1, null)
        }
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var self__ = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var self__ = this;
  return self__.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  if(self__.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, self__.tree, true, self__.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return self__.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.PersistentTreeMap(self__.comp, self__.tree, self__.cnt, meta__$1, self__.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, self__.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var self__ = this;
  var found = [null];
  var t = cljs.core.tree_map_remove.call(null, self__.comp, self__.tree, k, found);
  if(t == null) {
    if(cljs.core.nth.call(null, found, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(self__.comp, null, 0, self__.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(self__.comp, t.blacken(), self__.cnt - 1, self__.meta, null)
  }
};
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in$ = cljs.core.seq.call(null, keyvals);
    var out = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(in$) {
        var G__7577 = cljs.core.nnext.call(null, in$);
        var G__7578 = cljs.core.assoc_BANG_.call(null, out, cljs.core.first.call(null, in$), cljs.core.second.call(null, in$));
        in$ = G__7577;
        out = G__7578;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out)
      }
      break
    }
  };
  var hash_map = function(var_args) {
    var keyvals = null;
    if(arguments.length > 0) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hash_map__delegate.call(this, keyvals)
  };
  hash_map.cljs$lang$maxFixedArity = 0;
  hash_map.cljs$lang$applyTo = function(arglist__7579) {
    var keyvals = cljs.core.seq(arglist__7579);
    return hash_map__delegate(keyvals)
  };
  hash_map.cljs$core$IFn$_invoke$arity$variadic = hash_map__delegate;
  return hash_map
}();
cljs.core.array_map = function() {
  var array_map__delegate = function(keyvals) {
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, cljs.core.count.call(null, keyvals), 2), cljs.core.apply.call(null, cljs.core.array, keyvals), null)
  };
  var array_map = function(var_args) {
    var keyvals = null;
    if(arguments.length > 0) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return array_map__delegate.call(this, keyvals)
  };
  array_map.cljs$lang$maxFixedArity = 0;
  array_map.cljs$lang$applyTo = function(arglist__7580) {
    var keyvals = cljs.core.seq(arglist__7580);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$core$IFn$_invoke$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.obj_map = function() {
  var obj_map__delegate = function(keyvals) {
    var ks = [];
    var obj = {};
    var kvs = cljs.core.seq.call(null, keyvals);
    while(true) {
      if(kvs) {
        ks.push(cljs.core.first.call(null, kvs));
        obj[cljs.core.first.call(null, kvs)] = cljs.core.second.call(null, kvs);
        var G__7581 = cljs.core.nnext.call(null, kvs);
        kvs = G__7581;
        continue
      }else {
        return cljs.core.ObjMap.fromObject.call(null, ks, obj)
      }
      break
    }
  };
  var obj_map = function(var_args) {
    var keyvals = null;
    if(arguments.length > 0) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return obj_map__delegate.call(this, keyvals)
  };
  obj_map.cljs$lang$maxFixedArity = 0;
  obj_map.cljs$lang$applyTo = function(arglist__7582) {
    var keyvals = cljs.core.seq(arglist__7582);
    return obj_map__delegate(keyvals)
  };
  obj_map.cljs$core$IFn$_invoke$arity$variadic = obj_map__delegate;
  return obj_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in$ = cljs.core.seq.call(null, keyvals);
    var out = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(in$) {
        var G__7583 = cljs.core.nnext.call(null, in$);
        var G__7584 = cljs.core.assoc.call(null, out, cljs.core.first.call(null, in$), cljs.core.second.call(null, in$));
        in$ = G__7583;
        out = G__7584;
        continue
      }else {
        return out
      }
      break
    }
  };
  var sorted_map = function(var_args) {
    var keyvals = null;
    if(arguments.length > 0) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_map__delegate.call(this, keyvals)
  };
  sorted_map.cljs$lang$maxFixedArity = 0;
  sorted_map.cljs$lang$applyTo = function(arglist__7585) {
    var keyvals = cljs.core.seq(arglist__7585);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$core$IFn$_invoke$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in$ = cljs.core.seq.call(null, keyvals);
    var out = new cljs.core.PersistentTreeMap(cljs.core.fn__GT_comparator.call(null, comparator), null, 0, null, 0);
    while(true) {
      if(in$) {
        var G__7586 = cljs.core.nnext.call(null, in$);
        var G__7587 = cljs.core.assoc.call(null, out, cljs.core.first.call(null, in$), cljs.core.second.call(null, in$));
        in$ = G__7586;
        out = G__7587;
        continue
      }else {
        return out
      }
      break
    }
  };
  var sorted_map_by = function(comparator, var_args) {
    var keyvals = null;
    if(arguments.length > 1) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_map_by__delegate.call(this, comparator, keyvals)
  };
  sorted_map_by.cljs$lang$maxFixedArity = 1;
  sorted_map_by.cljs$lang$applyTo = function(arglist__7588) {
    var comparator = cljs.core.first(arglist__7588);
    var keyvals = cljs.core.rest(arglist__7588);
    return sorted_map_by__delegate(comparator, keyvals)
  };
  sorted_map_by.cljs$core$IFn$_invoke$arity$variadic = sorted_map_by__delegate;
  return sorted_map_by
}();
cljs.core.keys = function keys(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.first, hash_map))
};
cljs.core.key = function key(map_entry) {
  return cljs.core._key.call(null, map_entry)
};
cljs.core.vals = function vals(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.second, hash_map))
};
cljs.core.val = function val(map_entry) {
  return cljs.core._val.call(null, map_entry)
};
cljs.core.merge = function() {
  var merge__delegate = function(maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      return cljs.core.reduce.call(null, function(p1__7589_SHARP_, p2__7590_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3943__auto__ = p1__7589_SHARP_;
          if(cljs.core.truth_(or__3943__auto__)) {
            return or__3943__auto__
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), p2__7590_SHARP_)
      }, maps)
    }else {
      return null
    }
  };
  var merge = function(var_args) {
    var maps = null;
    if(arguments.length > 0) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return merge__delegate.call(this, maps)
  };
  merge.cljs$lang$maxFixedArity = 0;
  merge.cljs$lang$applyTo = function(arglist__7591) {
    var maps = cljs.core.seq(arglist__7591);
    return merge__delegate(maps)
  };
  merge.cljs$core$IFn$_invoke$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry = function(m, e) {
        var k = cljs.core.first.call(null, e);
        var v = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k)) {
          return cljs.core.assoc.call(null, m, k, f.call(null, cljs.core.get.call(null, m, k), v))
        }else {
          return cljs.core.assoc.call(null, m, k, v)
        }
      };
      var merge2 = function(merge_entry) {
        return function(m1, m2) {
          return cljs.core.reduce.call(null, merge_entry, function() {
            var or__3943__auto__ = m1;
            if(cljs.core.truth_(or__3943__auto__)) {
              return or__3943__auto__
            }else {
              return cljs.core.ObjMap.EMPTY
            }
          }(), cljs.core.seq.call(null, m2))
        }
      }(merge_entry);
      return cljs.core.reduce.call(null, merge2, maps)
    }else {
      return null
    }
  };
  var merge_with = function(f, var_args) {
    var maps = null;
    if(arguments.length > 1) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return merge_with__delegate.call(this, f, maps)
  };
  merge_with.cljs$lang$maxFixedArity = 1;
  merge_with.cljs$lang$applyTo = function(arglist__7592) {
    var f = cljs.core.first(arglist__7592);
    var maps = cljs.core.rest(arglist__7592);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$core$IFn$_invoke$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret = cljs.core.ObjMap.EMPTY;
  var keys = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(keys) {
      var key = cljs.core.first.call(null, keys);
      var entry = cljs.core.get.call(null, map, key, "\ufdd0:cljs.core/not-found");
      var G__7593 = cljs.core.not_EQ_.call(null, entry, "\ufdd0:cljs.core/not-found") ? cljs.core.assoc.call(null, ret, key, entry) : ret;
      var G__7594 = cljs.core.next.call(null, keys);
      ret = G__7593;
      keys = G__7594;
      continue
    }else {
      return ret
    }
    break
  }
};
goog.provide("cljs.core.PersistentHashSet");
cljs.core.PersistentHashSet = function(meta, hash_map, __hash) {
  this.meta = meta;
  this.hash_map = hash_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 4;
  this.cljs$lang$protocol_mask$partition0$ = 15077647
};
cljs.core.PersistentHashSet.cljs$lang$type = true;
cljs.core.PersistentHashSet.cljs$lang$ctorStr = "cljs.core/PersistentHashSet";
cljs.core.PersistentHashSet.cljs$lang$ctorPrWriter = function(this__6461__auto__, writer__6462__auto__, opt__6463__auto__) {
  return cljs.core._write.call(null, writer__6462__auto__, "cljs.core/PersistentHashSet")
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var self__ = this;
  return new cljs.core.TransientHashSet(cljs.core._as_transient.call(null, self__.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__6347__auto__ = self__.__hash;
  if(!(h__6347__auto__ == null)) {
    return h__6347__auto__
  }else {
    var h__6347__auto____$1 = cljs.core.hash_iset.call(null, coll);
    self__.__hash = h__6347__auto____$1;
    return h__6347__auto____$1
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var self__ = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var self__ = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, self__.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__7597 = null;
  var G__7597__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$2(coll, k)
  };
  var G__7597__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, not_found)
  };
  G__7597 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7597__2.call(this, self__, k);
      case 3:
        return G__7597__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__7597
}();
cljs.core.PersistentHashSet.prototype.apply = function(self__, args7596) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args7596.slice()))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return new cljs.core.PersistentHashSet(self__.meta, cljs.core.assoc.call(null, self__.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.keys.call(null, self__.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var self__ = this;
  return new cljs.core.PersistentHashSet(self__.meta, cljs.core._dissoc.call(null, self__.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core._count.call(null, self__.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  var and__3941__auto__ = cljs.core.set_QMARK_.call(null, other);
  if(and__3941__auto__) {
    var and__3941__auto____$1 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3941__auto____$1) {
      return cljs.core.every_QMARK_.call(null, function(p1__7595_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__7595_SHARP_)
      }, other)
    }else {
      return and__3941__auto____$1
    }
  }else {
    return and__3941__auto__
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.PersistentHashSet(meta__$1, self__.hash_map, self__.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, self__.meta)
};
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.PersistentArrayMap.EMPTY, 0);
cljs.core.PersistentHashSet.fromArray = function(items, no_clone) {
  var len = items.length;
  if(len / 2 <= cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
    var arr = no_clone ? items : items.slice();
    return new cljs.core.PersistentHashSet(null, cljs.core.PersistentArrayMap.fromArray.call(null, arr, true), null)
  }else {
    var i = 0;
    var out = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
    while(true) {
      if(i < len) {
        var G__7598 = i + 2;
        var G__7599 = cljs.core.conj_BANG_.call(null, out, items[i]);
        i = G__7598;
        out = G__7599;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out)
      }
      break
    }
  }
};
goog.provide("cljs.core.TransientHashSet");
cljs.core.TransientHashSet = function(transient_map) {
  this.transient_map = transient_map;
  this.cljs$lang$protocol_mask$partition0$ = 259;
  this.cljs$lang$protocol_mask$partition1$ = 136
};
cljs.core.TransientHashSet.cljs$lang$type = true;
cljs.core.TransientHashSet.cljs$lang$ctorStr = "cljs.core/TransientHashSet";
cljs.core.TransientHashSet.cljs$lang$ctorPrWriter = function(this__6461__auto__, writer__6462__auto__, opt__6463__auto__) {
  return cljs.core._write.call(null, writer__6462__auto__, "cljs.core/TransientHashSet")
};
cljs.core.TransientHashSet.prototype.call = function() {
  var G__7602 = null;
  var G__7602__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var tcoll = self____$1;
    if(cljs.core._lookup.call(null, self__.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__7602__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var tcoll = self____$1;
    if(cljs.core._lookup.call(null, self__.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__7602 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7602__2.call(this, self__, k);
      case 3:
        return G__7602__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__7602
}();
cljs.core.TransientHashSet.prototype.apply = function(self__, args7601) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args7601.slice()))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var self__ = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var self__ = this;
  if(cljs.core._lookup.call(null, self__.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var self__ = this;
  return cljs.core.count.call(null, self__.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var self__ = this;
  self__.transient_map = cljs.core.dissoc_BANG_.call(null, self__.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var self__ = this;
  self__.transient_map = cljs.core.assoc_BANG_.call(null, self__.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var self__ = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, self__.transient_map), null)
};
goog.provide("cljs.core.PersistentTreeSet");
cljs.core.PersistentTreeSet = function(meta, tree_map, __hash) {
  this.meta = meta;
  this.tree_map = tree_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 417730831
};
cljs.core.PersistentTreeSet.cljs$lang$type = true;
cljs.core.PersistentTreeSet.cljs$lang$ctorStr = "cljs.core/PersistentTreeSet";
cljs.core.PersistentTreeSet.cljs$lang$ctorPrWriter = function(this__6461__auto__, writer__6462__auto__, opt__6463__auto__) {
  return cljs.core._write.call(null, writer__6462__auto__, "cljs.core/PersistentTreeSet")
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__6347__auto__ = self__.__hash;
  if(!(h__6347__auto__ == null)) {
    return h__6347__auto__
  }else {
    var h__6347__auto____$1 = cljs.core.hash_iset.call(null, coll);
    self__.__hash = h__6347__auto____$1;
    return h__6347__auto____$1
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var self__ = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var self__ = this;
  var n = self__.tree_map.entry_at(v);
  if(!(n == null)) {
    return n.key
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__7604 = null;
  var G__7604__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$2(coll, k)
  };
  var G__7604__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, not_found)
  };
  G__7604 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7604__2.call(this, self__, k);
      case 3:
        return G__7604__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__7604
}();
cljs.core.PersistentTreeSet.prototype.apply = function(self__, args7603) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args7603.slice()))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return new cljs.core.PersistentTreeSet(self__.meta, cljs.core.assoc.call(null, self__.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, self__.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var self__ = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, self__.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var self__ = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, self__.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var self__ = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core._comparator.call(null, self__.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.keys.call(null, self__.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var self__ = this;
  return new cljs.core.PersistentTreeSet(self__.meta, cljs.core.dissoc.call(null, self__.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.count.call(null, self__.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  var and__3941__auto__ = cljs.core.set_QMARK_.call(null, other);
  if(and__3941__auto__) {
    var and__3941__auto____$1 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3941__auto____$1) {
      return cljs.core.every_QMARK_.call(null, function(p1__7600_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__7600_SHARP_)
      }, other)
    }else {
      return and__3941__auto____$1
    }
  }else {
    return and__3941__auto__
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.PersistentTreeSet(meta__$1, self__.tree_map, self__.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, self__.meta)
};
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.PersistentTreeMap.EMPTY, 0);
cljs.core.hash_set = function() {
  var hash_set = null;
  var hash_set__0 = function() {
    return cljs.core.PersistentHashSet.EMPTY
  };
  var hash_set__1 = function() {
    var G__7605__delegate = function(keys) {
      if(function() {
        var and__3941__auto__ = keys instanceof cljs.core.IndexedSeq;
        if(and__3941__auto__) {
          return keys.arr.length < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD
        }else {
          return and__3941__auto__
        }
      }()) {
        var karr = keys.arr;
        var klen = karr.length;
        var alen = 2 * klen;
        var arr = new Array(alen);
        var ki = 0;
        while(true) {
          if(ki < klen) {
            var ai = 2 * ki;
            arr[ai] = karr[ki];
            arr[ai + 1] = null;
            var G__7606 = ki + 1;
            ki = G__7606;
            continue
          }else {
            return cljs.core.PersistentHashSet.fromArray.call(null, arr, true)
          }
          break
        }
      }else {
        var in$ = keys;
        var out = cljs.core._as_transient.call(null, cljs.core.PersistentHashSet.EMPTY);
        while(true) {
          if(!(in$ == null)) {
            var G__7607 = cljs.core._next.call(null, in$);
            var G__7608 = cljs.core._conj_BANG_.call(null, out, cljs.core._first.call(null, in$));
            in$ = G__7607;
            out = G__7608;
            continue
          }else {
            return cljs.core._persistent_BANG_.call(null, out)
          }
          break
        }
      }
    };
    var G__7605 = function(var_args) {
      var keys = null;
      if(arguments.length > 0) {
        keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__7605__delegate.call(this, keys)
    };
    G__7605.cljs$lang$maxFixedArity = 0;
    G__7605.cljs$lang$applyTo = function(arglist__7609) {
      var keys = cljs.core.seq(arglist__7609);
      return G__7605__delegate(keys)
    };
    G__7605.cljs$core$IFn$_invoke$arity$variadic = G__7605__delegate;
    return G__7605
  }();
  hash_set = function(var_args) {
    var keys = var_args;
    switch(arguments.length) {
      case 0:
        return hash_set__0.call(this);
      default:
        return hash_set__1.cljs$core$IFn$_invoke$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  hash_set.cljs$lang$maxFixedArity = 0;
  hash_set.cljs$lang$applyTo = hash_set__1.cljs$lang$applyTo;
  hash_set.cljs$core$IFn$_invoke$arity$0 = hash_set__0;
  hash_set.cljs$core$IFn$_invoke$arity$variadic = hash_set__1.cljs$core$IFn$_invoke$arity$variadic;
  return hash_set
}();
cljs.core.set = function set(coll) {
  return cljs.core.apply.call(null, cljs.core.hash_set, coll)
};
cljs.core.sorted_set = function() {
  var sorted_set__delegate = function(keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, cljs.core.PersistentTreeSet.EMPTY, keys)
  };
  var sorted_set = function(var_args) {
    var keys = null;
    if(arguments.length > 0) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_set__delegate.call(this, keys)
  };
  sorted_set.cljs$lang$maxFixedArity = 0;
  sorted_set.cljs$lang$applyTo = function(arglist__7610) {
    var keys = cljs.core.seq(arglist__7610);
    return sorted_set__delegate(keys)
  };
  sorted_set.cljs$core$IFn$_invoke$arity$variadic = sorted_set__delegate;
  return sorted_set
}();
cljs.core.sorted_set_by = function() {
  var sorted_set_by__delegate = function(comparator, keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map_by.call(null, comparator), 0), keys)
  };
  var sorted_set_by = function(comparator, var_args) {
    var keys = null;
    if(arguments.length > 1) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_set_by__delegate.call(this, comparator, keys)
  };
  sorted_set_by.cljs$lang$maxFixedArity = 1;
  sorted_set_by.cljs$lang$applyTo = function(arglist__7612) {
    var comparator = cljs.core.first(arglist__7612);
    var keys = cljs.core.rest(arglist__7612);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$core$IFn$_invoke$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__4090__auto__ = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__4090__auto__)) {
        var e = temp__4090__auto__;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__7611_SHARP_) {
      var temp__4090__auto__ = cljs.core.find.call(null, smap, p1__7611_SHARP_);
      if(cljs.core.truth_(temp__4090__auto__)) {
        var e = temp__4090__auto__;
        return cljs.core.second.call(null, e)
      }else {
        return p1__7611_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__7619, seen__$1) {
        while(true) {
          var vec__7620 = p__7619;
          var f = cljs.core.nth.call(null, vec__7620, 0, null);
          var xs__$1 = vec__7620;
          var temp__4092__auto__ = cljs.core.seq.call(null, xs__$1);
          if(temp__4092__auto__) {
            var s = temp__4092__auto__;
            if(cljs.core.contains_QMARK_.call(null, seen__$1, f)) {
              var G__7621 = cljs.core.rest.call(null, s);
              var G__7622 = seen__$1;
              p__7619 = G__7621;
              seen__$1 = G__7622;
              continue
            }else {
              return cljs.core.cons.call(null, f, step.call(null, cljs.core.rest.call(null, s), cljs.core.conj.call(null, seen__$1, f)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    }, null)
  };
  return step.call(null, coll, cljs.core.PersistentHashSet.EMPTY)
};
cljs.core.butlast = function butlast(s) {
  var ret = cljs.core.PersistentVector.EMPTY;
  var s__$1 = s;
  while(true) {
    if(cljs.core.next.call(null, s__$1)) {
      var G__7623 = cljs.core.conj.call(null, ret, cljs.core.first.call(null, s__$1));
      var G__7624 = cljs.core.next.call(null, s__$1);
      ret = G__7623;
      s__$1 = G__7624;
      continue
    }else {
      return cljs.core.seq.call(null, ret)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(function() {
    var G__7626 = x;
    if(G__7626) {
      if(cljs.core.truth_(function() {
        var or__3943__auto__ = null;
        if(cljs.core.truth_(or__3943__auto__)) {
          return or__3943__auto__
        }else {
          return G__7626.cljs$core$INamed$
        }
      }())) {
        return true
      }else {
        return false
      }
    }else {
      return false
    }
  }()) {
    return cljs.core._name.call(null, x)
  }else {
    if(cljs.core.string_QMARK_.call(null, x)) {
      return x
    }else {
      if(cljs.core.keyword_QMARK_.call(null, x)) {
        var i = x.lastIndexOf("/", x.length - 2);
        if(i < 0) {
          return cljs.core.subs.call(null, x, 2)
        }else {
          return cljs.core.subs.call(null, x, i + 1)
        }
      }else {
        if("\ufdd0:else") {
          throw new Error([cljs.core.str("Doesn't support name: "), cljs.core.str(x)].join(""));
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.namespace = function namespace(x) {
  if(function() {
    var G__7628 = x;
    if(G__7628) {
      if(cljs.core.truth_(function() {
        var or__3943__auto__ = null;
        if(cljs.core.truth_(or__3943__auto__)) {
          return or__3943__auto__
        }else {
          return G__7628.cljs$core$INamed$
        }
      }())) {
        return true
      }else {
        return false
      }
    }else {
      return false
    }
  }()) {
    return cljs.core._namespace.call(null, x)
  }else {
    if(cljs.core.keyword_QMARK_.call(null, x)) {
      var i = x.lastIndexOf("/", x.length - 2);
      if(i > -1) {
        return cljs.core.subs.call(null, x, 2, i)
      }else {
        return null
      }
    }else {
      throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
    }
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map = cljs.core.ObjMap.EMPTY;
  var ks = cljs.core.seq.call(null, keys);
  var vs = cljs.core.seq.call(null, vals);
  while(true) {
    if(function() {
      var and__3941__auto__ = ks;
      if(and__3941__auto__) {
        return vs
      }else {
        return and__3941__auto__
      }
    }()) {
      var G__7631 = cljs.core.assoc.call(null, map, cljs.core.first.call(null, ks), cljs.core.first.call(null, vs));
      var G__7632 = cljs.core.next.call(null, ks);
      var G__7633 = cljs.core.next.call(null, vs);
      map = G__7631;
      ks = G__7632;
      vs = G__7633;
      continue
    }else {
      return map
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__2 = function(k, x) {
    return x
  };
  var max_key__3 = function(k, x, y) {
    if(k.call(null, x) > k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var max_key__4 = function() {
    var G__7636__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__7629_SHARP_, p2__7630_SHARP_) {
        return max_key.call(null, k, p1__7629_SHARP_, p2__7630_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__7636 = function(k, x, y, var_args) {
      var more = null;
      if(arguments.length > 3) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7636__delegate.call(this, k, x, y, more)
    };
    G__7636.cljs$lang$maxFixedArity = 3;
    G__7636.cljs$lang$applyTo = function(arglist__7637) {
      var k = cljs.core.first(arglist__7637);
      arglist__7637 = cljs.core.next(arglist__7637);
      var x = cljs.core.first(arglist__7637);
      arglist__7637 = cljs.core.next(arglist__7637);
      var y = cljs.core.first(arglist__7637);
      var more = cljs.core.rest(arglist__7637);
      return G__7636__delegate(k, x, y, more)
    };
    G__7636.cljs$core$IFn$_invoke$arity$variadic = G__7636__delegate;
    return G__7636
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__2.call(this, k, x);
      case 3:
        return max_key__3.call(this, k, x, y);
      default:
        return max_key__4.cljs$core$IFn$_invoke$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__4.cljs$lang$applyTo;
  max_key.cljs$core$IFn$_invoke$arity$2 = max_key__2;
  max_key.cljs$core$IFn$_invoke$arity$3 = max_key__3;
  max_key.cljs$core$IFn$_invoke$arity$variadic = max_key__4.cljs$core$IFn$_invoke$arity$variadic;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__2 = function(k, x) {
    return x
  };
  var min_key__3 = function(k, x, y) {
    if(k.call(null, x) < k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var min_key__4 = function() {
    var G__7638__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__7634_SHARP_, p2__7635_SHARP_) {
        return min_key.call(null, k, p1__7634_SHARP_, p2__7635_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__7638 = function(k, x, y, var_args) {
      var more = null;
      if(arguments.length > 3) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7638__delegate.call(this, k, x, y, more)
    };
    G__7638.cljs$lang$maxFixedArity = 3;
    G__7638.cljs$lang$applyTo = function(arglist__7639) {
      var k = cljs.core.first(arglist__7639);
      arglist__7639 = cljs.core.next(arglist__7639);
      var x = cljs.core.first(arglist__7639);
      arglist__7639 = cljs.core.next(arglist__7639);
      var y = cljs.core.first(arglist__7639);
      var more = cljs.core.rest(arglist__7639);
      return G__7638__delegate(k, x, y, more)
    };
    G__7638.cljs$core$IFn$_invoke$arity$variadic = G__7638__delegate;
    return G__7638
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__2.call(this, k, x);
      case 3:
        return min_key__3.call(this, k, x, y);
      default:
        return min_key__4.cljs$core$IFn$_invoke$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__4.cljs$lang$applyTo;
  min_key.cljs$core$IFn$_invoke$arity$2 = min_key__2;
  min_key.cljs$core$IFn$_invoke$arity$3 = min_key__3;
  min_key.cljs$core$IFn$_invoke$arity$variadic = min_key__4.cljs$core$IFn$_invoke$arity$variadic;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__2 = function(n, coll) {
    return partition_all.call(null, n, n, coll)
  };
  var partition_all__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto__ = cljs.core.seq.call(null, coll);
      if(temp__4092__auto__) {
        var s = temp__4092__auto__;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s)))
      }else {
        return null
      }
    }, null)
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__2.call(this, n, step);
      case 3:
        return partition_all__3.call(this, n, step, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  partition_all.cljs$core$IFn$_invoke$arity$2 = partition_all__2;
  partition_all.cljs$core$IFn$_invoke$arity$3 = partition_all__3;
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__4092__auto__ = cljs.core.seq.call(null, coll);
    if(temp__4092__auto__) {
      var s = temp__4092__auto__;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s), take_while.call(null, pred, cljs.core.rest.call(null, s)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.mk_bound_fn = function mk_bound_fn(sc, test, key) {
  return function(e) {
    var comp = cljs.core._comparator.call(null, sc);
    return test.call(null, comp.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._GT_, null, cljs.core._GT__EQ_, null], true).call(null, test))) {
      var temp__4092__auto__ = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__4092__auto__)) {
        var vec__7642 = temp__4092__auto__;
        var e = cljs.core.nth.call(null, vec__7642, 0, null);
        var s = vec__7642;
        if(cljs.core.truth_(include.call(null, e))) {
          return s
        }else {
          return cljs.core.next.call(null, s)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__4092__auto__ = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__4092__auto__)) {
      var vec__7643 = temp__4092__auto__;
      var e = cljs.core.nth.call(null, vec__7643, 0, null);
      var s = vec__7643;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e)) ? s : cljs.core.next.call(null, s))
    }else {
      return null
    }
  };
  subseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return subseq__3.call(this, sc, start_test, start_key);
      case 5:
        return subseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  subseq.cljs$core$IFn$_invoke$arity$3 = subseq__3;
  subseq.cljs$core$IFn$_invoke$arity$5 = subseq__5;
  return subseq
}();
cljs.core.rsubseq = function() {
  var rsubseq = null;
  var rsubseq__3 = function(sc, test, key) {
    var include = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._LT_, null, cljs.core._LT__EQ_, null], true).call(null, test))) {
      var temp__4092__auto__ = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__4092__auto__)) {
        var vec__7646 = temp__4092__auto__;
        var e = cljs.core.nth.call(null, vec__7646, 0, null);
        var s = vec__7646;
        if(cljs.core.truth_(include.call(null, e))) {
          return s
        }else {
          return cljs.core.next.call(null, s)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__4092__auto__ = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__4092__auto__)) {
      var vec__7647 = temp__4092__auto__;
      var e = cljs.core.nth.call(null, vec__7647, 0, null);
      var s = vec__7647;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e)) ? s : cljs.core.next.call(null, s))
    }else {
      return null
    }
  };
  rsubseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return rsubseq__3.call(this, sc, start_test, start_key);
      case 5:
        return rsubseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  rsubseq.cljs$core$IFn$_invoke$arity$3 = rsubseq__3;
  rsubseq.cljs$core$IFn$_invoke$arity$5 = rsubseq__5;
  return rsubseq
}();
goog.provide("cljs.core.Range");
cljs.core.Range = function(meta, start, end, step, __hash) {
  this.meta = meta;
  this.start = start;
  this.end = end;
  this.step = step;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32375006
};
cljs.core.Range.cljs$lang$type = true;
cljs.core.Range.cljs$lang$ctorStr = "cljs.core/Range";
cljs.core.Range.cljs$lang$ctorPrWriter = function(this__6461__auto__, writer__6462__auto__, opt__6463__auto__) {
  return cljs.core._write.call(null, writer__6462__auto__, "cljs.core/Range")
};
cljs.core.Range.prototype.cljs$core$IHash$_hash$arity$1 = function(rng) {
  var self__ = this;
  var h__6347__auto__ = self__.__hash;
  if(!(h__6347__auto__ == null)) {
    return h__6347__auto__
  }else {
    var h__6347__auto____$1 = cljs.core.hash_coll.call(null, rng);
    self__.__hash = h__6347__auto____$1;
    return h__6347__auto____$1
  }
};
cljs.core.Range.prototype.cljs$core$INext$_next$arity$1 = function(rng) {
  var self__ = this;
  if(self__.step > 0) {
    if(self__.start + self__.step < self__.end) {
      return new cljs.core.Range(self__.meta, self__.start + self__.step, self__.end, self__.step, null)
    }else {
      return null
    }
  }else {
    if(self__.start + self__.step > self__.end) {
      return new cljs.core.Range(self__.meta, self__.start + self__.step, self__.end, self__.step, null)
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var self__ = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var self__ = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var self__ = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var self__ = this;
  if(self__.step > 0) {
    if(self__.start < self__.end) {
      return rng
    }else {
      return null
    }
  }else {
    if(self__.start > self__.end) {
      return rng
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var self__ = this;
  if(cljs.core.not.call(null, rng.cljs$core$ISeqable$_seq$arity$1(rng))) {
    return 0
  }else {
    return Math.ceil((self__.end - self__.start) / self__.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var self__ = this;
  return self__.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var self__ = this;
  if(!(rng.cljs$core$ISeqable$_seq$arity$1(rng) == null)) {
    return new cljs.core.Range(self__.meta, self__.start + self__.step, self__.end, self__.step, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta__$1) {
  var self__ = this;
  return new cljs.core.Range(meta__$1, self__.start, self__.end, self__.step, self__.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var self__ = this;
  return self__.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var self__ = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return self__.start + n * self__.step
  }else {
    if(function() {
      var and__3941__auto__ = self__.start > self__.end;
      if(and__3941__auto__) {
        return self__.step === 0
      }else {
        return and__3941__auto__
      }
    }()) {
      return self__.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var self__ = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return self__.start + n * self__.step
  }else {
    if(function() {
      var and__3941__auto__ = self__.start > self__.end;
      if(and__3941__auto__) {
        return self__.step === 0
      }else {
        return and__3941__auto__
      }
    }()) {
      return self__.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, self__.meta)
};
cljs.core.range = function() {
  var range = null;
  var range__0 = function() {
    return range.call(null, 0, Number.MAX_VALUE, 1)
  };
  var range__1 = function(end) {
    return range.call(null, 0, end, 1)
  };
  var range__2 = function(start, end) {
    return range.call(null, start, end, 1)
  };
  var range__3 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step, null)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__0.call(this);
      case 1:
        return range__1.call(this, start);
      case 2:
        return range__2.call(this, start, end);
      case 3:
        return range__3.call(this, start, end, step)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  range.cljs$core$IFn$_invoke$arity$0 = range__0;
  range.cljs$core$IFn$_invoke$arity$1 = range__1;
  range.cljs$core$IFn$_invoke$arity$2 = range__2;
  range.cljs$core$IFn$_invoke$arity$3 = range__3;
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__4092__auto__ = cljs.core.seq.call(null, coll);
    if(temp__4092__auto__) {
      var s = temp__4092__auto__;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s), take_nth.call(null, n, cljs.core.drop.call(null, n, s)))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_with = function split_with(pred, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take_while.call(null, pred, coll), cljs.core.drop_while.call(null, pred, coll)], true)
};
cljs.core.partition_by = function partition_by(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__4092__auto__ = cljs.core.seq.call(null, coll);
    if(temp__4092__auto__) {
      var s = temp__4092__auto__;
      var fst = cljs.core.first.call(null, s);
      var fv = f.call(null, fst);
      var run = cljs.core.cons.call(null, fst, cljs.core.take_while.call(null, function(fst, fv) {
        return function(p1__7648_SHARP_) {
          return cljs.core._EQ_.call(null, fv, f.call(null, p1__7648_SHARP_))
        }
      }(fst, fv), cljs.core.next.call(null, s)));
      return cljs.core.cons.call(null, run, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run), s))))
    }else {
      return null
    }
  }, null)
};
cljs.core.frequencies = function frequencies(coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(counts, x) {
    return cljs.core.assoc_BANG_.call(null, counts, x, cljs.core.get.call(null, counts, x, 0) + 1)
  }, cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY), coll))
};
cljs.core.reductions = function() {
  var reductions = null;
  var reductions__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4090__auto__ = cljs.core.seq.call(null, coll);
      if(temp__4090__auto__) {
        var s = temp__4090__auto__;
        return reductions.call(null, f, cljs.core.first.call(null, s), cljs.core.rest.call(null, s))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    }, null)
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto__ = cljs.core.seq.call(null, coll);
      if(temp__4092__auto__) {
        var s = temp__4092__auto__;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s)), cljs.core.rest.call(null, s))
      }else {
        return null
      }
    }, null))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__2.call(this, f, init);
      case 3:
        return reductions__3.call(this, f, init, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  reductions.cljs$core$IFn$_invoke$arity$2 = reductions__2;
  reductions.cljs$core$IFn$_invoke$arity$3 = reductions__3;
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__1 = function(f) {
    return function() {
      var G__7659 = null;
      var G__7659__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__7659__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__7659__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__7659__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__7659__4 = function() {
        var G__7660__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__7660 = function(x, y, z, var_args) {
          var args = null;
          if(arguments.length > 3) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7660__delegate.call(this, x, y, z, args)
        };
        G__7660.cljs$lang$maxFixedArity = 3;
        G__7660.cljs$lang$applyTo = function(arglist__7661) {
          var x = cljs.core.first(arglist__7661);
          arglist__7661 = cljs.core.next(arglist__7661);
          var y = cljs.core.first(arglist__7661);
          arglist__7661 = cljs.core.next(arglist__7661);
          var z = cljs.core.first(arglist__7661);
          var args = cljs.core.rest(arglist__7661);
          return G__7660__delegate(x, y, z, args)
        };
        G__7660.cljs$core$IFn$_invoke$arity$variadic = G__7660__delegate;
        return G__7660
      }();
      G__7659 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__7659__0.call(this);
          case 1:
            return G__7659__1.call(this, x);
          case 2:
            return G__7659__2.call(this, x, y);
          case 3:
            return G__7659__3.call(this, x, y, z);
          default:
            return G__7659__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      G__7659.cljs$lang$maxFixedArity = 3;
      G__7659.cljs$lang$applyTo = G__7659__4.cljs$lang$applyTo;
      return G__7659
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__7662 = null;
      var G__7662__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__7662__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__7662__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__7662__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__7662__4 = function() {
        var G__7663__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__7663 = function(x, y, z, var_args) {
          var args = null;
          if(arguments.length > 3) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7663__delegate.call(this, x, y, z, args)
        };
        G__7663.cljs$lang$maxFixedArity = 3;
        G__7663.cljs$lang$applyTo = function(arglist__7664) {
          var x = cljs.core.first(arglist__7664);
          arglist__7664 = cljs.core.next(arglist__7664);
          var y = cljs.core.first(arglist__7664);
          arglist__7664 = cljs.core.next(arglist__7664);
          var z = cljs.core.first(arglist__7664);
          var args = cljs.core.rest(arglist__7664);
          return G__7663__delegate(x, y, z, args)
        };
        G__7663.cljs$core$IFn$_invoke$arity$variadic = G__7663__delegate;
        return G__7663
      }();
      G__7662 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__7662__0.call(this);
          case 1:
            return G__7662__1.call(this, x);
          case 2:
            return G__7662__2.call(this, x, y);
          case 3:
            return G__7662__3.call(this, x, y, z);
          default:
            return G__7662__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      G__7662.cljs$lang$maxFixedArity = 3;
      G__7662.cljs$lang$applyTo = G__7662__4.cljs$lang$applyTo;
      return G__7662
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__7665 = null;
      var G__7665__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__7665__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__7665__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__7665__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__7665__4 = function() {
        var G__7666__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__7666 = function(x, y, z, var_args) {
          var args = null;
          if(arguments.length > 3) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7666__delegate.call(this, x, y, z, args)
        };
        G__7666.cljs$lang$maxFixedArity = 3;
        G__7666.cljs$lang$applyTo = function(arglist__7667) {
          var x = cljs.core.first(arglist__7667);
          arglist__7667 = cljs.core.next(arglist__7667);
          var y = cljs.core.first(arglist__7667);
          arglist__7667 = cljs.core.next(arglist__7667);
          var z = cljs.core.first(arglist__7667);
          var args = cljs.core.rest(arglist__7667);
          return G__7666__delegate(x, y, z, args)
        };
        G__7666.cljs$core$IFn$_invoke$arity$variadic = G__7666__delegate;
        return G__7666
      }();
      G__7665 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__7665__0.call(this);
          case 1:
            return G__7665__1.call(this, x);
          case 2:
            return G__7665__2.call(this, x, y);
          case 3:
            return G__7665__3.call(this, x, y, z);
          default:
            return G__7665__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      G__7665.cljs$lang$maxFixedArity = 3;
      G__7665.cljs$lang$applyTo = G__7665__4.cljs$lang$applyTo;
      return G__7665
    }()
  };
  var juxt__4 = function() {
    var G__7668__delegate = function(f, g, h, fs) {
      var fs__$1 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__7669 = null;
        var G__7669__0 = function() {
          return cljs.core.reduce.call(null, function(p1__7649_SHARP_, p2__7650_SHARP_) {
            return cljs.core.conj.call(null, p1__7649_SHARP_, p2__7650_SHARP_.call(null))
          }, cljs.core.PersistentVector.EMPTY, fs__$1)
        };
        var G__7669__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__7651_SHARP_, p2__7652_SHARP_) {
            return cljs.core.conj.call(null, p1__7651_SHARP_, p2__7652_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.EMPTY, fs__$1)
        };
        var G__7669__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__7653_SHARP_, p2__7654_SHARP_) {
            return cljs.core.conj.call(null, p1__7653_SHARP_, p2__7654_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.EMPTY, fs__$1)
        };
        var G__7669__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__7655_SHARP_, p2__7656_SHARP_) {
            return cljs.core.conj.call(null, p1__7655_SHARP_, p2__7656_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.EMPTY, fs__$1)
        };
        var G__7669__4 = function() {
          var G__7670__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__7657_SHARP_, p2__7658_SHARP_) {
              return cljs.core.conj.call(null, p1__7657_SHARP_, cljs.core.apply.call(null, p2__7658_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.EMPTY, fs__$1)
          };
          var G__7670 = function(x, y, z, var_args) {
            var args = null;
            if(arguments.length > 3) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__7670__delegate.call(this, x, y, z, args)
          };
          G__7670.cljs$lang$maxFixedArity = 3;
          G__7670.cljs$lang$applyTo = function(arglist__7671) {
            var x = cljs.core.first(arglist__7671);
            arglist__7671 = cljs.core.next(arglist__7671);
            var y = cljs.core.first(arglist__7671);
            arglist__7671 = cljs.core.next(arglist__7671);
            var z = cljs.core.first(arglist__7671);
            var args = cljs.core.rest(arglist__7671);
            return G__7670__delegate(x, y, z, args)
          };
          G__7670.cljs$core$IFn$_invoke$arity$variadic = G__7670__delegate;
          return G__7670
        }();
        G__7669 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__7669__0.call(this);
            case 1:
              return G__7669__1.call(this, x);
            case 2:
              return G__7669__2.call(this, x, y);
            case 3:
              return G__7669__3.call(this, x, y, z);
            default:
              return G__7669__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw new Error("Invalid arity: " + arguments.length);
        };
        G__7669.cljs$lang$maxFixedArity = 3;
        G__7669.cljs$lang$applyTo = G__7669__4.cljs$lang$applyTo;
        return G__7669
      }()
    };
    var G__7668 = function(f, g, h, var_args) {
      var fs = null;
      if(arguments.length > 3) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7668__delegate.call(this, f, g, h, fs)
    };
    G__7668.cljs$lang$maxFixedArity = 3;
    G__7668.cljs$lang$applyTo = function(arglist__7672) {
      var f = cljs.core.first(arglist__7672);
      arglist__7672 = cljs.core.next(arglist__7672);
      var g = cljs.core.first(arglist__7672);
      arglist__7672 = cljs.core.next(arglist__7672);
      var h = cljs.core.first(arglist__7672);
      var fs = cljs.core.rest(arglist__7672);
      return G__7668__delegate(f, g, h, fs)
    };
    G__7668.cljs$core$IFn$_invoke$arity$variadic = G__7668__delegate;
    return G__7668
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__1.call(this, f);
      case 2:
        return juxt__2.call(this, f, g);
      case 3:
        return juxt__3.call(this, f, g, h);
      default:
        return juxt__4.cljs$core$IFn$_invoke$arity$variadic(f, g, h, cljs.core.array_seq(arguments, 3))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__4.cljs$lang$applyTo;
  juxt.cljs$core$IFn$_invoke$arity$1 = juxt__1;
  juxt.cljs$core$IFn$_invoke$arity$2 = juxt__2;
  juxt.cljs$core$IFn$_invoke$arity$3 = juxt__3;
  juxt.cljs$core$IFn$_invoke$arity$variadic = juxt__4.cljs$core$IFn$_invoke$arity$variadic;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__1 = function(coll) {
    while(true) {
      if(cljs.core.seq.call(null, coll)) {
        var G__7673 = cljs.core.next.call(null, coll);
        coll = G__7673;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__2 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3941__auto__ = cljs.core.seq.call(null, coll);
        if(and__3941__auto__) {
          return n > 0
        }else {
          return and__3941__auto__
        }
      }())) {
        var G__7674 = n - 1;
        var G__7675 = cljs.core.next.call(null, coll);
        n = G__7674;
        coll = G__7675;
        continue
      }else {
        return null
      }
      break
    }
  };
  dorun = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return dorun__1.call(this, n);
      case 2:
        return dorun__2.call(this, n, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  dorun.cljs$core$IFn$_invoke$arity$1 = dorun__1;
  dorun.cljs$core$IFn$_invoke$arity$2 = dorun__2;
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__1 = function(coll) {
    cljs.core.dorun.call(null, coll);
    return coll
  };
  var doall__2 = function(n, coll) {
    cljs.core.dorun.call(null, n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__1.call(this, n);
      case 2:
        return doall__2.call(this, n, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  doall.cljs$core$IFn$_invoke$arity$1 = doall__1;
  doall.cljs$core$IFn$_invoke$arity$2 = doall__2;
  return doall
}();
cljs.core.regexp_QMARK_ = function regexp_QMARK_(o) {
  return o instanceof RegExp
};
cljs.core.re_matches = function re_matches(re, s) {
  var matches = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches), s)) {
    if(cljs.core.count.call(null, matches) === 1) {
      return cljs.core.first.call(null, matches)
    }else {
      return cljs.core.vec.call(null, matches)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches = re.exec(s);
  if(matches == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches) === 1) {
      return cljs.core.first.call(null, matches)
    }else {
      return cljs.core.vec.call(null, matches)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data = cljs.core.re_find.call(null, re, s);
  var match_idx = s.search(re);
  var match_str = cljs.core.coll_QMARK_.call(null, match_data) ? cljs.core.first.call(null, match_data) : match_data;
  var post_match = cljs.core.subs.call(null, s, match_idx + cljs.core.count.call(null, match_str));
  if(cljs.core.truth_(match_data)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data, re_seq.call(null, re, post_match))
    }, null)
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__7677 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var _ = cljs.core.nth.call(null, vec__7677, 0, null);
  var flags = cljs.core.nth.call(null, vec__7677, 1, null);
  var pattern = cljs.core.nth.call(null, vec__7677, 2, null);
  return new RegExp(pattern, flags)
};
cljs.core.pr_sequential_writer = function pr_sequential_writer(writer, print_one, begin, sep, end, opts, coll) {
  cljs.core._write.call(null, writer, begin);
  if(cljs.core.seq.call(null, coll)) {
    print_one.call(null, cljs.core.first.call(null, coll), writer, opts)
  }else {
  }
  var seq__7682_7686 = cljs.core.seq.call(null, cljs.core.next.call(null, coll));
  var chunk__7683_7687 = null;
  var count__7684_7688 = 0;
  var i__7685_7689 = 0;
  while(true) {
    if(i__7685_7689 < count__7684_7688) {
      var o_7690 = cljs.core._nth.call(null, chunk__7683_7687, i__7685_7689);
      cljs.core._write.call(null, writer, sep);
      print_one.call(null, o_7690, writer, opts);
      var G__7691 = seq__7682_7686;
      var G__7692 = chunk__7683_7687;
      var G__7693 = count__7684_7688;
      var G__7694 = i__7685_7689 + 1;
      seq__7682_7686 = G__7691;
      chunk__7683_7687 = G__7692;
      count__7684_7688 = G__7693;
      i__7685_7689 = G__7694;
      continue
    }else {
      var temp__4092__auto___7695 = cljs.core.seq.call(null, seq__7682_7686);
      if(temp__4092__auto___7695) {
        var seq__7682_7696__$1 = temp__4092__auto___7695;
        if(cljs.core.chunked_seq_QMARK_.call(null, seq__7682_7696__$1)) {
          var c__6652__auto___7697 = cljs.core.chunk_first.call(null, seq__7682_7696__$1);
          var G__7698 = cljs.core.chunk_rest.call(null, seq__7682_7696__$1);
          var G__7699 = c__6652__auto___7697;
          var G__7700 = cljs.core.count.call(null, c__6652__auto___7697);
          var G__7701 = 0;
          seq__7682_7686 = G__7698;
          chunk__7683_7687 = G__7699;
          count__7684_7688 = G__7700;
          i__7685_7689 = G__7701;
          continue
        }else {
          var o_7702 = cljs.core.first.call(null, seq__7682_7696__$1);
          cljs.core._write.call(null, writer, sep);
          print_one.call(null, o_7702, writer, opts);
          var G__7703 = cljs.core.next.call(null, seq__7682_7696__$1);
          var G__7704 = null;
          var G__7705 = 0;
          var G__7706 = 0;
          seq__7682_7686 = G__7703;
          chunk__7683_7687 = G__7704;
          count__7684_7688 = G__7705;
          i__7685_7689 = G__7706;
          continue
        }
      }else {
      }
    }
    break
  }
  return cljs.core._write.call(null, writer, end)
};
cljs.core.write_all = function() {
  var write_all__delegate = function(writer, ss) {
    var seq__7711 = cljs.core.seq.call(null, ss);
    var chunk__7712 = null;
    var count__7713 = 0;
    var i__7714 = 0;
    while(true) {
      if(i__7714 < count__7713) {
        var s = cljs.core._nth.call(null, chunk__7712, i__7714);
        cljs.core._write.call(null, writer, s);
        var G__7715 = seq__7711;
        var G__7716 = chunk__7712;
        var G__7717 = count__7713;
        var G__7718 = i__7714 + 1;
        seq__7711 = G__7715;
        chunk__7712 = G__7716;
        count__7713 = G__7717;
        i__7714 = G__7718;
        continue
      }else {
        var temp__4092__auto__ = cljs.core.seq.call(null, seq__7711);
        if(temp__4092__auto__) {
          var seq__7711__$1 = temp__4092__auto__;
          if(cljs.core.chunked_seq_QMARK_.call(null, seq__7711__$1)) {
            var c__6652__auto__ = cljs.core.chunk_first.call(null, seq__7711__$1);
            var G__7719 = cljs.core.chunk_rest.call(null, seq__7711__$1);
            var G__7720 = c__6652__auto__;
            var G__7721 = cljs.core.count.call(null, c__6652__auto__);
            var G__7722 = 0;
            seq__7711 = G__7719;
            chunk__7712 = G__7720;
            count__7713 = G__7721;
            i__7714 = G__7722;
            continue
          }else {
            var s = cljs.core.first.call(null, seq__7711__$1);
            cljs.core._write.call(null, writer, s);
            var G__7723 = cljs.core.next.call(null, seq__7711__$1);
            var G__7724 = null;
            var G__7725 = 0;
            var G__7726 = 0;
            seq__7711 = G__7723;
            chunk__7712 = G__7724;
            count__7713 = G__7725;
            i__7714 = G__7726;
            continue
          }
        }else {
          return null
        }
      }
      break
    }
  };
  var write_all = function(writer, var_args) {
    var ss = null;
    if(arguments.length > 1) {
      ss = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return write_all__delegate.call(this, writer, ss)
  };
  write_all.cljs$lang$maxFixedArity = 1;
  write_all.cljs$lang$applyTo = function(arglist__7727) {
    var writer = cljs.core.first(arglist__7727);
    var ss = cljs.core.rest(arglist__7727);
    return write_all__delegate(writer, ss)
  };
  write_all.cljs$core$IFn$_invoke$arity$variadic = write_all__delegate;
  return write_all
}();
cljs.core.string_print = function string_print(x) {
  cljs.core._STAR_print_fn_STAR_.call(null, x);
  return null
};
cljs.core.flush = function flush() {
  return null
};
cljs.core.char_escapes = {'"':'\\"', "\\":"\\\\", "\b":"\\b", "\f":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t"};
cljs.core.quote_string = function quote_string(s) {
  return[cljs.core.str('"'), cljs.core.str(s.replace(RegExp('[\\\\"\b\f\n\r\t]', "g"), function(match) {
    return cljs.core.char_escapes[match]
  })), cljs.core.str('"')].join("")
};
cljs.core.pr_writer = function pr_writer(obj, writer, opts) {
  if(obj == null) {
    return cljs.core._write.call(null, writer, "nil")
  }else {
    if(void 0 === obj) {
      return cljs.core._write.call(null, writer, "#<undefined>")
    }else {
      if("\ufdd0:else") {
        if(cljs.core.truth_(function() {
          var and__3941__auto__ = cljs.core.get.call(null, opts, "\ufdd0:meta");
          if(cljs.core.truth_(and__3941__auto__)) {
            var and__3941__auto____$1 = function() {
              var G__7730 = obj;
              if(G__7730) {
                if(function() {
                  var or__3943__auto__ = G__7730.cljs$lang$protocol_mask$partition0$ & 131072;
                  if(or__3943__auto__) {
                    return or__3943__auto__
                  }else {
                    return G__7730.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__7730.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__7730)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__7730)
              }
            }();
            if(cljs.core.truth_(and__3941__auto____$1)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3941__auto____$1
            }
          }else {
            return and__3941__auto__
          }
        }())) {
          cljs.core._write.call(null, writer, "^");
          pr_writer.call(null, cljs.core.meta.call(null, obj), writer, opts);
          cljs.core._write.call(null, writer, " ")
        }else {
        }
        if(obj == null) {
          return cljs.core._write.call(null, writer, "nil")
        }else {
          if(obj.cljs$lang$type) {
            return obj.cljs$lang$ctorPrWriter(obj, writer, opts)
          }else {
            if(function() {
              var G__7731 = obj;
              if(G__7731) {
                if(function() {
                  var or__3943__auto__ = G__7731.cljs$lang$protocol_mask$partition0$ & 2147483648;
                  if(or__3943__auto__) {
                    return or__3943__auto__
                  }else {
                    return G__7731.cljs$core$IPrintWithWriter$
                  }
                }()) {
                  return true
                }else {
                  return false
                }
              }else {
                return false
              }
            }()) {
              return cljs.core._pr_writer.call(null, obj, writer, opts)
            }else {
              if(function() {
                var or__3943__auto__ = cljs.core.type.call(null, obj) === Boolean;
                if(or__3943__auto__) {
                  return or__3943__auto__
                }else {
                  return typeof obj === "number"
                }
              }()) {
                return cljs.core._write.call(null, writer, [cljs.core.str(obj)].join(""))
              }else {
                if(obj instanceof Array) {
                  return cljs.core.pr_sequential_writer.call(null, writer, pr_writer, "#<Array [", ", ", "]>", opts, obj)
                }else {
                  if(goog.isString(obj)) {
                    if(cljs.core.keyword_QMARK_.call(null, obj)) {
                      cljs.core._write.call(null, writer, ":");
                      var temp__4092__auto___7732 = cljs.core.namespace.call(null, obj);
                      if(cljs.core.truth_(temp__4092__auto___7732)) {
                        var nspc_7733 = temp__4092__auto___7732;
                        cljs.core.write_all.call(null, writer, [cljs.core.str(nspc_7733)].join(""), "/")
                      }else {
                      }
                      return cljs.core._write.call(null, writer, cljs.core.name.call(null, obj))
                    }else {
                      if(obj instanceof cljs.core.Symbol) {
                        var temp__4092__auto___7734 = cljs.core.namespace.call(null, obj);
                        if(cljs.core.truth_(temp__4092__auto___7734)) {
                          var nspc_7735 = temp__4092__auto___7734;
                          cljs.core.write_all.call(null, writer, [cljs.core.str(nspc_7735)].join(""), "/")
                        }else {
                        }
                        return cljs.core._write.call(null, writer, cljs.core.name.call(null, obj))
                      }else {
                        if("\ufdd0:else") {
                          if(cljs.core.truth_((new cljs.core.Keyword("\ufdd0:readably")).call(null, opts))) {
                            return cljs.core._write.call(null, writer, cljs.core.quote_string.call(null, obj))
                          }else {
                            return cljs.core._write.call(null, writer, obj)
                          }
                        }else {
                          return null
                        }
                      }
                    }
                  }else {
                    if(cljs.core.fn_QMARK_.call(null, obj)) {
                      return cljs.core.write_all.call(null, writer, "#<", [cljs.core.str(obj)].join(""), ">")
                    }else {
                      if(obj instanceof Date) {
                        var normalize = function(n, len) {
                          var ns = [cljs.core.str(n)].join("");
                          while(true) {
                            if(cljs.core.count.call(null, ns) < len) {
                              var G__7736 = [cljs.core.str("0"), cljs.core.str(ns)].join("");
                              ns = G__7736;
                              continue
                            }else {
                              return ns
                            }
                            break
                          }
                        };
                        return cljs.core.write_all.call(null, writer, '#inst "', [cljs.core.str(obj.getUTCFullYear())].join(""), "-", normalize.call(null, obj.getUTCMonth() + 1, 2), "-", normalize.call(null, obj.getUTCDate(), 2), "T", normalize.call(null, obj.getUTCHours(), 2), ":", normalize.call(null, obj.getUTCMinutes(), 2), ":", normalize.call(null, obj.getUTCSeconds(), 2), ".", normalize.call(null, obj.getUTCMilliseconds(), 3), "-", '00:00"')
                      }else {
                        if(cljs.core.truth_(cljs.core.regexp_QMARK_.call(null, obj))) {
                          return cljs.core.write_all.call(null, writer, '#"', obj.source, '"')
                        }else {
                          if("\ufdd0:else") {
                            return cljs.core.write_all.call(null, writer, "#<", [cljs.core.str(obj)].join(""), ">")
                          }else {
                            return null
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_seq_writer = function pr_seq_writer(objs, writer, opts) {
  cljs.core.pr_writer.call(null, cljs.core.first.call(null, objs), writer, opts);
  var seq__7741 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  var chunk__7742 = null;
  var count__7743 = 0;
  var i__7744 = 0;
  while(true) {
    if(i__7744 < count__7743) {
      var obj = cljs.core._nth.call(null, chunk__7742, i__7744);
      cljs.core._write.call(null, writer, " ");
      cljs.core.pr_writer.call(null, obj, writer, opts);
      var G__7745 = seq__7741;
      var G__7746 = chunk__7742;
      var G__7747 = count__7743;
      var G__7748 = i__7744 + 1;
      seq__7741 = G__7745;
      chunk__7742 = G__7746;
      count__7743 = G__7747;
      i__7744 = G__7748;
      continue
    }else {
      var temp__4092__auto__ = cljs.core.seq.call(null, seq__7741);
      if(temp__4092__auto__) {
        var seq__7741__$1 = temp__4092__auto__;
        if(cljs.core.chunked_seq_QMARK_.call(null, seq__7741__$1)) {
          var c__6652__auto__ = cljs.core.chunk_first.call(null, seq__7741__$1);
          var G__7749 = cljs.core.chunk_rest.call(null, seq__7741__$1);
          var G__7750 = c__6652__auto__;
          var G__7751 = cljs.core.count.call(null, c__6652__auto__);
          var G__7752 = 0;
          seq__7741 = G__7749;
          chunk__7742 = G__7750;
          count__7743 = G__7751;
          i__7744 = G__7752;
          continue
        }else {
          var obj = cljs.core.first.call(null, seq__7741__$1);
          cljs.core._write.call(null, writer, " ");
          cljs.core.pr_writer.call(null, obj, writer, opts);
          var G__7753 = cljs.core.next.call(null, seq__7741__$1);
          var G__7754 = null;
          var G__7755 = 0;
          var G__7756 = 0;
          seq__7741 = G__7753;
          chunk__7742 = G__7754;
          count__7743 = G__7755;
          i__7744 = G__7756;
          continue
        }
      }else {
        return null
      }
    }
    break
  }
};
cljs.core.pr_sb_with_opts = function pr_sb_with_opts(objs, opts) {
  var sb = new goog.string.StringBuffer;
  var writer = new cljs.core.StringBufferWriter(sb);
  cljs.core.pr_seq_writer.call(null, objs, writer, opts);
  cljs.core._flush.call(null, writer);
  return sb
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  if(cljs.core.empty_QMARK_.call(null, objs)) {
    return""
  }else {
    return[cljs.core.str(cljs.core.pr_sb_with_opts.call(null, objs, opts))].join("")
  }
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  if(cljs.core.empty_QMARK_.call(null, objs)) {
    return"\n"
  }else {
    var sb = cljs.core.pr_sb_with_opts.call(null, objs, opts);
    sb.append("\n");
    return[cljs.core.str(sb)].join("")
  }
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  return cljs.core.string_print.call(null, cljs.core.pr_str_with_opts.call(null, objs, opts))
};
cljs.core.newline = function newline(opts) {
  cljs.core.string_print.call(null, "\n");
  if(cljs.core.truth_(cljs.core.get.call(null, opts, "\ufdd0:flush-on-newline"))) {
    return cljs.core.flush.call(null)
  }else {
    return null
  }
};
cljs.core.pr_str = function() {
  var pr_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr_str = function(var_args) {
    var objs = null;
    if(arguments.length > 0) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr_str__delegate.call(this, objs)
  };
  pr_str.cljs$lang$maxFixedArity = 0;
  pr_str.cljs$lang$applyTo = function(arglist__7757) {
    var objs = cljs.core.seq(arglist__7757);
    return pr_str__delegate(objs)
  };
  pr_str.cljs$core$IFn$_invoke$arity$variadic = pr_str__delegate;
  return pr_str
}();
cljs.core.prn_str = function() {
  var prn_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var prn_str = function(var_args) {
    var objs = null;
    if(arguments.length > 0) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn_str__delegate.call(this, objs)
  };
  prn_str.cljs$lang$maxFixedArity = 0;
  prn_str.cljs$lang$applyTo = function(arglist__7758) {
    var objs = cljs.core.seq(arglist__7758);
    return prn_str__delegate(objs)
  };
  prn_str.cljs$core$IFn$_invoke$arity$variadic = prn_str__delegate;
  return prn_str
}();
cljs.core.pr = function() {
  var pr__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr = function(var_args) {
    var objs = null;
    if(arguments.length > 0) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr__delegate.call(this, objs)
  };
  pr.cljs$lang$maxFixedArity = 0;
  pr.cljs$lang$applyTo = function(arglist__7759) {
    var objs = cljs.core.seq(arglist__7759);
    return pr__delegate(objs)
  };
  pr.cljs$core$IFn$_invoke$arity$variadic = pr__delegate;
  return pr
}();
cljs.core.print = function() {
  var cljs_core_print__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0:readably", false))
  };
  var cljs_core_print = function(var_args) {
    var objs = null;
    if(arguments.length > 0) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return cljs_core_print__delegate.call(this, objs)
  };
  cljs_core_print.cljs$lang$maxFixedArity = 0;
  cljs_core_print.cljs$lang$applyTo = function(arglist__7760) {
    var objs = cljs.core.seq(arglist__7760);
    return cljs_core_print__delegate(objs)
  };
  cljs_core_print.cljs$core$IFn$_invoke$arity$variadic = cljs_core_print__delegate;
  return cljs_core_print
}();
cljs.core.print_str = function() {
  var print_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0:readably", false))
  };
  var print_str = function(var_args) {
    var objs = null;
    if(arguments.length > 0) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return print_str__delegate.call(this, objs)
  };
  print_str.cljs$lang$maxFixedArity = 0;
  print_str.cljs$lang$applyTo = function(arglist__7761) {
    var objs = cljs.core.seq(arglist__7761);
    return print_str__delegate(objs)
  };
  print_str.cljs$core$IFn$_invoke$arity$variadic = print_str__delegate;
  return print_str
}();
cljs.core.println = function() {
  var println__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0:readably", false));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var println = function(var_args) {
    var objs = null;
    if(arguments.length > 0) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println__delegate.call(this, objs)
  };
  println.cljs$lang$maxFixedArity = 0;
  println.cljs$lang$applyTo = function(arglist__7762) {
    var objs = cljs.core.seq(arglist__7762);
    return println__delegate(objs)
  };
  println.cljs$core$IFn$_invoke$arity$variadic = println__delegate;
  return println
}();
cljs.core.println_str = function() {
  var println_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0:readably", false))
  };
  var println_str = function(var_args) {
    var objs = null;
    if(arguments.length > 0) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println_str__delegate.call(this, objs)
  };
  println_str.cljs$lang$maxFixedArity = 0;
  println_str.cljs$lang$applyTo = function(arglist__7763) {
    var objs = cljs.core.seq(arglist__7763);
    return println_str__delegate(objs)
  };
  println_str.cljs$core$IFn$_invoke$arity$variadic = println_str__delegate;
  return println_str
}();
cljs.core.prn = function() {
  var prn__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var prn = function(var_args) {
    var objs = null;
    if(arguments.length > 0) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn__delegate.call(this, objs)
  };
  prn.cljs$lang$maxFixedArity = 0;
  prn.cljs$lang$applyTo = function(arglist__7764) {
    var objs = cljs.core.seq(arglist__7764);
    return prn__delegate(objs)
  };
  prn.cljs$core$IFn$_invoke$arity$variadic = prn__delegate;
  return prn
}();
cljs.core.printf = function() {
  var printf__delegate = function(fmt, args) {
    return cljs.core.print.call(null, cljs.core.apply.call(null, cljs.core.format, fmt, args))
  };
  var printf = function(fmt, var_args) {
    var args = null;
    if(arguments.length > 1) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return printf__delegate.call(this, fmt, args)
  };
  printf.cljs$lang$maxFixedArity = 1;
  printf.cljs$lang$applyTo = function(arglist__7765) {
    var fmt = cljs.core.first(arglist__7765);
    var args = cljs.core.rest(arglist__7765);
    return printf__delegate(fmt, args)
  };
  printf.cljs$core$IFn$_invoke$arity$variadic = printf__delegate;
  return printf
}();
cljs.core.IndexedSeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.Subvec.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedCons.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  var pr_pair = function(keyval) {
    return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential_writer.call(null, writer, pr_pair, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  var pr_pair = function(keyval) {
    return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential_writer.call(null, writer, pr_pair, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "#queue [", " ", "]", opts, cljs.core.seq.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.RSeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.RSeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "#{", " ", "}", opts, coll)
};
cljs.core.NodeSeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.RedNode.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.RedNode.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  var pr_pair = function(keyval) {
    return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential_writer.call(null, writer, pr_pair, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "#{", " ", "}", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "[", " ", "]", opts, coll)
};
cljs.core.List.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.List.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.EmptyList.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core._write.call(null, writer, "()")
};
cljs.core.BlackNode.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.BlackNode.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "[", " ", "]", opts, coll)
};
cljs.core.Cons.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.Range.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.Range.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  var pr_pair = function(keyval) {
    return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential_writer.call(null, writer, pr_pair, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IComparable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IComparable$_compare$arity$2 = function(x, y) {
  return cljs.core.compare_indexed.call(null, x, y)
};
cljs.core.Subvec.prototype.cljs$core$IComparable$ = true;
cljs.core.Subvec.prototype.cljs$core$IComparable$_compare$arity$2 = function(x, y) {
  return cljs.core.compare_indexed.call(null, x, y)
};
goog.provide("cljs.core.Atom");
cljs.core.Atom = function(state, meta, validator, watches) {
  this.state = state;
  this.meta = meta;
  this.validator = validator;
  this.watches = watches;
  this.cljs$lang$protocol_mask$partition0$ = 2153938944;
  this.cljs$lang$protocol_mask$partition1$ = 2
};
cljs.core.Atom.cljs$lang$type = true;
cljs.core.Atom.cljs$lang$ctorStr = "cljs.core/Atom";
cljs.core.Atom.cljs$lang$ctorPrWriter = function(this__6461__auto__, writer__6462__auto__, opt__6463__auto__) {
  return cljs.core._write.call(null, writer__6462__auto__, "cljs.core/Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var self__ = this;
  return goog.getUid(this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var self__ = this;
  var seq__7766 = cljs.core.seq.call(null, self__.watches);
  var chunk__7767 = null;
  var count__7768 = 0;
  var i__7769 = 0;
  while(true) {
    if(i__7769 < count__7768) {
      var vec__7770 = cljs.core._nth.call(null, chunk__7767, i__7769);
      var key = cljs.core.nth.call(null, vec__7770, 0, null);
      var f = cljs.core.nth.call(null, vec__7770, 1, null);
      f.call(null, key, this$, oldval, newval);
      var G__7772 = seq__7766;
      var G__7773 = chunk__7767;
      var G__7774 = count__7768;
      var G__7775 = i__7769 + 1;
      seq__7766 = G__7772;
      chunk__7767 = G__7773;
      count__7768 = G__7774;
      i__7769 = G__7775;
      continue
    }else {
      var temp__4092__auto__ = cljs.core.seq.call(null, seq__7766);
      if(temp__4092__auto__) {
        var seq__7766__$1 = temp__4092__auto__;
        if(cljs.core.chunked_seq_QMARK_.call(null, seq__7766__$1)) {
          var c__6652__auto__ = cljs.core.chunk_first.call(null, seq__7766__$1);
          var G__7776 = cljs.core.chunk_rest.call(null, seq__7766__$1);
          var G__7777 = c__6652__auto__;
          var G__7778 = cljs.core.count.call(null, c__6652__auto__);
          var G__7779 = 0;
          seq__7766 = G__7776;
          chunk__7767 = G__7777;
          count__7768 = G__7778;
          i__7769 = G__7779;
          continue
        }else {
          var vec__7771 = cljs.core.first.call(null, seq__7766__$1);
          var key = cljs.core.nth.call(null, vec__7771, 0, null);
          var f = cljs.core.nth.call(null, vec__7771, 1, null);
          f.call(null, key, this$, oldval, newval);
          var G__7780 = cljs.core.next.call(null, seq__7766__$1);
          var G__7781 = null;
          var G__7782 = 0;
          var G__7783 = 0;
          seq__7766 = G__7780;
          chunk__7767 = G__7781;
          count__7768 = G__7782;
          i__7769 = G__7783;
          continue
        }
      }else {
        return null
      }
    }
    break
  }
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_add_watch$arity$3 = function(this$, key, f) {
  var self__ = this;
  return this$.watches = cljs.core.assoc.call(null, self__.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var self__ = this;
  return this$.watches = cljs.core.dissoc.call(null, self__.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(a, writer, opts) {
  var self__ = this;
  cljs.core._write.call(null, writer, "#<Atom: ");
  cljs.core.pr_writer.call(null, self__.state, writer, opts);
  return cljs.core._write.call(null, writer, ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var self__ = this;
  return self__.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var self__ = this;
  return self__.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var self__ = this;
  return o === other
};
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__7787__delegate = function(x, p__7784) {
      var map__7786 = p__7784;
      var map__7786__$1 = cljs.core.seq_QMARK_.call(null, map__7786) ? cljs.core.apply.call(null, cljs.core.hash_map, map__7786) : map__7786;
      var validator = cljs.core.get.call(null, map__7786__$1, "\ufdd0:validator");
      var meta = cljs.core.get.call(null, map__7786__$1, "\ufdd0:meta");
      return new cljs.core.Atom(x, meta, validator, null)
    };
    var G__7787 = function(x, var_args) {
      var p__7784 = null;
      if(arguments.length > 1) {
        p__7784 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__7787__delegate.call(this, x, p__7784)
    };
    G__7787.cljs$lang$maxFixedArity = 1;
    G__7787.cljs$lang$applyTo = function(arglist__7788) {
      var x = cljs.core.first(arglist__7788);
      var p__7784 = cljs.core.rest(arglist__7788);
      return G__7787__delegate(x, p__7784)
    };
    G__7787.cljs$core$IFn$_invoke$arity$variadic = G__7787__delegate;
    return G__7787
  }();
  atom = function(x, var_args) {
    var p__7784 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__1.call(this, x);
      default:
        return atom__2.cljs$core$IFn$_invoke$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__2.cljs$lang$applyTo;
  atom.cljs$core$IFn$_invoke$arity$1 = atom__1;
  atom.cljs$core$IFn$_invoke$arity$variadic = atom__2.cljs$core$IFn$_invoke$arity$variadic;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__4092__auto___7789 = a.validator;
  if(cljs.core.truth_(temp__4092__auto___7789)) {
    var validate_7790 = temp__4092__auto___7789;
    if(cljs.core.truth_(validate_7790.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list(new cljs.core.Symbol(null, "validate", "validate", 1233162959, null), new cljs.core.Symbol(null, "new-value", "new-value", 972165309, null)), cljs.core.hash_map("\ufdd0:line", 6673, "\ufdd0:column", 13))))].join(""));
    }
  }else {
  }
  var old_value_7791 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value_7791, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___2 = function(a, f) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state))
  };
  var swap_BANG___3 = function(a, f, x) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x))
  };
  var swap_BANG___4 = function(a, f, x, y) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y))
  };
  var swap_BANG___5 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y, z))
  };
  var swap_BANG___6 = function() {
    var G__7792__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__7792 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(arguments.length > 5) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__7792__delegate.call(this, a, f, x, y, z, more)
    };
    G__7792.cljs$lang$maxFixedArity = 5;
    G__7792.cljs$lang$applyTo = function(arglist__7793) {
      var a = cljs.core.first(arglist__7793);
      arglist__7793 = cljs.core.next(arglist__7793);
      var f = cljs.core.first(arglist__7793);
      arglist__7793 = cljs.core.next(arglist__7793);
      var x = cljs.core.first(arglist__7793);
      arglist__7793 = cljs.core.next(arglist__7793);
      var y = cljs.core.first(arglist__7793);
      arglist__7793 = cljs.core.next(arglist__7793);
      var z = cljs.core.first(arglist__7793);
      var more = cljs.core.rest(arglist__7793);
      return G__7792__delegate(a, f, x, y, z, more)
    };
    G__7792.cljs$core$IFn$_invoke$arity$variadic = G__7792__delegate;
    return G__7792
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___2.call(this, a, f);
      case 3:
        return swap_BANG___3.call(this, a, f, x);
      case 4:
        return swap_BANG___4.call(this, a, f, x, y);
      case 5:
        return swap_BANG___5.call(this, a, f, x, y, z);
      default:
        return swap_BANG___6.cljs$core$IFn$_invoke$arity$variadic(a, f, x, y, z, cljs.core.array_seq(arguments, 5))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___6.cljs$lang$applyTo;
  swap_BANG_.cljs$core$IFn$_invoke$arity$2 = swap_BANG___2;
  swap_BANG_.cljs$core$IFn$_invoke$arity$3 = swap_BANG___3;
  swap_BANG_.cljs$core$IFn$_invoke$arity$4 = swap_BANG___4;
  swap_BANG_.cljs$core$IFn$_invoke$arity$5 = swap_BANG___5;
  swap_BANG_.cljs$core$IFn$_invoke$arity$variadic = swap_BANG___6.cljs$core$IFn$_invoke$arity$variadic;
  return swap_BANG_
}();
cljs.core.compare_and_set_BANG_ = function compare_and_set_BANG_(a, oldval, newval) {
  if(cljs.core._EQ_.call(null, a.state, oldval)) {
    cljs.core.reset_BANG_.call(null, a, newval);
    return true
  }else {
    return false
  }
};
cljs.core.deref = function deref(o) {
  return cljs.core._deref.call(null, o)
};
cljs.core.set_validator_BANG_ = function set_validator_BANG_(iref, val) {
  return iref.validator = val
};
cljs.core.get_validator = function get_validator(iref) {
  return iref.validator
};
cljs.core.alter_meta_BANG_ = function() {
  var alter_meta_BANG___delegate = function(iref, f, args) {
    return iref.meta = cljs.core.apply.call(null, f, iref.meta, args)
  };
  var alter_meta_BANG_ = function(iref, f, var_args) {
    var args = null;
    if(arguments.length > 2) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$maxFixedArity = 2;
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__7794) {
    var iref = cljs.core.first(arglist__7794);
    arglist__7794 = cljs.core.next(arglist__7794);
    var f = cljs.core.first(arglist__7794);
    var args = cljs.core.rest(arglist__7794);
    return alter_meta_BANG___delegate(iref, f, args)
  };
  alter_meta_BANG_.cljs$core$IFn$_invoke$arity$variadic = alter_meta_BANG___delegate;
  return alter_meta_BANG_
}();
cljs.core.reset_meta_BANG_ = function reset_meta_BANG_(iref, m) {
  return iref.meta = m
};
cljs.core.add_watch = function add_watch(iref, key, f) {
  return cljs.core._add_watch.call(null, iref, key, f)
};
cljs.core.remove_watch = function remove_watch(iref, key) {
  return cljs.core._remove_watch.call(null, iref, key)
};
cljs.core.gensym_counter = null;
cljs.core.gensym = function() {
  var gensym = null;
  var gensym__0 = function() {
    return gensym.call(null, "G__")
  };
  var gensym__1 = function(prefix_string) {
    if(cljs.core.gensym_counter == null) {
      cljs.core.gensym_counter = cljs.core.atom.call(null, 0)
    }else {
    }
    return cljs.core.symbol.call(null, [cljs.core.str(prefix_string), cljs.core.str(cljs.core.swap_BANG_.call(null, cljs.core.gensym_counter, cljs.core.inc))].join(""))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__0.call(this);
      case 1:
        return gensym__1.call(this, prefix_string)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  gensym.cljs$core$IFn$_invoke$arity$0 = gensym__0;
  gensym.cljs$core$IFn$_invoke$arity$1 = gensym__1;
  return gensym
}();
cljs.core.fixture1 = 1;
cljs.core.fixture2 = 2;
goog.provide("cljs.core.Delay");
cljs.core.Delay = function(state, f) {
  this.state = state;
  this.f = f;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 32768
};
cljs.core.Delay.cljs$lang$type = true;
cljs.core.Delay.cljs$lang$ctorStr = "cljs.core/Delay";
cljs.core.Delay.cljs$lang$ctorPrWriter = function(this__6461__auto__, writer__6462__auto__, opt__6463__auto__) {
  return cljs.core._write.call(null, writer__6462__auto__, "cljs.core/Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_$arity$1 = function(d) {
  var self__ = this;
  return(new cljs.core.Keyword("\ufdd0:done")).call(null, cljs.core.deref.call(null, self__.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var self__ = this;
  return(new cljs.core.Keyword("\ufdd0:value")).call(null, cljs.core.swap_BANG_.call(null, self__.state, function(p__7795) {
    var map__7796 = p__7795;
    var map__7796__$1 = cljs.core.seq_QMARK_.call(null, map__7796) ? cljs.core.apply.call(null, cljs.core.hash_map, map__7796) : map__7796;
    var curr_state = map__7796__$1;
    var done = cljs.core.get.call(null, map__7796__$1, "\ufdd0:done");
    if(cljs.core.truth_(done)) {
      return curr_state
    }else {
      return cljs.core.PersistentArrayMap.fromArray(["\ufdd0:done", true, "\ufdd0:value", self__.f.call(null)], true)
    }
  }))
};
cljs.core.delay_QMARK_ = function delay_QMARK_(x) {
  return x instanceof cljs.core.Delay
};
cljs.core.force = function force(x) {
  if(cljs.core.delay_QMARK_.call(null, x)) {
    return cljs.core.deref.call(null, x)
  }else {
    return x
  }
};
cljs.core.realized_QMARK_ = function realized_QMARK_(d) {
  return cljs.core._realized_QMARK_.call(null, d)
};
cljs.core.IEncodeJS = {};
cljs.core._clj__GT_js = function _clj__GT_js(x) {
  if(function() {
    var and__3941__auto__ = x;
    if(and__3941__auto__) {
      return x.cljs$core$IEncodeJS$_clj__GT_js$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return x.cljs$core$IEncodeJS$_clj__GT_js$arity$1(x)
  }else {
    var x__6521__auto__ = x == null ? null : x;
    return function() {
      var or__3943__auto__ = cljs.core._clj__GT_js[goog.typeOf(x__6521__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._clj__GT_js["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IEncodeJS.-clj->js", x);
        }
      }
    }().call(null, x)
  }
};
cljs.core._key__GT_js = function _key__GT_js(x) {
  if(function() {
    var and__3941__auto__ = x;
    if(and__3941__auto__) {
      return x.cljs$core$IEncodeJS$_key__GT_js$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return x.cljs$core$IEncodeJS$_key__GT_js$arity$1(x)
  }else {
    var x__6521__auto__ = x == null ? null : x;
    return function() {
      var or__3943__auto__ = cljs.core._key__GT_js[goog.typeOf(x__6521__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._key__GT_js["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IEncodeJS.-key->js", x);
        }
      }
    }().call(null, x)
  }
};
cljs.core.key__GT_js = function key__GT_js(k) {
  if(function() {
    var G__7798 = k;
    if(G__7798) {
      if(cljs.core.truth_(function() {
        var or__3943__auto__ = null;
        if(cljs.core.truth_(or__3943__auto__)) {
          return or__3943__auto__
        }else {
          return G__7798.cljs$core$IEncodeJS$
        }
      }())) {
        return true
      }else {
        if(!G__7798.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEncodeJS, G__7798)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEncodeJS, G__7798)
    }
  }()) {
    return cljs.core._clj__GT_js.call(null, k)
  }else {
    if(function() {
      var or__3943__auto__ = cljs.core.string_QMARK_.call(null, k);
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = typeof k === "number";
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          var or__3943__auto____$2 = cljs.core.keyword_QMARK_.call(null, k);
          if(or__3943__auto____$2) {
            return or__3943__auto____$2
          }else {
            return k instanceof cljs.core.Symbol
          }
        }
      }
    }()) {
      return cljs.core.clj__GT_js.call(null, k)
    }else {
      return cljs.core.pr_str.call(null, k)
    }
  }
};
cljs.core.clj__GT_js = function clj__GT_js(x) {
  if(x == null) {
    return null
  }else {
    if(function() {
      var G__7806 = x;
      if(G__7806) {
        if(cljs.core.truth_(function() {
          var or__3943__auto__ = null;
          if(cljs.core.truth_(or__3943__auto__)) {
            return or__3943__auto__
          }else {
            return G__7806.cljs$core$IEncodeJS$
          }
        }())) {
          return true
        }else {
          if(!G__7806.cljs$lang$protocol_mask$partition$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IEncodeJS, G__7806)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IEncodeJS, G__7806)
      }
    }()) {
      return cljs.core._clj__GT_js.call(null, x)
    }else {
      if(cljs.core.keyword_QMARK_.call(null, x)) {
        return cljs.core.name.call(null, x)
      }else {
        if(x instanceof cljs.core.Symbol) {
          return[cljs.core.str(x)].join("")
        }else {
          if(cljs.core.map_QMARK_.call(null, x)) {
            var m = {};
            var seq__7807_7813 = cljs.core.seq.call(null, x);
            var chunk__7808_7814 = null;
            var count__7809_7815 = 0;
            var i__7810_7816 = 0;
            while(true) {
              if(i__7810_7816 < count__7809_7815) {
                var vec__7811_7817 = cljs.core._nth.call(null, chunk__7808_7814, i__7810_7816);
                var k_7818 = cljs.core.nth.call(null, vec__7811_7817, 0, null);
                var v_7819 = cljs.core.nth.call(null, vec__7811_7817, 1, null);
                m[cljs.core.key__GT_js.call(null, k_7818)] = clj__GT_js.call(null, v_7819);
                var G__7820 = seq__7807_7813;
                var G__7821 = chunk__7808_7814;
                var G__7822 = count__7809_7815;
                var G__7823 = i__7810_7816 + 1;
                seq__7807_7813 = G__7820;
                chunk__7808_7814 = G__7821;
                count__7809_7815 = G__7822;
                i__7810_7816 = G__7823;
                continue
              }else {
                var temp__4092__auto___7824 = cljs.core.seq.call(null, seq__7807_7813);
                if(temp__4092__auto___7824) {
                  var seq__7807_7825__$1 = temp__4092__auto___7824;
                  if(cljs.core.chunked_seq_QMARK_.call(null, seq__7807_7825__$1)) {
                    var c__6652__auto___7826 = cljs.core.chunk_first.call(null, seq__7807_7825__$1);
                    var G__7827 = cljs.core.chunk_rest.call(null, seq__7807_7825__$1);
                    var G__7828 = c__6652__auto___7826;
                    var G__7829 = cljs.core.count.call(null, c__6652__auto___7826);
                    var G__7830 = 0;
                    seq__7807_7813 = G__7827;
                    chunk__7808_7814 = G__7828;
                    count__7809_7815 = G__7829;
                    i__7810_7816 = G__7830;
                    continue
                  }else {
                    var vec__7812_7831 = cljs.core.first.call(null, seq__7807_7825__$1);
                    var k_7832 = cljs.core.nth.call(null, vec__7812_7831, 0, null);
                    var v_7833 = cljs.core.nth.call(null, vec__7812_7831, 1, null);
                    m[cljs.core.key__GT_js.call(null, k_7832)] = clj__GT_js.call(null, v_7833);
                    var G__7834 = cljs.core.next.call(null, seq__7807_7825__$1);
                    var G__7835 = null;
                    var G__7836 = 0;
                    var G__7837 = 0;
                    seq__7807_7813 = G__7834;
                    chunk__7808_7814 = G__7835;
                    count__7809_7815 = G__7836;
                    i__7810_7816 = G__7837;
                    continue
                  }
                }else {
                }
              }
              break
            }
            return m
          }else {
            if(cljs.core.coll_QMARK_.call(null, x)) {
              return cljs.core.apply.call(null, cljs.core.array, cljs.core.map.call(null, clj__GT_js, x))
            }else {
              if("\ufdd0:else") {
                return x
              }else {
                return null
              }
            }
          }
        }
      }
    }
  }
};
cljs.core.IEncodeClojure = {};
cljs.core._js__GT_clj = function _js__GT_clj(x, options) {
  if(function() {
    var and__3941__auto__ = x;
    if(and__3941__auto__) {
      return x.cljs$core$IEncodeClojure$_js__GT_clj$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return x.cljs$core$IEncodeClojure$_js__GT_clj$arity$2(x, options)
  }else {
    var x__6521__auto__ = x == null ? null : x;
    return function() {
      var or__3943__auto__ = cljs.core._js__GT_clj[goog.typeOf(x__6521__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._js__GT_clj["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IEncodeClojure.-js->clj", x);
        }
      }
    }().call(null, x, options)
  }
};
cljs.core.js__GT_clj = function() {
  var js__GT_clj = null;
  var js__GT_clj__1 = function(x) {
    return js__GT_clj.call(null, x, cljs.core.PersistentArrayMap.fromArray(["\ufdd0:keywordize-keys", false], true))
  };
  var js__GT_clj__2 = function() {
    var G__7858__delegate = function(x, opts) {
      if(function() {
        var G__7848 = cljs.core.IEncodeClojure;
        if(G__7848) {
          if(cljs.core.truth_(function() {
            var or__3943__auto__ = null;
            if(cljs.core.truth_(or__3943__auto__)) {
              return or__3943__auto__
            }else {
              return G__7848.cljs$core$x$
            }
          }())) {
            return true
          }else {
            if(!G__7848.cljs$lang$protocol_mask$partition$) {
              return cljs.core.type_satisfies_.call(null, x, G__7848)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, x, G__7848)
        }
      }()) {
        return cljs.core._js__GT_clj.call(null, x, cljs.core.apply.call(null, cljs.core.array_map, opts))
      }else {
        if(cljs.core.seq.call(null, opts)) {
          var map__7849 = opts;
          var map__7849__$1 = cljs.core.seq_QMARK_.call(null, map__7849) ? cljs.core.apply.call(null, cljs.core.hash_map, map__7849) : map__7849;
          var keywordize_keys = cljs.core.get.call(null, map__7849__$1, "\ufdd0:keywordize-keys");
          var keyfn = cljs.core.truth_(keywordize_keys) ? cljs.core.keyword : cljs.core.str;
          var f = function(map__7849, map__7849__$1, keywordize_keys, keyfn) {
            return function thisfn(x__$1) {
              if(cljs.core.seq_QMARK_.call(null, x__$1)) {
                return cljs.core.doall.call(null, cljs.core.map.call(null, thisfn, x__$1))
              }else {
                if(cljs.core.coll_QMARK_.call(null, x__$1)) {
                  return cljs.core.into.call(null, cljs.core.empty.call(null, x__$1), cljs.core.map.call(null, thisfn, x__$1))
                }else {
                  if(x__$1 instanceof Array) {
                    return cljs.core.vec.call(null, cljs.core.map.call(null, thisfn, x__$1))
                  }else {
                    if(cljs.core.type.call(null, x__$1) === Object) {
                      return cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, function() {
                        var iter__6621__auto__ = function(map__7849, map__7849__$1, keywordize_keys, keyfn) {
                          return function iter__7854(s__7855) {
                            return new cljs.core.LazySeq(null, false, function(map__7849, map__7849__$1, keywordize_keys, keyfn) {
                              return function() {
                                var s__7855__$1 = s__7855;
                                while(true) {
                                  var temp__4092__auto__ = cljs.core.seq.call(null, s__7855__$1);
                                  if(temp__4092__auto__) {
                                    var s__7855__$2 = temp__4092__auto__;
                                    if(cljs.core.chunked_seq_QMARK_.call(null, s__7855__$2)) {
                                      var c__6619__auto__ = cljs.core.chunk_first.call(null, s__7855__$2);
                                      var size__6620__auto__ = cljs.core.count.call(null, c__6619__auto__);
                                      var b__7857 = cljs.core.chunk_buffer.call(null, size__6620__auto__);
                                      if(function() {
                                        var i__7856 = 0;
                                        while(true) {
                                          if(i__7856 < size__6620__auto__) {
                                            var k = cljs.core._nth.call(null, c__6619__auto__, i__7856);
                                            cljs.core.chunk_append.call(null, b__7857, cljs.core.PersistentVector.fromArray([keyfn.call(null, k), thisfn.call(null, x__$1[k])], true));
                                            var G__7859 = i__7856 + 1;
                                            i__7856 = G__7859;
                                            continue
                                          }else {
                                            return true
                                          }
                                          break
                                        }
                                      }()) {
                                        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__7857), iter__7854.call(null, cljs.core.chunk_rest.call(null, s__7855__$2)))
                                      }else {
                                        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__7857), null)
                                      }
                                    }else {
                                      var k = cljs.core.first.call(null, s__7855__$2);
                                      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn.call(null, k), thisfn.call(null, x__$1[k])], true), iter__7854.call(null, cljs.core.rest.call(null, s__7855__$2)))
                                    }
                                  }else {
                                    return null
                                  }
                                  break
                                }
                              }
                            }(map__7849, map__7849__$1, keywordize_keys, keyfn), null)
                          }
                        }(map__7849, map__7849__$1, keywordize_keys, keyfn);
                        return iter__6621__auto__.call(null, cljs.core.js_keys.call(null, x__$1))
                      }())
                    }else {
                      if("\ufdd0:else") {
                        return x__$1
                      }else {
                        return null
                      }
                    }
                  }
                }
              }
            }
          }(map__7849, map__7849__$1, keywordize_keys, keyfn);
          return f.call(null, x)
        }else {
          return null
        }
      }
    };
    var G__7858 = function(x, var_args) {
      var opts = null;
      if(arguments.length > 1) {
        opts = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__7858__delegate.call(this, x, opts)
    };
    G__7858.cljs$lang$maxFixedArity = 1;
    G__7858.cljs$lang$applyTo = function(arglist__7860) {
      var x = cljs.core.first(arglist__7860);
      var opts = cljs.core.rest(arglist__7860);
      return G__7858__delegate(x, opts)
    };
    G__7858.cljs$core$IFn$_invoke$arity$variadic = G__7858__delegate;
    return G__7858
  }();
  js__GT_clj = function(x, var_args) {
    var opts = var_args;
    switch(arguments.length) {
      case 1:
        return js__GT_clj__1.call(this, x);
      default:
        return js__GT_clj__2.cljs$core$IFn$_invoke$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = js__GT_clj__2.cljs$lang$applyTo;
  js__GT_clj.cljs$core$IFn$_invoke$arity$1 = js__GT_clj__1;
  js__GT_clj.cljs$core$IFn$_invoke$arity$variadic = js__GT_clj__2.cljs$core$IFn$_invoke$arity$variadic;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  return function() {
    var G__7861__delegate = function(args) {
      var temp__4090__auto__ = cljs.core.get.call(null, cljs.core.deref.call(null, mem), args);
      if(cljs.core.truth_(temp__4090__auto__)) {
        var v = temp__4090__auto__;
        return v
      }else {
        var ret = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem, cljs.core.assoc, args, ret);
        return ret
      }
    };
    var G__7861 = function(var_args) {
      var args = null;
      if(arguments.length > 0) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__7861__delegate.call(this, args)
    };
    G__7861.cljs$lang$maxFixedArity = 0;
    G__7861.cljs$lang$applyTo = function(arglist__7862) {
      var args = cljs.core.seq(arglist__7862);
      return G__7861__delegate(args)
    };
    G__7861.cljs$core$IFn$_invoke$arity$variadic = G__7861__delegate;
    return G__7861
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret)) {
        var G__7863 = ret;
        f = G__7863;
        continue
      }else {
        return ret
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__7864__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__7864 = function(f, var_args) {
      var args = null;
      if(arguments.length > 1) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__7864__delegate.call(this, f, args)
    };
    G__7864.cljs$lang$maxFixedArity = 1;
    G__7864.cljs$lang$applyTo = function(arglist__7865) {
      var f = cljs.core.first(arglist__7865);
      var args = cljs.core.rest(arglist__7865);
      return G__7864__delegate(f, args)
    };
    G__7864.cljs$core$IFn$_invoke$arity$variadic = G__7864__delegate;
    return G__7864
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__1.call(this, f);
      default:
        return trampoline__2.cljs$core$IFn$_invoke$arity$variadic(f, cljs.core.array_seq(arguments, 1))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__2.cljs$lang$applyTo;
  trampoline.cljs$core$IFn$_invoke$arity$1 = trampoline__1;
  trampoline.cljs$core$IFn$_invoke$arity$variadic = trampoline__2.cljs$core$IFn$_invoke$arity$variadic;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return rand.call(null, 1)
  };
  var rand__1 = function(n) {
    return Math.random.call(null) * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  rand.cljs$core$IFn$_invoke$arity$0 = rand__0;
  rand.cljs$core$IFn$_invoke$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return Math.floor.call(null, Math.random.call(null) * n)
};
cljs.core.rand_nth = function rand_nth(coll) {
  return cljs.core.nth.call(null, coll, cljs.core.rand_int.call(null, cljs.core.count.call(null, coll)))
};
cljs.core.group_by = function group_by(f, coll) {
  return cljs.core.reduce.call(null, function(ret, x) {
    var k = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k, cljs.core.conj.call(null, cljs.core.get.call(null, ret, k, cljs.core.PersistentVector.EMPTY), x))
  }, cljs.core.ObjMap.EMPTY, coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.PersistentArrayMap.fromArray(["\ufdd0:parents", cljs.core.ObjMap.EMPTY, "\ufdd0:descendants", cljs.core.ObjMap.EMPTY, "\ufdd0:ancestors", cljs.core.ObjMap.EMPTY], true)
};
cljs.core._global_hierarchy = null;
cljs.core.get_global_hierarchy = function get_global_hierarchy() {
  if(cljs.core._global_hierarchy == null) {
    cljs.core._global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null))
  }else {
  }
  return cljs.core._global_hierarchy
};
cljs.core.swap_global_hierarchy_BANG_ = function() {
  var swap_global_hierarchy_BANG___delegate = function(f, args) {
    return cljs.core.apply.call(null, cljs.core.swap_BANG_, cljs.core.get_global_hierarchy.call(null), f, args)
  };
  var swap_global_hierarchy_BANG_ = function(f, var_args) {
    var args = null;
    if(arguments.length > 1) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return swap_global_hierarchy_BANG___delegate.call(this, f, args)
  };
  swap_global_hierarchy_BANG_.cljs$lang$maxFixedArity = 1;
  swap_global_hierarchy_BANG_.cljs$lang$applyTo = function(arglist__7866) {
    var f = cljs.core.first(arglist__7866);
    var args = cljs.core.rest(arglist__7866);
    return swap_global_hierarchy_BANG___delegate(f, args)
  };
  swap_global_hierarchy_BANG_.cljs$core$IFn$_invoke$arity$variadic = swap_global_hierarchy_BANG___delegate;
  return swap_global_hierarchy_BANG_
}();
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___2 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.get_global_hierarchy.call(null)), child, parent)
  };
  var isa_QMARK___3 = function(h, child, parent) {
    var or__3943__auto__ = cljs.core._EQ_.call(null, child, parent);
    if(or__3943__auto__) {
      return or__3943__auto__
    }else {
      var or__3943__auto____$1 = cljs.core.contains_QMARK_.call(null, (new cljs.core.Keyword("\ufdd0:ancestors")).call(null, h).call(null, child), parent);
      if(or__3943__auto____$1) {
        return or__3943__auto____$1
      }else {
        var and__3941__auto__ = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3941__auto__) {
          var and__3941__auto____$1 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3941__auto____$1) {
            var and__3941__auto____$2 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3941__auto____$2) {
              var ret = true;
              var i = 0;
              while(true) {
                if(function() {
                  var or__3943__auto____$2 = cljs.core.not.call(null, ret);
                  if(or__3943__auto____$2) {
                    return or__3943__auto____$2
                  }else {
                    return i === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret
                }else {
                  var G__7867 = isa_QMARK_.call(null, h, child.call(null, i), parent.call(null, i));
                  var G__7868 = i + 1;
                  ret = G__7867;
                  i = G__7868;
                  continue
                }
                break
              }
            }else {
              return and__3941__auto____$2
            }
          }else {
            return and__3941__auto____$1
          }
        }else {
          return and__3941__auto__
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___2.call(this, h, child);
      case 3:
        return isa_QMARK___3.call(this, h, child, parent)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  isa_QMARK_.cljs$core$IFn$_invoke$arity$2 = isa_QMARK___2;
  isa_QMARK_.cljs$core$IFn$_invoke$arity$3 = isa_QMARK___3;
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__1 = function(tag) {
    return parents.call(null, cljs.core.deref.call(null, cljs.core.get_global_hierarchy.call(null)), tag)
  };
  var parents__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, (new cljs.core.Keyword("\ufdd0:parents")).call(null, h), tag))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__1.call(this, h);
      case 2:
        return parents__2.call(this, h, tag)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  parents.cljs$core$IFn$_invoke$arity$1 = parents__1;
  parents.cljs$core$IFn$_invoke$arity$2 = parents__2;
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__1 = function(tag) {
    return ancestors.call(null, cljs.core.deref.call(null, cljs.core.get_global_hierarchy.call(null)), tag)
  };
  var ancestors__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, (new cljs.core.Keyword("\ufdd0:ancestors")).call(null, h), tag))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__1.call(this, h);
      case 2:
        return ancestors__2.call(this, h, tag)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  ancestors.cljs$core$IFn$_invoke$arity$1 = ancestors__1;
  ancestors.cljs$core$IFn$_invoke$arity$2 = ancestors__2;
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__1 = function(tag) {
    return descendants.call(null, cljs.core.deref.call(null, cljs.core.get_global_hierarchy.call(null)), tag)
  };
  var descendants__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, (new cljs.core.Keyword("\ufdd0:descendants")).call(null, h), tag))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__1.call(this, h);
      case 2:
        return descendants__2.call(this, h, tag)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  descendants.cljs$core$IFn$_invoke$arity$1 = descendants__1;
  descendants.cljs$core$IFn$_invoke$arity$2 = descendants__2;
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__2 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace.call(null, parent))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list(new cljs.core.Symbol(null, "namespace", "namespace", -388313324, null), new cljs.core.Symbol(null, "parent", "parent", 1659011683, null)), cljs.core.hash_map("\ufdd0:line", 7014, "\ufdd0:column", 12))))].join(""));
    }
    cljs.core.swap_global_hierarchy_BANG_.call(null, derive, tag, parent);
    return null
  };
  var derive__3 = function(h, tag, parent) {
    if(cljs.core.not_EQ_.call(null, tag, parent)) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list(new cljs.core.Symbol(null, "not=", "not=", -1637144189, null), new cljs.core.Symbol(null, "tag", "tag", -1640416941, null), new cljs.core.Symbol(null, "parent", "parent", 1659011683, null)), cljs.core.hash_map("\ufdd0:line", 7018, "\ufdd0:column", 12))))].join(""));
    }
    var tp = (new cljs.core.Keyword("\ufdd0:parents")).call(null, h);
    var td = (new cljs.core.Keyword("\ufdd0:descendants")).call(null, h);
    var ta = (new cljs.core.Keyword("\ufdd0:ancestors")).call(null, h);
    var tf = function(tp, td, ta) {
      return function(m, source, sources, target, targets) {
        return cljs.core.reduce.call(null, function(tp, td, ta) {
          return function(ret, k) {
            return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.get.call(null, targets, k, cljs.core.PersistentHashSet.EMPTY), cljs.core.cons.call(null, target, targets.call(null, target))))
          }
        }(tp, td, ta), m, cljs.core.cons.call(null, source, sources.call(null, source)))
      }
    }(tp, td, ta);
    var or__3943__auto__ = cljs.core.contains_QMARK_.call(null, tp.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.PersistentArrayMap.fromArray(["\ufdd0:parents", cljs.core.assoc.call(null, (new cljs.core.Keyword("\ufdd0:parents")).call(null, h), tag, cljs.core.conj.call(null, cljs.core.get.call(null, tp, tag, cljs.core.PersistentHashSet.EMPTY), parent)), "\ufdd0:ancestors", tf.call(null, (new cljs.core.Keyword("\ufdd0:ancestors")).call(null, h), tag, td, parent, ta), "\ufdd0:descendants", tf.call(null, (new cljs.core.Keyword("\ufdd0:descendants")).call(null, h), parent, ta, tag, td)], 
      true)
    }();
    if(cljs.core.truth_(or__3943__auto__)) {
      return or__3943__auto__
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__2.call(this, h, tag);
      case 3:
        return derive__3.call(this, h, tag, parent)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  derive.cljs$core$IFn$_invoke$arity$2 = derive__2;
  derive.cljs$core$IFn$_invoke$arity$3 = derive__3;
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__2 = function(tag, parent) {
    cljs.core.swap_global_hierarchy_BANG_.call(null, underive, tag, parent);
    return null
  };
  var underive__3 = function(h, tag, parent) {
    var parentMap = (new cljs.core.Keyword("\ufdd0:parents")).call(null, h);
    var childsParents = cljs.core.truth_(parentMap.call(null, tag)) ? cljs.core.disj.call(null, parentMap.call(null, tag), parent) : cljs.core.PersistentHashSet.EMPTY;
    var newParents = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents)) ? cljs.core.assoc.call(null, parentMap, tag, childsParents) : cljs.core.dissoc.call(null, parentMap, tag);
    var deriv_seq = cljs.core.flatten.call(null, cljs.core.map.call(null, function(parentMap, childsParents, newParents) {
      return function(p1__7869_SHARP_) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, p1__7869_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__7869_SHARP_), cljs.core.second.call(null, p1__7869_SHARP_)))
      }
    }(parentMap, childsParents, newParents), cljs.core.seq.call(null, newParents)));
    if(cljs.core.contains_QMARK_.call(null, parentMap.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__7870_SHARP_, p2__7871_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__7870_SHARP_, p2__7871_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__2.call(this, h, tag);
      case 3:
        return underive__3.call(this, h, tag, parent)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  underive.cljs$core$IFn$_invoke$arity$2 = underive__2;
  underive.cljs$core$IFn$_invoke$arity$3 = underive__3;
  return underive
}();
cljs.core.reset_cache = function reset_cache(method_cache, method_table, cached_hierarchy, hierarchy) {
  cljs.core.swap_BANG_.call(null, method_cache, function(_) {
    return cljs.core.deref.call(null, method_table)
  });
  return cljs.core.swap_BANG_.call(null, cached_hierarchy, function(_) {
    return cljs.core.deref.call(null, hierarchy)
  })
};
cljs.core.prefers_STAR_ = function prefers_STAR_(x, y, prefer_table) {
  var xprefs = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3943__auto__ = cljs.core.truth_(function() {
    var and__3941__auto__ = xprefs;
    if(cljs.core.truth_(and__3941__auto__)) {
      return xprefs.call(null, y)
    }else {
      return and__3941__auto__
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3943__auto__)) {
    return or__3943__auto__
  }else {
    var or__3943__auto____$1 = function() {
      var ps = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps), prefer_table))) {
          }else {
          }
          var G__7872 = cljs.core.rest.call(null, ps);
          ps = G__7872;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3943__auto____$1)) {
      return or__3943__auto____$1
    }else {
      var or__3943__auto____$2 = function() {
        var ps = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps), y, prefer_table))) {
            }else {
            }
            var G__7873 = cljs.core.rest.call(null, ps);
            ps = G__7873;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3943__auto____$2)) {
        return or__3943__auto____$2
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3943__auto__ = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3943__auto__)) {
    return or__3943__auto__
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry = cljs.core.reduce.call(null, function(be, p__7876) {
    var vec__7877 = p__7876;
    var k = cljs.core.nth.call(null, vec__7877, 0, null);
    var _ = cljs.core.nth.call(null, vec__7877, 1, null);
    var e = vec__7877;
    if(cljs.core.isa_QMARK_.call(null, cljs.core.deref.call(null, hierarchy), dispatch_val, k)) {
      var be2 = cljs.core.truth_(function() {
        var or__3943__auto__ = be == null;
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          return cljs.core.dominates.call(null, k, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2), k, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry));
      return cljs.core.second.call(null, best_entry)
    }else {
      cljs.core.reset_cache.call(null, method_cache, method_table, cached_hierarchy, hierarchy);
      return find_and_cache_best_method.call(null, name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy)
    }
  }else {
    return null
  }
};
cljs.core.IMultiFn = {};
cljs.core._reset = function _reset(mf) {
  if(function() {
    var and__3941__auto__ = mf;
    if(and__3941__auto__) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    var x__6521__auto__ = mf == null ? null : mf;
    return function() {
      var or__3943__auto__ = cljs.core._reset[goog.typeOf(x__6521__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._reset["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3941__auto__ = mf;
    if(and__3941__auto__) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3941__auto__
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    var x__6521__auto__ = mf == null ? null : mf;
    return function() {
      var or__3943__auto__ = cljs.core._add_method[goog.typeOf(x__6521__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._add_method["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3941__auto__ = mf;
    if(and__3941__auto__) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    var x__6521__auto__ = mf == null ? null : mf;
    return function() {
      var or__3943__auto__ = cljs.core._remove_method[goog.typeOf(x__6521__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._remove_method["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3941__auto__ = mf;
    if(and__3941__auto__) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3941__auto__
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    var x__6521__auto__ = mf == null ? null : mf;
    return function() {
      var or__3943__auto__ = cljs.core._prefer_method[goog.typeOf(x__6521__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._prefer_method["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3941__auto__ = mf;
    if(and__3941__auto__) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    var x__6521__auto__ = mf == null ? null : mf;
    return function() {
      var or__3943__auto__ = cljs.core._get_method[goog.typeOf(x__6521__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._get_method["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3941__auto__ = mf;
    if(and__3941__auto__) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    var x__6521__auto__ = mf == null ? null : mf;
    return function() {
      var or__3943__auto__ = cljs.core._methods[goog.typeOf(x__6521__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._methods["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3941__auto__ = mf;
    if(and__3941__auto__) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    var x__6521__auto__ = mf == null ? null : mf;
    return function() {
      var or__3943__auto__ = cljs.core._prefers[goog.typeOf(x__6521__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._prefers["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3941__auto__ = mf;
    if(and__3941__auto__) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    var x__6521__auto__ = mf == null ? null : mf;
    return function() {
      var or__3943__auto__ = cljs.core._dispatch[goog.typeOf(x__6521__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._dispatch["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn = cljs.core._get_method.call(null, mf, dispatch_val);
  if(cljs.core.truth_(target_fn)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val)].join(""));
  }
  return cljs.core.apply.call(null, target_fn, args)
};
goog.provide("cljs.core.MultiFn");
cljs.core.MultiFn = function(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  this.name = name;
  this.dispatch_fn = dispatch_fn;
  this.default_dispatch_val = default_dispatch_val;
  this.hierarchy = hierarchy;
  this.method_table = method_table;
  this.prefer_table = prefer_table;
  this.method_cache = method_cache;
  this.cached_hierarchy = cached_hierarchy;
  this.cljs$lang$protocol_mask$partition0$ = 4194304;
  this.cljs$lang$protocol_mask$partition1$ = 256
};
cljs.core.MultiFn.cljs$lang$type = true;
cljs.core.MultiFn.cljs$lang$ctorStr = "cljs.core/MultiFn";
cljs.core.MultiFn.cljs$lang$ctorPrWriter = function(this__6461__auto__, writer__6462__auto__, opt__6463__auto__) {
  return cljs.core._write.call(null, writer__6462__auto__, "cljs.core/MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var self__ = this;
  return goog.getUid(this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var self__ = this;
  cljs.core.swap_BANG_.call(null, self__.method_table, function(mf__$1) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, self__.method_cache, function(mf__$1) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, self__.prefer_table, function(mf__$1) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, self__.cached_hierarchy, function(mf__$1) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var self__ = this;
  cljs.core.swap_BANG_.call(null, self__.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, self__.method_cache, self__.method_table, self__.cached_hierarchy, self__.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var self__ = this;
  cljs.core.swap_BANG_.call(null, self__.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, self__.method_cache, self__.method_table, self__.cached_hierarchy, self__.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var self__ = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, self__.cached_hierarchy), cljs.core.deref.call(null, self__.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, self__.method_cache, self__.method_table, self__.cached_hierarchy, self__.hierarchy)
  }
  var temp__4090__auto__ = cljs.core.deref.call(null, self__.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__4090__auto__)) {
    var target_fn = temp__4090__auto__;
    return target_fn
  }else {
    var temp__4090__auto____$1 = cljs.core.find_and_cache_best_method.call(null, self__.name, dispatch_val, self__.hierarchy, self__.method_table, self__.prefer_table, self__.method_cache, self__.cached_hierarchy);
    if(cljs.core.truth_(temp__4090__auto____$1)) {
      var target_fn = temp__4090__auto____$1;
      return target_fn
    }else {
      return cljs.core.deref.call(null, self__.method_table).call(null, self__.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var self__ = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, self__.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(self__.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, self__.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core.get.call(null, old, dispatch_val_x, cljs.core.PersistentHashSet.EMPTY), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, self__.method_cache, self__.method_table, self__.cached_hierarchy, self__.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var self__ = this;
  return cljs.core.deref.call(null, self__.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var self__ = this;
  return cljs.core.deref.call(null, self__.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var self__ = this;
  return cljs.core.do_dispatch.call(null, mf, self__.dispatch_fn, args)
};
cljs.core.MultiFn.prototype.call = function() {
  var G__7878__delegate = function(_, args) {
    var self = this;
    return cljs.core._dispatch.call(null, self, args)
  };
  var G__7878 = function(_, var_args) {
    var args = null;
    if(arguments.length > 1) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__7878__delegate.call(this, _, args)
  };
  G__7878.cljs$lang$maxFixedArity = 1;
  G__7878.cljs$lang$applyTo = function(arglist__7879) {
    var _ = cljs.core.first(arglist__7879);
    var args = cljs.core.rest(arglist__7879);
    return G__7878__delegate(_, args)
  };
  G__7878.cljs$core$IFn$_invoke$arity$variadic = G__7878__delegate;
  return G__7878
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  var self = this;
  return cljs.core._dispatch.call(null, self, args)
};
cljs.core.remove_all_methods = function remove_all_methods(multifn) {
  return cljs.core._reset.call(null, multifn)
};
cljs.core.remove_method = function remove_method(multifn, dispatch_val) {
  return cljs.core._remove_method.call(null, multifn, dispatch_val)
};
cljs.core.prefer_method = function prefer_method(multifn, dispatch_val_x, dispatch_val_y) {
  return cljs.core._prefer_method.call(null, multifn, dispatch_val_x, dispatch_val_y)
};
cljs.core.methods$ = function methods$(multifn) {
  return cljs.core._methods.call(null, multifn)
};
cljs.core.get_method = function get_method(multifn, dispatch_val) {
  return cljs.core._get_method.call(null, multifn, dispatch_val)
};
cljs.core.prefers = function prefers(multifn) {
  return cljs.core._prefers.call(null, multifn)
};
goog.provide("cljs.core.UUID");
cljs.core.UUID = function(uuid) {
  this.uuid = uuid;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2153775104
};
cljs.core.UUID.cljs$lang$type = true;
cljs.core.UUID.cljs$lang$ctorStr = "cljs.core/UUID";
cljs.core.UUID.cljs$lang$ctorPrWriter = function(this__6461__auto__, writer__6462__auto__, opt__6463__auto__) {
  return cljs.core._write.call(null, writer__6462__auto__, "cljs.core/UUID")
};
cljs.core.UUID.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var self__ = this;
  return goog.string.hashCode(cljs.core.pr_str.call(null, this$))
};
cljs.core.UUID.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(_, writer, ___$1) {
  var self__ = this;
  return cljs.core._write.call(null, writer, [cljs.core.str('#uuid "'), cljs.core.str(self__.uuid), cljs.core.str('"')].join(""))
};
cljs.core.UUID.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var self__ = this;
  var and__3941__auto__ = other instanceof cljs.core.UUID;
  if(and__3941__auto__) {
    return self__.uuid === other.uuid
  }else {
    return and__3941__auto__
  }
};
goog.provide("cljs.core.ExceptionInfo");
cljs.core.ExceptionInfo = function(message, data, cause) {
  this.message = message;
  this.data = data;
  this.cause = cause
};
cljs.core.ExceptionInfo.cljs$lang$type = true;
cljs.core.ExceptionInfo.cljs$lang$ctorStr = "cljs.core/ExceptionInfo";
cljs.core.ExceptionInfo.cljs$lang$ctorPrWriter = function(this__6464__auto__, writer__6465__auto__, opts__6466__auto__) {
  return cljs.core._write.call(null, writer__6465__auto__, "cljs.core/ExceptionInfo")
};
cljs.core.ExceptionInfo.prototype = new Error;
cljs.core.ExceptionInfo.prototype.constructor = cljs.core.ExceptionInfo;
cljs.core.ex_info = function() {
  var ex_info = null;
  var ex_info__2 = function(msg, map) {
    return new cljs.core.ExceptionInfo(msg, map, null)
  };
  var ex_info__3 = function(msg, map, cause) {
    return new cljs.core.ExceptionInfo(msg, map, cause)
  };
  ex_info = function(msg, map, cause) {
    switch(arguments.length) {
      case 2:
        return ex_info__2.call(this, msg, map);
      case 3:
        return ex_info__3.call(this, msg, map, cause)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  ex_info.cljs$core$IFn$_invoke$arity$2 = ex_info__2;
  ex_info.cljs$core$IFn$_invoke$arity$3 = ex_info__3;
  return ex_info
}();
cljs.core.ex_data = function ex_data(ex) {
  if(ex instanceof cljs.core.ExceptionInfo) {
    return ex.data
  }else {
    return null
  }
};
cljs.core.ex_message = function ex_message(ex) {
  if(ex instanceof Error) {
    return ex.message
  }else {
    return null
  }
};
cljs.core.ex_cause = function ex_cause(ex) {
  if(ex instanceof cljs.core.ExceptionInfo) {
    return ex.cause
  }else {
    return null
  }
};
cljs.core.comparator = function comparator(pred) {
  return function(x, y) {
    if(cljs.core.truth_(pred.call(null, x, y))) {
      return-1
    }else {
      if(cljs.core.truth_(pred.call(null, y, x))) {
        return 1
      }else {
        if("\ufdd0:else") {
          return 0
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.special_symbol_QMARK_ = function special_symbol_QMARK_(x) {
  return cljs.core.contains_QMARK_.call(null, cljs.core.set([new cljs.core.Symbol(null, "deftype*", "deftype*", -978581244, null), new cljs.core.Symbol(null, "new", "new", -1640422567, null), new cljs.core.Symbol(null, "try*", "try*", -1636962424, null), new cljs.core.Symbol(null, "quote", "quote", -1532577739, null), new cljs.core.Symbol(null, "&", "&", -1640531489, null), new cljs.core.Symbol(null, "set!", "set!", -1637004872, null), new cljs.core.Symbol(null, "recur", "recur", -1532142362, null), 
  new cljs.core.Symbol(null, ".", ".", -1640531481, null), new cljs.core.Symbol(null, "ns", "ns", -1640528002, null), new cljs.core.Symbol(null, "do", "do", -1640528316, null), new cljs.core.Symbol(null, "fn*", "fn*", -1640430053, null), new cljs.core.Symbol(null, "throw", "throw", -1530191713, null), new cljs.core.Symbol(null, "letfn*", "letfn*", 1548249632, null), new cljs.core.Symbol(null, "js*", "js*", -1640426054, null), new cljs.core.Symbol(null, "defrecord*", "defrecord*", 774272013, null), 
  new cljs.core.Symbol(null, "let*", "let*", -1637213400, null), new cljs.core.Symbol(null, "loop*", "loop*", -1537374273, null), new cljs.core.Symbol(null, "if", "if", -1640528170, null), new cljs.core.Symbol(null, "def", "def", -1640432194, null)]), x)
};
goog.provide("goog.userAgent");
goog.require("goog.string");
goog.userAgent.ASSUME_IE = false;
goog.userAgent.ASSUME_GECKO = false;
goog.userAgent.ASSUME_WEBKIT = false;
goog.userAgent.ASSUME_MOBILE_WEBKIT = false;
goog.userAgent.ASSUME_OPERA = false;
goog.userAgent.ASSUME_ANY_VERSION = false;
goog.userAgent.BROWSER_KNOWN_ = goog.userAgent.ASSUME_IE || goog.userAgent.ASSUME_GECKO || goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_OPERA;
goog.userAgent.getUserAgentString = function() {
  return goog.global["navigator"] ? goog.global["navigator"].userAgent : null
};
goog.userAgent.getNavigator = function() {
  return goog.global["navigator"]
};
goog.userAgent.init_ = function() {
  goog.userAgent.detectedOpera_ = false;
  goog.userAgent.detectedIe_ = false;
  goog.userAgent.detectedWebkit_ = false;
  goog.userAgent.detectedMobile_ = false;
  goog.userAgent.detectedGecko_ = false;
  var ua;
  if(!goog.userAgent.BROWSER_KNOWN_ && (ua = goog.userAgent.getUserAgentString())) {
    var navigator = goog.userAgent.getNavigator();
    goog.userAgent.detectedOpera_ = ua.indexOf("Opera") == 0;
    goog.userAgent.detectedIe_ = !goog.userAgent.detectedOpera_ && ua.indexOf("MSIE") != -1;
    goog.userAgent.detectedWebkit_ = !goog.userAgent.detectedOpera_ && ua.indexOf("WebKit") != -1;
    goog.userAgent.detectedMobile_ = goog.userAgent.detectedWebkit_ && ua.indexOf("Mobile") != -1;
    goog.userAgent.detectedGecko_ = !goog.userAgent.detectedOpera_ && !goog.userAgent.detectedWebkit_ && navigator.product == "Gecko"
  }
};
if(!goog.userAgent.BROWSER_KNOWN_) {
  goog.userAgent.init_()
}
goog.userAgent.OPERA = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_OPERA : goog.userAgent.detectedOpera_;
goog.userAgent.IE = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_IE : goog.userAgent.detectedIe_;
goog.userAgent.GECKO = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_GECKO : goog.userAgent.detectedGecko_;
goog.userAgent.WEBKIT = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_MOBILE_WEBKIT : goog.userAgent.detectedWebkit_;
goog.userAgent.MOBILE = goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.detectedMobile_;
goog.userAgent.SAFARI = goog.userAgent.WEBKIT;
goog.userAgent.determinePlatform_ = function() {
  var navigator = goog.userAgent.getNavigator();
  return navigator && navigator.platform || ""
};
goog.userAgent.PLATFORM = goog.userAgent.determinePlatform_();
goog.userAgent.ASSUME_MAC = false;
goog.userAgent.ASSUME_WINDOWS = false;
goog.userAgent.ASSUME_LINUX = false;
goog.userAgent.ASSUME_X11 = false;
goog.userAgent.PLATFORM_KNOWN_ = goog.userAgent.ASSUME_MAC || goog.userAgent.ASSUME_WINDOWS || goog.userAgent.ASSUME_LINUX || goog.userAgent.ASSUME_X11;
goog.userAgent.initPlatform_ = function() {
  goog.userAgent.detectedMac_ = goog.string.contains(goog.userAgent.PLATFORM, "Mac");
  goog.userAgent.detectedWindows_ = goog.string.contains(goog.userAgent.PLATFORM, "Win");
  goog.userAgent.detectedLinux_ = goog.string.contains(goog.userAgent.PLATFORM, "Linux");
  goog.userAgent.detectedX11_ = !!goog.userAgent.getNavigator() && goog.string.contains(goog.userAgent.getNavigator()["appVersion"] || "", "X11")
};
if(!goog.userAgent.PLATFORM_KNOWN_) {
  goog.userAgent.initPlatform_()
}
goog.userAgent.MAC = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_MAC : goog.userAgent.detectedMac_;
goog.userAgent.WINDOWS = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_WINDOWS : goog.userAgent.detectedWindows_;
goog.userAgent.LINUX = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_LINUX : goog.userAgent.detectedLinux_;
goog.userAgent.X11 = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_X11 : goog.userAgent.detectedX11_;
goog.userAgent.determineVersion_ = function() {
  var version = "", re;
  if(goog.userAgent.OPERA && goog.global["opera"]) {
    var operaVersion = goog.global["opera"].version;
    version = typeof operaVersion == "function" ? operaVersion() : operaVersion
  }else {
    if(goog.userAgent.GECKO) {
      re = /rv\:([^\);]+)(\)|;)/
    }else {
      if(goog.userAgent.IE) {
        re = /MSIE\s+([^\);]+)(\)|;)/
      }else {
        if(goog.userAgent.WEBKIT) {
          re = /WebKit\/(\S+)/
        }
      }
    }
    if(re) {
      var arr = re.exec(goog.userAgent.getUserAgentString());
      version = arr ? arr[1] : ""
    }
  }
  if(goog.userAgent.IE) {
    var docMode = goog.userAgent.getDocumentMode_();
    if(docMode > parseFloat(version)) {
      return String(docMode)
    }
  }
  return version
};
goog.userAgent.getDocumentMode_ = function() {
  var doc = goog.global["document"];
  return doc ? doc["documentMode"] : undefined
};
goog.userAgent.VERSION = goog.userAgent.determineVersion_();
goog.userAgent.compare = function(v1, v2) {
  return goog.string.compareVersions(v1, v2)
};
goog.userAgent.isVersionCache_ = {};
goog.userAgent.isVersion = function(version) {
  return goog.userAgent.ASSUME_ANY_VERSION || goog.userAgent.isVersionCache_[version] || (goog.userAgent.isVersionCache_[version] = goog.string.compareVersions(goog.userAgent.VERSION, version) >= 0)
};
goog.userAgent.isDocumentModeCache_ = {};
goog.userAgent.isDocumentMode = function(documentMode) {
  return goog.userAgent.isDocumentModeCache_[documentMode] || (goog.userAgent.isDocumentModeCache_[documentMode] = goog.userAgent.IE && !!document.documentMode && document.documentMode >= documentMode)
};
goog.provide("goog.events.EventType");
goog.require("goog.userAgent");
goog.events.EventType = {CLICK:"click", DBLCLICK:"dblclick", MOUSEDOWN:"mousedown", MOUSEUP:"mouseup", MOUSEOVER:"mouseover", MOUSEOUT:"mouseout", MOUSEMOVE:"mousemove", SELECTSTART:"selectstart", KEYPRESS:"keypress", KEYDOWN:"keydown", KEYUP:"keyup", BLUR:"blur", FOCUS:"focus", DEACTIVATE:"deactivate", FOCUSIN:goog.userAgent.IE ? "focusin" : "DOMFocusIn", FOCUSOUT:goog.userAgent.IE ? "focusout" : "DOMFocusOut", CHANGE:"change", SELECT:"select", SUBMIT:"submit", INPUT:"input", PROPERTYCHANGE:"propertychange", 
DRAGSTART:"dragstart", DRAGENTER:"dragenter", DRAGOVER:"dragover", DRAGLEAVE:"dragleave", DROP:"drop", TOUCHSTART:"touchstart", TOUCHMOVE:"touchmove", TOUCHEND:"touchend", TOUCHCANCEL:"touchcancel", CONTEXTMENU:"contextmenu", ERROR:"error", HELP:"help", LOAD:"load", LOSECAPTURE:"losecapture", READYSTATECHANGE:"readystatechange", RESIZE:"resize", SCROLL:"scroll", UNLOAD:"unload", HASHCHANGE:"hashchange", PAGEHIDE:"pagehide", PAGESHOW:"pageshow", POPSTATE:"popstate", COPY:"copy", PASTE:"paste", CUT:"cut", 
BEFORECOPY:"beforecopy", BEFORECUT:"beforecut", BEFOREPASTE:"beforepaste", ONLINE:"online", OFFLINE:"offline", MESSAGE:"message", CONNECT:"connect", TRANSITIONEND:goog.userAgent.WEBKIT ? "webkitTransitionEnd" : goog.userAgent.OPERA ? "oTransitionEnd" : "transitionend"};
goog.provide("goog.disposable.IDisposable");
goog.disposable.IDisposable = function() {
};
goog.disposable.IDisposable.prototype.dispose;
goog.disposable.IDisposable.prototype.isDisposed;
goog.provide("goog.Disposable");
goog.provide("goog.dispose");
goog.require("goog.disposable.IDisposable");
goog.Disposable = function() {
  this.disposed_ = false;
  if(goog.Disposable.ENABLE_MONITORING) {
    this.creationStack = (new Error).stack;
    goog.Disposable.instances_[goog.getUid(this)] = this
  }
};
goog.Disposable.ENABLE_MONITORING = false;
goog.Disposable.instances_ = {};
goog.Disposable.getUndisposedObjects = function() {
  var ret = [];
  for(var id in goog.Disposable.instances_) {
    if(goog.Disposable.instances_.hasOwnProperty(id)) {
      ret.push(goog.Disposable.instances_[Number(id)])
    }
  }
  return ret
};
goog.Disposable.clearUndisposedObjects = function() {
  goog.Disposable.instances_ = {}
};
goog.Disposable.prototype.dependentDisposables_;
goog.Disposable.prototype.onDisposeCallbacks_;
goog.Disposable.prototype.creationStack;
goog.Disposable.prototype.isDisposed = function() {
  return!!this.disposed_
};
goog.Disposable.prototype.getDisposed = goog.Disposable.prototype.isDisposed;
goog.Disposable.prototype.dispose = function() {
  if(!this.disposed_) {
    if(goog.Disposable.ENABLE_MONITORING) {
      if(this.disposed_ == undefined) {
        throw Error(this + " did not call the goog.Disposable base " + "constructor");
      }
      var uid = goog.getUid(this);
      delete goog.Disposable.instances_[uid]
    }
    this.disposed_ = true;
    this.disposeInternal()
  }
};
goog.Disposable.prototype.registerDisposable = function(disposable) {
  if(!this.dependentDisposables_) {
    this.dependentDisposables_ = []
  }
  this.dependentDisposables_.push(disposable)
};
goog.Disposable.prototype.addOnDisposeCallback = function(callback, opt_scope) {
  if(!this.onDisposeCallbacks_) {
    this.onDisposeCallbacks_ = []
  }
  this.onDisposeCallbacks_.push(goog.bind(callback, opt_scope))
};
goog.Disposable.prototype.disposeInternal = function() {
  if(this.dependentDisposables_) {
    goog.disposeAll.apply(null, this.dependentDisposables_)
  }
  if(this.onDisposeCallbacks_) {
    while(this.onDisposeCallbacks_.length) {
      this.onDisposeCallbacks_.shift()()
    }
  }
};
goog.dispose = function(obj) {
  if(obj && typeof obj.dispose == "function") {
    obj.dispose()
  }
};
goog.disposeAll = function(var_args) {
  for(var i = 0, len = arguments.length;i < len;++i) {
    var disposable = arguments[i];
    if(goog.isArrayLike(disposable)) {
      goog.disposeAll.apply(null, disposable)
    }else {
      goog.dispose(disposable)
    }
  }
};
goog.provide("goog.debug.EntryPointMonitor");
goog.provide("goog.debug.entryPointRegistry");
goog.require("goog.asserts");
goog.debug.EntryPointMonitor = function() {
};
goog.debug.EntryPointMonitor.prototype.wrap;
goog.debug.EntryPointMonitor.prototype.unwrap;
goog.debug.entryPointRegistry.refList_ = [];
goog.debug.entryPointRegistry.monitors_ = [];
goog.debug.entryPointRegistry.monitorsMayExist_ = false;
goog.debug.entryPointRegistry.register = function(callback) {
  goog.debug.entryPointRegistry.refList_[goog.debug.entryPointRegistry.refList_.length] = callback;
  if(goog.debug.entryPointRegistry.monitorsMayExist_) {
    var monitors = goog.debug.entryPointRegistry.monitors_;
    for(var i = 0;i < monitors.length;i++) {
      callback(goog.bind(monitors[i].wrap, monitors[i]))
    }
  }
};
goog.debug.entryPointRegistry.monitorAll = function(monitor) {
  goog.debug.entryPointRegistry.monitorsMayExist_ = true;
  var transformer = goog.bind(monitor.wrap, monitor);
  for(var i = 0;i < goog.debug.entryPointRegistry.refList_.length;i++) {
    goog.debug.entryPointRegistry.refList_[i](transformer)
  }
  goog.debug.entryPointRegistry.monitors_.push(monitor)
};
goog.debug.entryPointRegistry.unmonitorAllIfPossible = function(monitor) {
  var monitors = goog.debug.entryPointRegistry.monitors_;
  goog.asserts.assert(monitor == monitors[monitors.length - 1], "Only the most recent monitor can be unwrapped.");
  var transformer = goog.bind(monitor.unwrap, monitor);
  for(var i = 0;i < goog.debug.entryPointRegistry.refList_.length;i++) {
    goog.debug.entryPointRegistry.refList_[i](transformer)
  }
  monitors.length--
};
goog.provide("goog.debug.errorHandlerWeakDep");
goog.debug.errorHandlerWeakDep = {protectEntryPoint:function(fn, opt_tracers) {
  return fn
}};
goog.provide("goog.events.BrowserFeature");
goog.require("goog.userAgent");
goog.events.BrowserFeature = {HAS_W3C_BUTTON:!goog.userAgent.IE || goog.userAgent.isDocumentMode(9), HAS_W3C_EVENT_SUPPORT:!goog.userAgent.IE || goog.userAgent.isDocumentMode(9), SET_KEY_CODE_TO_PREVENT_DEFAULT:goog.userAgent.IE && !goog.userAgent.isVersion("8"), HAS_NAVIGATOR_ONLINE_PROPERTY:!goog.userAgent.WEBKIT || goog.userAgent.isVersion("528"), HAS_HTML5_NETWORK_EVENT_SUPPORT:goog.userAgent.GECKO && goog.userAgent.isVersion("1.9b") || goog.userAgent.IE && goog.userAgent.isVersion("8") || goog.userAgent.OPERA && 
goog.userAgent.isVersion("9.5") || goog.userAgent.WEBKIT && goog.userAgent.isVersion("528"), HTML5_NETWORK_EVENTS_FIRE_ON_BODY:goog.userAgent.GECKO && !goog.userAgent.isVersion("8") || goog.userAgent.IE && !goog.userAgent.isVersion("9")};
goog.provide("goog.events.Event");
goog.require("goog.Disposable");
goog.events.Event = function(type, opt_target) {
  this.type = type;
  this.target = opt_target;
  this.currentTarget = this.target
};
goog.events.Event.prototype.disposeInternal = function() {
};
goog.events.Event.prototype.dispose = function() {
};
goog.events.Event.prototype.propagationStopped_ = false;
goog.events.Event.prototype.defaultPrevented = false;
goog.events.Event.prototype.returnValue_ = true;
goog.events.Event.prototype.stopPropagation = function() {
  this.propagationStopped_ = true
};
goog.events.Event.prototype.preventDefault = function() {
  this.defaultPrevented = true;
  this.returnValue_ = false
};
goog.events.Event.stopPropagation = function(e) {
  e.stopPropagation()
};
goog.events.Event.preventDefault = function(e) {
  e.preventDefault()
};
goog.provide("goog.reflect");
goog.reflect.object = function(type, object) {
  return object
};
goog.reflect.sinkValue = function(x) {
  goog.reflect.sinkValue[" "](x);
  return x
};
goog.reflect.sinkValue[" "] = goog.nullFunction;
goog.reflect.canAccessProperty = function(obj, prop) {
  try {
    goog.reflect.sinkValue(obj[prop]);
    return true
  }catch(e) {
  }
  return false
};
goog.provide("goog.events.BrowserEvent");
goog.provide("goog.events.BrowserEvent.MouseButton");
goog.require("goog.events.BrowserFeature");
goog.require("goog.events.Event");
goog.require("goog.events.EventType");
goog.require("goog.reflect");
goog.require("goog.userAgent");
goog.events.BrowserEvent = function(opt_e, opt_currentTarget) {
  if(opt_e) {
    this.init(opt_e, opt_currentTarget)
  }
};
goog.inherits(goog.events.BrowserEvent, goog.events.Event);
goog.events.BrowserEvent.MouseButton = {LEFT:0, MIDDLE:1, RIGHT:2};
goog.events.BrowserEvent.IEButtonMap = [1, 4, 2];
goog.events.BrowserEvent.prototype.target = null;
goog.events.BrowserEvent.prototype.currentTarget;
goog.events.BrowserEvent.prototype.relatedTarget = null;
goog.events.BrowserEvent.prototype.offsetX = 0;
goog.events.BrowserEvent.prototype.offsetY = 0;
goog.events.BrowserEvent.prototype.clientX = 0;
goog.events.BrowserEvent.prototype.clientY = 0;
goog.events.BrowserEvent.prototype.screenX = 0;
goog.events.BrowserEvent.prototype.screenY = 0;
goog.events.BrowserEvent.prototype.button = 0;
goog.events.BrowserEvent.prototype.keyCode = 0;
goog.events.BrowserEvent.prototype.charCode = 0;
goog.events.BrowserEvent.prototype.ctrlKey = false;
goog.events.BrowserEvent.prototype.altKey = false;
goog.events.BrowserEvent.prototype.shiftKey = false;
goog.events.BrowserEvent.prototype.metaKey = false;
goog.events.BrowserEvent.prototype.state;
goog.events.BrowserEvent.prototype.platformModifierKey = false;
goog.events.BrowserEvent.prototype.event_ = null;
goog.events.BrowserEvent.prototype.init = function(e, opt_currentTarget) {
  var type = this.type = e.type;
  goog.events.Event.call(this, type);
  this.target = e.target || e.srcElement;
  this.currentTarget = opt_currentTarget;
  var relatedTarget = e.relatedTarget;
  if(relatedTarget) {
    if(goog.userAgent.GECKO) {
      if(!goog.reflect.canAccessProperty(relatedTarget, "nodeName")) {
        relatedTarget = null
      }
    }
  }else {
    if(type == goog.events.EventType.MOUSEOVER) {
      relatedTarget = e.fromElement
    }else {
      if(type == goog.events.EventType.MOUSEOUT) {
        relatedTarget = e.toElement
      }
    }
  }
  this.relatedTarget = relatedTarget;
  this.offsetX = goog.userAgent.WEBKIT || e.offsetX !== undefined ? e.offsetX : e.layerX;
  this.offsetY = goog.userAgent.WEBKIT || e.offsetY !== undefined ? e.offsetY : e.layerY;
  this.clientX = e.clientX !== undefined ? e.clientX : e.pageX;
  this.clientY = e.clientY !== undefined ? e.clientY : e.pageY;
  this.screenX = e.screenX || 0;
  this.screenY = e.screenY || 0;
  this.button = e.button;
  this.keyCode = e.keyCode || 0;
  this.charCode = e.charCode || (type == "keypress" ? e.keyCode : 0);
  this.ctrlKey = e.ctrlKey;
  this.altKey = e.altKey;
  this.shiftKey = e.shiftKey;
  this.metaKey = e.metaKey;
  this.platformModifierKey = goog.userAgent.MAC ? e.metaKey : e.ctrlKey;
  this.state = e.state;
  this.event_ = e;
  if(e.defaultPrevented) {
    this.preventDefault()
  }
  delete this.propagationStopped_
};
goog.events.BrowserEvent.prototype.isButton = function(button) {
  if(!goog.events.BrowserFeature.HAS_W3C_BUTTON) {
    if(this.type == "click") {
      return button == goog.events.BrowserEvent.MouseButton.LEFT
    }else {
      return!!(this.event_.button & goog.events.BrowserEvent.IEButtonMap[button])
    }
  }else {
    return this.event_.button == button
  }
};
goog.events.BrowserEvent.prototype.isMouseActionButton = function() {
  return this.isButton(goog.events.BrowserEvent.MouseButton.LEFT) && !(goog.userAgent.WEBKIT && goog.userAgent.MAC && this.ctrlKey)
};
goog.events.BrowserEvent.prototype.stopPropagation = function() {
  goog.events.BrowserEvent.superClass_.stopPropagation.call(this);
  if(this.event_.stopPropagation) {
    this.event_.stopPropagation()
  }else {
    this.event_.cancelBubble = true
  }
};
goog.events.BrowserEvent.prototype.preventDefault = function() {
  goog.events.BrowserEvent.superClass_.preventDefault.call(this);
  var be = this.event_;
  if(!be.preventDefault) {
    be.returnValue = false;
    if(goog.events.BrowserFeature.SET_KEY_CODE_TO_PREVENT_DEFAULT) {
      try {
        var VK_F1 = 112;
        var VK_F12 = 123;
        if(be.ctrlKey || be.keyCode >= VK_F1 && be.keyCode <= VK_F12) {
          be.keyCode = -1
        }
      }catch(ex) {
      }
    }
  }else {
    be.preventDefault()
  }
};
goog.events.BrowserEvent.prototype.getBrowserEvent = function() {
  return this.event_
};
goog.events.BrowserEvent.prototype.disposeInternal = function() {
};
goog.provide("goog.events.EventWrapper");
goog.events.EventWrapper = function() {
};
goog.events.EventWrapper.prototype.listen = function(src, listener, opt_capt, opt_scope, opt_eventHandler) {
};
goog.events.EventWrapper.prototype.unlisten = function(src, listener, opt_capt, opt_scope, opt_eventHandler) {
};
goog.provide("goog.events.Listener");
goog.events.Listener = function() {
  if(goog.events.Listener.ENABLE_MONITORING) {
    this.creationStack = (new Error).stack
  }
};
goog.events.Listener.counter_ = 0;
goog.events.Listener.ENABLE_MONITORING = false;
goog.events.Listener.prototype.isFunctionListener_;
goog.events.Listener.prototype.listener;
goog.events.Listener.prototype.proxy;
goog.events.Listener.prototype.src;
goog.events.Listener.prototype.type;
goog.events.Listener.prototype.capture;
goog.events.Listener.prototype.handler;
goog.events.Listener.prototype.key = 0;
goog.events.Listener.prototype.removed = false;
goog.events.Listener.prototype.callOnce = false;
goog.events.Listener.prototype.creationStack;
goog.events.Listener.prototype.init = function(listener, proxy, src, type, capture, opt_handler) {
  if(goog.isFunction(listener)) {
    this.isFunctionListener_ = true
  }else {
    if(listener && listener.handleEvent && goog.isFunction(listener.handleEvent)) {
      this.isFunctionListener_ = false
    }else {
      throw Error("Invalid listener argument");
    }
  }
  this.listener = listener;
  this.proxy = proxy;
  this.src = src;
  this.type = type;
  this.capture = !!capture;
  this.handler = opt_handler;
  this.callOnce = false;
  this.key = ++goog.events.Listener.counter_;
  this.removed = false
};
goog.events.Listener.prototype.handleEvent = function(eventObject) {
  if(this.isFunctionListener_) {
    return this.listener.call(this.handler || this.src, eventObject)
  }
  return this.listener.handleEvent.call(this.listener, eventObject)
};
goog.provide("goog.events");
goog.require("goog.array");
goog.require("goog.debug.entryPointRegistry");
goog.require("goog.debug.errorHandlerWeakDep");
goog.require("goog.events.BrowserEvent");
goog.require("goog.events.BrowserFeature");
goog.require("goog.events.Event");
goog.require("goog.events.EventWrapper");
goog.require("goog.events.Listener");
goog.require("goog.object");
goog.require("goog.userAgent");
goog.events.listeners_ = {};
goog.events.listenerTree_ = {};
goog.events.sources_ = {};
goog.events.onString_ = "on";
goog.events.onStringMap_ = {};
goog.events.keySeparator_ = "_";
goog.events.listen = function(src, type, listener, opt_capt, opt_handler) {
  if(!type) {
    throw Error("Invalid event type");
  }else {
    if(goog.isArray(type)) {
      for(var i = 0;i < type.length;i++) {
        goog.events.listen(src, type[i], listener, opt_capt, opt_handler)
      }
      return null
    }else {
      var capture = !!opt_capt;
      var map = goog.events.listenerTree_;
      if(!(type in map)) {
        map[type] = {count_:0, remaining_:0}
      }
      map = map[type];
      if(!(capture in map)) {
        map[capture] = {count_:0, remaining_:0};
        map.count_++
      }
      map = map[capture];
      var srcUid = goog.getUid(src);
      var listenerArray, listenerObj;
      map.remaining_++;
      if(!map[srcUid]) {
        listenerArray = map[srcUid] = [];
        map.count_++
      }else {
        listenerArray = map[srcUid];
        for(var i = 0;i < listenerArray.length;i++) {
          listenerObj = listenerArray[i];
          if(listenerObj.listener == listener && listenerObj.handler == opt_handler) {
            if(listenerObj.removed) {
              break
            }
            return listenerArray[i].key
          }
        }
      }
      var proxy = goog.events.getProxy();
      proxy.src = src;
      listenerObj = new goog.events.Listener;
      listenerObj.init(listener, proxy, src, type, capture, opt_handler);
      var key = listenerObj.key;
      proxy.key = key;
      listenerArray.push(listenerObj);
      goog.events.listeners_[key] = listenerObj;
      if(!goog.events.sources_[srcUid]) {
        goog.events.sources_[srcUid] = []
      }
      goog.events.sources_[srcUid].push(listenerObj);
      if(src.addEventListener) {
        if(src == goog.global || !src.customEvent_) {
          src.addEventListener(type, proxy, capture)
        }
      }else {
        src.attachEvent(goog.events.getOnString_(type), proxy)
      }
      return key
    }
  }
};
goog.events.getProxy = function() {
  var proxyCallbackFunction = goog.events.handleBrowserEvent_;
  var f = goog.events.BrowserFeature.HAS_W3C_EVENT_SUPPORT ? function(eventObject) {
    return proxyCallbackFunction.call(f.src, f.key, eventObject)
  } : function(eventObject) {
    var v = proxyCallbackFunction.call(f.src, f.key, eventObject);
    if(!v) {
      return v
    }
  };
  return f
};
goog.events.listenOnce = function(src, type, listener, opt_capt, opt_handler) {
  if(goog.isArray(type)) {
    for(var i = 0;i < type.length;i++) {
      goog.events.listenOnce(src, type[i], listener, opt_capt, opt_handler)
    }
    return null
  }
  var key = goog.events.listen(src, type, listener, opt_capt, opt_handler);
  var listenerObj = goog.events.listeners_[key];
  listenerObj.callOnce = true;
  return key
};
goog.events.listenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.listen(src, listener, opt_capt, opt_handler)
};
goog.events.unlisten = function(src, type, listener, opt_capt, opt_handler) {
  if(goog.isArray(type)) {
    for(var i = 0;i < type.length;i++) {
      goog.events.unlisten(src, type[i], listener, opt_capt, opt_handler)
    }
    return null
  }
  var capture = !!opt_capt;
  var listenerArray = goog.events.getListeners_(src, type, capture);
  if(!listenerArray) {
    return false
  }
  for(var i = 0;i < listenerArray.length;i++) {
    if(listenerArray[i].listener == listener && listenerArray[i].capture == capture && listenerArray[i].handler == opt_handler) {
      return goog.events.unlistenByKey(listenerArray[i].key)
    }
  }
  return false
};
goog.events.unlistenByKey = function(key) {
  if(!goog.events.listeners_[key]) {
    return false
  }
  var listener = goog.events.listeners_[key];
  if(listener.removed) {
    return false
  }
  var src = listener.src;
  var type = listener.type;
  var proxy = listener.proxy;
  var capture = listener.capture;
  if(src.removeEventListener) {
    if(src == goog.global || !src.customEvent_) {
      src.removeEventListener(type, proxy, capture)
    }
  }else {
    if(src.detachEvent) {
      src.detachEvent(goog.events.getOnString_(type), proxy)
    }
  }
  var srcUid = goog.getUid(src);
  if(goog.events.sources_[srcUid]) {
    var sourcesArray = goog.events.sources_[srcUid];
    goog.array.remove(sourcesArray, listener);
    if(sourcesArray.length == 0) {
      delete goog.events.sources_[srcUid]
    }
  }
  listener.removed = true;
  var listenerArray = goog.events.listenerTree_[type][capture][srcUid];
  if(listenerArray) {
    listenerArray.needsCleanup_ = true;
    goog.events.cleanUp_(type, capture, srcUid, listenerArray)
  }
  delete goog.events.listeners_[key];
  return true
};
goog.events.unlistenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.unlisten(src, listener, opt_capt, opt_handler)
};
goog.events.cleanUp_ = function(type, capture, srcUid, listenerArray) {
  if(!listenerArray.locked_) {
    if(listenerArray.needsCleanup_) {
      for(var oldIndex = 0, newIndex = 0;oldIndex < listenerArray.length;oldIndex++) {
        if(listenerArray[oldIndex].removed) {
          var proxy = listenerArray[oldIndex].proxy;
          proxy.src = null;
          continue
        }
        if(oldIndex != newIndex) {
          listenerArray[newIndex] = listenerArray[oldIndex]
        }
        newIndex++
      }
      listenerArray.length = newIndex;
      listenerArray.needsCleanup_ = false;
      if(newIndex == 0) {
        delete goog.events.listenerTree_[type][capture][srcUid];
        goog.events.listenerTree_[type][capture].count_--;
        if(goog.events.listenerTree_[type][capture].count_ == 0) {
          delete goog.events.listenerTree_[type][capture];
          goog.events.listenerTree_[type].count_--
        }
        if(goog.events.listenerTree_[type].count_ == 0) {
          delete goog.events.listenerTree_[type]
        }
      }
    }
  }
};
goog.events.removeAll = function(opt_obj, opt_type, opt_capt) {
  var count = 0;
  var noObj = opt_obj == null;
  var noType = opt_type == null;
  var noCapt = opt_capt == null;
  opt_capt = !!opt_capt;
  if(!noObj) {
    var srcUid = goog.getUid(opt_obj);
    if(goog.events.sources_[srcUid]) {
      var sourcesArray = goog.events.sources_[srcUid];
      for(var i = sourcesArray.length - 1;i >= 0;i--) {
        var listener = sourcesArray[i];
        if((noType || opt_type == listener.type) && (noCapt || opt_capt == listener.capture)) {
          goog.events.unlistenByKey(listener.key);
          count++
        }
      }
    }
  }else {
    goog.object.forEach(goog.events.sources_, function(listeners) {
      for(var i = listeners.length - 1;i >= 0;i--) {
        var listener = listeners[i];
        if((noType || opt_type == listener.type) && (noCapt || opt_capt == listener.capture)) {
          goog.events.unlistenByKey(listener.key);
          count++
        }
      }
    })
  }
  return count
};
goog.events.getListeners = function(obj, type, capture) {
  return goog.events.getListeners_(obj, type, capture) || []
};
goog.events.getListeners_ = function(obj, type, capture) {
  var map = goog.events.listenerTree_;
  if(type in map) {
    map = map[type];
    if(capture in map) {
      map = map[capture];
      var objUid = goog.getUid(obj);
      if(map[objUid]) {
        return map[objUid]
      }
    }
  }
  return null
};
goog.events.getListener = function(src, type, listener, opt_capt, opt_handler) {
  var capture = !!opt_capt;
  var listenerArray = goog.events.getListeners_(src, type, capture);
  if(listenerArray) {
    for(var i = 0;i < listenerArray.length;i++) {
      if(!listenerArray[i].removed && listenerArray[i].listener == listener && listenerArray[i].capture == capture && listenerArray[i].handler == opt_handler) {
        return listenerArray[i]
      }
    }
  }
  return null
};
goog.events.hasListener = function(obj, opt_type, opt_capture) {
  var objUid = goog.getUid(obj);
  var listeners = goog.events.sources_[objUid];
  if(listeners) {
    var hasType = goog.isDef(opt_type);
    var hasCapture = goog.isDef(opt_capture);
    if(hasType && hasCapture) {
      var map = goog.events.listenerTree_[opt_type];
      return!!map && !!map[opt_capture] && objUid in map[opt_capture]
    }else {
      if(!(hasType || hasCapture)) {
        return true
      }else {
        return goog.array.some(listeners, function(listener) {
          return hasType && listener.type == opt_type || hasCapture && listener.capture == opt_capture
        })
      }
    }
  }
  return false
};
goog.events.expose = function(e) {
  var str = [];
  for(var key in e) {
    if(e[key] && e[key].id) {
      str.push(key + " = " + e[key] + " (" + e[key].id + ")")
    }else {
      str.push(key + " = " + e[key])
    }
  }
  return str.join("\n")
};
goog.events.getOnString_ = function(type) {
  if(type in goog.events.onStringMap_) {
    return goog.events.onStringMap_[type]
  }
  return goog.events.onStringMap_[type] = goog.events.onString_ + type
};
goog.events.fireListeners = function(obj, type, capture, eventObject) {
  var map = goog.events.listenerTree_;
  if(type in map) {
    map = map[type];
    if(capture in map) {
      return goog.events.fireListeners_(map[capture], obj, type, capture, eventObject)
    }
  }
  return true
};
goog.events.fireListeners_ = function(map, obj, type, capture, eventObject) {
  var retval = 1;
  var objUid = goog.getUid(obj);
  if(map[objUid]) {
    map.remaining_--;
    var listenerArray = map[objUid];
    if(!listenerArray.locked_) {
      listenerArray.locked_ = 1
    }else {
      listenerArray.locked_++
    }
    try {
      var length = listenerArray.length;
      for(var i = 0;i < length;i++) {
        var listener = listenerArray[i];
        if(listener && !listener.removed) {
          retval &= goog.events.fireListener(listener, eventObject) !== false
        }
      }
    }finally {
      listenerArray.locked_--;
      goog.events.cleanUp_(type, capture, objUid, listenerArray)
    }
  }
  return Boolean(retval)
};
goog.events.fireListener = function(listener, eventObject) {
  if(listener.callOnce) {
    goog.events.unlistenByKey(listener.key)
  }
  return listener.handleEvent(eventObject)
};
goog.events.getTotalListenerCount = function() {
  return goog.object.getCount(goog.events.listeners_)
};
goog.events.dispatchEvent = function(src, e) {
  var type = e.type || e;
  var map = goog.events.listenerTree_;
  if(!(type in map)) {
    return true
  }
  if(goog.isString(e)) {
    e = new goog.events.Event(e, src)
  }else {
    if(!(e instanceof goog.events.Event)) {
      var oldEvent = e;
      e = new goog.events.Event(type, src);
      goog.object.extend(e, oldEvent)
    }else {
      e.target = e.target || src
    }
  }
  var rv = 1, ancestors;
  map = map[type];
  var hasCapture = true in map;
  var targetsMap;
  if(hasCapture) {
    ancestors = [];
    for(var parent = src;parent;parent = parent.getParentEventTarget()) {
      ancestors.push(parent)
    }
    targetsMap = map[true];
    targetsMap.remaining_ = targetsMap.count_;
    for(var i = ancestors.length - 1;!e.propagationStopped_ && i >= 0 && targetsMap.remaining_;i--) {
      e.currentTarget = ancestors[i];
      rv &= goog.events.fireListeners_(targetsMap, ancestors[i], e.type, true, e) && e.returnValue_ != false
    }
  }
  var hasBubble = false in map;
  if(hasBubble) {
    targetsMap = map[false];
    targetsMap.remaining_ = targetsMap.count_;
    if(hasCapture) {
      for(var i = 0;!e.propagationStopped_ && i < ancestors.length && targetsMap.remaining_;i++) {
        e.currentTarget = ancestors[i];
        rv &= goog.events.fireListeners_(targetsMap, ancestors[i], e.type, false, e) && e.returnValue_ != false
      }
    }else {
      for(var current = src;!e.propagationStopped_ && current && targetsMap.remaining_;current = current.getParentEventTarget()) {
        e.currentTarget = current;
        rv &= goog.events.fireListeners_(targetsMap, current, e.type, false, e) && e.returnValue_ != false
      }
    }
  }
  return Boolean(rv)
};
goog.events.protectBrowserEventEntryPoint = function(errorHandler) {
  goog.events.handleBrowserEvent_ = errorHandler.protectEntryPoint(goog.events.handleBrowserEvent_)
};
goog.events.handleBrowserEvent_ = function(key, opt_evt) {
  if(!goog.events.listeners_[key]) {
    return true
  }
  var listener = goog.events.listeners_[key];
  var type = listener.type;
  var map = goog.events.listenerTree_;
  if(!(type in map)) {
    return true
  }
  map = map[type];
  var retval, targetsMap;
  if(!goog.events.BrowserFeature.HAS_W3C_EVENT_SUPPORT) {
    var ieEvent = opt_evt || goog.getObjectByName("window.event");
    var hasCapture = true in map;
    var hasBubble = false in map;
    if(hasCapture) {
      if(goog.events.isMarkedIeEvent_(ieEvent)) {
        return true
      }
      goog.events.markIeEvent_(ieEvent)
    }
    var evt = new goog.events.BrowserEvent;
    evt.init(ieEvent, this);
    retval = true;
    try {
      if(hasCapture) {
        var ancestors = [];
        for(var parent = evt.currentTarget;parent;parent = parent.parentNode) {
          ancestors.push(parent)
        }
        targetsMap = map[true];
        targetsMap.remaining_ = targetsMap.count_;
        for(var i = ancestors.length - 1;!evt.propagationStopped_ && i >= 0 && targetsMap.remaining_;i--) {
          evt.currentTarget = ancestors[i];
          retval &= goog.events.fireListeners_(targetsMap, ancestors[i], type, true, evt)
        }
        if(hasBubble) {
          targetsMap = map[false];
          targetsMap.remaining_ = targetsMap.count_;
          for(var i = 0;!evt.propagationStopped_ && i < ancestors.length && targetsMap.remaining_;i++) {
            evt.currentTarget = ancestors[i];
            retval &= goog.events.fireListeners_(targetsMap, ancestors[i], type, false, evt)
          }
        }
      }else {
        retval = goog.events.fireListener(listener, evt)
      }
    }finally {
      if(ancestors) {
        ancestors.length = 0
      }
    }
    return retval
  }
  var be = new goog.events.BrowserEvent(opt_evt, this);
  retval = goog.events.fireListener(listener, be);
  return retval
};
goog.events.markIeEvent_ = function(e) {
  var useReturnValue = false;
  if(e.keyCode == 0) {
    try {
      e.keyCode = -1;
      return
    }catch(ex) {
      useReturnValue = true
    }
  }
  if(useReturnValue || e.returnValue == undefined) {
    e.returnValue = true
  }
};
goog.events.isMarkedIeEvent_ = function(e) {
  return e.keyCode < 0 || e.returnValue != undefined
};
goog.events.uniqueIdCounter_ = 0;
goog.events.getUniqueId = function(identifier) {
  return identifier + "_" + goog.events.uniqueIdCounter_++
};
goog.debug.entryPointRegistry.register(function(transformer) {
  goog.events.handleBrowserEvent_ = transformer(goog.events.handleBrowserEvent_)
});
goog.provide("goog.events.EventTarget");
goog.require("goog.Disposable");
goog.require("goog.events");
goog.events.EventTarget = function() {
  goog.Disposable.call(this)
};
goog.inherits(goog.events.EventTarget, goog.Disposable);
goog.events.EventTarget.prototype.customEvent_ = true;
goog.events.EventTarget.prototype.parentEventTarget_ = null;
goog.events.EventTarget.prototype.getParentEventTarget = function() {
  return this.parentEventTarget_
};
goog.events.EventTarget.prototype.setParentEventTarget = function(parent) {
  this.parentEventTarget_ = parent
};
goog.events.EventTarget.prototype.addEventListener = function(type, handler, opt_capture, opt_handlerScope) {
  goog.events.listen(this, type, handler, opt_capture, opt_handlerScope)
};
goog.events.EventTarget.prototype.removeEventListener = function(type, handler, opt_capture, opt_handlerScope) {
  goog.events.unlisten(this, type, handler, opt_capture, opt_handlerScope)
};
goog.events.EventTarget.prototype.dispatchEvent = function(e) {
  return goog.events.dispatchEvent(this, e)
};
goog.events.EventTarget.prototype.disposeInternal = function() {
  goog.events.EventTarget.superClass_.disposeInternal.call(this);
  goog.events.removeAll(this);
  this.parentEventTarget_ = null
};
goog.provide("clojure.browser.event");
goog.require("cljs.core");
goog.require("goog.events.EventType");
goog.require("goog.events.EventTarget");
goog.require("goog.events");
clojure.browser.event.EventType = {};
clojure.browser.event.event_types = function event_types(this$) {
  if(function() {
    var and__3941__auto__ = this$;
    if(and__3941__auto__) {
      return this$.clojure$browser$event$EventType$event_types$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return this$.clojure$browser$event$EventType$event_types$arity$1(this$)
  }else {
    var x__6521__auto__ = this$ == null ? null : this$;
    return function() {
      var or__3943__auto__ = clojure.browser.event.event_types[goog.typeOf(x__6521__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = clojure.browser.event.event_types["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "EventType.event-types", this$);
        }
      }
    }().call(null, this$)
  }
};
Element.prototype.clojure$browser$event$EventType$ = true;
Element.prototype.clojure$browser$event$EventType$event_types$arity$1 = function(this$) {
  return cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, cljs.core.map.call(null, function(p__7035) {
    var vec__7036 = p__7035;
    var k = cljs.core.nth.call(null, vec__7036, 0, null);
    var v = cljs.core.nth.call(null, vec__7036, 1, null);
    return cljs.core.PersistentVector.fromArray([cljs.core.keyword.call(null, k.toLowerCase()), v], true)
  }, cljs.core.merge.call(null, cljs.core.js__GT_clj.call(null, goog.events.EventType))))
};
goog.events.EventTarget.prototype.clojure$browser$event$EventType$ = true;
goog.events.EventTarget.prototype.clojure$browser$event$EventType$event_types$arity$1 = function(this$) {
  return cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, cljs.core.map.call(null, function(p__7037) {
    var vec__7038 = p__7037;
    var k = cljs.core.nth.call(null, vec__7038, 0, null);
    var v = cljs.core.nth.call(null, vec__7038, 1, null);
    return cljs.core.PersistentVector.fromArray([cljs.core.keyword.call(null, k.toLowerCase()), v], true)
  }, cljs.core.merge.call(null, cljs.core.js__GT_clj.call(null, goog.events.EventType))))
};
clojure.browser.event.listen = function() {
  var listen = null;
  var listen__3 = function(src, type, fn) {
    return listen.call(null, src, type, fn, false)
  };
  var listen__4 = function(src, type, fn, capture_QMARK_) {
    return goog.events.listen(src, cljs.core.get.call(null, clojure.browser.event.event_types.call(null, src), type, type), fn, capture_QMARK_)
  };
  listen = function(src, type, fn, capture_QMARK_) {
    switch(arguments.length) {
      case 3:
        return listen__3.call(this, src, type, fn);
      case 4:
        return listen__4.call(this, src, type, fn, capture_QMARK_)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  listen.cljs$core$IFn$_invoke$arity$3 = listen__3;
  listen.cljs$core$IFn$_invoke$arity$4 = listen__4;
  return listen
}();
clojure.browser.event.listen_once = function() {
  var listen_once = null;
  var listen_once__3 = function(src, type, fn) {
    return listen_once.call(null, src, type, fn, false)
  };
  var listen_once__4 = function(src, type, fn, capture_QMARK_) {
    return goog.events.listenOnce(src, cljs.core.get.call(null, clojure.browser.event.event_types.call(null, src), type, type), fn, capture_QMARK_)
  };
  listen_once = function(src, type, fn, capture_QMARK_) {
    switch(arguments.length) {
      case 3:
        return listen_once__3.call(this, src, type, fn);
      case 4:
        return listen_once__4.call(this, src, type, fn, capture_QMARK_)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  listen_once.cljs$core$IFn$_invoke$arity$3 = listen_once__3;
  listen_once.cljs$core$IFn$_invoke$arity$4 = listen_once__4;
  return listen_once
}();
clojure.browser.event.unlisten = function() {
  var unlisten = null;
  var unlisten__3 = function(src, type, fn) {
    return unlisten.call(null, src, type, fn, false)
  };
  var unlisten__4 = function(src, type, fn, capture_QMARK_) {
    return goog.events.unlisten(src, cljs.core.get.call(null, clojure.browser.event.event_types.call(null, src), type, type), fn, capture_QMARK_)
  };
  unlisten = function(src, type, fn, capture_QMARK_) {
    switch(arguments.length) {
      case 3:
        return unlisten__3.call(this, src, type, fn);
      case 4:
        return unlisten__4.call(this, src, type, fn, capture_QMARK_)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  unlisten.cljs$core$IFn$_invoke$arity$3 = unlisten__3;
  unlisten.cljs$core$IFn$_invoke$arity$4 = unlisten__4;
  return unlisten
}();
clojure.browser.event.unlisten_by_key = function unlisten_by_key(key) {
  return goog.events.unlistenByKey(key)
};
clojure.browser.event.dispatch_event = function dispatch_event(src, event) {
  return goog.events.dispatchEvent(src, event)
};
clojure.browser.event.expose = function expose(e) {
  return goog.events.expose(e)
};
clojure.browser.event.fire_listeners = function fire_listeners(obj, type, capture, event) {
  return null
};
clojure.browser.event.total_listener_count = function total_listener_count() {
  return goog.events.getTotalListenerCount()
};
clojure.browser.event.get_listener = function get_listener(src, type, listener, opt_capt, opt_handler) {
  return null
};
clojure.browser.event.all_listeners = function all_listeners(obj, type, capture) {
  return null
};
clojure.browser.event.unique_event_id = function unique_event_id(event_type) {
  return null
};
clojure.browser.event.has_listener = function has_listener(obj, opt_type, opt_capture) {
  return null
};
clojure.browser.event.remove_all = function remove_all(opt_obj, opt_type, opt_capt) {
  return null
};
goog.provide("goog.Timer");
goog.require("goog.events.EventTarget");
goog.Timer = function(opt_interval, opt_timerObject) {
  goog.events.EventTarget.call(this);
  this.interval_ = opt_interval || 1;
  this.timerObject_ = opt_timerObject || goog.Timer.defaultTimerObject;
  this.boundTick_ = goog.bind(this.tick_, this);
  this.last_ = goog.now()
};
goog.inherits(goog.Timer, goog.events.EventTarget);
goog.Timer.MAX_TIMEOUT_ = 2147483647;
goog.Timer.prototype.enabled = false;
goog.Timer.defaultTimerObject = goog.global["window"];
goog.Timer.intervalScale = 0.8;
goog.Timer.prototype.timer_ = null;
goog.Timer.prototype.getInterval = function() {
  return this.interval_
};
goog.Timer.prototype.setInterval = function(interval) {
  this.interval_ = interval;
  if(this.timer_ && this.enabled) {
    this.stop();
    this.start()
  }else {
    if(this.timer_) {
      this.stop()
    }
  }
};
goog.Timer.prototype.tick_ = function() {
  if(this.enabled) {
    var elapsed = goog.now() - this.last_;
    if(elapsed > 0 && elapsed < this.interval_ * goog.Timer.intervalScale) {
      this.timer_ = this.timerObject_.setTimeout(this.boundTick_, this.interval_ - elapsed);
      return
    }
    this.dispatchTick();
    if(this.enabled) {
      this.timer_ = this.timerObject_.setTimeout(this.boundTick_, this.interval_);
      this.last_ = goog.now()
    }
  }
};
goog.Timer.prototype.dispatchTick = function() {
  this.dispatchEvent(goog.Timer.TICK)
};
goog.Timer.prototype.start = function() {
  this.enabled = true;
  if(!this.timer_) {
    this.timer_ = this.timerObject_.setTimeout(this.boundTick_, this.interval_);
    this.last_ = goog.now()
  }
};
goog.Timer.prototype.stop = function() {
  this.enabled = false;
  if(this.timer_) {
    this.timerObject_.clearTimeout(this.timer_);
    this.timer_ = null
  }
};
goog.Timer.prototype.disposeInternal = function() {
  goog.Timer.superClass_.disposeInternal.call(this);
  this.stop();
  delete this.timerObject_
};
goog.Timer.TICK = "tick";
goog.Timer.callOnce = function(listener, opt_delay, opt_handler) {
  if(goog.isFunction(listener)) {
    if(opt_handler) {
      listener = goog.bind(listener, opt_handler)
    }
  }else {
    if(listener && typeof listener.handleEvent == "function") {
      listener = goog.bind(listener.handleEvent, listener)
    }else {
      throw Error("Invalid listener argument");
    }
  }
  if(opt_delay > goog.Timer.MAX_TIMEOUT_) {
    return-1
  }else {
    return goog.Timer.defaultTimerObject.setTimeout(listener, opt_delay || 0)
  }
};
goog.Timer.clear = function(timerId) {
  goog.Timer.defaultTimerObject.clearTimeout(timerId)
};
goog.provide("goog.structs");
goog.require("goog.array");
goog.require("goog.object");
goog.structs.getCount = function(col) {
  if(typeof col.getCount == "function") {
    return col.getCount()
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return col.length
  }
  return goog.object.getCount(col)
};
goog.structs.getValues = function(col) {
  if(typeof col.getValues == "function") {
    return col.getValues()
  }
  if(goog.isString(col)) {
    return col.split("")
  }
  if(goog.isArrayLike(col)) {
    var rv = [];
    var l = col.length;
    for(var i = 0;i < l;i++) {
      rv.push(col[i])
    }
    return rv
  }
  return goog.object.getValues(col)
};
goog.structs.getKeys = function(col) {
  if(typeof col.getKeys == "function") {
    return col.getKeys()
  }
  if(typeof col.getValues == "function") {
    return undefined
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    var rv = [];
    var l = col.length;
    for(var i = 0;i < l;i++) {
      rv.push(i)
    }
    return rv
  }
  return goog.object.getKeys(col)
};
goog.structs.contains = function(col, val) {
  if(typeof col.contains == "function") {
    return col.contains(val)
  }
  if(typeof col.containsValue == "function") {
    return col.containsValue(val)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.contains(col, val)
  }
  return goog.object.containsValue(col, val)
};
goog.structs.isEmpty = function(col) {
  if(typeof col.isEmpty == "function") {
    return col.isEmpty()
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.isEmpty(col)
  }
  return goog.object.isEmpty(col)
};
goog.structs.clear = function(col) {
  if(typeof col.clear == "function") {
    col.clear()
  }else {
    if(goog.isArrayLike(col)) {
      goog.array.clear(col)
    }else {
      goog.object.clear(col)
    }
  }
};
goog.structs.forEach = function(col, f, opt_obj) {
  if(typeof col.forEach == "function") {
    col.forEach(f, opt_obj)
  }else {
    if(goog.isArrayLike(col) || goog.isString(col)) {
      goog.array.forEach(col, f, opt_obj)
    }else {
      var keys = goog.structs.getKeys(col);
      var values = goog.structs.getValues(col);
      var l = values.length;
      for(var i = 0;i < l;i++) {
        f.call(opt_obj, values[i], keys && keys[i], col)
      }
    }
  }
};
goog.structs.filter = function(col, f, opt_obj) {
  if(typeof col.filter == "function") {
    return col.filter(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.filter(col, f, opt_obj)
  }
  var rv;
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  if(keys) {
    rv = {};
    for(var i = 0;i < l;i++) {
      if(f.call(opt_obj, values[i], keys[i], col)) {
        rv[keys[i]] = values[i]
      }
    }
  }else {
    rv = [];
    for(var i = 0;i < l;i++) {
      if(f.call(opt_obj, values[i], undefined, col)) {
        rv.push(values[i])
      }
    }
  }
  return rv
};
goog.structs.map = function(col, f, opt_obj) {
  if(typeof col.map == "function") {
    return col.map(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.map(col, f, opt_obj)
  }
  var rv;
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  if(keys) {
    rv = {};
    for(var i = 0;i < l;i++) {
      rv[keys[i]] = f.call(opt_obj, values[i], keys[i], col)
    }
  }else {
    rv = [];
    for(var i = 0;i < l;i++) {
      rv[i] = f.call(opt_obj, values[i], undefined, col)
    }
  }
  return rv
};
goog.structs.some = function(col, f, opt_obj) {
  if(typeof col.some == "function") {
    return col.some(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.some(col, f, opt_obj)
  }
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  for(var i = 0;i < l;i++) {
    if(f.call(opt_obj, values[i], keys && keys[i], col)) {
      return true
    }
  }
  return false
};
goog.structs.every = function(col, f, opt_obj) {
  if(typeof col.every == "function") {
    return col.every(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.every(col, f, opt_obj)
  }
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  for(var i = 0;i < l;i++) {
    if(!f.call(opt_obj, values[i], keys && keys[i], col)) {
      return false
    }
  }
  return true
};
goog.provide("goog.structs.Collection");
goog.structs.Collection = function() {
};
goog.structs.Collection.prototype.add;
goog.structs.Collection.prototype.remove;
goog.structs.Collection.prototype.contains;
goog.structs.Collection.prototype.getCount;
goog.provide("goog.iter");
goog.provide("goog.iter.Iterator");
goog.provide("goog.iter.StopIteration");
goog.require("goog.array");
goog.require("goog.asserts");
goog.iter.Iterable;
if("StopIteration" in goog.global) {
  goog.iter.StopIteration = goog.global["StopIteration"]
}else {
  goog.iter.StopIteration = Error("StopIteration")
}
goog.iter.Iterator = function() {
};
goog.iter.Iterator.prototype.next = function() {
  throw goog.iter.StopIteration;
};
goog.iter.Iterator.prototype.__iterator__ = function(opt_keys) {
  return this
};
goog.iter.toIterator = function(iterable) {
  if(iterable instanceof goog.iter.Iterator) {
    return iterable
  }
  if(typeof iterable.__iterator__ == "function") {
    return iterable.__iterator__(false)
  }
  if(goog.isArrayLike(iterable)) {
    var i = 0;
    var newIter = new goog.iter.Iterator;
    newIter.next = function() {
      while(true) {
        if(i >= iterable.length) {
          throw goog.iter.StopIteration;
        }
        if(!(i in iterable)) {
          i++;
          continue
        }
        return iterable[i++]
      }
    };
    return newIter
  }
  throw Error("Not implemented");
};
goog.iter.forEach = function(iterable, f, opt_obj) {
  if(goog.isArrayLike(iterable)) {
    try {
      goog.array.forEach(iterable, f, opt_obj)
    }catch(ex) {
      if(ex !== goog.iter.StopIteration) {
        throw ex;
      }
    }
  }else {
    iterable = goog.iter.toIterator(iterable);
    try {
      while(true) {
        f.call(opt_obj, iterable.next(), undefined, iterable)
      }
    }catch(ex) {
      if(ex !== goog.iter.StopIteration) {
        throw ex;
      }
    }
  }
};
goog.iter.filter = function(iterable, f, opt_obj) {
  var iterator = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    while(true) {
      var val = iterator.next();
      if(f.call(opt_obj, val, undefined, iterator)) {
        return val
      }
    }
  };
  return newIter
};
goog.iter.range = function(startOrStop, opt_stop, opt_step) {
  var start = 0;
  var stop = startOrStop;
  var step = opt_step || 1;
  if(arguments.length > 1) {
    start = startOrStop;
    stop = opt_stop
  }
  if(step == 0) {
    throw Error("Range step argument must not be zero");
  }
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    if(step > 0 && start >= stop || step < 0 && start <= stop) {
      throw goog.iter.StopIteration;
    }
    var rv = start;
    start += step;
    return rv
  };
  return newIter
};
goog.iter.join = function(iterable, deliminator) {
  return goog.iter.toArray(iterable).join(deliminator)
};
goog.iter.map = function(iterable, f, opt_obj) {
  var iterator = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    while(true) {
      var val = iterator.next();
      return f.call(opt_obj, val, undefined, iterator)
    }
  };
  return newIter
};
goog.iter.reduce = function(iterable, f, val, opt_obj) {
  var rval = val;
  goog.iter.forEach(iterable, function(val) {
    rval = f.call(opt_obj, rval, val)
  });
  return rval
};
goog.iter.some = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  try {
    while(true) {
      if(f.call(opt_obj, iterable.next(), undefined, iterable)) {
        return true
      }
    }
  }catch(ex) {
    if(ex !== goog.iter.StopIteration) {
      throw ex;
    }
  }
  return false
};
goog.iter.every = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  try {
    while(true) {
      if(!f.call(opt_obj, iterable.next(), undefined, iterable)) {
        return false
      }
    }
  }catch(ex) {
    if(ex !== goog.iter.StopIteration) {
      throw ex;
    }
  }
  return true
};
goog.iter.chain = function(var_args) {
  var args = arguments;
  var length = args.length;
  var i = 0;
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    try {
      if(i >= length) {
        throw goog.iter.StopIteration;
      }
      var current = goog.iter.toIterator(args[i]);
      return current.next()
    }catch(ex) {
      if(ex !== goog.iter.StopIteration || i >= length) {
        throw ex;
      }else {
        i++;
        return this.next()
      }
    }
  };
  return newIter
};
goog.iter.dropWhile = function(iterable, f, opt_obj) {
  var iterator = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  var dropping = true;
  newIter.next = function() {
    while(true) {
      var val = iterator.next();
      if(dropping && f.call(opt_obj, val, undefined, iterator)) {
        continue
      }else {
        dropping = false
      }
      return val
    }
  };
  return newIter
};
goog.iter.takeWhile = function(iterable, f, opt_obj) {
  var iterator = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  var taking = true;
  newIter.next = function() {
    while(true) {
      if(taking) {
        var val = iterator.next();
        if(f.call(opt_obj, val, undefined, iterator)) {
          return val
        }else {
          taking = false
        }
      }else {
        throw goog.iter.StopIteration;
      }
    }
  };
  return newIter
};
goog.iter.toArray = function(iterable) {
  if(goog.isArrayLike(iterable)) {
    return goog.array.toArray(iterable)
  }
  iterable = goog.iter.toIterator(iterable);
  var array = [];
  goog.iter.forEach(iterable, function(val) {
    array.push(val)
  });
  return array
};
goog.iter.equals = function(iterable1, iterable2) {
  iterable1 = goog.iter.toIterator(iterable1);
  iterable2 = goog.iter.toIterator(iterable2);
  var b1, b2;
  try {
    while(true) {
      b1 = b2 = false;
      var val1 = iterable1.next();
      b1 = true;
      var val2 = iterable2.next();
      b2 = true;
      if(val1 != val2) {
        return false
      }
    }
  }catch(ex) {
    if(ex !== goog.iter.StopIteration) {
      throw ex;
    }else {
      if(b1 && !b2) {
        return false
      }
      if(!b2) {
        try {
          val2 = iterable2.next();
          return false
        }catch(ex1) {
          if(ex1 !== goog.iter.StopIteration) {
            throw ex1;
          }
          return true
        }
      }
    }
  }
  return false
};
goog.iter.nextOrValue = function(iterable, defaultValue) {
  try {
    return goog.iter.toIterator(iterable).next()
  }catch(e) {
    if(e != goog.iter.StopIteration) {
      throw e;
    }
    return defaultValue
  }
};
goog.iter.product = function(var_args) {
  var someArrayEmpty = goog.array.some(arguments, function(arr) {
    return!arr.length
  });
  if(someArrayEmpty || !arguments.length) {
    return new goog.iter.Iterator
  }
  var iter = new goog.iter.Iterator;
  var arrays = arguments;
  var indicies = goog.array.repeat(0, arrays.length);
  iter.next = function() {
    if(indicies) {
      var retVal = goog.array.map(indicies, function(valueIndex, arrayIndex) {
        return arrays[arrayIndex][valueIndex]
      });
      for(var i = indicies.length - 1;i >= 0;i--) {
        goog.asserts.assert(indicies);
        if(indicies[i] < arrays[i].length - 1) {
          indicies[i]++;
          break
        }
        if(i == 0) {
          indicies = null;
          break
        }
        indicies[i] = 0
      }
      return retVal
    }
    throw goog.iter.StopIteration;
  };
  return iter
};
goog.iter.cycle = function(iterable) {
  var baseIterator = goog.iter.toIterator(iterable);
  var cache = [];
  var cacheIndex = 0;
  var iter = new goog.iter.Iterator;
  var useCache = false;
  iter.next = function() {
    var returnElement = null;
    if(!useCache) {
      try {
        returnElement = baseIterator.next();
        cache.push(returnElement);
        return returnElement
      }catch(e) {
        if(e != goog.iter.StopIteration || goog.array.isEmpty(cache)) {
          throw e;
        }
        useCache = true
      }
    }
    returnElement = cache[cacheIndex];
    cacheIndex = (cacheIndex + 1) % cache.length;
    return returnElement
  };
  return iter
};
goog.provide("goog.structs.Map");
goog.require("goog.iter.Iterator");
goog.require("goog.iter.StopIteration");
goog.require("goog.object");
goog.require("goog.structs");
goog.structs.Map = function(opt_map, var_args) {
  this.map_ = {};
  this.keys_ = [];
  var argLength = arguments.length;
  if(argLength > 1) {
    if(argLength % 2) {
      throw Error("Uneven number of arguments");
    }
    for(var i = 0;i < argLength;i += 2) {
      this.set(arguments[i], arguments[i + 1])
    }
  }else {
    if(opt_map) {
      this.addAll(opt_map)
    }
  }
};
goog.structs.Map.prototype.count_ = 0;
goog.structs.Map.prototype.version_ = 0;
goog.structs.Map.prototype.getCount = function() {
  return this.count_
};
goog.structs.Map.prototype.getValues = function() {
  this.cleanupKeysArray_();
  var rv = [];
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    rv.push(this.map_[key])
  }
  return rv
};
goog.structs.Map.prototype.getKeys = function() {
  this.cleanupKeysArray_();
  return this.keys_.concat()
};
goog.structs.Map.prototype.containsKey = function(key) {
  return goog.structs.Map.hasKey_(this.map_, key)
};
goog.structs.Map.prototype.containsValue = function(val) {
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    if(goog.structs.Map.hasKey_(this.map_, key) && this.map_[key] == val) {
      return true
    }
  }
  return false
};
goog.structs.Map.prototype.equals = function(otherMap, opt_equalityFn) {
  if(this === otherMap) {
    return true
  }
  if(this.count_ != otherMap.getCount()) {
    return false
  }
  var equalityFn = opt_equalityFn || goog.structs.Map.defaultEquals;
  this.cleanupKeysArray_();
  for(var key, i = 0;key = this.keys_[i];i++) {
    if(!equalityFn(this.get(key), otherMap.get(key))) {
      return false
    }
  }
  return true
};
goog.structs.Map.defaultEquals = function(a, b) {
  return a === b
};
goog.structs.Map.prototype.isEmpty = function() {
  return this.count_ == 0
};
goog.structs.Map.prototype.clear = function() {
  this.map_ = {};
  this.keys_.length = 0;
  this.count_ = 0;
  this.version_ = 0
};
goog.structs.Map.prototype.remove = function(key) {
  if(goog.structs.Map.hasKey_(this.map_, key)) {
    delete this.map_[key];
    this.count_--;
    this.version_++;
    if(this.keys_.length > 2 * this.count_) {
      this.cleanupKeysArray_()
    }
    return true
  }
  return false
};
goog.structs.Map.prototype.cleanupKeysArray_ = function() {
  if(this.count_ != this.keys_.length) {
    var srcIndex = 0;
    var destIndex = 0;
    while(srcIndex < this.keys_.length) {
      var key = this.keys_[srcIndex];
      if(goog.structs.Map.hasKey_(this.map_, key)) {
        this.keys_[destIndex++] = key
      }
      srcIndex++
    }
    this.keys_.length = destIndex
  }
  if(this.count_ != this.keys_.length) {
    var seen = {};
    var srcIndex = 0;
    var destIndex = 0;
    while(srcIndex < this.keys_.length) {
      var key = this.keys_[srcIndex];
      if(!goog.structs.Map.hasKey_(seen, key)) {
        this.keys_[destIndex++] = key;
        seen[key] = 1
      }
      srcIndex++
    }
    this.keys_.length = destIndex
  }
};
goog.structs.Map.prototype.get = function(key, opt_val) {
  if(goog.structs.Map.hasKey_(this.map_, key)) {
    return this.map_[key]
  }
  return opt_val
};
goog.structs.Map.prototype.set = function(key, value) {
  if(!goog.structs.Map.hasKey_(this.map_, key)) {
    this.count_++;
    this.keys_.push(key);
    this.version_++
  }
  this.map_[key] = value
};
goog.structs.Map.prototype.addAll = function(map) {
  var keys, values;
  if(map instanceof goog.structs.Map) {
    keys = map.getKeys();
    values = map.getValues()
  }else {
    keys = goog.object.getKeys(map);
    values = goog.object.getValues(map)
  }
  for(var i = 0;i < keys.length;i++) {
    this.set(keys[i], values[i])
  }
};
goog.structs.Map.prototype.clone = function() {
  return new goog.structs.Map(this)
};
goog.structs.Map.prototype.transpose = function() {
  var transposed = new goog.structs.Map;
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    var value = this.map_[key];
    transposed.set(value, key)
  }
  return transposed
};
goog.structs.Map.prototype.toObject = function() {
  this.cleanupKeysArray_();
  var obj = {};
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    obj[key] = this.map_[key]
  }
  return obj
};
goog.structs.Map.prototype.getKeyIterator = function() {
  return this.__iterator__(true)
};
goog.structs.Map.prototype.getValueIterator = function() {
  return this.__iterator__(false)
};
goog.structs.Map.prototype.__iterator__ = function(opt_keys) {
  this.cleanupKeysArray_();
  var i = 0;
  var keys = this.keys_;
  var map = this.map_;
  var version = this.version_;
  var selfObj = this;
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    while(true) {
      if(version != selfObj.version_) {
        throw Error("The map has changed since the iterator was created");
      }
      if(i >= keys.length) {
        throw goog.iter.StopIteration;
      }
      var key = keys[i++];
      return opt_keys ? key : map[key]
    }
  };
  return newIter
};
goog.structs.Map.hasKey_ = function(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key)
};
goog.provide("goog.structs.Set");
goog.require("goog.structs");
goog.require("goog.structs.Collection");
goog.require("goog.structs.Map");
goog.structs.Set = function(opt_values) {
  this.map_ = new goog.structs.Map;
  if(opt_values) {
    this.addAll(opt_values)
  }
};
goog.structs.Set.getKey_ = function(val) {
  var type = typeof val;
  if(type == "object" && val || type == "function") {
    return"o" + goog.getUid(val)
  }else {
    return type.substr(0, 1) + val
  }
};
goog.structs.Set.prototype.getCount = function() {
  return this.map_.getCount()
};
goog.structs.Set.prototype.add = function(element) {
  this.map_.set(goog.structs.Set.getKey_(element), element)
};
goog.structs.Set.prototype.addAll = function(col) {
  var values = goog.structs.getValues(col);
  var l = values.length;
  for(var i = 0;i < l;i++) {
    this.add(values[i])
  }
};
goog.structs.Set.prototype.removeAll = function(col) {
  var values = goog.structs.getValues(col);
  var l = values.length;
  for(var i = 0;i < l;i++) {
    this.remove(values[i])
  }
};
goog.structs.Set.prototype.remove = function(element) {
  return this.map_.remove(goog.structs.Set.getKey_(element))
};
goog.structs.Set.prototype.clear = function() {
  this.map_.clear()
};
goog.structs.Set.prototype.isEmpty = function() {
  return this.map_.isEmpty()
};
goog.structs.Set.prototype.contains = function(element) {
  return this.map_.containsKey(goog.structs.Set.getKey_(element))
};
goog.structs.Set.prototype.containsAll = function(col) {
  return goog.structs.every(col, this.contains, this)
};
goog.structs.Set.prototype.intersection = function(col) {
  var result = new goog.structs.Set;
  var values = goog.structs.getValues(col);
  for(var i = 0;i < values.length;i++) {
    var value = values[i];
    if(this.contains(value)) {
      result.add(value)
    }
  }
  return result
};
goog.structs.Set.prototype.difference = function(col) {
  var result = this.clone();
  result.removeAll(col);
  return result
};
goog.structs.Set.prototype.getValues = function() {
  return this.map_.getValues()
};
goog.structs.Set.prototype.clone = function() {
  return new goog.structs.Set(this)
};
goog.structs.Set.prototype.equals = function(col) {
  return this.getCount() == goog.structs.getCount(col) && this.isSubsetOf(col)
};
goog.structs.Set.prototype.isSubsetOf = function(col) {
  var colCount = goog.structs.getCount(col);
  if(this.getCount() > colCount) {
    return false
  }
  if(!(col instanceof goog.structs.Set) && colCount > 5) {
    col = new goog.structs.Set(col)
  }
  return goog.structs.every(this, function(value) {
    return goog.structs.contains(col, value)
  })
};
goog.structs.Set.prototype.__iterator__ = function(opt_keys) {
  return this.map_.__iterator__(false)
};
goog.provide("goog.debug");
goog.require("goog.array");
goog.require("goog.string");
goog.require("goog.structs.Set");
goog.require("goog.userAgent");
goog.debug.catchErrors = function(logFunc, opt_cancel, opt_target) {
  var target = opt_target || goog.global;
  var oldErrorHandler = target.onerror;
  var retVal = !!opt_cancel;
  if(goog.userAgent.WEBKIT && !goog.userAgent.isVersion("535.3")) {
    retVal = !retVal
  }
  target.onerror = function(message, url, line) {
    if(oldErrorHandler) {
      oldErrorHandler(message, url, line)
    }
    logFunc({message:message, fileName:url, line:line});
    return retVal
  }
};
goog.debug.expose = function(obj, opt_showFn) {
  if(typeof obj == "undefined") {
    return"undefined"
  }
  if(obj == null) {
    return"NULL"
  }
  var str = [];
  for(var x in obj) {
    if(!opt_showFn && goog.isFunction(obj[x])) {
      continue
    }
    var s = x + " = ";
    try {
      s += obj[x]
    }catch(e) {
      s += "*** " + e + " ***"
    }
    str.push(s)
  }
  return str.join("\n")
};
goog.debug.deepExpose = function(obj, opt_showFn) {
  var previous = new goog.structs.Set;
  var str = [];
  var helper = function(obj, space) {
    var nestspace = space + "  ";
    var indentMultiline = function(str) {
      return str.replace(/\n/g, "\n" + space)
    };
    try {
      if(!goog.isDef(obj)) {
        str.push("undefined")
      }else {
        if(goog.isNull(obj)) {
          str.push("NULL")
        }else {
          if(goog.isString(obj)) {
            str.push('"' + indentMultiline(obj) + '"')
          }else {
            if(goog.isFunction(obj)) {
              str.push(indentMultiline(String(obj)))
            }else {
              if(goog.isObject(obj)) {
                if(previous.contains(obj)) {
                  str.push("*** reference loop detected ***")
                }else {
                  previous.add(obj);
                  str.push("{");
                  for(var x in obj) {
                    if(!opt_showFn && goog.isFunction(obj[x])) {
                      continue
                    }
                    str.push("\n");
                    str.push(nestspace);
                    str.push(x + " = ");
                    helper(obj[x], nestspace)
                  }
                  str.push("\n" + space + "}")
                }
              }else {
                str.push(obj)
              }
            }
          }
        }
      }
    }catch(e) {
      str.push("*** " + e + " ***")
    }
  };
  helper(obj, "");
  return str.join("")
};
goog.debug.exposeArray = function(arr) {
  var str = [];
  for(var i = 0;i < arr.length;i++) {
    if(goog.isArray(arr[i])) {
      str.push(goog.debug.exposeArray(arr[i]))
    }else {
      str.push(arr[i])
    }
  }
  return"[ " + str.join(", ") + " ]"
};
goog.debug.exposeException = function(err, opt_fn) {
  try {
    var e = goog.debug.normalizeErrorObject(err);
    var error = "Message: " + goog.string.htmlEscape(e.message) + '\nUrl: <a href="view-source:' + e.fileName + '" target="_new">' + e.fileName + "</a>\nLine: " + e.lineNumber + "\n\nBrowser stack:\n" + goog.string.htmlEscape(e.stack + "-> ") + "[end]\n\nJS stack traversal:\n" + goog.string.htmlEscape(goog.debug.getStacktrace(opt_fn) + "-> ");
    return error
  }catch(e2) {
    return"Exception trying to expose exception! You win, we lose. " + e2
  }
};
goog.debug.normalizeErrorObject = function(err) {
  var href = goog.getObjectByName("window.location.href");
  if(goog.isString(err)) {
    return{"message":err, "name":"Unknown error", "lineNumber":"Not available", "fileName":href, "stack":"Not available"}
  }
  var lineNumber, fileName;
  var threwError = false;
  try {
    lineNumber = err.lineNumber || err.line || "Not available"
  }catch(e) {
    lineNumber = "Not available";
    threwError = true
  }
  try {
    fileName = err.fileName || err.filename || err.sourceURL || href
  }catch(e) {
    fileName = "Not available";
    threwError = true
  }
  if(threwError || !err.lineNumber || !err.fileName || !err.stack) {
    return{"message":err.message, "name":err.name, "lineNumber":lineNumber, "fileName":fileName, "stack":err.stack || "Not available"}
  }
  return err
};
goog.debug.enhanceError = function(err, opt_message) {
  var error = typeof err == "string" ? Error(err) : err;
  if(!error.stack) {
    error.stack = goog.debug.getStacktrace(arguments.callee.caller)
  }
  if(opt_message) {
    var x = 0;
    while(error["message" + x]) {
      ++x
    }
    error["message" + x] = String(opt_message)
  }
  return error
};
goog.debug.getStacktraceSimple = function(opt_depth) {
  var sb = [];
  var fn = arguments.callee.caller;
  var depth = 0;
  while(fn && (!opt_depth || depth < opt_depth)) {
    sb.push(goog.debug.getFunctionName(fn));
    sb.push("()\n");
    try {
      fn = fn.caller
    }catch(e) {
      sb.push("[exception trying to get caller]\n");
      break
    }
    depth++;
    if(depth >= goog.debug.MAX_STACK_DEPTH) {
      sb.push("[...long stack...]");
      break
    }
  }
  if(opt_depth && depth >= opt_depth) {
    sb.push("[...reached max depth limit...]")
  }else {
    sb.push("[end]")
  }
  return sb.join("")
};
goog.debug.MAX_STACK_DEPTH = 50;
goog.debug.getStacktrace = function(opt_fn) {
  return goog.debug.getStacktraceHelper_(opt_fn || arguments.callee.caller, [])
};
goog.debug.getStacktraceHelper_ = function(fn, visited) {
  var sb = [];
  if(goog.array.contains(visited, fn)) {
    sb.push("[...circular reference...]")
  }else {
    if(fn && visited.length < goog.debug.MAX_STACK_DEPTH) {
      sb.push(goog.debug.getFunctionName(fn) + "(");
      var args = fn.arguments;
      for(var i = 0;i < args.length;i++) {
        if(i > 0) {
          sb.push(", ")
        }
        var argDesc;
        var arg = args[i];
        switch(typeof arg) {
          case "object":
            argDesc = arg ? "object" : "null";
            break;
          case "string":
            argDesc = arg;
            break;
          case "number":
            argDesc = String(arg);
            break;
          case "boolean":
            argDesc = arg ? "true" : "false";
            break;
          case "function":
            argDesc = goog.debug.getFunctionName(arg);
            argDesc = argDesc ? argDesc : "[fn]";
            break;
          case "undefined":
          ;
          default:
            argDesc = typeof arg;
            break
        }
        if(argDesc.length > 40) {
          argDesc = argDesc.substr(0, 40) + "..."
        }
        sb.push(argDesc)
      }
      visited.push(fn);
      sb.push(")\n");
      try {
        sb.push(goog.debug.getStacktraceHelper_(fn.caller, visited))
      }catch(e) {
        sb.push("[exception trying to get caller]\n")
      }
    }else {
      if(fn) {
        sb.push("[...long stack...]")
      }else {
        sb.push("[end]")
      }
    }
  }
  return sb.join("")
};
goog.debug.setFunctionResolver = function(resolver) {
  goog.debug.fnNameResolver_ = resolver
};
goog.debug.getFunctionName = function(fn) {
  if(goog.debug.fnNameCache_[fn]) {
    return goog.debug.fnNameCache_[fn]
  }
  if(goog.debug.fnNameResolver_) {
    var name = goog.debug.fnNameResolver_(fn);
    if(name) {
      goog.debug.fnNameCache_[fn] = name;
      return name
    }
  }
  var functionSource = String(fn);
  if(!goog.debug.fnNameCache_[functionSource]) {
    var matches = /function ([^\(]+)/.exec(functionSource);
    if(matches) {
      var method = matches[1];
      goog.debug.fnNameCache_[functionSource] = method
    }else {
      goog.debug.fnNameCache_[functionSource] = "[Anonymous]"
    }
  }
  return goog.debug.fnNameCache_[functionSource]
};
goog.debug.makeWhitespaceVisible = function(string) {
  return string.replace(/ /g, "[_]").replace(/\f/g, "[f]").replace(/\n/g, "[n]\n").replace(/\r/g, "[r]").replace(/\t/g, "[t]")
};
goog.debug.fnNameCache_ = {};
goog.debug.fnNameResolver_;
goog.provide("goog.debug.LogRecord");
goog.debug.LogRecord = function(level, msg, loggerName, opt_time, opt_sequenceNumber) {
  this.reset(level, msg, loggerName, opt_time, opt_sequenceNumber)
};
goog.debug.LogRecord.prototype.time_;
goog.debug.LogRecord.prototype.level_;
goog.debug.LogRecord.prototype.msg_;
goog.debug.LogRecord.prototype.loggerName_;
goog.debug.LogRecord.prototype.sequenceNumber_ = 0;
goog.debug.LogRecord.prototype.exception_ = null;
goog.debug.LogRecord.prototype.exceptionText_ = null;
goog.debug.LogRecord.ENABLE_SEQUENCE_NUMBERS = true;
goog.debug.LogRecord.nextSequenceNumber_ = 0;
goog.debug.LogRecord.prototype.reset = function(level, msg, loggerName, opt_time, opt_sequenceNumber) {
  if(goog.debug.LogRecord.ENABLE_SEQUENCE_NUMBERS) {
    this.sequenceNumber_ = typeof opt_sequenceNumber == "number" ? opt_sequenceNumber : goog.debug.LogRecord.nextSequenceNumber_++
  }
  this.time_ = opt_time || goog.now();
  this.level_ = level;
  this.msg_ = msg;
  this.loggerName_ = loggerName;
  delete this.exception_;
  delete this.exceptionText_
};
goog.debug.LogRecord.prototype.getLoggerName = function() {
  return this.loggerName_
};
goog.debug.LogRecord.prototype.getException = function() {
  return this.exception_
};
goog.debug.LogRecord.prototype.setException = function(exception) {
  this.exception_ = exception
};
goog.debug.LogRecord.prototype.getExceptionText = function() {
  return this.exceptionText_
};
goog.debug.LogRecord.prototype.setExceptionText = function(text) {
  this.exceptionText_ = text
};
goog.debug.LogRecord.prototype.setLoggerName = function(loggerName) {
  this.loggerName_ = loggerName
};
goog.debug.LogRecord.prototype.getLevel = function() {
  return this.level_
};
goog.debug.LogRecord.prototype.setLevel = function(level) {
  this.level_ = level
};
goog.debug.LogRecord.prototype.getMessage = function() {
  return this.msg_
};
goog.debug.LogRecord.prototype.setMessage = function(msg) {
  this.msg_ = msg
};
goog.debug.LogRecord.prototype.getMillis = function() {
  return this.time_
};
goog.debug.LogRecord.prototype.setMillis = function(time) {
  this.time_ = time
};
goog.debug.LogRecord.prototype.getSequenceNumber = function() {
  return this.sequenceNumber_
};
goog.provide("goog.debug.LogBuffer");
goog.require("goog.asserts");
goog.require("goog.debug.LogRecord");
goog.debug.LogBuffer = function() {
  goog.asserts.assert(goog.debug.LogBuffer.isBufferingEnabled(), "Cannot use goog.debug.LogBuffer without defining " + "goog.debug.LogBuffer.CAPACITY.");
  this.clear()
};
goog.debug.LogBuffer.getInstance = function() {
  if(!goog.debug.LogBuffer.instance_) {
    goog.debug.LogBuffer.instance_ = new goog.debug.LogBuffer
  }
  return goog.debug.LogBuffer.instance_
};
goog.debug.LogBuffer.CAPACITY = 0;
goog.debug.LogBuffer.prototype.buffer_;
goog.debug.LogBuffer.prototype.curIndex_;
goog.debug.LogBuffer.prototype.isFull_;
goog.debug.LogBuffer.prototype.addRecord = function(level, msg, loggerName) {
  var curIndex = (this.curIndex_ + 1) % goog.debug.LogBuffer.CAPACITY;
  this.curIndex_ = curIndex;
  if(this.isFull_) {
    var ret = this.buffer_[curIndex];
    ret.reset(level, msg, loggerName);
    return ret
  }
  this.isFull_ = curIndex == goog.debug.LogBuffer.CAPACITY - 1;
  return this.buffer_[curIndex] = new goog.debug.LogRecord(level, msg, loggerName)
};
goog.debug.LogBuffer.isBufferingEnabled = function() {
  return goog.debug.LogBuffer.CAPACITY > 0
};
goog.debug.LogBuffer.prototype.clear = function() {
  this.buffer_ = new Array(goog.debug.LogBuffer.CAPACITY);
  this.curIndex_ = -1;
  this.isFull_ = false
};
goog.debug.LogBuffer.prototype.forEachRecord = function(func) {
  var buffer = this.buffer_;
  if(!buffer[0]) {
    return
  }
  var curIndex = this.curIndex_;
  var i = this.isFull_ ? curIndex : -1;
  do {
    i = (i + 1) % goog.debug.LogBuffer.CAPACITY;
    func(buffer[i])
  }while(i != curIndex)
};
goog.provide("goog.debug.LogManager");
goog.provide("goog.debug.Logger");
goog.provide("goog.debug.Logger.Level");
goog.require("goog.array");
goog.require("goog.asserts");
goog.require("goog.debug");
goog.require("goog.debug.LogBuffer");
goog.require("goog.debug.LogRecord");
goog.debug.Logger = function(name) {
  this.name_ = name
};
goog.debug.Logger.prototype.parent_ = null;
goog.debug.Logger.prototype.level_ = null;
goog.debug.Logger.prototype.children_ = null;
goog.debug.Logger.prototype.handlers_ = null;
goog.debug.Logger.ENABLE_HIERARCHY = true;
if(!goog.debug.Logger.ENABLE_HIERARCHY) {
  goog.debug.Logger.rootHandlers_ = [];
  goog.debug.Logger.rootLevel_
}
goog.debug.Logger.Level = function(name, value) {
  this.name = name;
  this.value = value
};
goog.debug.Logger.Level.prototype.toString = function() {
  return this.name
};
goog.debug.Logger.Level.OFF = new goog.debug.Logger.Level("OFF", Infinity);
goog.debug.Logger.Level.SHOUT = new goog.debug.Logger.Level("SHOUT", 1200);
goog.debug.Logger.Level.SEVERE = new goog.debug.Logger.Level("SEVERE", 1E3);
goog.debug.Logger.Level.WARNING = new goog.debug.Logger.Level("WARNING", 900);
goog.debug.Logger.Level.INFO = new goog.debug.Logger.Level("INFO", 800);
goog.debug.Logger.Level.CONFIG = new goog.debug.Logger.Level("CONFIG", 700);
goog.debug.Logger.Level.FINE = new goog.debug.Logger.Level("FINE", 500);
goog.debug.Logger.Level.FINER = new goog.debug.Logger.Level("FINER", 400);
goog.debug.Logger.Level.FINEST = new goog.debug.Logger.Level("FINEST", 300);
goog.debug.Logger.Level.ALL = new goog.debug.Logger.Level("ALL", 0);
goog.debug.Logger.Level.PREDEFINED_LEVELS = [goog.debug.Logger.Level.OFF, goog.debug.Logger.Level.SHOUT, goog.debug.Logger.Level.SEVERE, goog.debug.Logger.Level.WARNING, goog.debug.Logger.Level.INFO, goog.debug.Logger.Level.CONFIG, goog.debug.Logger.Level.FINE, goog.debug.Logger.Level.FINER, goog.debug.Logger.Level.FINEST, goog.debug.Logger.Level.ALL];
goog.debug.Logger.Level.predefinedLevelsCache_ = null;
goog.debug.Logger.Level.createPredefinedLevelsCache_ = function() {
  goog.debug.Logger.Level.predefinedLevelsCache_ = {};
  for(var i = 0, level;level = goog.debug.Logger.Level.PREDEFINED_LEVELS[i];i++) {
    goog.debug.Logger.Level.predefinedLevelsCache_[level.value] = level;
    goog.debug.Logger.Level.predefinedLevelsCache_[level.name] = level
  }
};
goog.debug.Logger.Level.getPredefinedLevel = function(name) {
  if(!goog.debug.Logger.Level.predefinedLevelsCache_) {
    goog.debug.Logger.Level.createPredefinedLevelsCache_()
  }
  return goog.debug.Logger.Level.predefinedLevelsCache_[name] || null
};
goog.debug.Logger.Level.getPredefinedLevelByValue = function(value) {
  if(!goog.debug.Logger.Level.predefinedLevelsCache_) {
    goog.debug.Logger.Level.createPredefinedLevelsCache_()
  }
  if(value in goog.debug.Logger.Level.predefinedLevelsCache_) {
    return goog.debug.Logger.Level.predefinedLevelsCache_[value]
  }
  for(var i = 0;i < goog.debug.Logger.Level.PREDEFINED_LEVELS.length;++i) {
    var level = goog.debug.Logger.Level.PREDEFINED_LEVELS[i];
    if(level.value <= value) {
      return level
    }
  }
  return null
};
goog.debug.Logger.getLogger = function(name) {
  return goog.debug.LogManager.getLogger(name)
};
goog.debug.Logger.logToProfilers = function(msg) {
  if(goog.global["console"]) {
    if(goog.global["console"]["timeStamp"]) {
      goog.global["console"]["timeStamp"](msg)
    }else {
      if(goog.global["console"]["markTimeline"]) {
        goog.global["console"]["markTimeline"](msg)
      }
    }
  }
  if(goog.global["msWriteProfilerMark"]) {
    goog.global["msWriteProfilerMark"](msg)
  }
};
goog.debug.Logger.prototype.getName = function() {
  return this.name_
};
goog.debug.Logger.prototype.addHandler = function(handler) {
  if(goog.debug.Logger.ENABLE_HIERARCHY) {
    if(!this.handlers_) {
      this.handlers_ = []
    }
    this.handlers_.push(handler)
  }else {
    goog.asserts.assert(!this.name_, "Cannot call addHandler on a non-root logger when " + "goog.debug.Logger.ENABLE_HIERARCHY is false.");
    goog.debug.Logger.rootHandlers_.push(handler)
  }
};
goog.debug.Logger.prototype.removeHandler = function(handler) {
  var handlers = goog.debug.Logger.ENABLE_HIERARCHY ? this.handlers_ : goog.debug.Logger.rootHandlers_;
  return!!handlers && goog.array.remove(handlers, handler)
};
goog.debug.Logger.prototype.getParent = function() {
  return this.parent_
};
goog.debug.Logger.prototype.getChildren = function() {
  if(!this.children_) {
    this.children_ = {}
  }
  return this.children_
};
goog.debug.Logger.prototype.setLevel = function(level) {
  if(goog.debug.Logger.ENABLE_HIERARCHY) {
    this.level_ = level
  }else {
    goog.asserts.assert(!this.name_, "Cannot call setLevel() on a non-root logger when " + "goog.debug.Logger.ENABLE_HIERARCHY is false.");
    goog.debug.Logger.rootLevel_ = level
  }
};
goog.debug.Logger.prototype.getLevel = function() {
  return this.level_
};
goog.debug.Logger.prototype.getEffectiveLevel = function() {
  if(!goog.debug.Logger.ENABLE_HIERARCHY) {
    return goog.debug.Logger.rootLevel_
  }
  if(this.level_) {
    return this.level_
  }
  if(this.parent_) {
    return this.parent_.getEffectiveLevel()
  }
  goog.asserts.fail("Root logger has no level set.");
  return null
};
goog.debug.Logger.prototype.isLoggable = function(level) {
  return level.value >= this.getEffectiveLevel().value
};
goog.debug.Logger.prototype.log = function(level, msg, opt_exception) {
  if(this.isLoggable(level)) {
    this.doLogRecord_(this.getLogRecord(level, msg, opt_exception))
  }
};
goog.debug.Logger.prototype.getLogRecord = function(level, msg, opt_exception) {
  if(goog.debug.LogBuffer.isBufferingEnabled()) {
    var logRecord = goog.debug.LogBuffer.getInstance().addRecord(level, msg, this.name_)
  }else {
    logRecord = new goog.debug.LogRecord(level, String(msg), this.name_)
  }
  if(opt_exception) {
    logRecord.setException(opt_exception);
    logRecord.setExceptionText(goog.debug.exposeException(opt_exception, arguments.callee.caller))
  }
  return logRecord
};
goog.debug.Logger.prototype.shout = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.SHOUT, msg, opt_exception)
};
goog.debug.Logger.prototype.severe = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.SEVERE, msg, opt_exception)
};
goog.debug.Logger.prototype.warning = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.WARNING, msg, opt_exception)
};
goog.debug.Logger.prototype.info = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.INFO, msg, opt_exception)
};
goog.debug.Logger.prototype.config = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.CONFIG, msg, opt_exception)
};
goog.debug.Logger.prototype.fine = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.FINE, msg, opt_exception)
};
goog.debug.Logger.prototype.finer = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.FINER, msg, opt_exception)
};
goog.debug.Logger.prototype.finest = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.FINEST, msg, opt_exception)
};
goog.debug.Logger.prototype.logRecord = function(logRecord) {
  if(this.isLoggable(logRecord.getLevel())) {
    this.doLogRecord_(logRecord)
  }
};
goog.debug.Logger.prototype.doLogRecord_ = function(logRecord) {
  goog.debug.Logger.logToProfilers("log:" + logRecord.getMessage());
  if(goog.debug.Logger.ENABLE_HIERARCHY) {
    var target = this;
    while(target) {
      target.callPublish_(logRecord);
      target = target.getParent()
    }
  }else {
    for(var i = 0, handler;handler = goog.debug.Logger.rootHandlers_[i++];) {
      handler(logRecord)
    }
  }
};
goog.debug.Logger.prototype.callPublish_ = function(logRecord) {
  if(this.handlers_) {
    for(var i = 0, handler;handler = this.handlers_[i];i++) {
      handler(logRecord)
    }
  }
};
goog.debug.Logger.prototype.setParent_ = function(parent) {
  this.parent_ = parent
};
goog.debug.Logger.prototype.addChild_ = function(name, logger) {
  this.getChildren()[name] = logger
};
goog.debug.LogManager = {};
goog.debug.LogManager.loggers_ = {};
goog.debug.LogManager.rootLogger_ = null;
goog.debug.LogManager.initialize = function() {
  if(!goog.debug.LogManager.rootLogger_) {
    goog.debug.LogManager.rootLogger_ = new goog.debug.Logger("");
    goog.debug.LogManager.loggers_[""] = goog.debug.LogManager.rootLogger_;
    goog.debug.LogManager.rootLogger_.setLevel(goog.debug.Logger.Level.CONFIG)
  }
};
goog.debug.LogManager.getLoggers = function() {
  return goog.debug.LogManager.loggers_
};
goog.debug.LogManager.getRoot = function() {
  goog.debug.LogManager.initialize();
  return goog.debug.LogManager.rootLogger_
};
goog.debug.LogManager.getLogger = function(name) {
  goog.debug.LogManager.initialize();
  var ret = goog.debug.LogManager.loggers_[name];
  return ret || goog.debug.LogManager.createLogger_(name)
};
goog.debug.LogManager.createFunctionForCatchErrors = function(opt_logger) {
  return function(info) {
    var logger = opt_logger || goog.debug.LogManager.getRoot();
    logger.severe("Error: " + info.message + " (" + info.fileName + " @ Line: " + info.line + ")")
  }
};
goog.debug.LogManager.createLogger_ = function(name) {
  var logger = new goog.debug.Logger(name);
  if(goog.debug.Logger.ENABLE_HIERARCHY) {
    var lastDotIndex = name.lastIndexOf(".");
    var parentName = name.substr(0, lastDotIndex);
    var leafName = name.substr(lastDotIndex + 1);
    var parentLogger = goog.debug.LogManager.getLogger(parentName);
    parentLogger.addChild_(leafName, logger);
    logger.setParent_(parentLogger)
  }
  goog.debug.LogManager.loggers_[name] = logger;
  return logger
};
goog.provide("goog.json");
goog.provide("goog.json.Serializer");
goog.json.isValid_ = function(s) {
  if(/^\s*$/.test(s)) {
    return false
  }
  var backslashesRe = /\\["\\\/bfnrtu]/g;
  var simpleValuesRe = /"[^"\\\n\r\u2028\u2029\x00-\x08\x10-\x1f\x80-\x9f]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g;
  var openBracketsRe = /(?:^|:|,)(?:[\s\u2028\u2029]*\[)+/g;
  var remainderRe = /^[\],:{}\s\u2028\u2029]*$/;
  return remainderRe.test(s.replace(backslashesRe, "@").replace(simpleValuesRe, "]").replace(openBracketsRe, ""))
};
goog.json.parse = function(s) {
  var o = String(s);
  if(goog.json.isValid_(o)) {
    try {
      return eval("(" + o + ")")
    }catch(ex) {
    }
  }
  throw Error("Invalid JSON string: " + o);
};
goog.json.unsafeParse = function(s) {
  return eval("(" + s + ")")
};
goog.json.Replacer;
goog.json.serialize = function(object, opt_replacer) {
  return(new goog.json.Serializer(opt_replacer)).serialize(object)
};
goog.json.Serializer = function(opt_replacer) {
  this.replacer_ = opt_replacer
};
goog.json.Serializer.prototype.serialize = function(object) {
  var sb = [];
  this.serialize_(object, sb);
  return sb.join("")
};
goog.json.Serializer.prototype.serialize_ = function(object, sb) {
  switch(typeof object) {
    case "string":
      this.serializeString_(object, sb);
      break;
    case "number":
      this.serializeNumber_(object, sb);
      break;
    case "boolean":
      sb.push(object);
      break;
    case "undefined":
      sb.push("null");
      break;
    case "object":
      if(object == null) {
        sb.push("null");
        break
      }
      if(goog.isArray(object)) {
        this.serializeArray(object, sb);
        break
      }
      this.serializeObject_(object, sb);
      break;
    case "function":
      break;
    default:
      throw Error("Unknown type: " + typeof object);
  }
};
goog.json.Serializer.charToJsonCharCache_ = {'"':'\\"', "\\":"\\\\", "/":"\\/", "\b":"\\b", "\f":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\u000b"};
goog.json.Serializer.charsToReplace_ = /\uffff/.test("\uffff") ? /[\\\"\x00-\x1f\x7f-\uffff]/g : /[\\\"\x00-\x1f\x7f-\xff]/g;
goog.json.Serializer.prototype.serializeString_ = function(s, sb) {
  sb.push('"', s.replace(goog.json.Serializer.charsToReplace_, function(c) {
    if(c in goog.json.Serializer.charToJsonCharCache_) {
      return goog.json.Serializer.charToJsonCharCache_[c]
    }
    var cc = c.charCodeAt(0);
    var rv = "\\u";
    if(cc < 16) {
      rv += "000"
    }else {
      if(cc < 256) {
        rv += "00"
      }else {
        if(cc < 4096) {
          rv += "0"
        }
      }
    }
    return goog.json.Serializer.charToJsonCharCache_[c] = rv + cc.toString(16)
  }), '"')
};
goog.json.Serializer.prototype.serializeNumber_ = function(n, sb) {
  sb.push(isFinite(n) && !isNaN(n) ? n : "null")
};
goog.json.Serializer.prototype.serializeArray = function(arr, sb) {
  var l = arr.length;
  sb.push("[");
  var sep = "";
  for(var i = 0;i < l;i++) {
    sb.push(sep);
    var value = arr[i];
    this.serialize_(this.replacer_ ? this.replacer_.call(arr, String(i), value) : value, sb);
    sep = ","
  }
  sb.push("]")
};
goog.json.Serializer.prototype.serializeObject_ = function(obj, sb) {
  sb.push("{");
  var sep = "";
  for(var key in obj) {
    if(Object.prototype.hasOwnProperty.call(obj, key)) {
      var value = obj[key];
      if(typeof value != "function") {
        sb.push(sep);
        this.serializeString_(key, sb);
        sb.push(":");
        this.serialize_(this.replacer_ ? this.replacer_.call(obj, key, value) : value, sb);
        sep = ","
      }
    }
  }
  sb.push("}")
};
goog.provide("goog.net.ErrorCode");
goog.net.ErrorCode = {NO_ERROR:0, ACCESS_DENIED:1, FILE_NOT_FOUND:2, FF_SILENT_ERROR:3, CUSTOM_ERROR:4, EXCEPTION:5, HTTP_ERROR:6, ABORT:7, TIMEOUT:8, OFFLINE:9};
goog.net.ErrorCode.getDebugMessage = function(errorCode) {
  switch(errorCode) {
    case goog.net.ErrorCode.NO_ERROR:
      return"No Error";
    case goog.net.ErrorCode.ACCESS_DENIED:
      return"Access denied to content document";
    case goog.net.ErrorCode.FILE_NOT_FOUND:
      return"File not found";
    case goog.net.ErrorCode.FF_SILENT_ERROR:
      return"Firefox silently errored";
    case goog.net.ErrorCode.CUSTOM_ERROR:
      return"Application custom error";
    case goog.net.ErrorCode.EXCEPTION:
      return"An exception occurred";
    case goog.net.ErrorCode.HTTP_ERROR:
      return"Http response at 400 or 500 level";
    case goog.net.ErrorCode.ABORT:
      return"Request was aborted";
    case goog.net.ErrorCode.TIMEOUT:
      return"Request timed out";
    case goog.net.ErrorCode.OFFLINE:
      return"The resource is not available offline";
    default:
      return"Unrecognized error code"
  }
};
goog.provide("goog.net.EventType");
goog.net.EventType = {COMPLETE:"complete", SUCCESS:"success", ERROR:"error", ABORT:"abort", READY:"ready", READY_STATE_CHANGE:"readystatechange", TIMEOUT:"timeout", INCREMENTAL_DATA:"incrementaldata", PROGRESS:"progress"};
goog.provide("goog.net.HttpStatus");
goog.net.HttpStatus = {CONTINUE:100, SWITCHING_PROTOCOLS:101, OK:200, CREATED:201, ACCEPTED:202, NON_AUTHORITATIVE_INFORMATION:203, NO_CONTENT:204, RESET_CONTENT:205, PARTIAL_CONTENT:206, MULTIPLE_CHOICES:300, MOVED_PERMANENTLY:301, FOUND:302, SEE_OTHER:303, NOT_MODIFIED:304, USE_PROXY:305, TEMPORARY_REDIRECT:307, BAD_REQUEST:400, UNAUTHORIZED:401, PAYMENT_REQUIRED:402, FORBIDDEN:403, NOT_FOUND:404, METHOD_NOT_ALLOWED:405, NOT_ACCEPTABLE:406, PROXY_AUTHENTICATION_REQUIRED:407, REQUEST_TIMEOUT:408, 
CONFLICT:409, GONE:410, LENGTH_REQUIRED:411, PRECONDITION_FAILED:412, REQUEST_ENTITY_TOO_LARGE:413, REQUEST_URI_TOO_LONG:414, UNSUPPORTED_MEDIA_TYPE:415, REQUEST_RANGE_NOT_SATISFIABLE:416, EXPECTATION_FAILED:417, INTERNAL_SERVER_ERROR:500, NOT_IMPLEMENTED:501, BAD_GATEWAY:502, SERVICE_UNAVAILABLE:503, GATEWAY_TIMEOUT:504, HTTP_VERSION_NOT_SUPPORTED:505, QUIRK_IE_NO_CONTENT:1223};
goog.net.HttpStatus.isSuccess = function(status) {
  switch(status) {
    case goog.net.HttpStatus.OK:
    ;
    case goog.net.HttpStatus.CREATED:
    ;
    case goog.net.HttpStatus.ACCEPTED:
    ;
    case goog.net.HttpStatus.NO_CONTENT:
    ;
    case goog.net.HttpStatus.NOT_MODIFIED:
    ;
    case goog.net.HttpStatus.QUIRK_IE_NO_CONTENT:
      return true;
    default:
      return false
  }
};
goog.provide("goog.net.XmlHttpFactory");
goog.net.XmlHttpFactory = function() {
};
goog.net.XmlHttpFactory.prototype.cachedOptions_ = null;
goog.net.XmlHttpFactory.prototype.createInstance = goog.abstractMethod;
goog.net.XmlHttpFactory.prototype.getOptions = function() {
  return this.cachedOptions_ || (this.cachedOptions_ = this.internalGetOptions())
};
goog.net.XmlHttpFactory.prototype.internalGetOptions = goog.abstractMethod;
goog.provide("goog.net.WrapperXmlHttpFactory");
goog.require("goog.net.XmlHttpFactory");
goog.net.WrapperXmlHttpFactory = function(xhrFactory, optionsFactory) {
  goog.net.XmlHttpFactory.call(this);
  this.xhrFactory_ = xhrFactory;
  this.optionsFactory_ = optionsFactory
};
goog.inherits(goog.net.WrapperXmlHttpFactory, goog.net.XmlHttpFactory);
goog.net.WrapperXmlHttpFactory.prototype.createInstance = function() {
  return this.xhrFactory_()
};
goog.net.WrapperXmlHttpFactory.prototype.getOptions = function() {
  return this.optionsFactory_()
};
goog.provide("goog.net.DefaultXmlHttpFactory");
goog.provide("goog.net.XmlHttp");
goog.provide("goog.net.XmlHttp.OptionType");
goog.provide("goog.net.XmlHttp.ReadyState");
goog.require("goog.net.WrapperXmlHttpFactory");
goog.require("goog.net.XmlHttpFactory");
goog.net.XmlHttp = function() {
  return goog.net.XmlHttp.factory_.createInstance()
};
goog.net.XmlHttp.ASSUME_NATIVE_XHR = false;
goog.net.XmlHttp.getOptions = function() {
  return goog.net.XmlHttp.factory_.getOptions()
};
goog.net.XmlHttp.OptionType = {USE_NULL_FUNCTION:0, LOCAL_REQUEST_ERROR:1};
goog.net.XmlHttp.ReadyState = {UNINITIALIZED:0, LOADING:1, LOADED:2, INTERACTIVE:3, COMPLETE:4};
goog.net.XmlHttp.factory_;
goog.net.XmlHttp.setFactory = function(factory, optionsFactory) {
  goog.net.XmlHttp.setGlobalFactory(new goog.net.WrapperXmlHttpFactory(factory, optionsFactory))
};
goog.net.XmlHttp.setGlobalFactory = function(factory) {
  goog.net.XmlHttp.factory_ = factory
};
goog.net.DefaultXmlHttpFactory = function() {
  goog.net.XmlHttpFactory.call(this)
};
goog.inherits(goog.net.DefaultXmlHttpFactory, goog.net.XmlHttpFactory);
goog.net.DefaultXmlHttpFactory.prototype.createInstance = function() {
  var progId = this.getProgId_();
  if(progId) {
    return new ActiveXObject(progId)
  }else {
    return new XMLHttpRequest
  }
};
goog.net.DefaultXmlHttpFactory.prototype.internalGetOptions = function() {
  var progId = this.getProgId_();
  var options = {};
  if(progId) {
    options[goog.net.XmlHttp.OptionType.USE_NULL_FUNCTION] = true;
    options[goog.net.XmlHttp.OptionType.LOCAL_REQUEST_ERROR] = true
  }
  return options
};
goog.net.DefaultXmlHttpFactory.prototype.ieProgId_;
goog.net.DefaultXmlHttpFactory.prototype.getProgId_ = function() {
  if(goog.net.XmlHttp.ASSUME_NATIVE_XHR) {
    return""
  }
  if(!this.ieProgId_ && typeof XMLHttpRequest == "undefined" && typeof ActiveXObject != "undefined") {
    var ACTIVE_X_IDENTS = ["MSXML2.XMLHTTP.6.0", "MSXML2.XMLHTTP.3.0", "MSXML2.XMLHTTP", "Microsoft.XMLHTTP"];
    for(var i = 0;i < ACTIVE_X_IDENTS.length;i++) {
      var candidate = ACTIVE_X_IDENTS[i];
      try {
        new ActiveXObject(candidate);
        this.ieProgId_ = candidate;
        return candidate
      }catch(e) {
      }
    }
    throw Error("Could not create ActiveXObject. ActiveX might be disabled," + " or MSXML might not be installed");
  }
  return this.ieProgId_
};
goog.net.XmlHttp.setGlobalFactory(new goog.net.DefaultXmlHttpFactory);
goog.provide("goog.uri.utils");
goog.provide("goog.uri.utils.ComponentIndex");
goog.provide("goog.uri.utils.QueryArray");
goog.provide("goog.uri.utils.QueryValue");
goog.provide("goog.uri.utils.StandardQueryParam");
goog.require("goog.asserts");
goog.require("goog.string");
goog.require("goog.userAgent");
goog.uri.utils.CharCode_ = {AMPERSAND:38, EQUAL:61, HASH:35, QUESTION:63};
goog.uri.utils.buildFromEncodedParts = function(opt_scheme, opt_userInfo, opt_domain, opt_port, opt_path, opt_queryData, opt_fragment) {
  var out = [];
  if(opt_scheme) {
    out.push(opt_scheme, ":")
  }
  if(opt_domain) {
    out.push("//");
    if(opt_userInfo) {
      out.push(opt_userInfo, "@")
    }
    out.push(opt_domain);
    if(opt_port) {
      out.push(":", opt_port)
    }
  }
  if(opt_path) {
    out.push(opt_path)
  }
  if(opt_queryData) {
    out.push("?", opt_queryData)
  }
  if(opt_fragment) {
    out.push("#", opt_fragment)
  }
  return out.join("")
};
goog.uri.utils.splitRe_ = new RegExp("^" + "(?:" + "([^:/?#.]+)" + ":)?" + "(?://" + "(?:([^/?#]*)@)?" + "([\\w\\d\\-\\u0100-\\uffff.%]*)" + "(?::([0-9]+))?" + ")?" + "([^?#]+)?" + "(?:\\?([^#]*))?" + "(?:#(.*))?" + "$");
goog.uri.utils.ComponentIndex = {SCHEME:1, USER_INFO:2, DOMAIN:3, PORT:4, PATH:5, QUERY_DATA:6, FRAGMENT:7};
goog.uri.utils.split = function(uri) {
  return uri.match(goog.uri.utils.splitRe_)
};
goog.uri.utils.decodeIfPossible_ = function(uri) {
  return uri && decodeURIComponent(uri)
};
goog.uri.utils.getComponentByIndex_ = function(componentIndex, uri) {
  return goog.uri.utils.split(uri)[componentIndex] || null
};
goog.uri.utils.getScheme = function(uri) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.SCHEME, uri)
};
goog.uri.utils.getEffectiveScheme = function(uri) {
  var scheme = goog.uri.utils.getScheme(uri);
  if(!scheme && self.location) {
    var protocol = self.location.protocol;
    scheme = protocol.substr(0, protocol.length - 1)
  }
  return scheme ? scheme.toLowerCase() : ""
};
goog.uri.utils.getUserInfoEncoded = function(uri) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.USER_INFO, uri)
};
goog.uri.utils.getUserInfo = function(uri) {
  return goog.uri.utils.decodeIfPossible_(goog.uri.utils.getUserInfoEncoded(uri))
};
goog.uri.utils.getDomainEncoded = function(uri) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.DOMAIN, uri)
};
goog.uri.utils.getDomain = function(uri) {
  return goog.uri.utils.decodeIfPossible_(goog.uri.utils.getDomainEncoded(uri))
};
goog.uri.utils.getPort = function(uri) {
  return Number(goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.PORT, uri)) || null
};
goog.uri.utils.getPathEncoded = function(uri) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.PATH, uri)
};
goog.uri.utils.getPath = function(uri) {
  return goog.uri.utils.decodeIfPossible_(goog.uri.utils.getPathEncoded(uri))
};
goog.uri.utils.getQueryData = function(uri) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.QUERY_DATA, uri)
};
goog.uri.utils.getFragmentEncoded = function(uri) {
  var hashIndex = uri.indexOf("#");
  return hashIndex < 0 ? null : uri.substr(hashIndex + 1)
};
goog.uri.utils.setFragmentEncoded = function(uri, fragment) {
  return goog.uri.utils.removeFragment(uri) + (fragment ? "#" + fragment : "")
};
goog.uri.utils.getFragment = function(uri) {
  return goog.uri.utils.decodeIfPossible_(goog.uri.utils.getFragmentEncoded(uri))
};
goog.uri.utils.getHost = function(uri) {
  var pieces = goog.uri.utils.split(uri);
  return goog.uri.utils.buildFromEncodedParts(pieces[goog.uri.utils.ComponentIndex.SCHEME], pieces[goog.uri.utils.ComponentIndex.USER_INFO], pieces[goog.uri.utils.ComponentIndex.DOMAIN], pieces[goog.uri.utils.ComponentIndex.PORT])
};
goog.uri.utils.getPathAndAfter = function(uri) {
  var pieces = goog.uri.utils.split(uri);
  return goog.uri.utils.buildFromEncodedParts(null, null, null, null, pieces[goog.uri.utils.ComponentIndex.PATH], pieces[goog.uri.utils.ComponentIndex.QUERY_DATA], pieces[goog.uri.utils.ComponentIndex.FRAGMENT])
};
goog.uri.utils.removeFragment = function(uri) {
  var hashIndex = uri.indexOf("#");
  return hashIndex < 0 ? uri : uri.substr(0, hashIndex)
};
goog.uri.utils.haveSameDomain = function(uri1, uri2) {
  var pieces1 = goog.uri.utils.split(uri1);
  var pieces2 = goog.uri.utils.split(uri2);
  return pieces1[goog.uri.utils.ComponentIndex.DOMAIN] == pieces2[goog.uri.utils.ComponentIndex.DOMAIN] && pieces1[goog.uri.utils.ComponentIndex.SCHEME] == pieces2[goog.uri.utils.ComponentIndex.SCHEME] && pieces1[goog.uri.utils.ComponentIndex.PORT] == pieces2[goog.uri.utils.ComponentIndex.PORT]
};
goog.uri.utils.assertNoFragmentsOrQueries_ = function(uri) {
  if(goog.DEBUG && (uri.indexOf("#") >= 0 || uri.indexOf("?") >= 0)) {
    throw Error("goog.uri.utils: Fragment or query identifiers are not " + "supported: [" + uri + "]");
  }
};
goog.uri.utils.QueryValue;
goog.uri.utils.QueryArray;
goog.uri.utils.appendQueryData_ = function(buffer) {
  if(buffer[1]) {
    var baseUri = buffer[0];
    var hashIndex = baseUri.indexOf("#");
    if(hashIndex >= 0) {
      buffer.push(baseUri.substr(hashIndex));
      buffer[0] = baseUri = baseUri.substr(0, hashIndex)
    }
    var questionIndex = baseUri.indexOf("?");
    if(questionIndex < 0) {
      buffer[1] = "?"
    }else {
      if(questionIndex == baseUri.length - 1) {
        buffer[1] = undefined
      }
    }
  }
  return buffer.join("")
};
goog.uri.utils.appendKeyValuePairs_ = function(key, value, pairs) {
  if(goog.isArray(value)) {
    goog.asserts.assertArray(value);
    for(var j = 0;j < value.length;j++) {
      goog.uri.utils.appendKeyValuePairs_(key, String(value[j]), pairs)
    }
  }else {
    if(value != null) {
      pairs.push("&", key, value === "" ? "" : "=", goog.string.urlEncode(value))
    }
  }
};
goog.uri.utils.buildQueryDataBuffer_ = function(buffer, keysAndValues, opt_startIndex) {
  goog.asserts.assert(Math.max(keysAndValues.length - (opt_startIndex || 0), 0) % 2 == 0, "goog.uri.utils: Key/value lists must be even in length.");
  for(var i = opt_startIndex || 0;i < keysAndValues.length;i += 2) {
    goog.uri.utils.appendKeyValuePairs_(keysAndValues[i], keysAndValues[i + 1], buffer)
  }
  return buffer
};
goog.uri.utils.buildQueryData = function(keysAndValues, opt_startIndex) {
  var buffer = goog.uri.utils.buildQueryDataBuffer_([], keysAndValues, opt_startIndex);
  buffer[0] = "";
  return buffer.join("")
};
goog.uri.utils.buildQueryDataBufferFromMap_ = function(buffer, map) {
  for(var key in map) {
    goog.uri.utils.appendKeyValuePairs_(key, map[key], buffer)
  }
  return buffer
};
goog.uri.utils.buildQueryDataFromMap = function(map) {
  var buffer = goog.uri.utils.buildQueryDataBufferFromMap_([], map);
  buffer[0] = "";
  return buffer.join("")
};
goog.uri.utils.appendParams = function(uri, var_args) {
  return goog.uri.utils.appendQueryData_(arguments.length == 2 ? goog.uri.utils.buildQueryDataBuffer_([uri], arguments[1], 0) : goog.uri.utils.buildQueryDataBuffer_([uri], arguments, 1))
};
goog.uri.utils.appendParamsFromMap = function(uri, map) {
  return goog.uri.utils.appendQueryData_(goog.uri.utils.buildQueryDataBufferFromMap_([uri], map))
};
goog.uri.utils.appendParam = function(uri, key, value) {
  return goog.uri.utils.appendQueryData_([uri, "&", key, "=", goog.string.urlEncode(value)])
};
goog.uri.utils.findParam_ = function(uri, startIndex, keyEncoded, hashOrEndIndex) {
  var index = startIndex;
  var keyLength = keyEncoded.length;
  while((index = uri.indexOf(keyEncoded, index)) >= 0 && index < hashOrEndIndex) {
    var precedingChar = uri.charCodeAt(index - 1);
    if(precedingChar == goog.uri.utils.CharCode_.AMPERSAND || precedingChar == goog.uri.utils.CharCode_.QUESTION) {
      var followingChar = uri.charCodeAt(index + keyLength);
      if(!followingChar || followingChar == goog.uri.utils.CharCode_.EQUAL || followingChar == goog.uri.utils.CharCode_.AMPERSAND || followingChar == goog.uri.utils.CharCode_.HASH) {
        return index
      }
    }
    index += keyLength + 1
  }
  return-1
};
goog.uri.utils.hashOrEndRe_ = /#|$/;
goog.uri.utils.hasParam = function(uri, keyEncoded) {
  return goog.uri.utils.findParam_(uri, 0, keyEncoded, uri.search(goog.uri.utils.hashOrEndRe_)) >= 0
};
goog.uri.utils.getParamValue = function(uri, keyEncoded) {
  var hashOrEndIndex = uri.search(goog.uri.utils.hashOrEndRe_);
  var foundIndex = goog.uri.utils.findParam_(uri, 0, keyEncoded, hashOrEndIndex);
  if(foundIndex < 0) {
    return null
  }else {
    var endPosition = uri.indexOf("&", foundIndex);
    if(endPosition < 0 || endPosition > hashOrEndIndex) {
      endPosition = hashOrEndIndex
    }
    foundIndex += keyEncoded.length + 1;
    return goog.string.urlDecode(uri.substr(foundIndex, endPosition - foundIndex))
  }
};
goog.uri.utils.getParamValues = function(uri, keyEncoded) {
  var hashOrEndIndex = uri.search(goog.uri.utils.hashOrEndRe_);
  var position = 0;
  var foundIndex;
  var result = [];
  while((foundIndex = goog.uri.utils.findParam_(uri, position, keyEncoded, hashOrEndIndex)) >= 0) {
    position = uri.indexOf("&", foundIndex);
    if(position < 0 || position > hashOrEndIndex) {
      position = hashOrEndIndex
    }
    foundIndex += keyEncoded.length + 1;
    result.push(goog.string.urlDecode(uri.substr(foundIndex, position - foundIndex)))
  }
  return result
};
goog.uri.utils.trailingQueryPunctuationRe_ = /[?&]($|#)/;
goog.uri.utils.removeParam = function(uri, keyEncoded) {
  var hashOrEndIndex = uri.search(goog.uri.utils.hashOrEndRe_);
  var position = 0;
  var foundIndex;
  var buffer = [];
  while((foundIndex = goog.uri.utils.findParam_(uri, position, keyEncoded, hashOrEndIndex)) >= 0) {
    buffer.push(uri.substring(position, foundIndex));
    position = Math.min(uri.indexOf("&", foundIndex) + 1 || hashOrEndIndex, hashOrEndIndex)
  }
  buffer.push(uri.substr(position));
  return buffer.join("").replace(goog.uri.utils.trailingQueryPunctuationRe_, "$1")
};
goog.uri.utils.setParam = function(uri, keyEncoded, value) {
  return goog.uri.utils.appendParam(goog.uri.utils.removeParam(uri, keyEncoded), keyEncoded, value)
};
goog.uri.utils.appendPath = function(baseUri, path) {
  goog.uri.utils.assertNoFragmentsOrQueries_(baseUri);
  if(goog.string.endsWith(baseUri, "/")) {
    baseUri = baseUri.substr(0, baseUri.length - 1)
  }
  if(goog.string.startsWith(path, "/")) {
    path = path.substr(1)
  }
  return goog.string.buildString(baseUri, "/", path)
};
goog.uri.utils.StandardQueryParam = {RANDOM:"zx"};
goog.uri.utils.makeUnique = function(uri) {
  return goog.uri.utils.setParam(uri, goog.uri.utils.StandardQueryParam.RANDOM, goog.string.getRandomString())
};
goog.provide("goog.net.XhrIo");
goog.provide("goog.net.XhrIo.ResponseType");
goog.require("goog.Timer");
goog.require("goog.debug.Logger");
goog.require("goog.debug.entryPointRegistry");
goog.require("goog.debug.errorHandlerWeakDep");
goog.require("goog.events.EventTarget");
goog.require("goog.json");
goog.require("goog.net.ErrorCode");
goog.require("goog.net.EventType");
goog.require("goog.net.HttpStatus");
goog.require("goog.net.XmlHttp");
goog.require("goog.object");
goog.require("goog.structs");
goog.require("goog.structs.Map");
goog.require("goog.uri.utils");
goog.net.XhrIo = function(opt_xmlHttpFactory) {
  goog.events.EventTarget.call(this);
  this.headers = new goog.structs.Map;
  this.xmlHttpFactory_ = opt_xmlHttpFactory || null
};
goog.inherits(goog.net.XhrIo, goog.events.EventTarget);
goog.net.XhrIo.ResponseType = {DEFAULT:"", TEXT:"text", DOCUMENT:"document", BLOB:"blob", ARRAY_BUFFER:"arraybuffer"};
goog.net.XhrIo.prototype.logger_ = goog.debug.Logger.getLogger("goog.net.XhrIo");
goog.net.XhrIo.CONTENT_TYPE_HEADER = "Content-Type";
goog.net.XhrIo.HTTP_SCHEME_PATTERN = /^https?$/i;
goog.net.XhrIo.FORM_CONTENT_TYPE = "application/x-www-form-urlencoded;charset=utf-8";
goog.net.XhrIo.sendInstances_ = [];
goog.net.XhrIo.send = function(url, opt_callback, opt_method, opt_content, opt_headers, opt_timeoutInterval) {
  var x = new goog.net.XhrIo;
  goog.net.XhrIo.sendInstances_.push(x);
  if(opt_callback) {
    goog.events.listen(x, goog.net.EventType.COMPLETE, opt_callback)
  }
  goog.events.listen(x, goog.net.EventType.READY, goog.partial(goog.net.XhrIo.cleanupSend_, x));
  if(opt_timeoutInterval) {
    x.setTimeoutInterval(opt_timeoutInterval)
  }
  x.send(url, opt_method, opt_content, opt_headers)
};
goog.net.XhrIo.cleanup = function() {
  var instances = goog.net.XhrIo.sendInstances_;
  while(instances.length) {
    instances.pop().dispose()
  }
};
goog.net.XhrIo.protectEntryPoints = function(errorHandler) {
  goog.net.XhrIo.prototype.onReadyStateChangeEntryPoint_ = errorHandler.protectEntryPoint(goog.net.XhrIo.prototype.onReadyStateChangeEntryPoint_)
};
goog.net.XhrIo.cleanupSend_ = function(XhrIo) {
  XhrIo.dispose();
  goog.array.remove(goog.net.XhrIo.sendInstances_, XhrIo)
};
goog.net.XhrIo.prototype.active_ = false;
goog.net.XhrIo.prototype.xhr_ = null;
goog.net.XhrIo.prototype.xhrOptions_ = null;
goog.net.XhrIo.prototype.lastUri_ = "";
goog.net.XhrIo.prototype.lastMethod_ = "";
goog.net.XhrIo.prototype.lastErrorCode_ = goog.net.ErrorCode.NO_ERROR;
goog.net.XhrIo.prototype.lastError_ = "";
goog.net.XhrIo.prototype.errorDispatched_ = false;
goog.net.XhrIo.prototype.inSend_ = false;
goog.net.XhrIo.prototype.inOpen_ = false;
goog.net.XhrIo.prototype.inAbort_ = false;
goog.net.XhrIo.prototype.timeoutInterval_ = 0;
goog.net.XhrIo.prototype.timeoutId_ = null;
goog.net.XhrIo.prototype.responseType_ = goog.net.XhrIo.ResponseType.DEFAULT;
goog.net.XhrIo.prototype.withCredentials_ = false;
goog.net.XhrIo.prototype.getTimeoutInterval = function() {
  return this.timeoutInterval_
};
goog.net.XhrIo.prototype.setTimeoutInterval = function(ms) {
  this.timeoutInterval_ = Math.max(0, ms)
};
goog.net.XhrIo.prototype.setResponseType = function(type) {
  this.responseType_ = type
};
goog.net.XhrIo.prototype.getResponseType = function() {
  return this.responseType_
};
goog.net.XhrIo.prototype.setWithCredentials = function(withCredentials) {
  this.withCredentials_ = withCredentials
};
goog.net.XhrIo.prototype.getWithCredentials = function() {
  return this.withCredentials_
};
goog.net.XhrIo.prototype.send = function(url, opt_method, opt_content, opt_headers) {
  if(this.xhr_) {
    throw Error("[goog.net.XhrIo] Object is active with another request");
  }
  var method = opt_method ? opt_method.toUpperCase() : "GET";
  this.lastUri_ = url;
  this.lastError_ = "";
  this.lastErrorCode_ = goog.net.ErrorCode.NO_ERROR;
  this.lastMethod_ = method;
  this.errorDispatched_ = false;
  this.active_ = true;
  this.xhr_ = this.createXhr();
  this.xhrOptions_ = this.xmlHttpFactory_ ? this.xmlHttpFactory_.getOptions() : goog.net.XmlHttp.getOptions();
  this.xhr_.onreadystatechange = goog.bind(this.onReadyStateChange_, this);
  try {
    this.logger_.fine(this.formatMsg_("Opening Xhr"));
    this.inOpen_ = true;
    this.xhr_.open(method, url, true);
    this.inOpen_ = false
  }catch(err) {
    this.logger_.fine(this.formatMsg_("Error opening Xhr: " + err.message));
    this.error_(goog.net.ErrorCode.EXCEPTION, err);
    return
  }
  var content = opt_content || "";
  var headers = this.headers.clone();
  if(opt_headers) {
    goog.structs.forEach(opt_headers, function(value, key) {
      headers.set(key, value)
    })
  }
  if(method == "POST" && !headers.containsKey(goog.net.XhrIo.CONTENT_TYPE_HEADER)) {
    headers.set(goog.net.XhrIo.CONTENT_TYPE_HEADER, goog.net.XhrIo.FORM_CONTENT_TYPE)
  }
  goog.structs.forEach(headers, function(value, key) {
    this.xhr_.setRequestHeader(key, value)
  }, this);
  if(this.responseType_) {
    this.xhr_.responseType = this.responseType_
  }
  if(goog.object.containsKey(this.xhr_, "withCredentials")) {
    this.xhr_.withCredentials = this.withCredentials_
  }
  try {
    if(this.timeoutId_) {
      goog.Timer.defaultTimerObject.clearTimeout(this.timeoutId_);
      this.timeoutId_ = null
    }
    if(this.timeoutInterval_ > 0) {
      this.logger_.fine(this.formatMsg_("Will abort after " + this.timeoutInterval_ + "ms if incomplete"));
      this.timeoutId_ = goog.Timer.defaultTimerObject.setTimeout(goog.bind(this.timeout_, this), this.timeoutInterval_)
    }
    this.logger_.fine(this.formatMsg_("Sending request"));
    this.inSend_ = true;
    this.xhr_.send(content);
    this.inSend_ = false
  }catch(err) {
    this.logger_.fine(this.formatMsg_("Send error: " + err.message));
    this.error_(goog.net.ErrorCode.EXCEPTION, err)
  }
};
goog.net.XhrIo.prototype.createXhr = function() {
  return this.xmlHttpFactory_ ? this.xmlHttpFactory_.createInstance() : goog.net.XmlHttp()
};
goog.net.XhrIo.prototype.timeout_ = function() {
  if(typeof goog == "undefined") {
  }else {
    if(this.xhr_) {
      this.lastError_ = "Timed out after " + this.timeoutInterval_ + "ms, aborting";
      this.lastErrorCode_ = goog.net.ErrorCode.TIMEOUT;
      this.logger_.fine(this.formatMsg_(this.lastError_));
      this.dispatchEvent(goog.net.EventType.TIMEOUT);
      this.abort(goog.net.ErrorCode.TIMEOUT)
    }
  }
};
goog.net.XhrIo.prototype.error_ = function(errorCode, err) {
  this.active_ = false;
  if(this.xhr_) {
    this.inAbort_ = true;
    this.xhr_.abort();
    this.inAbort_ = false
  }
  this.lastError_ = err;
  this.lastErrorCode_ = errorCode;
  this.dispatchErrors_();
  this.cleanUpXhr_()
};
goog.net.XhrIo.prototype.dispatchErrors_ = function() {
  if(!this.errorDispatched_) {
    this.errorDispatched_ = true;
    this.dispatchEvent(goog.net.EventType.COMPLETE);
    this.dispatchEvent(goog.net.EventType.ERROR)
  }
};
goog.net.XhrIo.prototype.abort = function(opt_failureCode) {
  if(this.xhr_ && this.active_) {
    this.logger_.fine(this.formatMsg_("Aborting"));
    this.active_ = false;
    this.inAbort_ = true;
    this.xhr_.abort();
    this.inAbort_ = false;
    this.lastErrorCode_ = opt_failureCode || goog.net.ErrorCode.ABORT;
    this.dispatchEvent(goog.net.EventType.COMPLETE);
    this.dispatchEvent(goog.net.EventType.ABORT);
    this.cleanUpXhr_()
  }
};
goog.net.XhrIo.prototype.disposeInternal = function() {
  if(this.xhr_) {
    if(this.active_) {
      this.active_ = false;
      this.inAbort_ = true;
      this.xhr_.abort();
      this.inAbort_ = false
    }
    this.cleanUpXhr_(true)
  }
  goog.net.XhrIo.superClass_.disposeInternal.call(this)
};
goog.net.XhrIo.prototype.onReadyStateChange_ = function() {
  if(!this.inOpen_ && !this.inSend_ && !this.inAbort_) {
    this.onReadyStateChangeEntryPoint_()
  }else {
    this.onReadyStateChangeHelper_()
  }
};
goog.net.XhrIo.prototype.onReadyStateChangeEntryPoint_ = function() {
  this.onReadyStateChangeHelper_()
};
goog.net.XhrIo.prototype.onReadyStateChangeHelper_ = function() {
  if(!this.active_) {
    return
  }
  if(typeof goog == "undefined") {
  }else {
    if(this.xhrOptions_[goog.net.XmlHttp.OptionType.LOCAL_REQUEST_ERROR] && this.getReadyState() == goog.net.XmlHttp.ReadyState.COMPLETE && this.getStatus() == 2) {
      this.logger_.fine(this.formatMsg_("Local request error detected and ignored"))
    }else {
      if(this.inSend_ && this.getReadyState() == goog.net.XmlHttp.ReadyState.COMPLETE) {
        goog.Timer.defaultTimerObject.setTimeout(goog.bind(this.onReadyStateChange_, this), 0);
        return
      }
      this.dispatchEvent(goog.net.EventType.READY_STATE_CHANGE);
      if(this.isComplete()) {
        this.logger_.fine(this.formatMsg_("Request complete"));
        this.active_ = false;
        try {
          if(this.isSuccess()) {
            this.dispatchEvent(goog.net.EventType.COMPLETE);
            this.dispatchEvent(goog.net.EventType.SUCCESS)
          }else {
            this.lastErrorCode_ = goog.net.ErrorCode.HTTP_ERROR;
            this.lastError_ = this.getStatusText() + " [" + this.getStatus() + "]";
            this.dispatchErrors_()
          }
        }finally {
          this.cleanUpXhr_()
        }
      }
    }
  }
};
goog.net.XhrIo.prototype.cleanUpXhr_ = function(opt_fromDispose) {
  if(this.xhr_) {
    var xhr = this.xhr_;
    var clearedOnReadyStateChange = this.xhrOptions_[goog.net.XmlHttp.OptionType.USE_NULL_FUNCTION] ? goog.nullFunction : null;
    this.xhr_ = null;
    this.xhrOptions_ = null;
    if(this.timeoutId_) {
      goog.Timer.defaultTimerObject.clearTimeout(this.timeoutId_);
      this.timeoutId_ = null
    }
    if(!opt_fromDispose) {
      this.dispatchEvent(goog.net.EventType.READY)
    }
    try {
      xhr.onreadystatechange = clearedOnReadyStateChange
    }catch(e) {
      this.logger_.severe("Problem encountered resetting onreadystatechange: " + e.message)
    }
  }
};
goog.net.XhrIo.prototype.isActive = function() {
  return!!this.xhr_
};
goog.net.XhrIo.prototype.isComplete = function() {
  return this.getReadyState() == goog.net.XmlHttp.ReadyState.COMPLETE
};
goog.net.XhrIo.prototype.isSuccess = function() {
  var status = this.getStatus();
  return goog.net.HttpStatus.isSuccess(status) || status === 0 && !this.isLastUriEffectiveSchemeHttp_()
};
goog.net.XhrIo.prototype.isLastUriEffectiveSchemeHttp_ = function() {
  var scheme = goog.uri.utils.getEffectiveScheme(String(this.lastUri_));
  return goog.net.XhrIo.HTTP_SCHEME_PATTERN.test(scheme)
};
goog.net.XhrIo.prototype.getReadyState = function() {
  return this.xhr_ ? this.xhr_.readyState : goog.net.XmlHttp.ReadyState.UNINITIALIZED
};
goog.net.XhrIo.prototype.getStatus = function() {
  try {
    return this.getReadyState() > goog.net.XmlHttp.ReadyState.LOADED ? this.xhr_.status : -1
  }catch(e) {
    this.logger_.warning("Can not get status: " + e.message);
    return-1
  }
};
goog.net.XhrIo.prototype.getStatusText = function() {
  try {
    return this.getReadyState() > goog.net.XmlHttp.ReadyState.LOADED ? this.xhr_.statusText : ""
  }catch(e) {
    this.logger_.fine("Can not get status: " + e.message);
    return""
  }
};
goog.net.XhrIo.prototype.getLastUri = function() {
  return String(this.lastUri_)
};
goog.net.XhrIo.prototype.getResponseText = function() {
  try {
    return this.xhr_ ? this.xhr_.responseText : ""
  }catch(e) {
    this.logger_.fine("Can not get responseText: " + e.message);
    return""
  }
};
goog.net.XhrIo.prototype.getResponseXml = function() {
  try {
    return this.xhr_ ? this.xhr_.responseXML : null
  }catch(e) {
    this.logger_.fine("Can not get responseXML: " + e.message);
    return null
  }
};
goog.net.XhrIo.prototype.getResponseJson = function(opt_xssiPrefix) {
  if(!this.xhr_) {
    return undefined
  }
  var responseText = this.xhr_.responseText;
  if(opt_xssiPrefix && responseText.indexOf(opt_xssiPrefix) == 0) {
    responseText = responseText.substring(opt_xssiPrefix.length)
  }
  return goog.json.parse(responseText)
};
goog.net.XhrIo.prototype.getResponse = function() {
  try {
    if(!this.xhr_) {
      return null
    }
    if("response" in this.xhr_) {
      return this.xhr_.response
    }
    switch(this.responseType_) {
      case goog.net.XhrIo.ResponseType.DEFAULT:
      ;
      case goog.net.XhrIo.ResponseType.TEXT:
        return this.xhr_.responseText;
      case goog.net.XhrIo.ResponseType.ARRAY_BUFFER:
        if("mozResponseArrayBuffer" in this.xhr_) {
          return this.xhr_.mozResponseArrayBuffer
        }
    }
    this.logger_.severe("Response type " + this.responseType_ + " is not " + "supported on this browser");
    return null
  }catch(e) {
    this.logger_.fine("Can not get response: " + e.message);
    return null
  }
};
goog.net.XhrIo.prototype.getResponseHeader = function(key) {
  return this.xhr_ && this.isComplete() ? this.xhr_.getResponseHeader(key) : undefined
};
goog.net.XhrIo.prototype.getAllResponseHeaders = function() {
  return this.xhr_ && this.isComplete() ? this.xhr_.getAllResponseHeaders() : ""
};
goog.net.XhrIo.prototype.getLastErrorCode = function() {
  return this.lastErrorCode_
};
goog.net.XhrIo.prototype.getLastError = function() {
  return goog.isString(this.lastError_) ? this.lastError_ : String(this.lastError_)
};
goog.net.XhrIo.prototype.formatMsg_ = function(msg) {
  return msg + " [" + this.lastMethod_ + " " + this.lastUri_ + " " + this.getStatus() + "]"
};
goog.debug.entryPointRegistry.register(function(transformer) {
  goog.net.XhrIo.prototype.onReadyStateChangeEntryPoint_ = transformer(goog.net.XhrIo.prototype.onReadyStateChangeEntryPoint_)
});
goog.provide("cljs.diplomski.al");
goog.require("cljs.core");
goog.require("goog.net.XhrIo");
goog.require("clojure.browser.event");
cljs.diplomski.al.datum1 = function datum1() {
  return"2013-06-12"
};
document.write('Procenat kompletnosti (0-1):<br/><input type="text" name="kompletnost" id="ptext"><br/><br/><br/>');
document.write('<input type="checkbox" name="Daljinskim" id="dcbox">\u010citanje daljinskim putem<br/><br/><br/>');
document.write("Izaberite datum:");
document.write('<select id="cmb"><option value="2013-06-12">2013-06-12</option></select>');
document.write("<br/><br/><br/>");
document.write('<input type="button" id="search-btn" value="Prika\u017ei podatke" />');
document.write("</form>");
cljs.diplomski.al.percent_textbox = document.getElementById("ptext");
cljs.diplomski.al.remotely_checkbox = document.getElementById("dcbox");
cljs.diplomski.al.search_button = document.getElementById("search-btn");
cljs.diplomski.al.datum = function datum() {
  return document.getElementById("cmb").value
};
cljs.diplomski.al.procenat = function procenat() {
  return cljs.diplomski.al.percent_textbox.value
};
cljs.diplomski.al.vrati_procenat = function vrati_procenat() {
  if(cljs.core._EQ_.call(null, "", cljs.diplomski.al.procenat.call(null))) {
    return"-1"
  }else {
    return[cljs.core.str(cljs.diplomski.al.procenat.call(null))].join("")
  }
};
cljs.diplomski.al.checked = function checked() {
  if(cljs.core._EQ_.call(null, true, cljs.diplomski.al.remotely_checkbox.checked)) {
    return"1"
  }else {
    return"0"
  }
};
cljs.diplomski.al.build_link = function build_link() {
  return[cljs.core.str("http://ivanlt:3000/tbl/"), cljs.core.str(cljs.diplomski.al.datum.call(null)), cljs.core.str("/"), cljs.core.str(cljs.diplomski.al.vrati_procenat.call(null)), cljs.core.str("/"), cljs.core.str(cljs.diplomski.al.checked.call(null))].join("")
};
cljs.diplomski.al.open_link = function open_link() {
  return window.open(cljs.diplomski.al.build_link.call(null))
};
cljs.diplomski.al.write_something = function write_something() {
  return document.write(cljs.diplomski.al.build_link.call(null))
};
clojure.browser.event.listen.call(null, cljs.diplomski.al.search_button, "click", function() {
  return cljs.diplomski.al.open_link.call(null)
});
