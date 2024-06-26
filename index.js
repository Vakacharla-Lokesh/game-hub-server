import XLSX from 'xlsx';
import express from "express";
import ejs from 'ejs';
const app = express();
const port = 3000;

let sheet_data = new Map([
  ["Strategy", 0],
  ["Puzzle", 1],
]);

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

app.use(express.static("public"));
app.use(express.static("/views/images"));
app.get('/', (req, res) => {
  res.render("index.ejs");
});

app.get('/genre1', (req, res) =>{
  res.render("genre.ejs");``
});

app.get('/card', (req, res)=>{
  let x = game_data("Strategy", 9);
  let y = image_data("Strategy", 9);
  const game = {
    name: x,
    image: y
  }
  res.render("genre.ejs", game);
});

app.get('/puzzle', (req, res)=>{
  let x = game_data("Puzzle", 8);
  let y = image_data("Puzzle", 8);
  const game = {
    name: x,
    image: y
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
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

app.post('/signup', (req, res) => {
  const { username, email, password, confirm_password } = req.body;
  if (password!== confirm_password) {
    return res.status(400).send({ error: 'Passwords do not match' });
  }
  const hashedPassword = bcrypt.hashSync(password, 10);
  const user = new User({ username, email, password: hashedPassword });
  user.save((err, user) => {
    if (err) {
      return res.status(500).send({ error: 'Failed to create user' });
    }
    res.send({ message: 'User created successfully' });
  });
});

// LOGIN ROUTE
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  User.findOne({ username }, (err, user) => {
    if (err ||!user) {
      return res.status(401).send({ error: 'Invalid username or password' });
    }
    const isValid = bcrypt.compareSync(password, user.password);
    if (!isValid) {
      return res.status(401).send({ error: 'Invalid username or password' });
    }
    const sessionToken = uuid.v4();
    const session = new Session({ user_id: user._id, session_token });
    session.save((err, session) => {
      if (err) {
        return res.status(500).send({ error: 'Failed to create session' });
      }
      res.cookie('session_token', sessionToken, { httpOnly: true });
      res.send({ message: 'Logged in successfully' });
    });
  });
});
// LOGOUT ROUTE
app.get('/logout', (req, res) => {
  const sessionToken = req.cookies.session_token;
  Session.findOneAndRemove({ session_token }, (err, session) => {
    if (err) {
      return res.status(500).send({ error: 'Failed to delete session' });
    }
    res.clearCookie('session_token');
    res.send({ message: 'Logged out successfully' });
  });
});

const authenticate = (req, res, next) => {
  const sessionToken = req.cookies.session_token;
  Session.findOne({ session_token }, (err, session) => {
    if (err ||!session) {
      return res.status(401).send({ error: 'Invalid session token' });
    }
    req.user = session.user_id;
    next();
  });
};

// USING MONGODB
mongoose.connect('mongodb://localhost:27017/game-hub', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', (err) => console.error(err));
db.once('open', () => console.log('Connected to MongoDB'));

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  created_at: Date,
  updated_at: Date
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
app.listen(port, () => console.log(`Example app listening on port ${port}!`));