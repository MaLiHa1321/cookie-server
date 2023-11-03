const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000

// send cookies to client side
app.use(cors(
  {
    origin: ['http://localhost:5173'],
    credentials: true
  }

));
app.use(express.json())
app.use(cookieParser())

// verify middleware
const verifyToken = async(req,res,next) =>{
  const token = req.cookies?.token;
  if(!token){
    return res.status(401).send({message: "unauthorized access"})
  }
  jwt.verify(token, process.env.ACCESS_KEY_TOKEN, (err,decode) =>{
    if(err){
      return res.status(401).send({message: "unauthorized access"})
    }
    req.user = decode;
    next()
  })
}



// jwt middelware
// const logger = async(req,res,next) =>{
//   console.log("called by", req.host, req.originalUrl)
//   next()
// }

// verify token
// const verifyToken = async(req,res,next) =>{
//   const token = req.cookies?.token;
//   if(!token){
//     return res.status(401).send({message: 'forbidden'})
//   }
//   jwt.verify(token, process.env.ACCESS_KEY_TOKEN, (err,decoded) =>{
//     if(err){
//       return res.status(401).send({message: 'forbidden'})
//     }
//     req.user = decoded;
//     next()
//   })
// }
// const verifyToken = async(req,res,next) =>{

//   const token = req.cookies?.token;
//   if(!token){
//     return res.status(401).send({message: 'unahtrorized'})
//   }
//   jwt.verify(token, process.env.ACCESS_KEY_TOKEN, (err,decoded) =>{
//     if(err){
//       return res.status(401).send('forbiden')
//     }
//     req.user= decoded;
//     next()

//   })




// }



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ntnzcww.mongodb.net/?retryWrites=true&w=majority`;

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
    // await client.connect();

    const database = client.db("shop");
    const productCollection = database.collection("product");
    const bookingCollection = database.collection("booking");

    // add product
    app.post('/product', async(req,res) =>{
        const newProduct = req.body;
        console.log(newProduct)
        const result = await productCollection.insertOne(newProduct)
        res.send(result)
    })

    app.get('/product', async(req,res) =>{
        const cursor = productCollection.find()
        const result = await cursor.toArray()
        res.send(result)
    })

    app.get('/product/:id', async(req,res) =>{
        const id = req.params.id;
        const query ={ _id: new ObjectId(id)}
        const result = await productCollection.findOne(query)
        res.send(result)
    })

    // booking
    app.post('/booking', verifyToken, async(req,res) =>{
        const bookingProduct = req.body;
        console.log(bookingProduct)
        const result = await bookingCollection.insertOne(bookingProduct)
        res.send(result)
    })

    // get booking
    app.get('/booking', verifyToken,   async(req,res) =>{
      console.log(req.query.email)
    
      // verify user
      if(req.user.email !== req.query.email){
        return res.status(403).send({message: "access forbidden"});
      }
      console.log(req.cookies.token)
       
      let query ={}
      if(req.query.email){
        query ={email: req.query.email}
      }
        const cursor = bookingCollection.find(query)
        const result = await cursor.toArray()
        res.send(result)
    })

    // token generate
    app.post('/jwt', async(req,res) =>{
      const user = req.body;
      console.log(user)

      const token = jwt.sign(user, process.env.ACCESS_KEY_TOKEN, {expiresIn: '10h'} )
      res
      .cookie('token', token, {
        httpOnly: true,
        secure: false
      })
      .send({success: true})
  })

//  logout user
app.post('/logout', async(req,res) =>{
  const user = req.body;
  res.clearCookie('token', {maxAge: 0})
  .send({success: true})
})
 

   







    // app.post('/jwt', logger, verifyToken, async(req,res) =>{
    //   const user = req.body;
    //   console.log(user)
    //   const token = jwt.sign(user, process.env.ACCESS_KEY_TOKEN, {expiresIn: '10h'})
    
    //   res
    //   .cookie('token', token, {
    //     httpOnly: true,
    //     secure: false
    //   })
    //   .send({success: true})
    // })




    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})