require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());




// MongoDB database
const uri = `mongodb+srv://${process.env.MDB_USER_NAME}:${process.env.MDB_USER_PASS}@cluster0.xnvdy5u.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
  try{
    // MDB collections
    const categoriesCollection = client.db("book-store").collection("categories");


    // get all categories
    app.get('/categories', async(req, res) => {
      const query = {};
      const categories = await categoriesCollection.find(query).toArray();
      res.send(categories);
    })
  }
  finally{}
}
run().catch(err => console.log(err))











// server initialization
app.get('/', (req, res) => {
  res.send("BookStore server is running");
})
app.listen(port, ()=> {
  console.log(`Server is running on port ${port}`)
})