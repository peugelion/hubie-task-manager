var sql = require('mssql');

const config = {
	user: 'sa',
  password: 'password',
  server: '10.11.2.138', // You can use 'localhost\\instance' to connect to named instance
  database: 'hubie_web',
  connectionTimeout: 10000,
  requestTimeout: 10000,
  pool: {
  	max: 15,
  	idleTimeoutMillis: 60000
  }
}

module.exports = function() {
	var pool = new sql.ConnectionPool(config, err => {
		if (err) {
			console.log(err);
		}
	});
	return {
		login: function(username, password) {
			pool.request();

			pool.request()
		  .input('username', sql.NVarChar, username)
		  .input('password', sql.NVarChar, password)
		  .execute('task_LogIn', (err, result) => {
		  	if(err) {
		  		console.log(err);		  	
		  	} else {
		  		// if 'remember me'
		  		
		  		console.log('JA');
		  		return result;
        }
	    });
		},
		logout: function() {
			return "logout f()";
		},
		loadTasks: function() {
			return "loadTasks f()";
		}
	}	
};