var express 	 		 = require("express"),
		router  	 	 	 = express.Router(),
		https 				 = require('https'),
		fs 						 = require('fs'),
		app				 		 = express(),
		bodyParser 		 = require('body-parser'),
		// flash	 				 = require('connect-flash'),
		methodOverride = require('method-override'),
		hubieApi 			 = require('./models/hubie-interface')();

// options object for https server
// var sslOptions = {
//   key: fs.readFileSync('key.pem'),
//   cert: fs.readFileSync('cert.pem'),
//   passphrase: 'hubie'
// };

// body-parser provides req.body object
app.use(bodyParser.urlencoded({extended: true}));
//app.use(bodyParser.json());

// with this I'm serving the public directory
app.use(express.static(__dirname + "/public"));

// methodOverride provides the override for PUT and DELETE HTTP methods
app.use(methodOverride("_method"));

// for success/error messages between two requests
// app.use(flash());

// templating engine ejs - embedded javascript
app.set("view engine", "ejs");


// ===== ORDER OF ROUTES IS IMPORTANT!!! =====
// root route
router.get("/", function(req, res) {
	res.redirect('login');
});

// show login page
router.get("/login", function(req, res) {
	res.render('login');
});

// handle login
// router.post("/login", middleware, callback);
router.post('/login', function(req, res) {
	hubieApi.login(req.body.username, req.body.password);
	res.redirect('taskOverview');
});

// show landing page
router.get('/taskOverview', function(req, res) {
	res.render('landing', {user: {username: 'jovica', password: 'jovica'}});
})

// logout
router.get("/logout", function(req, res) {
	// req.logout();
	// req.flash("success", "Logged you out!");
	res.redirect('login');
});

app.use(router);

app.listen(3000, function() {
	console.log('TaskManager app started!');
});

// https.createServer(sslOptions, app).listen(8443, function() {
// 	console.log('TaskManager app started!');
// });