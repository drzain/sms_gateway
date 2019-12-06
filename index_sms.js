var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var http = require('http').Server(app);
var uuidv4 = require('uuid/v4');
var parseString = require('xml2js').parseString;
var utf8 = require('utf8');
var urlencode = require('urlencode');
var request = require('request');
var sha1 = require('sha1');
// require(process.cwd() + '/database');
var MySQL = require('mysql');

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.use((err, req, res, next) => {

    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        console.error(err);
        return res.sendStatus(400); // Bad request
    }

    next();
});

var DB1 = MySQL.createPool(
{
	connectionLimit : 32,
	host            : '172.15.1.3',
	user            : 'sms',
	password        : "5'+v_FC=#MDR^d^$QjW-",
	database        : 'db_sms_bfs'
});
/*var DB2 = MySQL.createPool(
{
	connectionLimit : 32,
	host            : '172.16.30.250',
	user            : 'ceontab',
	password        : 'remotecrontab',
	database        : 'fintech_v2'
});*/

var client = 'beyond_sms';
var api_version = '1';

app.post('/api/' + api_version + '/'+ client +'/sms', function(req, res, next) {
	//console.log(req.body);
	if(
		(req.body.user == '' || req.body.user == null) || (req.body.apikey == '' || req.body.apikey == null) || 
	   	(req.body.phone == '' || req.body.phone == null) || (req.body.message == '' || req.body.message == null)|| 
	   	(req.body.trxid == '' || req.body.trxid == null) || (req.body.trxdate == '' || req.body.trxdate == null) || 
	   	(req.body.senderid == '' || req.body.senderid == null) || (req.body.sendtype == '' || req.body.sendtype == null) || 
	   	(req.body.typesms == '' || req.body.typesms == null)
	){
		var o = [] // empty Object
		var data = {
		    code: '600',
		    desc: 'Missing parameter'
		};
		o.push(data);
		res.end(JSON.stringify(data));
		return false;
	}

	DB1.query("SELECT id, username, api_key, limit_sms FROM be_user WHERE is_active = 1 AND username = '"+req.body.user +"' AND api_key = '"+req.body.apikey+"' LIMIT 1", 
	function (err, result, fields) {
		if (err){
			throw err;
		} else {
			var str = JSON.stringify(result);
      		var rows = JSON.parse(str);
      		//console.log(rows.length);
      		//console.log(rows);
			//console.log(str);

			if(rows.length == '1'){
				for(var i = 0; i < rows.length; i++){
	      			var str2 = JSON.stringify(result[i]);
		 			var data = JSON.parse(str2);
		 			var username = data.username;
		 			var clientid = data.id;
	      		}

	      		var fullphone = req.body.phone;
	      		var prefix = fullphone.substr(0,4);

	      		DB1.query("SELECT sender_id FROM sms_client WHERE username = '"+req.body.user+"' AND state = 'Y' AND sender_id = '"+req.body.senderid+"'", 
				function (errq, resultq, fieldsq) {

					if(errq){
						console.log(req.body.trxid+' '+errq);
					}else{
						var strq = JSON.stringify(resultq);
						var rowq = JSON.parse(strq);

						if(rowq.length == '1'){

							//var uniqueid = uuidv4();
				      		//var message = urlencode.decode(req.body.message);
				      		var message = req.body.message;
				      		var drurl = req.body.drurl;

				      		if(req.body.typesms == 'unmask'){
								var jenissms = '1';
							}else{
								var jenissms = '2';
							}

							if(req.body.sendtype == 'otp'){
								var tipekirim = '1';
							}else{
								var tipekirim = '2';
							}

				      		var sql = "INSERT INTO sms_data (uniqueid, sender, msisdn, message, createdTimeStamp, lkddate, client, sms_tipe, send_tipe, system_by, flag, vendor) VALUES ('"+req.body.trxid+"','"+req.body.senderid+"','"+req.body.phone+"','"+mysql_real_escape_string(req.body.message)+"',NOW(),CURDATE(), '"+req.body.user+"', '"+jenissms+"', '2', 'API SMS','Y','Bhinneka')";
							DB1.query(sql, function(err, resultinsert){
								//console.log(err);
								if(err){

							        if(err.code == 'ER_DUP_ENTRY' || err.errno == 1062){
							            console.log('Here you can handle duplication')
							            var o = [] // empty Object
										var data = {
										    code: '610',
										    desc: 'Duplicate trxid'
										};
										o.push(data);
										res.end(JSON.stringify(data));
										console.log(req.body.trxid+' failed insert 610');
							        }else{
							           console.log(req.body.trxid+' '+err.code);
							        }

						      	}else{
						         	if(resultinsert.affectedRows > 0){
										/*var o = [] // empty Object
										var data = {
										    code: '7001',
										    unique: uniqueid
										};
										o.push(data);
										res.end(JSON.stringify(o));
										//res.send('<pre>7001</pre><pre>'+uniqueid+'</pre>');
										console.log('success insert');*/

										var userid = 'tiu';
										var secret = 'Bs9alWLKxWlH93eo6ToL';

										var headersOpt = {  
										    "content-type": "application/json",
										};

										
										var sendurl = 'https://api.smshub.co.id/sendSms';
										

										if(req.body.typesms == 'unmask'){
											var tipesms = 'unmask';
										}else{
											var tipesms = 'mask';
										}

										var signature = sha1(req.body.message+req.body.phone+req.body.senderid+req.body.trxdate+req.body.trxid+tipesms+userid+secret);


										var options = {
										  uri: sendurl,
										  method: 'POST',
										  headers: headersOpt,
										  json: {
										    "userid": userid,
											"msisdn": req.body.phone,
											"message": req.body.message,
											"type": tipesms ,
											"sender": req.body.senderid,
											"trxid": req.body.trxid,
											"trxdate": req.body.trxdate,
											"signature": signature
										  }
										};

										request(options, function (error, response, body) {
										  if (!error && response.statusCode == 200) {
										    console.log(body) // Print the shortened url.
										    var str = JSON.stringify(body);
										    var respon = JSON.parse(str);
										    var error_code = respon.error;
										    var pesan = respon.message;

										    if(error_code == '200'){

										    	var sqlsent = "INSERT INTO sms_sent (unique_id, error_code, message, create_TimeStamp, client) VALUES ('"+req.body.trxid+"','"+error_code+"','"+pesan+"', NOW(), '"+req.body.user+"')";
												DB1.query(sqlsent, function(err, resultinsert){
													if(err){
														console.log(req.body.trxid+' '+err.code)
													}
												});

												var o = [] // empty Object
												var data = {
												    code: '200',
												    desc: 'Success'
												};
												o.push(data);
												res.end(JSON.stringify(data));
												console.log(req.body.trxid+' sms success 200');

										    }else{

										    	var sqlunsent = "INSERT INTO sms_unsent (unique_id, error_code, message, create_TimeStamp, client) VALUES ('"+req.body.trxid+"','"+error_code+"','"+pesan+"', NOW(), '"+req.body.user+"')";
												DB1.query(sqlunsent, function(err, resultinsert){
													if(err){
														console.log(req.body.trxid+' '+err.code)
													}
												});

												var o = [] // empty Object
												var data = {
												    code: error_code,
												    desc: 'Failed'
												};
												o.push(data);
												res.end(JSON.stringify(data));
												console.log(req.body.trxid+' sms failed '+error_code);

										    }

										  }else{
										  		var sqlunsent = "INSERT INTO sms_unsent (unique_id, error_code, message, create_TimeStamp, client) VALUES ('"+req.body.trxid+"','"+error_code+"','"+pesan+"', NOW(), '"+req.body.user+"')";
												DB1.query(sqlunsent, function(err, resultinsert){
													if(err){
														console.log(req.body.trxid+' '+err.code)
													}
												});

										  		var data = {
												    code: '400',
												    desc: 'Failed'
												};
												res.end(JSON.stringify(data));
												console.log(req.body.trxid+' '+error);
										  }
										});


									}else{
										var o = [] // empty Object
										var data = {
										    code: '610',
										    desc: 'Duplicate trxid'
										};
										o.push(data);
										res.end(JSON.stringify(data));
										console.log(req.body.trxid+' failed insert 610');
									}
						      	}
							});

						}else{

							var data = {
							    code: '603',
							    desc: 'sender not registered'
							};
							res.end(JSON.stringify(data));
							console.log(req.body.trxid+' failed insert 603');

						}

					}

				});

			}else{
				var o = [] // empty Object
				var data = {
				    code: '605',
				    desc: 'check your authentication'
				};
				o.push(data);
				res.end(JSON.stringify(data));
				return false;
			}
		}
	});

});

app.post('/api/' + api_version + '/'+ client +'/premium', function(req, res, next) {
	//console.log(req.body);
	if(
		(req.body.user == '' || req.body.user == null) || (req.body.apikey == '' || req.body.apikey == null) || 
	   	(req.body.phone == '' || req.body.phone == null) || (req.body.message == '' || req.body.message == null)|| 
	   	(req.body.trxid == '' || req.body.trxid == null) || (req.body.trxdate == '' || req.body.trxdate == null) || 
	   	(req.body.senderid == '' || req.body.senderid == null) || (req.body.sendtype == '' || req.body.sendtype == null) || 
	   	(req.body.typesms == '' || req.body.typesms == null)
	){
		var o = [] // empty Object
		var data = {
		    code: '600',
		    desc: 'Missing parameter'
		};
		o.push(data);
		res.end(JSON.stringify(data));
		return false;
	}

	DB1.query("SELECT id, username, api_key, limit_sms FROM be_user WHERE is_active = 1 AND username = '"+req.body.user +"' AND api_key = '"+req.body.apikey+"' LIMIT 1", 
	function (err, result, fields) {
		if (err){
			throw err;
		} else {
			var str = JSON.stringify(result);
      		var rows = JSON.parse(str);
      		//console.log(rows.length);
      		//console.log(rows);
			//console.log(str);

			if(rows.length == '1'){
				for(var i = 0; i < rows.length; i++){
	      			var str2 = JSON.stringify(result[i]);
		 			var data = JSON.parse(str2);
		 			var username = data.username;
		 			var clientid = data.id;
	      		}

	      		var fullphone = req.body.phone;
	      		var prefix = fullphone.substr(0,4);

	      		DB1.query("SELECT sender_id FROM sms_client WHERE username = '"+req.body.user+"' AND state = 'Y' AND sender_id = '"+req.body.senderid+"'", 
				function (errq, resultq, fieldsq) {

					if(errq){
						console.log(req.body.trxid+' '+errq);
					}else{
						var strq = JSON.stringify(resultq);
						var rowq = JSON.parse(strq);

						if(rowq.length == '1'){

							//var uniqueid = uuidv4();
				      		//var message = urlencode.decode(req.body.message);
				      		var message = req.body.message;
				      		var drurl = req.body.drurl;

				      		if(req.body.typesms == 'unmask'){
								var jenissms = '1';
							}else{
								var jenissms = '2';
							}

							var tipekirim = '1';
							

				      		var sql = "INSERT INTO sms_data (uniqueid, sender, msisdn, message, createdTimeStamp, lkddate, client, sms_tipe, send_tipe, system_by, flag, vendor) VALUES ('"+req.body.trxid+"','"+req.body.senderid+"','"+req.body.phone+"','"+mysql_real_escape_string(req.body.message)+"',NOW(),CURDATE(), '"+req.body.user+"', '"+jenissms+"', '1', 'API SMS','Y','Bhinneka')";
							DB1.query(sql, function(err, resultinsert){
								//console.log(err);
								if(err){

							        if(err.code == 'ER_DUP_ENTRY' || err.errno == 1062){
							            //console.log('Here you can handle duplication')
							            var o = [] // empty Object
										var data = {
										    code: '610',
										    desc: 'Duplicate trxid'
										};
										o.push(data);
										res.end(JSON.stringify(data));
										console.log(req.body.trxid+' failed insert 610');
							        }else{
							           console.log(req.body.trxid+' '+err.code);
							        }

						      	}else{
						         	if(resultinsert.affectedRows > 0){
										/*var o = [] // empty Object
										var data = {
										    code: '7001',
										    unique: uniqueid
										};
										o.push(data);
										res.end(JSON.stringify(o));
										//res.send('<pre>7001</pre><pre>'+uniqueid+'</pre>');
										console.log('success insert');*/

										var userid = 'tiu';
										var secret = 'Bs9alWLKxWlH93eo6ToL';

										var headersOpt = {  
										    "content-type": "application/json",
										};

										
										var sendurl = 'https://api.smshub.co.id/sendOtp';
										

										if(req.body.typesms == 'unmask'){
											var tipesms = 'unmask';
										}else{
											var tipesms = 'mask';
										}

										var signature = sha1(req.body.message+req.body.phone+req.body.senderid+req.body.trxdate+req.body.trxid+tipesms+userid+secret);


										var options = {
										  uri: sendurl,
										  method: 'POST',
										  headers: headersOpt,
										  json: {
										    "userid": userid,
											"msisdn": req.body.phone,
											"message": req.body.message,
											"type": tipesms ,
											"sender": req.body.senderid,
											"trxid": req.body.trxid,
											"trxdate": req.body.trxdate,
											"signature": signature
										  }
										};

										request(options, function (error, response, body) {
										  if (!error && response.statusCode == 200) {
										    console.log(body) // Print the shortened url.
										    var str = JSON.stringify(body);
										    var respon = JSON.parse(str);
										    var error_code = respon.error;
										    var pesan = respon.message;

										    if(error_code == '200'){

										    	var sqlsent = "INSERT INTO sms_sent (unique_id, error_code, message, create_TimeStamp, client) VALUES ('"+req.body.trxid+"','"+error_code+"','"+pesan+"', NOW(), '"+req.body.user+"')";
												DB1.query(sqlsent, function(err, resultinsert){
													if(err){
														console.log(req.body.trxid+' '+err.code)
													}
												});

												var o = [] // empty Object
												var data = {
												    code: '200',
												    desc: 'Success'
												};
												o.push(data);
												res.end(JSON.stringify(data));
												console.log(req.body.trxid+' sms success');

										    }else{

										    	var sqlunsent = "INSERT INTO sms_unsent (unique_id, error_code, message, create_TimeStamp, client) VALUES ('"+req.body.trxid+"','"+error_code+"','"+pesan+"', NOW(), '"+req.body.user+"')";
												DB1.query(sqlunsent, function(err, resultinsert){
													if(err){
														console.log(req.body.trxid+' '+err.code)
													}
												});

												var o = [] // empty Object
												var data = {
												    code: error_code,
												    desc: 'Failed'
												};
												o.push(data);
												res.end(JSON.stringify(data));
												console.log(req.body.trxid+' sms failed '+error_code);

										    }

										  }
										});


									}else{
										var o = [] // empty Object
										var data = {
										    code: '610',
										    desc: 'Duplicate trxid'
										};
										o.push(data);
										res.end(JSON.stringify(data));
										console.log(req.body.trxid+' failed insert 610');
									}
						      	}
							});

						}else{

							var data = {
							    code: '603',
							    desc: 'sender not registered'
							};
							res.end(JSON.stringify(data));
							console.log(req.body.trxid+' failed insert 603');

						}

					}

				});

			}else{
				var o = [] // empty Object
				var data = {
				    code: '605',
				    desc: 'check your authentication'
				};
				o.push(data);
				res.end(JSON.stringify(data));
				return false;
			}
		}
	});

});

function mysql_real_escape_string (str) {
    return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (char) {
        switch (char) {
            case "\0":
                return "\\0";
            case "\x08":
                return "\\b";
            case "\x09":
                return "\\t";
            case "\x1a":
                return "\\z";
            case "\n":
                return "\\n";
            case "\r":
                return "\\r";
            case "\"":
            case "'":
            case "\\":
            case "%":
                return "\\"+char; // prepends a backslash to backslash, percent,
                                  // and double/single quotes
        }
    });
}

http.listen(8000, function(){
  	console.log('listening on *:8000');
});
