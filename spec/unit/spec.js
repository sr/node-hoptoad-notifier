JSpec.describe('Hoptoad', function() {
  before_each(function() {
    Hoptoad.API_KEY    = undefined;
    Hoptoad.NOTICE_XML = fixture('notice.xml');
  });

  describe('notify', function() {
    before_each(function() {
      var HTTP    = require('http');
      var context = JSpec.context = {
        xml: 'FAKE_XML',

        client: {
          request: function(method, path, headers) {}
        },

        request: {
          'end'   : function() {},
          'write' : function() {}
        }
      };

      stub(HTTP, 'createClient').and_return(context.client);
      stub(Hoptoad, 'generateXML').and_return(context.xml);
      stub(context.client, 'request').and_return(context.request);
    });

    after_each(function() {
      var HTTP = require('http');

      JSpec.context = undefined;

      destub(HTTP);
      destub(Hoptoad);
    });

    it('should POST to "/notifier_api/v2/notices" with correct headers', function() {
      var
      context = JSpec.context;
      context.client.should.receive('request', 'once')
                           .with_args('POST',
                                      '/notifier_api/v2/notices',
                                      { 'Content-Type'   : 'text/xml',
                                        'Content-Length' : context.xml.length });

      Hoptoad.notify({});
    });

    it('should write the notice XML to the connection', function() {
      var
      context = JSpec.context;
      context.request.should.receive('write').with_args(context.xml);

      Hoptoad.notify({});
    });

    it('should end the request', function() {
      var
      context = JSpec.context;
      context.request.should.receive('end');

      Hoptoad.notify({});
    });
  });

  describe('environment=', function() {
    it('should default environment in notice XML to production', function() {
      var matcher = new RegExp('<environment-name>production</environment-name>');

      Hoptoad.NOTICE_XML.should.match(matcher);
    });

    it('should update environment in notice XML', function() {
      var matcher = new RegExp('<environment-name>staging</environment-name>');

      Hoptoad.environment = 'staging';
      Hoptoad.NOTICE_XML.should.match(matcher);
    });
  });

  describe('key=', function() {
    it('should insert API key into notice XML', function() {
      var key     = 'EXAMPLE_KEY';
      var matcher = new RegExp('<api-key>' + key + '</api-key>');

      Hoptoad.key = key;
      Hoptoad.NOTICE_XML.should.match(matcher);
    });

    it('should not overwrite an existing API key', function() {
      var key     = 'EXAMPLE_KEY';
      var matcher = new RegExp('<api-key>' + key + '</api-key>');

      Hoptoad.key = key;
      Hoptoad.key = 'SECOND_KEY';

      Hoptoad.NOTICE_XML.should.match(matcher)
    });
  });

  describe('generateBacktrace', function() {
    it('should generate line XML elements for each backtrace line', function() {
      var backtraceXML = Hoptoad.generateBacktrace({
        stack : "  at Timeout.callback (file.js:10:1)\n" +
                "  at fakeFunction (file2.js:100:1)"
      });

      backtraceXML.should.eql(['<line method="Timeout.callback" file="file.js" number="10" />', '<line method="fakeFunction" file="file2.js" number="100" />']);
    });

    it('should not include lines that do not match', function() {
      var backtraceXML = Hoptoad.generateBacktrace({
        stack : "  node.js (file.js:1:2)"
      });

      backtraceXML.should.be_empty
    });
  });

  describe('generateXML', function() {
    before_each(function() {
      stub(Hoptoad, 'generateBacktrace')
        .and_return(['<line-1 />', '<line-2 />']);
    });

    after_each(function() {
      destub(Hoptoad, 'generateBacktrace');
    });

    it('should include project root', function() {
      var xml     = Hoptoad.generateXML({});
      var root    = process.cwd();
      var matcher = new RegExp('<project-root>' + root + '</project-root>');

      xml.should.match(matcher);
    });

    it('should include error type', function() {
      var xml     = Hoptoad.generateXML({ type : 'SOME_CRAZY_ERROR' });
      var matcher = new RegExp('<class>SOME_CRAZY_ERROR</class>');

      xml.should.match(matcher);
    });

    it('should include error message', function() {
      var xml     = Hoptoad.generateXML({ message : 'Bad code.' });
      var matcher = new RegExp('<message>Bad code.</message>');

      xml.should.match(matcher);
    });

    it('should include backtrace lines', function() {
      var xml     = Hoptoad.generateXML({});
      var matcher = new RegExp('<backtrace><line-1 /><line-2 /></backtrace>');

      xml.should.match(matcher);
    });
  });
});
