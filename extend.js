(function() {
  var graph = require("fbgraph");

  // get from facebook graph api explorer page
  graph.setAccessToken(process.env.fb_df_access_token);

  graph.extendAccessToken(
    {
      access_token: process.env.fb_df_access_token,
      client_id: "App Id from FB",
      client_secret: "from App Settings/Basic"
    },
    function(err, facebookRes) {
      console.log(facebookRes);
    }
  );
})();
