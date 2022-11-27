require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion } = require('mongodb');
const { query } = require('express');
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
    const booksCollection = client.db("book-store").collection("books");


    // get all categories
    app.get('/categories', async(req, res) => {
      const query = {};
      const categories = await categoriesCollection.find(query).toArray();
      res.send(categories);
    })

    // post/create book collection
    app.post('/books', async(req, res) => {
      const book = req.body;
      console.log(book)
      const result = await booksCollection.insertOne(book);
      res.send(result);
    })
    
    // get all book by category
    app.get('/books', async(req, res)=> {
      const category = req.query.name;
      console.log(category);
      let query = {};
      if(category){
        query = {
          bookCategory: category
        }
      };
      const result = await booksCollection.find(query).toArray();
      res.send(result);
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