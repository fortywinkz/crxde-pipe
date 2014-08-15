var fs = require('fs');
var logger = require('./logger');

var configPropNames;
var defaults = {};

configPropNames = {
  hostname: {
    attrName: 'HOSTNAME',
    matcher: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
    defaults: 'localhost'
  },
  port: {
    attrName: 'PORT',
    matcher: /\d{1,5}/,
    defaults: '4502'
  },
  login: {
    attrName: 'LOGIN',
    matcher: /^[a-z0-9_-]{4,18}$/,
    defaults: 'admin'
  },
  password: {
    attrName: 'PASSWORD',
    matcher: /.+/,
    defaults: 'admin'
  },
  cssMap: {
    attrName: 'CSS_PREPROC_MAP',
    defaults: '.preproc_config'
  },
  interval: {
    attrName: 'INTERVAL',
    matcher: /\d+/,
    defaults: 500
  },
  ignore: {
    attrName: 'IGNORE',
    defaults: /\.git|\.sass-cache|\.hg|\.idea|\.svn|\.cache|\.project|___jb__bak___|Thumbs.db$|ehthumbs.db$|Desktop.ini$|\$RECYCLE.BIN/
  },
  enablePreproc: {
    attrName: 'ENABLE_PREPROC',
    matcher: /(true|false)/,
    defaults: false
  },
  matchRoot: {
    attrName: 'MATCH_ROOT',
    defaults: /jcr_root(.*)$/
  }
};

(function () {
  var c = configPropNames,
      keys = Object.keys(c);

  keys.forEach(function (key){
    defaults[c[key].attrName] = c[key].defaults;
  });
})();

function firstLetterUpperCase(string) {
  var fl = string[0].toUpperCase();
  var worldWithoutFL = string.substr(1);

  return fl + worldWithoutFL;
}

function Config(path, callback) {
  var self = this;

  this.path = path;

  this.options = Object.create(defaults);
  this.callback = callback;

  fs.exists(path, function (exist) {
    if (exist) {
      self._parseFile(path);
    } else {
      logger.error('Config file doesn\'t exist: ' + path);
    }
  })
}

Config.prototype = {
  get: function (name) {
    return this.options[name];
  },

  _parseFile: function (path) {
    var self = this;

    fs.readFile(path, function (error, configJSON) {
      var config;

      if (error) {
        throw error;
      } else {
        config = JSON.parse(configJSON);

        Object.keys(configPropNames).forEach(function (configKey) {
          var configName = configPropNames[configKey].attrName,
              configProp = config[configName],
              parseFunction = self['_parse' + firstLetterUpperCase(configKey)],
              parsedValue;

          if (!parseFunction) {
            self.options[configName] = configProp;
          } else if (typeof configProp !== 'undefined') {
            parsedValue = parseFunction.call(self, configProp);

            if (typeof parsedValue === 'boolean' || parsedValue) {
              console.log(parsedValue);
              self.options[configName] = parsedValue;
            }
          }
        });

        self.callback();
      }
    });
  },

  _parserAttrError : function (attrKey, value) {
    var attrName = configPropNames[attrKey].attrName;

     logger.error('You might make mistake in %s, you write: %s', attrName, value);
  },

  _parserDefaultParse: function (attrKey, prop) {
    var matcher = configPropNames[attrKey].matcher;
    var attr = configPropNames[attrKey].attrName;

    if (matcher.test(prop)) {
      return prop;
    } else {
      this._parserAttrError(attrKey, prop);
    }
  },

  _parseHostname: function (hostname) {
    return this._parserDefaultParse('hostname', hostname);
  },

  _parsePort: function (port) {
    return this._parserDefaultParse('port', port);
  },

  _parseLogin: function (login) {
    return this._parserDefaultParse('login', login);
  },

  _parseInterval: function (interval) {
    return this._parserDefaultParse('interval', interval);
  },

  _parseEnablePreproc: function (flag) {
    return this._parserDefaultParse('enablePreproc', flag);
  },

  _parseIgnore: function (ignore) {
    return new RegExp(ignore);
  },

  _parseMatchRoot: function (matchRoot) {
    return new RegExp(matchRoot);
  },

  _parseEnablePreproc: function (enablePreproc) {
    var matcher = configPropNames.enablePreproc.matcher;

    if(matcher.test(enablePreproc)){
      if (enablePreproc instanceof String){
        return enablePreproc === 'false' ? false : true;
      }

      return enablePreproc;
    }
  }
}

module.exports = Config;