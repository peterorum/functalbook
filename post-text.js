(function()
{
    var graph = require('fbgraph');

    graph.setAccessToken(process.env.fb_df_access_token);

    var post = {
        message: "Test post. Ingore if I haven't already deleted it."
    };

    graph.post("/feed", post, function(err, res)
    {
        console.log(res); // { id: xxxxx}
    });

})();
