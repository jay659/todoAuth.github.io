 const express = require('express');

const app = express();
const cookieparser=require('cookie-parser');



const routes=require('./root');


app.set('view engine','ejs');


app.get('/', routes);
app.post('/signup', routes);
app.get('/login',routes);
app.post('/login',routes);
app.get('/home',routes);
app.get('/logout',routes);
app.post('/newtodo', routes);

app.get('/delete/:id',routes);
app.get('/:id',routes);
app.get('/*',routes);

app.listen(3040, () => {
    console.log(`Server started on port`);
});
