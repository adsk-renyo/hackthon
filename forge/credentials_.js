var baseUrl = 'https://developer-stg.api.autodesk.com';
var version = 'v1';
var credentials = {
	// Replace placeholder below by the Consumer Key and Consumer Secret you got from
	// http://developer.autodesk.com/ for the production server
	clientId: process.env.CONSUMER_KEY || '<your staging app consumer key here>',
	clientSecret: process.env.CONSUMER_SECRET || '<your staging app consumer secrete here>',
	grantType: 'client_credentials',

	authenticationUrl: baseUrl + '/authentication/' + version + '/authenticate'
};

module.exports = credentials;
