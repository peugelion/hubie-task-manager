var express 	 		 = require("express"),
		router  	 	 	 = express.Router(),
		app				 		 = express(),
		bodyParser 		 = require('body-parser'),
		flash	 				 = require('connect-flash'),
		methodOverride = require('method-override'),
		session				 = require('express-session'),
		cookieParser	 = require('cookie-parser'),
		hubieApi 			 = require('./models/hubie-interface').connect(),
		moment 				 = require('moment');

moment.locale('sr');

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
			req.session.companyCode  = companyCode;
			req.session.fk_appUser	 = fk_appUser;
			req.session.lang_id			 = lang_id;
			req.session.currentUser	 = result.recordsets[2][0].ime + " " + result.recordsets[2][0].prezime;
			req.session.taskStatuses = result.recordsets[3];
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
			res.render('taskOverview', {moment: moment, loadedTasks: result.recordset});
		})
		.catch(err => {
			console.log(err);
		});
});

// load form to create new task \ new task page
router.get('/tasks/new', isLoggedIn, function(req, res) {
	let session = req.session;
	res.render('newTask', {taskStatuses: req.session.taskStatuses});
});

// search parters api
router.get("/tasks/searchpartners/:searchstr", isLoggedIn, function(req, res) {
	let session = req.session;
	hubieApi.loadPartners(session.companyCode, session.lang_id, req.params.searchstr )
		.then(result => {
			var resp = {};
			//resp["success"] = true;
			resp["results"] = result.recordset;
			res.json(resp);
		})
		.catch(err => {
			console.log(err);
			//var resp = {};
			//resp["success"] = false;
			//resp["err"] = err;
			//res.json(resp);
		});
});

// create task
router.post('/tasks', isLoggedIn, function(req, res) {
  	// console.log(req.body); // your JSON
  	// res.send(req.body);    // echo the result back


	let session = req.session;
  	console.log(req.body);
  	console.log("req.body.Pk_id : ", req.body.Pk_id);
  	console.log("fk_appUser : ", session.fk_appUser);
  	var newTask = req.body;
	hubieApi.createTask(session.companyCode, session.lang_id, session.fk_appUser, newTask)
		.then(result => {
			//var resp = {};
			//resp["success"] = true;
			//resp["results"] = result.recordset;
			//res.json(resp);
			console.log(result);
			res.json(result);
		})
		.catch(err => {
			console.log(err);
		});
});

// show specific task
router.get('/tasks/:id', function(req, res) {
});

// load the form to update task
router.get("/tasks/:id/edit", isLoggedIn, function(req, res) {
	let session = req.session;
	hubieApi.getTask(session.companyCode, session.lang_id, req.params.id)
		.then(result => {
			result.recordset[0].Datum = moment(result.recordset[0].Datum).format('D. MMMM YYYY');
			res.render('editTask', {taskRecord: result.recordset[0], taskStatuses: req.session.taskStatuses});
		})
		.catch(err => {
			console.log(err);
		});
});

// update the task
router.put("/tasks/:id", isLoggedIn, function(req, res) {
	let task = req.body.task;
	hubieApi.updateTask(req.session.companyCode, req.session.fk_appUser, req.session.lang_id, task)
		.then(result => {
			req.flash("success", "Uspešno ste izmenili task.");
			res.redirect('/taskOverview');
		})
		.catch(err => {
			// req.flash("error", err.message);
			// res.redirect('back');
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