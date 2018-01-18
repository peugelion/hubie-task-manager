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
								 .input('SifraPreduzeca', sql.Int, companyCode)
								 .input('Fk_korisnikApl', sql.Int, fk_appUser)
								 .input('Jezik_id', sql.Int, lang_id)
						.execute('task_GetOpenTasks');
		},
		getTask: function(companyCode, lang_id, task_id) {
			return pool.request()
								 .input('SifraPreduzeca', sql.Int, companyCode)
								 .input('Jezik_id', sql.Int, lang_id)
								 .input('Fk_Task', sql.Int, task_id)
						.execute('task_GetTask');
		},
		loadPartners: function(companyCode, lang_id, searchstr) {
			return pool.request()
								 .input('Sifra_Preduzeca', sql.Int, companyCode)
								 .input('Jezik_id', sql.Int, lang_id)
								 .input('global', sql.NVarChar, searchstr)
						.execute('sp_GlobalPartner');
		},

		createTask: function(companyCode, lang_id, fk_appUser, newTask) {
			return pool.request()
								 .input('sifra_preduzeca', sql.Int, companyCode)
								 .input('kor_id', sql.Int, fk_appUser)
								 //.input('Datum', sql.DateTime, new Date().toISOString().slice(0, 19).replace('T', ' '))
								 .input('Datum', sql.DateTime, new Date('05/08/07 12:35 PM'))
								 .input('Fk_Partner', sql.NVarChar, newTask.Pk_id)
								 .input('Subject', sql.NVarChar(250), "test hardcode".substring(0, 250))
								 .input('Fk_Radnik', sql.Int, fk_appUser) // TODO ??
								 .input('PlanOd', sql.DateTime, null) // TODO ??
								 .input('PlanDo', sql.DateTime, null) // TODO ??
								 .input('PlanVreme', sql.NVarChar(5), null) // TODO ??
								 .input('RealizovanOd', sql.DateTime, null) // TODO ??
								 .input('RealizovanDo', sql.DateTime, null) // TODO ??
								 .input('RealizacijaVreme', sql.NVarChar(5), null) // TODO ??
								 .input('KomentarRadnika', sql.NVarChar(250), "Komentar Radnika".substring(0, 250))
								 .input('Fk_St_420', sql.Int, 2241) // TODO ??
						.execute('task_InsertTask');
		},
					
		updateTask: function(companyCode, fk_appUser, lang_id, task) {
			task.RealizacijaVreme = parseInt(task.RealizacijaVreme) || 0;
			task.RealizacijaDani  = parseInt(task.RealizacijaDani) || 0;
			task.fk_radnik 				= parseInt(task.fk_radnik) || null;
			return pool.request()
								 .input('SifraPreduzeca', sql.Int, companyCode)
								 .input('Jezik_id', sql.Int, lang_id)
								 .input('fk_KorisnikApl', sql.Int, fk_appUser)
								 .input('RealizovanOd', sql.NVarChar, task.RealizovanOdISO)
								 .input('RealizovanOdVreme', sql.Int, parseInt(task.RealizovanOdVreme))
								 .input('RealizovanDo', sql.NVarChar, task.RealizovanDoISO)
								 .input('RealizovanDoVreme', sql.Int, parseInt(task.RealizovanDoVreme))
								 .input('RealizacijaVreme', sql.Int, task.RealizacijaVreme)
								 .input('RealizacijaDani', sql.Int, task.RealizacijaDani)
								 .input('Fk_St_420', sql.Int, task.Naziv_Stavke)
								 .input('KomentarRadnika', sql.NVarChar, task.KomentarRadnika)
								 .input('fk_radnik', sql.Int, task.fk_radnik)
								 .input('Fk_Task', sql.Int, task.Pk_Id)
							.execute('task_UpdateTask');
		}
	}	
}();