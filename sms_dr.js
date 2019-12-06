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
var MySQL = require('mysql');
var EventEmitter = require('events');
var util = require('util');

var DB1 = MySQL.createPool(
{
	connectionLimit : 32, 
	host            : '192.168.88.11',
	user            : 'crontab',
	password        : 'remotecrontab',
	database        : 'db_sms_pkp'
});

function MyEmitter() {

	EventEmitter.call(this);

}

util.inherits(MyEmitter, EventEmitter);

MyEmitter.prototype.sending = function sending() {
 	
	DB1.query("SELECT COUNT(id) AS COUNT FROM sms_dn_queue WHERE send_flag IS NULL AND DATE(create_timestamp) = CURRENT_DATE() ;", 
	function (err, result, fields) {
		if (err){
			throw err;
		} else {

			var str = JSON.stringify(result);
      		var rows = JSON.parse(str);

      		for(var i = 0; i < rows.length; i++){
      			var str2 = JSON.stringify(result[i]);
	 			var data = JSON.parse(str2);
	 			var countres = data.COUNT;
      		}

      		if(countres.toString().trim() == 0){
      			//console.log('waiting dr')
      			DB1.query("INSERT IGNORE INTO sms_dn_queue (unique_id,create_timestamp)	SELECT trxid, NOW() FROM sms_dr_otp WHERE send_state = 'N' AND trxid NOT IN (SELECT unique_id FROM sms_dn_queue) AND DATE(createdTimeStamp) =  CURRENT_DATE() AND send_count = 0 ORDER BY id ASC LIMIT 20 ;", 
				function (err, result, fields) {
						if(err){
							console.log(err);
						}
				});	

      		}

      		DB1.query("SELECT a.trxid, a.status, a.error_code, b.msisdn, c.drurl FROM sms_dr_otp a LEFT JOIN sms_data b ON a.trxid = b.uniqueid LEFT JOIN be_user c ON b.`client` = c.username WHERE DATE(a.createdTimeStamp) = CURDATE() AND a.send_state = 'N' AND a.send_tipe = 1 AND a.`trxid` IN (SELECT unique_id FROM sms_dn_queue WHERE send_flag IS NULL) ORDER BY a.id ASC", 
			function (err, result, fields) {

				if(err){
					console.log(err)
				}else{
					var str = JSON.stringify(result);
		      		var rows = JSON.parse(str);
		      		var t = 0;
		      		for(var x = 1; x <= rows.length; x++){

		      			//console.log(x)
		      			var str2 = JSON.stringify(result[t]);
			 			var data = JSON.parse(str2);

			 			var uniqueid = data.trxid;
			 			var status = data.status;
			 			var dr = data.error_code;
			 			var msisdn = data.msisdn;
			 			var drurl = data.drurl;
			 			t++;
			 			
			 			kirimreq(drurl, uniqueid, dr, msisdn);
			 			

		      		}
				}

			});


		}
	});
	
	this.emit('kirim');	

}

async function kirimreq(drurl, uniqueid, dr, msisdn){
	try{
		//console.log("async dimulai")
		await sendreq(drurl, uniqueid, dr, msisdn)
	}catch(error){
		console.error(error);
	}
	
}

function sendreq(drurl,uniqueid,dr,msisdn) {
	return new Promise((resolve, reject) => {

	DB1.query("INSERT IGNORE INTO sms_dn_pool (unique_id, create_timestamp) VALUES ('"+uniqueid+"',NOW())", 
	function (errz, resultz, fields) {
			if(errz){
				console.log(errz);
			}

			if(resultz.affectedRows > 0){
				//console.log("masuk kesini")
				//console.log(uniqueid+" "+dr+" "+msisdn)

				var headersOpt = {  
				    "content-type": "application/json",
				};

					var options = {
				  uri: drurl,
				  method: 'POST',
				  headers: headersOpt,
				  json: {
				    "trxid": uniqueid,
					"code": dr,
					"phone": msisdn
				  }
				};
				//console.log(options)
				request(options, function (error, response, body) {
				  resolve(body);
				  if (!error && response.statusCode == 200) {
				  	//console.log(error) // Print the shortened url.
				    var str = JSON.stringify(body);
				    var respon = JSON.parse(str);
				    console.log(uniqueid)
				    var sqlsent = "INSERT INTO sms_dn_sent (unique_id, dr_url, create_timestamp, return_respon) VALUES ('"+uniqueid+"','"+drurl+"', NOW(), '"+body+"')";
					DB1.query(sqlsent, function(err, resultinsert){
						if(err){
							console.log(err.code)
						}
					});
					console.log("dr sukses dikirim")
					/*var o = [] // empty Object
					var data = {
					    desc: 'success'
					};
					o.push(data);
					res.end(JSON.stringify(o));*/

				  }else{
				  	if(error.code == 'ETIMEDOUT' || error.errno == 'ETIMEDOUT'){
				  		error_code = '601';
				  		var sqlunsent = "INSERT INTO sms_dn_unsent (unique_id, dr_url, create_timestamp) VALUES ('"+uniqueid+"','"+drurl+"', NOW())";
						DB1.query(sqlunsent, function(err, resultinsert){
							if(err){
								console.log(err.code)
							}
						});
			            /*var o = [] // empty Object
						var data = {
						    desc: 'failed'
						};
						o.push(data);
						res.end(JSON.stringify(o));*/
						console.log('sent dr result timeout');
			        }else{
			        	console.log(error)
			           	var sqlunsent = "INSERT INTO sms_dn_unsent (unique_id, dr_url, create_timestamp) VALUES ('"+uniqueid+"','"+drurl+"', NOW())";
						DB1.query(sqlunsent, function(err, resultinsert){
							if(err){
								console.log(err.code)
							}
						});
						console.log("dr gagal dikirim")
			            /*var o = [] // empty Object
						var data = {
						    desc: 'failed'
						};
						o.push(data);
						res.end(JSON.stringify(o));*/
			        }
				  }

				});
				//kirimreq(drurl, uniqueid, dr, msisdn);
				
			}
	});
	

});
}
 
//} 
//requestcall();
var sms = new MyEmitter();

sms.on('kirim', function() {
	//console.log('Calling...');
	setTimeout(function(){ 
		sms.sending(); 
	
	}, 500)
});

sms.sending();