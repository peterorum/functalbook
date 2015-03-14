(function()
{
    var graph = require('fbgraph');

    graph.setAccessToken(process.env.fb_df_access_token);

    var options = {
        timeout: 3000,
        pool:
        {
            maxSockets: Infinity
        },
        headers:
        {
            connection: "keep-alive"
        }
    };

    graph
        .setOptions(options)
        .get("me", function(err, res)
        {
            console.log(res);
        });


})();
