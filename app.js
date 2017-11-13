var express 	 		 = require("express"),
		router  	 	 	 = express.Router(),
		app				 		 = express(),
		bodyParser 		 = require('body-parser'),
		// flash	 				 = require('connect-flash'),
		methodOverride = require('method-override');

// body-parser provides req.body object
app.use(bodyParser.urlencoded({extended: true}));
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
	res.render('landing', {user: {username: req.body.username, password: req.body.password}});
});

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