const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
// =========== for payment with stripe ============
const stripe = require('stripe')(process.env.PAYMENT_SECRETE_KEY)
const app = express();
const port = process.env.PORT || 5000;

//=============== middleware ======================
app.use(cors());
app.use(express.json());

// ======== jwtVerification ============
const verifyJWT = (req,res,next)=>{
const authorization = req.headers.authorization;
if(!authorization){
  return res.status(401).send({error:true, message:'unauthorized access'}) 
}
const token = authorization.split(' ')[1];
jwt.verify(token,process.env.ACCESS_TOKEN_SECRETE,(err,decoded) => {
  if(err){
    return  res.status(401).send({error:true, message:'unauthorized access2'}) 
  }
  req.decoded = decoded;
  next();
})


}


// ========== database start ===============
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bphasys.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();


    
    const usersCollection = client.db('bistroDb').collection('users');
    const menuCollection = client.db('bistroDb').collection('menu');
    const reviewsCollection = client.db('bistroDb').collection('reviews');
    const cartsCollection = client.db('bistroDb').collection('carts');
    const paymentsCollection = client.db('bistroDb').collection('payments');
    const reservationCollection = client.db('bistroDb').collection('reservation');


    // =========== jwt =========
    app.post('/jwt',(req,res)=>{
      const user = req.body;
      const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRETE,{expiresIn:'5000y'})
      res.send({token})
    });

    // ========== verify admin function ==========
    const verifyAdmin = async(req,res,next) =>{
      const email = req.decoded.email;
      const query = {email:email}
      const user = await usersCollection.findOne(query);
      if(user?.role !== 'admin'){
        return res.status(401).send({error:true, message:'unauthorized access'}) 
      }
      next();
    };
    // ========== end ===================

    // ======== get all menu item from database collection ========
    app.get('/menu',async(req,res)=>{
        const result = await menuCollection.find().toArray();
        res.send(result)
    });

    // ========= post a menu item to database ===========
    app.post('/menu',verifyJWT,verifyAdmin,async(req,res)=>{
      const newItem = req.body;
      const result = await menuCollection.insertOne(newItem)
      res.send(result)
    });

    // ============ delete a item from menu ===========
    app.delete('/menu/:id',verifyJWT,verifyAdmin,async(req,res)=>{
      const id = req.params.id;
      const query = {_id : new ObjectId(id)};
      const result = await menuCollection.deleteOne(query);
      res.send(result);
    })


    // =========== get all reviews item from database collection =======
app.get('/review',async(req,res)=>{
        const result = await reviewsCollection.find().toArray();
        res.send(result)
});



// ============ cart collection =========
// ========== post a cart item to database collection ===========
app.post('/carts',async(req,res)=>{
  const item = req.body;
  const result = await cartsCollection.insertOne(item);
  res.send(result);
});



// ============= get added cart item from database collection ==========
app.get('/carts', async(req,res)=>{
  const email = req.query.email;
  if(!email){
    res.send([]);
  }
  // const decodedEmail = req.decoded.email;
  // console.log('decoded mail',decodedEmail)
  // if(email !== decodedEmail){
  //   return  res.status(401).send({error:true, message:'forbidden access'}) 
  // }
  
    const query = { email: email};
    const result = await cartsCollection.find(query).toArray();
    res.send(result)
  
});



// ========= delete item from added product ==========
app.delete('/carts/:id',async(req,res)=>{
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await cartsCollection.deleteOne(query);
  res.send(result);
})
// ================== cart collection end =======================


// =========== Users collection (same to firebase auth) ================
app.post('/users',async(req,res)=>{
  const user = req.body;
  // ======= this part is for google sign in problem because we do not understand that it is new user or not ========
  const query = {email: user.email}
  const existingUser = await usersCollection.findOne(query)
  if(existingUser){
    return res.send('user already exist')
  }
  const result = await usersCollection.insertOne(user);
  res.send(result)
});



// ============ load users data from database =========
app.get('/users',verifyJWT,verifyAdmin,async(req,res)=>{
  const result = await usersCollection.find().toArray();
  res.send(result)
});


// ==== for checking admin test for identify that admin or not =======
app.get('/users/admin/:email',verifyJWT,async(req,res)=>{
  const email = req.params.email;
  if(req.decoded.email !== email){
    res.send({admin:false})
  }
  const query = {email:email};
  const user = await usersCollection.findOne(query);
  const result = {admin:user?.role === 'admin'}
  res.send(result)
})


// ========== for updating user to admin ===========
app.patch('/users/admin/:id',async(req,res)=>{
  const id = req.params.id;
  const filter = {_id : new ObjectId(id)}
  const updateDoc = {
    $set: {
      role: 'admin'
    },
  };
  const result = await usersCollection.updateOne(filter,updateDoc);
  res.send(result)
});





// ======= for creating an admin by a input field by one click ========
app.post('/new-admin',async(req,res)=>{
  const admin = req.body;
 
  // ======= this part is for google sign in problem because we do not understand that it is new user or not ========
  const query = {email: admin.email}
  const existingUser = await usersCollection.findOne(query)
  if(existingUser){
    return res.send('user already exist')
  }
  const result = await usersCollection.insertOne(admin);
  res.send(result)
})



app.delete('/users/:id',async(req,res)=>{
  const id = req.params.id;
  const query = {_id: new ObjectId(id)}
  const result = await usersCollection.deleteOne(query);
  res.send(result)
});

// =========== payment system with stripe =============
app.post("/create-payment-intent", async (req, res) => {
  const { price } = req.body;
  const amount = Math.ceil(price * 100); // Convert price to cents and round up

  if (amount < 100) {
    // Handle the case where the amount is less than 1 USD (100 cents)
    return res.status(400).send("Invalid amount");
  }

  // Create a PaymentIntent with the order amount and currency
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount,
    currency: "usd",
    payment_method_types: ['card']
  });

  res.send({
    clientSecret: paymentIntent.client_secret,
  });
});
// ================== post payments info to database ============


app.post('/payments',async(req,res) =>{
  const payment = req.body;
  const insertResult = await paymentsCollection.insertOne(payment);
  // ======== delete the cart item at the same time ==========
  const query = {_id : {$in : payment.cartItems.map(id => new ObjectId(id))}}
  const deleteResult = await cartsCollection.deleteMany(query)
  res.send({insertResult,deleteResult})
});

// ========== admin dashboard data loading ==============
app.get('/admin-states',async(req,res)=>{
  const users = await usersCollection.estimatedDocumentCount();
  const menuItems = await menuCollection.estimatedDocumentCount();
  const orders = await paymentsCollection.estimatedDocumentCount()

  // ======== best way to get sum of a field is to group and sum operator======
  const payments = await paymentsCollection.find().toArray();
  const revenue = payments.reduce((sum,payment)=> sum + payment.price,0)
  res.send({
    users,
    menuItems,
    orders,
    revenue
  })
});

// =============== chart data for admin ===============


app.get('/chart-data', async (req, res) => {
 
    const paymentsData = await paymentsCollection.find().toArray();

    // Extract foodIds from paymentsData and flatten
    const newId = paymentsData.flatMap(payment => payment.foodId);
    const query = { _id: { $in: newId.map(id => new ObjectId(id)) }};
    const result = await menuCollection.find(query).toArray();
    res.send(result);
 
});

// =================== chart data for user =================
app.get('/chart-data-user', async (req, res) => {
  const email = req.query.email;
  const filter = {email:email}
    const paymentsData = await paymentsCollection.find(filter).toArray();

    // Extract foodIds from paymentsData and flatten
    const newId = paymentsData.flatMap(payment => payment.foodId);
    const query = { _id: { $in: newId.map(id => new ObjectId(id)) }};
    const result = await menuCollection.find(query).toArray();
    res.send(result);
 
});

// ============= load payment history =============
app.get('/paymentHistory' ,async(req,res)=>{
  const email = req.query.email;
  const filter = {email:email};
  const result = await paymentsCollection.find(filter).toArray();
  console.log(result)
  res.send(result)
});

// =============== post reservation ==============
app.post('/reservation',async(req,res)=>{
const reservation = req.body;
const result = await reservationCollection.insertOne(reservation);
res.send(result)
});

// ============ load payment data for bookings ================
app.get('/bookingsHistory',async(req,res)=>{
  const result = await paymentsCollection.find().toArray();
  res.send(result)
})






// ===== this is for set or updating data just one click =========

// app.post('/updateProducts', async (req, res) => {
//   try {
    
//     // Fetch all documents from the collection
//     const filter = {}; // An empty filter matches all documents in the collection
//     const products = await menuCollection.find(filter).toArray();

//     for (const product of products) {
//       // Generate a unique productId for each product
//       const productId = Math.random().toString(16).slice(2, 16);

//       // Update the product with the new productId
//       const update = { $set: { productId } };
//       await menuCollection.updateOne({ _id: product._id }, update);
//     }

//     res.status(200).json({ message: 'Products updated successfully' });
//   } catch (error) {
//     console.error('Error:', error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }})










    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
// =========== database end ================



app.get('/',(req,res)=>{
    res.send('boss is running')
});

app.listen(port,()=>{
    console.log(`boss is running on the port ${port}`)
});

