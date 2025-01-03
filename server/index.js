const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const campgroundsRouter = require('./routes/campgrounds');
const reviewsRouter = require('./routes/reviews');
const authRouter = require('./routes/auth');
const passport = require('passport');
const localStrategy = require('passport-local');
const User = require('./models/user');
const ExpressError = require('./utils/ExpressError');
const session = require('express-session');

mongoose.connect('mongodb://127.0.0.1:27017/yelpCamp');
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
})
const app = express();

const sessionConfig = {
    secret: "thisisnotagoodsecret",
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}
app.use(session(sessionConfig));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new localStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(cors({ origin: ['http://localhost:5173'] }));

app.use('/', authRouter)
app.use('/api/campgrounds', campgroundsRouter);
app.use('/api/campgrounds/:id/reviews', reviewsRouter);

app.all('*', (req, res, next) => {
    next(new ExpressError(404, 'Page Not Found'))
});

app.use((err, req, res, next) => {
    const { status = 500 } = err;
    if (!err.message)
        err.message = 'Something Went Wrong';
    res.status(status).send({ error: err });
});

app.listen(8080, (req, res) => {
    console.log("Listening on port 8080");
});