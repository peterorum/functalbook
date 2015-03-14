(function()
{
    "use strict";

    // just serves up one particular file

    var fs = require('fs');
    var http = require('http');
    var url = require('url');

    http.createServer(function(req, res)
    {
        var request = url.parse(req.url, true);
        var action = request.pathname;

        if (action == '/functal.png')
        {
            var img = fs.readFileSync('./functal.png');

            res.writeHead(200,
            {
                'Content-Type': 'image/png'
            });

            res.end(img, 'binary');
        }
        else
        {
            res.writeHead(200,
            {
                'Content-Type': 'text/plain'
            });

            res.end('Functal\n');
        }
    }).listen(8081);


})();
