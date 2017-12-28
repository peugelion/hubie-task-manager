var express 	 		 = require("express"),
		router  	 	 	 = express.Router(),
		app				 		 = express(),
		bodyParser 		 = require('body-parser'),
		flash	 				 = require('connect-flash'),
		methodOverride = require('method-override'),
		session				 = require('express-session'),
		cookieParser	 = require('cookie-parser'),
		hubieApi 			 = require('./models/hubie-interface').connect();

// body-parser provides req.body object
app.use(bodyParser.urlencoded({extended: true}));
//app.use(bodyParser.json());

// with this I'm serving the public directory
app.use(express.static(__dirname + "/public"));

// methodOverride provides the override for PUT and DELETE HTTP methods
app.use(methodOverride("_method"));

app.use(session({
	secret: "Once upon a time...!",
	resave: false,
	saveUninitialized: false,
	cookie: {
		path: '/',
		httpOnly: true,
		secure: false,
		maxAge: 30 * 60 * 1000
	}
}));

app.use(cookieParser());

// for success/error messages between two requests
app.use(flash());

// templating engine ejs - embedded javascript
app.set("view engine", "ejs");

function isLoggedIn (req, res, next) {
	if(req.sessionID && req.session.fk_appUser) {
		return next();
	}
	req.flash("error", "You need to be logged in to do that!");
	res.redirect('/login');
}

function handleLogin(req, res) {
	let username = req.body.username || req.cookies.hubieLoginUsername;
	let password = req.body.password || req.cookies.hubieLoginPassword;
	hubieApi.login(username, password)
		.then(result => {
			let companyCode = result.recordsets[0][0].Sifra;
			let lang_id			= result.recordsets[1][0].FK_Jezik;
			let fk_appUser	= result.recordsets[2][0].fk_korisnikApl;
			req.session.companyCode = companyCode;
			req.session.fk_appUser	= fk_appUser;
			req.session.lang_id			= lang_id;
			req.session.currentUser	= result.recordsets[2][0].ime + " " + result.recordsets[2][0].prezime;
			if (req.body.remember_me) {
				let cookieOptions = {
					path: '/',
					httpOnly: true,
					maxAge: 30 * 24 * 60 * 60 * 1000   // 30 days
				}
				res.cookie("hubieLoginUsername", username, cookieOptions);
				res.cookie("hubieLoginPassword", password, cookieOptions);
			}
			res.redirect('taskOverview');
		})
		.catch(err => {
			req.flash("error", err.message);
			res.redirect('login');
		});
}

// ===== ORDER OF ROUTES IS IMPORTANT!!! =====
// root route
router.get("/", function(req, res) {
	if(req.cookies.hubieLoginUsername && req.cookies.hubieLoginPassword) {
		handleLogin(req, res);
	} else {
		res.redirect('login');
	}
});

// show login page
router.get("/login", function(req, res) {
	if(req.sessionID && req.session.fk_appUser) {
		res.redirect('taskOverview');
	} else {
		res.render('login');
	}
});

// handle login
// router.post("/login", callback);
router.post('/login', function(req, res) {
	handleLogin(req, res);
});

// show landing page
router.get('/taskOverview', isLoggedIn, function(req, res) {
	let session = req.session;
	hubieApi.loadTasks(session.companyCode, session.fk_appUser, session.lang_id)
		.then(result => {
			res.render('taskOverview', {loadedTasks: result.recordset});
		})
		.catch(err => {
			console.log(err);
		});
});

// logout
router.get("/logout", function(req, res) {
	req.session.destroy(err => {
		if(err) console.log("You are not logged out. Reason : " + err);
	});
	res.clearCookie("hubieLoginUsername");
	res.clearCookie("hubieLoginPassword");
	res.redirect('login');
});

// middleware to use on every request
app.use(function(req, res, next) {
		res.locals.currentUser = req.session.currentUser;
		res.locals.error = req.flash("error");
		res.locals.success = req.flash("success");
		next();
});

app.use(router);

app.listen(3000, function() {
	console.log('TaskManager app started!');
});