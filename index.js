require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const stripe = require("stripe")(`${process.env.STRIPE_SK}`);
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// JSON Web Token (JWT)
// verifying JWT by token what is gotten from client side header
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res
      .status(401)
      .send({ message: "unauthorized access", status: "401" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.DB_JWT_SECRET, function (err, decoded) {
    if (err) {
      return res
        .status(403)
        .send({ message: "forbidden access", status: "403" });
    }
    req.decoded = decoded;
    next();
  });
}

// MongoDB database
const uri = `mongodb+srv://${process.env.MDB_USER_NAME}:${process.env.MDB_USER_PASS}@cluster0.xnvdy5u.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
  try{
    // MDB collections
    const categoriesCollection = client.db("book-store").collection("categories");
    const booksCollection = client.db("book-store").collection("books");
    const ordersCollection = client.db("book-store").collection("orders");
    const paymentsCollection = client.db("book-store").collection("payments");
    const usersCollection = client.db("book-store").collection("users");

    // Create admin middleware
    const verifyAdmin = async (req, res, next) => {
      // check admin
      const decodedEmail = req.decoded.email;
      const query = { userEmail: decodedEmail };
      const user = await usersCollection.findOne(query);
      if (user?.role !== "admin") {
        return res
          .status(403)
          .send({ message: "forbidden access", status: "403" });
      }
      next();
    };

    // Create seller middleware
    const verifySeller = async (req, res, next) => {
      // check admin
      const decodedEmail = req.decoded.email;
      const query = { userEmail: decodedEmail };
      const user = await usersCollection.findOne(query);
      if (user?.role !== "seller") {
        return res
          .status(403)
          .send({ message: "forbidden access", status: "403" });
      }
      next();
    };

    // get all categories
    app.get('/categories', async(req, res) => {
      const query = {};
      const categories = await categoriesCollection.find(query).toArray();
      res.send(categories);
    })

    // post/create book collection
    app.post('/books', verifyJWT, verifySeller, async(req, res) => {
      const book = req.body;
      const result = await booksCollection.insertOne(book);
      res.send(result);
    })
    
    // get all books by category
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
    app.get('/books/:email', verifyJWT, verifySeller, async(req, res) => {
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
    app.put('/books-isAdvertised/:id', verifyJWT, verifySeller, async(req, res) => {
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

    // update book status to report
    app.put('/books-isReported/:id', verifyJWT, async(req, res) => {
      const id = req.params.id;
      const status = req.body.isReported
      const filter = { _id: ObjectId(id) };
      const options = { upsert:true };
      const updateDoc = {
        $set: {
          isReported:status
        }
      };
      const result = await booksCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    })

    // get book by reported status:true
    app.get('/books-isReported', verifyJWT, verifyAdmin, async(req, res)=> {
      const query = {
        isReported: true
      };
      const result = await booksCollection.find(query).toArray();
      res.send(result);
    })

    // delete reported product by id
    app.delete('/books-isReported/:id', verifyJWT, verifyAdmin, async(req, res) => {
      const id = req.params.id;
      const filter1 = { _id: ObjectId(id)};
      const result = await booksCollection.deleteOne(filter1);
      const filter2 = {bookId: id};
      const orderDelete = await ordersCollection.deleteOne(filter2);
      res.send(result);
    })

    // delete book by id
    app.delete('/books/:id', verifyJWT, verifySeller, async(req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await booksCollection.deleteOne(query);
      res.send(result);
    })

    // post/create order collection
    app.post('/orders', verifyJWT, async(req, res) => {
      const order = req.body;
      const result = await ordersCollection.insertOne(order);
      res.send(result);
    })

    // get orders by email
    app.get('/orders/:email', verifyJWT, async(req, res) =>{
      const email = req.params.email;
      const query = {
        buyerEmail: email
      };
      const orders = await ordersCollection.find(query).toArray();
      res.send(orders);
    })

    // delete order by id
    app.delete('/orders/:id', verifyJWT, async(req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id)};
      const result = await ordersCollection.deleteOne(query);
      res.send(result);
    })

    // get order by id
    app.get('/orders-to-payment/:id', verifyJWT, async(req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id)};
      const result = await ordersCollection.findOne(query);
      res.send(result);
    })

    // create users database
    app.post("/users", async (req, res) => {
      const user = req.body.registeredUser;
      console.log(user)
      const query = {
        userEmail: user.userEmail,
      };
      const alreadyRegistered = await usersCollection.find(query).toArray();
      if (alreadyRegistered.length) {
        return res.send({
          acknowledged: false,
          message: "You have already registered",
        });
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // get all users by query=role
    app.get("/users", verifyJWT, verifyAdmin, async (req, res) => {
      const role = req.query.role;
      const query = {role: role};
      const allUsers = await usersCollection.find(query).toArray();
      res.send(allUsers);
    });

    // get only admin
    app.get("/users/admin/:email", verifyJWT, verifyAdmin, async (req, res) => {
      const email = req.params.email;
      const query = { userEmail: email };
      const user = await usersCollection.findOne(query);
      res.send({ isAdmin: user?.role === "admin" });
    });

    // get only seller
    app.get("/users/seller", verifyJWT, verifySeller, async (req, res) => {
      const email = req.query.email;
      const role = req.query.role;
      const query = { userEmail: email, role: role };
      const user = await usersCollection.findOne(query);
      res.send({ isSeller: user?.role === "seller" });
    });

    // update seller status to verified
    app.put('/users-seller/:id', verifyJWT, verifyAdmin, async(req, res) => {
      const id = req.params.id;
      const status = req.body.isVerified;
      const filter = { _id: ObjectId(id) };
      const options = { upsert:true };
      const updateDoc = {
        $set: {
          isVerified:status
        }
      };
      const result = await usersCollection.updateOne(filter, updateDoc, options);
      // update book collection
      const email = req.body.sellerEmail;
      const query = { sellerEmail: email};
      const updateBookDoc = {
        $set: {
          isVerified:true
        }
      };
      const updateBook = await booksCollection.updateMany(query, updateBookDoc, options);
      res.send(result);
    })

    // delete user
    app.delete("/users/:id", verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });

    // Step 1: creating JWT by getting user from backend
    app.get("/jwt", async (req, res) => {
      // taking email from client side
      const email = req.query.email;
      const query = {
        userEmail: email,
      };
      // trying to get user by email
      const user = await usersCollection.findOne(query);
      if (user) {
        // create & then send token
        const token = jwt.sign({ email }, process.env.DB_JWT_SECRET, {
          expiresIn: "20d",
        });
        res.send({ accessToken: token });
      } else {
        res.status(401).send({ message: "unauthorized access", status: "403" });
      }
    });

    // stripe payment
    app.post("/create-payment-intent", async(req, res) => {
      const price = parseFloat(req.body.bookPrice);
      const amount = price * 100;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });
      res.send({ clientSecret: paymentIntent.client_secret });
    })

    // post or create payment
    app.post("/payments", verifyJWT, async (req, res) => {
      // create new payment collection
      const payment = req.body;
      const result = await paymentsCollection.insertOne(payment);
      // update order collection
      const id = payment.orderedId;
      const query = { _id: ObjectId(id) };
      const updateDoc = {
        $set: {
          paid: true,
          transactionId: payment.transactionId,
        },
      };
      const updateOrder = await ordersCollection.updateOne( query, updateDoc );
      // update book collection
      const bookId = payment.bookId
      const queryBook = { _id: ObjectId(bookId)};
      const options = {upsert:true};
      const updateBookDoc = {
        $set: {
          isSold:true
        }
      };
      const updateBook = await booksCollection.updateOne(queryBook, updateBookDoc, options);

      res.send(result);
    });



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
run().catch(err => console.log(err.message))





// server initialization
app.get('/', (req, res) => {
  res.send("BookStore server is running");
})
app.listen(port, ()=> {
  console.log(`Server is running on port ${port}`)
})