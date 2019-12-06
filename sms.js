var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mysql = require('mysql');
var pool = mysql.createPool({
  host: "HOST",
  user: "username",
  password: "password",
  database: "db"
});

io.on('connection', function(socket){
  console.log('a user connected');
});

io.on('connection', function(socket){

	socket.on('disconnect', function(){
        console.log('disconnect');
  	});

  	socket.on('alldata', function(alldata){
    var id = socket.id;
    var data = JSON.parse(alldata);
    var user = data.user;
    var where = '';
    if (user == 'admin'){
      where = '';
    }else{
      where = "AND client = '"+user+"'";
    }
    var sqlquery = 'SELECT count(id) as alldata FROM sms_data WHERE lkddate = CURDATE() '+where;
    pool.getConnection(function(err, connection) {
      if (err) { 
        console.log(err); 
        return; 
      }
      connection.query(sqlquery, function (err, result) {
          //if (err) throw err;
          connection.release();
          if (err) console.log(err);
          var str = JSON.stringify(result);
          result = JSON.parse(str);

          io.to(socket.id).emit('alldata', JSON.stringify(result));
          //console.log(result);
      });

      });
    });

    socket.on('sent', function(sent){
    var id = socket.id;
    var data = JSON.parse(sent);
    var user = data.user;
    var where = '';
    if (user == 'admin'){
      where = '';
    }else{
      where = "AND client = '"+user+"'";
    }
    var sqlquery = 'SELECT count(id) as sent FROM sms_data WHERE flag = \'Y\' AND error_code IN (\'200\',\'0\') AND lkddate = CURDATE()'+where;
    pool.getConnection(function(err, connection) {
      if (err) { 
        console.log(err); 
        return; 
      }
      connection.query(sqlquery, function (err, result1) {
          //if (err) throw err;
          connection.release();
          if (err) console.log(err);
          var str1 = JSON.stringify(result1);
          result1 = JSON.parse(str1);

          io.to(socket.id).emit('sent', JSON.stringify(result1));
          //console.log(result1);
      });

      });
    });

    socket.on('pending', function(pending){
    var id = socket.id;
    var data = JSON.parse(pending);
    var user = data.user;
    var where = '';
    if (user == 'admin'){
      where = '';
    }else{
      where = "AND client = '"+user+"'";
    }
    var sqlquery = 'SELECT count(id) as pending FROM sms_data WHERE flag = \'N\' AND lkddate = CURDATE()'+where;
    pool.getConnection(function(err, connection) {
      if (err) { 
        console.log(err); 
        return; 
      }
      connection.query(sqlquery, function (err, result) {
          //if (err) throw err;
          connection.release();
          if (err) console.log(err);
          var str = JSON.stringify(result);
          result = JSON.parse(str);

          io.to(socket.id).emit('pending', JSON.stringify(result));
          //console.log(result);
      });

      });
    });

    socket.on('failed', function(failed){
    var id = socket.id;
    var data = JSON.parse(failed);
    var user = data.user;
    var where = '';
    if (user == 'admin'){
      where = '';
    }else{
      where = "AND client = '"+user+"'";
    }
    var sqlquery = 'SELECT count(id) as failed FROM sms_data WHERE error_code != \'200\' AND lkddate = CURDATE()'+where;
    pool.getConnection(function(err, connection) {
      if (err) { 
        console.log(err); 
        return; 
      }
      connection.query(sqlquery, function (err, result) {
          //if (err) throw err;
          connection.release();
          if (err) console.log(err);
          var str = JSON.stringify(result);
          result = JSON.parse(str);

          io.to(socket.id).emit('failed', JSON.stringify(result));
          //console.log(result);
      });

      });
    });

});

http.listen(8888, function(){
  console.log('listening on *:8888');
});
