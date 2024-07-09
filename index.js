import XLSX from 'xlsx';
import express from "express";
import ejs from 'ejs';
import bodyParser from "body-parser";
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const app = express();
const port = 3000;

app.use(express.static("public"));
app.use(express.static("/views/images"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// app.use(authenticate);

let sheet_data = new Map([
  ["Strategy", 0],
  ["Puzzle", 1],
  ["Action", 2],

]);

let curr_login = "false";

function game_data(type, rows) {
  if (XLSX !== undefined) {
      // Code to work with the workbook
      const sheet_name = (String)(type);
      const table = XLSX.readFile("C:\\Users\\Psn\\Desktop\\Web Development\\Game-hub-server\\public\\resources\\Strategy.xlsx");
      var sheet_numb = sheet_data.get(sheet_name);
        const sheet = table.Sheets[table.SheetNames[Number(sheet_numb)]];
        var range = XLSX.utils.decode_range(sheet["!ref"]);

        const game_name = new Array();
        // const image_url = new Array();
        for (let rowNum = 1; rowNum < rows; rowNum++) {
            // Example: Get second cell in each row, i.e. Column "B"
            const firstCell = sheet[XLSX.utils.encode_cell({r: rowNum, c: 0})];
            // const secondCell = sheet[XLSX.utils.encode_cell({r: rowNum, c: 1})];
            // const thirdCell = sheet[XLSX.utils.encode_cell({r: rowNum, c: 2})];
            // const fourthCell = sheet[XLSX.utils.encode_cell({r: rowNum, c: 3})];
            // NOTE: secondCell is undefined if it does not exist (i.e. if its empty)
            // console.log(firstCell.v);
            // console.log(secondCell.v);
            // console.log(thirdCell.v);
            // console.log(fourthCell.w); 
            // console.log(rowNum);
            game_name.push(String(firstCell.v));
            // image_url.push(fourthCell.v);
        }

        return game_name;
        }
   else {
    console.log('xlsx is not defined');
  }
}

function image_data(type, rows) {
  const sheet_name = type;
  const table = XLSX.readFile("C:\\Users\\Psn\\Desktop\\Web Development\\Game-hub-server\\public\\resources\\Strategy.xlsx");
  var sheet_numb = sheet_data.get(sheet_name);
    const sheet = table.Sheets[table.SheetNames[Number(sheet_numb)]];
    var range = XLSX.utils.decode_range(sheet['!ref']);
    const image_url = new Array();
    for (let rowNum = 1; rowNum < rows; rowNum++) {
        const fourthCell = sheet[XLSX.utils.encode_cell({r: rowNum, c: 3})];
        // console.log(fourthCell.v); 
        // console.log(rowNum);
        image_url.push(String(fourthCell.v));
    }

    return image_url;
}

// USING MONGODB
mongoose.connect('mongodb://localhost:27017/game-hub', { useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', (err) => console.error(err));
db.once('open', () => console.log('Connected to MongoDB'));

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  created_at: Date,
  updated_at: Date,
  lastLoginTime: Date,
  loginStreak: {
    currentStreak: Number,
    longestStreak: Number
  }
});

const User = mongoose.model('User', userSchema);

const sessionSchema = new mongoose.Schema({
  user_id: mongoose.Schema.Types.ObjectId,
  session_token: String,
  expires_at: Date,
  created_at: Date,
  updated_at: Date
});

const Session = mongoose.model('Session', sessionSchema);

const authenticate = (req, res, next) => {
  const sessionToken = req.cookies.session_token;
  Session.findOne({sessionToken }, (err, session) => {
    if (err ||!session) {
      return res.status(401).send({ error: 'Invalid session token' });
    }
    req.user = session.user_id;
    next();
  });
};

function loginstreak(user){
  // Update lastLoginTime
  user.lastLoginTime = Date.now();
  // await user.save();

  // Update loginStreak
  const today = new Date();
  const lastLoginDate = new Date(user.lastLoginTime);
  const diffInDays = Math.abs(today - lastLoginDate) / (1000 * 3600 * 24);

  if (diffInDays <= 1) {
    // User has logged in consecutively
    user.loginStreak.currentStreak += 1;
    if (user.loginStreak.currentStreak > user.loginStreak.longestStreak) {
      user.loginStreak.longestStreak = user.loginStreak.currentStreak;
    }
  } else {
    // User has not logged in consecutively
    user.loginStreak.currentStreak = 1;
  }

  // await user.save();
}


app.get('/', (req, res) => {
  // res.render("partials\\header.ejs", {
  //   route: req.url,
  // })
  res.render("index.ejs", {
    route: req.url,
    logged_in: curr_login,
  });
});

app.get('/genre1', (req, res) =>{
  res.render("genre.ejs");
});

app.get('/user', (req, res) =>{
  curr_login = "true";
  res.render("index.ejs", {
    route: req.url,
    logged_in: curr_login,
  });
});

app.get('/card', (req, res)=>{
  let x = game_data("Strategy", 11);
  let y = image_data("Strategy", 11);
  const game = {
    name: x,
    image: y,
    genre_type: "Strategy",
    route: req.url,
    logged_in: curr_login,
  }
  res.render("genre.ejs", game);
});

app.get('/puzzle', (req, res)=>{
  let x = game_data("Puzzle", 8);
  let y = image_data("Puzzle", 8);
  const game = {
    name: x,
    image: y,
    genre_type: "Puzzle",
    route: req.url,
    logged_in: curr_login,
  }
  res.render("genre.ejs", game);
});

app.get('/about', (req, res)=>{
  res.render("about_index.ejs");
});

app.get('/signup-get', (req, res) =>{
  res.render("signup.ejs");
});

app.get('/login-get', (req, res) =>{
  res.render("login.ejs");
});

// SIGNUP ROUTE
app.post('/signup', async (req, res) => {
  const { username, email, password, confirm_password } = req.body;
  if (password !== confirm_password) {
    return res.status(400).send({ error: 'Passwords do not match' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    const result = await user.save();
    res.send({ message: 'User created successfully' });
  } catch (err) {
    return res.status(500).send({ error: 'Failed to create user' });
  }
});

// LOGIN ROUTE
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).send({ error: 'Invalid username or password' });
    }

    const isValid = bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).send({ error: 'Invalid username or password' });
    }
    loginstreak(user);
    const sessionToken = crypto.randomBytes(16).toString('hex');
    const session = new Session({ user_id: user._id, sessionToken });
    const result = await session.save();
    res.cookie('session_token', sessionToken, { httpOnly: true });
    // res.render("index.ejs");
    // res.send({ message: 'Logged in successfully' });
    // res.render("index_loggedin.ejs");
    res.redirect('/user');
  } catch (err) {
    return res.status(500).send({ error: 'Failed to create session' });
  }
});
// LOGOUT ROUTE
app.get('/logout', (req, res) => {
  const sessionToken = req.cookies.session_token;
  Session.findOneAndRemove({ sessionToken }, (err, session) => {
    if (err) {
      return res.status(500).send({ error: 'Failed to delete session' });
    }
    res.clearCookie('session_token');
    // res.send({ message: 'Logged out successfully' }, '/');
    res.redirect('/');
  });
});

// FORGOT PASSWORD
app.get('/forgot-password-get', (req, res) => {
  const typeofpage = {
    title: 'Forgot Password',
    val : 0
  }
  res.render('forgot-password.ejs', typeofpage);
});

app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).send({ error: 'User not found' });
    }

    // Generate a password reset token
    const token = crypto.randomBytes(16).toString('hex');
    user.passwordResetToken = token;
    user.passwordResetExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send a password reset email to the user
    const resetUrl = `http://localhost:3000/reset-password/${token}`;
    const mailOptions = {
      from: 'your-email@example.com',
      to: email,
      subject: 'Password Reset',
      text: `Click this link to reset your password: ${resetUrl}`,
    };
    // Use a mailer service like Nodemailer to send the email
    // ...

    res.send({ message: 'Password reset link sent to your email' });
  } catch (err) {
    return res.status(500).send({ error: 'Failed to send password reset link' });
  }
});

app.get('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  try {
    const user = await User.findOne({ passwordResetToken: token, passwordResetExpires: { $gt: Date.now() } });
    if (!user) {
      return res.status(404).send({ error: 'Invalid password reset token' });
    }

    const typeofpage = {
      title: 'Reset Password',
      val : 1
    }
    res.render('reset-password.ejs', typeofpage);
    // res.render('forgot-password.ejs',  { token });
  } catch (err) {
    return res.status(500).send({ error: 'Failed to find user' });
  }
});

app.post('/reset-password/changed', async (req, res) => {
  // const { token } = req.params;
  const { password, confirm_password } = req.body;
  try {
    const user = await User.findOne({ passwordResetToken: token, passwordResetExpires: { $gt: Date.now() } });
    if (!user) {
      return res.status(404).send({ error: 'Invalid password reset token' });
    }

    if (password !== confirm_password) {
      return res.status(400).send({ error: 'Passwords do not match' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    res.send({ message: 'Password reset successfully' });
  } catch (err) {
    return res.status(500).send({ error: 'Failed to reset password' });
  }
});

app.get('/faqs', (req, res) =>{
  res.render('faqs.ejs', {
    route: req.url,
    logged_in: curr_login,
  });
});

// USER PROFILE
app.get('/user-profile', (req, res) =>{
  curr_login = "true";
  res.render("profile_page.ejs", {
    route: req.url,
    logged_in: curr_login,
  });
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));