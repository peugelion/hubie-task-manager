var express 	 		 = require("express"),
		router  	 	 	 = express.Router(),
		//https 				 = require('https'),
		//fs 						 = require('fs'),
		app				 		 = express(),
		bodyParser 		 = require('body-parser'),
		flash	 				 = require('connect-flash'),
		methodOverride = require('method-override'),
		session				 = require('express-session'),
		cookieParser	 = require('cookie-parser'),
		hubieApi 			 = require('./models/hubie-interface').connect();

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
// router.post("/login", callback);
router.post('/login', function(req, res) {
	let username = req.body.username;
	let password = req.body.password
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
				res.cookie("hubieLoginUsername", username);
				res.cookie("hubieLoginPassword", password);
			}
			res.redirect('taskOverview');
			// hubieApi.loadTasks(companyCode, fk_appUser, lang_id)
			// 	.then(result => {
			// 		console.log("Tasks ===== ", result);
			// 		res.render('taskOverview', {user: {username: 'jovica', password: 'jovica'}});
			// 	})
			// 	.catch(err => {
			// 		console.log(err);
			// 	});
		})
		.catch(err => {
			req.flash("error", err.message);
			res.redirect('login');
		});
});

// show landing page
router.get('/taskOverview', function(req, res) {
	res.render('taskOverview', {user: {username: 'jovica', password: 'jovica'}});
})

// logout
router.get("/logout", function(req, res) {
	req.session.destroy(err => {
		if(err) console.log("You are not logged out. Reason : " + err);
	});
	res.clearCookie("hubieLoginUsername");
	res.clearCookie("hubieLoginPassword");
	res.redirect('login');
});

app.use(function(req, res, next) {
	res.locals.currentUser = req.session.currentUser;
	res.locals.error = req.flash("error");
	res.locals.success = req.flash("success");
	next();
})

app.use(router);

app.listen(3000, function() {
	console.log('TaskManager app started!');
});

// https.createServer(sslOptions, app).listen(8443, function() {
// 	console.log('TaskManager app started!');
// });