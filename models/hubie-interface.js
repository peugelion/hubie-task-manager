var sql = require('mssql');

const config = {
	user: 'sa',
  password: 'password',
  server: '10.11.2.138',
  database: 'hubie_web',
  connectionTimeout: 5000,
  requestTimeout: 10000,
  pool: {
  	max: 15,
  	idleTimeoutMillis: 60000
  }
}

module.exports = function() {
	let connError = {};
	let pool = null;
	return {
		connect: function() {
			pool = new sql.ConnectionPool(config, err => {
				if(err) {
					connError.hasError = true;
					connError.error = err.originalError;
				}
			});
			return this;
		},
		login: function(user, pass) {
			return pool.request()
								 .input('username', sql.NVarChar, user)
								 .input('password', sql.NVarChar, pass)
						.execute('task_LogIn');
		},
		logout: function() {
			return "logout f()";
		},
		loadTasks: function(companyCode, fk_appUser, lang_id) {
			return pool.request()
								 .input('@SifraPreduzeca', sql.Int, 1)
								 .input('@Fk_korisnikApl', sql.Int, 292)
								 .input('@Jezik_id', sql.Int, 4)
						.execute('task_GetOpenTasks');
		}
	}	
}();