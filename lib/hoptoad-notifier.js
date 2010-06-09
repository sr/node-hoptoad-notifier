var HTTP    = require('http');
var Hoptoad = {
  VERSION           : '0.1.0',
  NOTICE_XML        : '<?xml version="1.0" encoding="UTF-8"?><notice version="2.0"><api-key>API_KEY</api-key><notifier><name>hoptoad-notifier-js</name><version>0.1.0</version><url>http://github.com/tristandunn/hoptoad-notifier-js</url></notifier><error><class>EXCEPTION_CLASS</class><message>EXCEPTION_MESSAGE</message><backtrace>BACKTRACE_LINES</backtrace></error><server-environment><project-root>PROJECT_ROOT</project-root><environment-name>production</environment-name></server-environment></notice>',
  BACKTRACE_MATCHER : /\s+at (.*) \(([^\:]+)\:(\d+)\:(\d+)\)/,

  notify: function(error) {
    var xml     = Hoptoad.generateXML(error);
    var client  = HTTP.createClient(80, 'hoptoadapp.com');
    var headers = { 'Content-Type'   : 'text/xml',
                    'Content-Length' : xml.length };
    var request = client.request('POST', '/notifier_api/v2/notices', headers);

    request.write(xml);
    request.end();
  },

  set key(value) {
    if (Hoptoad.API_KEY === undefined) {
      Hoptoad.API_KEY    = value;
      Hoptoad.NOTICE_XML = Hoptoad.NOTICE_XML.replace('API_KEY', value);
    }
  },

  generateBacktrace: function(error) {
    return error.stack.split("\n").map(function(line) {
      var matches = line.match(Hoptoad.BACKTRACE_MATCHER);

      if (matches) {
        return '<line method="' + matches[1] +
                     '" file="' + matches[2] +
                   '" number="' + matches[3] + '" />';
      }
    }).filter(function(line) {
      return line !== undefined;
    });
  },

  generateXML: function(error) {
    var xml       = Hoptoad.NOTICE_XML;
    var backtrace = Hoptoad.generateBacktrace(error);

    return xml.replace('PROJECT_ROOT',      process.cwd())
              .replace('EXCEPTION_CLASS',   error.type)
              .replace('EXCEPTION_MESSAGE', error.message)
              .replace('BACKTRACE_LINES',   backtrace.join(''));
  }
};

exports.Hoptoad = Hoptoad;
