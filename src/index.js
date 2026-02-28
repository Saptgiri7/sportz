import express from 'express';
const port = 8000;

const app = express();

app.use(express.json());


app.get('/',(req,res)=>{
    res.send('<h1>Hello from express server</h1>')
})


app.listen(port,()=>{
    console.log(`server listening on port: ${port}`);
})


