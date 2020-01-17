(function() {
  var graph = require("fbgraph");
  // get from facebook graph api explorer page

  // use this to convert a token from explorer page to a long lived one

  // this may be required if my facebook password changes

  // do for both daily functal & daliy jzx.
  // replace process.env.fb_df_access_token below with the token from explorer page

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
