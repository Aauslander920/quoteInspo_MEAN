// require dependencies
var express = require('express'),
    bodyParser = require('body-parser'),
    mongoose = require('mongoose'),
    morgan = require('morgan'),
    passport = require('passport'),
    jwt = require('jwt-simple'),
    User = require('./models/user.js'),
    Post = require('./models/post.js'),
    config = require('./config/database.js'),
    port = process.env.PORT || 3000,
    mongoDBURI = process.env.MONGODB_URI || 'mongodb://localhost/quoteInspo';


// instantiates express
var app = express();

// middleware
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(morgan('dev'));
app.use(passport.initialize());


// database
mongoose.connect(mongoDBURI);
var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('Connected to mongoDB');
}); //end db.once

// pass in passport package to exported function to configure passport
require('./config/passport')(passport);

// use express router
var apiRoutes = express.Router();

//use post controller
var postController = require('./controllers/posts');
app.use('/posts', postController);

// make sure api routes use the right stuff
app.use('/api', apiRoutes);

// create a new user account at http://localhost:3000/api/signup
apiRoutes.post('/signup', function(req, res) {
  if (!req.body.username || !req.body.password) {
    res.json({success: false, msg: 'something is wrong'});
  } else {
    var user = new User({
      username: req.body.username,
      password: req.body.password
    });
    // save new user
    user.save(function(err) {
      if (err) {
        console.log(err);
        return res.json({success: false, msg: 'username already exists'});
      }
      res.json({success: true, msg: 'created new user successfully!'});
    });
  }
});

// login route
apiRoutes.post('/authenticate', function(req, res) {
  User.findOne({
    username: req.body.username
  }, function(err, foundUser) {
    if (err) {
      console.log(err);
    } if (!foundUser) {
      res.json({success: false, msg: 'authentication failed; user not found'});
    } else {
      // check for password match
      foundUser.comparePassword(req.body.password, function(err, isMatch) {
        if (isMatch && !err) {
          // if user is found & password is correct, create a token!
          var token = jwt.encode(foundUser, config.secret);
          var username = req.body.username;
          var userId = foundUser._id;
          // return token, username, and userId as json for saving in brower localStorage
          res.json({success: true, token: token, username: username, userId: userId});
        } else {
          res.send({success: false, msg: 'authentication failed because password is wrong'});
        }
      });
    }
  });
});

apiRoutes.delete('/users/:id', function(req, res) {
  console.log(req.params.id);
  User.findByIdAndRemove(req.params.id, function(err, foundUser) {
    console.log(foundUser);
    // foundUser.remove();
  })
})

// listener
app.listen(port, function() {
  console.log('quoteInspo app is listening on port: ' + port);
});
