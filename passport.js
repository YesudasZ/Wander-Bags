const passport = require('passport'); 
const GoogleStrategy = require('passport-google-oauth2').Strategy; 
require('dotenv').config();

passport.serializeUser((user , done) => { 
	done(null , user); 
}) 
passport.deserializeUser(function(user, done) { 
	done(null, user); 
}); 

passport.use(new GoogleStrategy({ 
	clientID:process.env.CLIENT_ID, // Your Credentials here. 
	clientSecret:process.env.CLIENT_SECRET, // Your Credentials here. 
	callbackURL:"http://localhost:4000/auth/google/callback", 
	passReqToCallback:true
}, 
function(request, accessToken, refreshToken, profile, done) { 
	console.log(profile)
	return done(null, profile); 
} 
));