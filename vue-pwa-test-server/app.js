const express = require('express'),
      cors    = require('cors');

const app = express();

//CORS 허용
app.use(cors({ 
  origin(origin, callback) {
    callback(null, true)
  },
  credentials : true 
}));

//application/json 형태의 데이터 req.body에 저장
app.use(express.json());
//www-form-urlencode 형태의 데이터 req.body에 저장
app.use(express.urlencoded({ extended: false }));

//Error Handler
app.use((err, req, res, next) => {
  console.log('++++++++++++++Error!!!!!+++++++++++++', err.message);
  console.log(err.stack);
  res.status(err.status || 500);
  res.json({ code : err.code, msg : err.message, status : err.status });
});

module.exports = app;