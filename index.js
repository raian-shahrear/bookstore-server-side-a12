require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
    const ordersCollection = client.db("book-store").collection("orders");


    // get all categories
    app.get('/categories', async(req, res) => {
      const query = {};
      const categories = await categoriesCollection.find(query).toArray();
      res.send(categories);
    })

    // post/create book collection
    app.post('/books', async(req, res) => {
      const book = req.body;
      const result = await booksCollection.insertOne(book);
      res.send(result);
    })
    
    // get all book by category
    app.get('/books', async(req, res)=> {
      const categoryId = req.query.id;
      let query = {};
      if(categoryId){
        query = {
          categoryId: categoryId
        }
      };
      const result = await booksCollection.find(query).toArray();
      res.send(result);
    })

    // get books by seller email
    app.get('/books/:email', async(req, res) => {
      const email = req.params.email;
      const query = {
        sellerEmail: email
      };
      const result = await booksCollection.find(query).toArray();
      res.send(result);
    })

    // get book by advertisement status:true
    app.get('/books-isAdvertised', async(req, res)=> {
      const query = {
        isAdvertised: true
      };
      const result = await booksCollection.find(query).toArray();
      res.send(result);
    })

    // update book's advertisement status
    app.put('/books/:id', async(req, res) => {
      const id = req.params.id;
      const status = req.body.isAdvertised
      const filter = { _id: ObjectId(id) };
      const options = { upsert:true };
      const updateDoc = {
        $set: {
          isAdvertised:status
        }
      };
      const result = await booksCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    })

    // delete book by id
    app.delete('/books/:id', async(req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await booksCollection.deleteOne(query);
      res.send(result);
    })

    // post/create order collection
    app.post('/orders', async(req, res) => {
      const order = req.body;
      const result = await ordersCollection.insertOne(order);
      res.send(result);
    })

    // get orders by email
    app.get('/orders/:email', async(req, res) =>{
      const email = req.params.email;
      const query = {
        buyerEmail: email
      };
      const orders = await ordersCollection.find(query).toArray();
      res.send(orders);
    })

    // get order by id
    app.get('/orders-to-payment/:id', async(req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id)};
      const result = await ordersCollection.findOne(query);
      res.send(result);
    })

    // update order to report
    app.put('/orders/:id', async(req, res) => {
      const id = req.params.id;
      const status = req.body.isReported
      const filter = { _id: ObjectId(id) };
      const options = { upsert:true };
      const updateDoc = {
        $set: {
          isReported:status
        }
      };
      const result = await ordersCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    })

    // delete order by id
    app.delete('/orders/:id', async(req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id)};
      const result = await ordersCollection.deleteOne(query);
      res.send(result);
    })



    // app.get('/books/email', async(req, res) => {
    //   const filter = {};
    //   const options = {upsert: true};
    //   const updateDoc = {
    //     $set: {
    //       sellerEmail: "elon@gmail.com"
    //     }
    //   };
    //   const result = await booksCollection.updateMany(filter, updateDoc, options)
    //   res.send(result);
    // })
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