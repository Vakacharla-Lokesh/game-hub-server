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

app.listen(port, () => console.log(`Example app listening on port ${port}!`));