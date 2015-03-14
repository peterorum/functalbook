(function()
{
    var graph = require('fbgraph');

    graph.setAccessToken(process.env.fb_df_access_token);

    graph.extendAccessToken(
    {
        "access_token": process.env.fb_df_access_token,
        "client_id": process.env.fb_df_app_id,
        "client_secret": process.env.fb_df_app_secret
    }, function(err, facebookRes)
    {
        console.log(facebookRes);
    });

})();
