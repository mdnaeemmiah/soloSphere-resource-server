const express = require('express')
const app = express()
const cors = require('cors');
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const port = process.env.PORT || 9000;

app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true,
  optionsSuccessStatus: 200,
}))
app.use(express.json())
app.use(cookieParser())

// verify jwt middleware
const verifyToken = (req, res, next) => {
  const token = req.cookies?.token
  if (!token) return res.status(401).send({ message: 'unauthorized access' })
  if (token) {
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        console.log(err);
        return res.status(401).send({ message: 'unauthorized access' })
      }
      console.log(decoded);
      req.user = decoded
      next()
    })
  }


}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qenm5ah.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    const jobCollection = client.db('soloSphere').collection('jobs')
    const bidCollection = client.db('soloSphere').collection('bids')

    // jwt token
    app.post('/jwt', async (req, res) => {
      const email  = req.body;
      const token = jwt.sign(email , process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '365d'
      })
      res.cookie('token', token, {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        secure: process.env.NODE_ENV === 'production',
      })
        .send({ success: true })
    })
    // clear token
    app.get('/logout', (req, res) => {
      res.clearCookie('token', {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 0,
      })
        .send({ success: true })
    })

    // get all jobs data from db
    app.get('/jobs', async (req, res) => {
      const result = await jobCollection.find().toArray()
      res.send(result);
    })
    // get a single job data db useing id
    app.get('/job/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await jobCollection.findOne(query)
      res.send(result);
    })
    // save bid data
    app.post('/bid', async (req, res) => {
      const bidData = req.body;
      const result = await bidCollection.insertOne(bidData);
      res.send(result)
    })
    // save job data
    app.post('/job', async (req, res) => {
      const bidData = req.body;
      const result = await jobCollection.insertOne(bidData);
      res.send(result)
    })
    // get all jobs posted by specific use
    app.get('/jobs/:email', verifyToken, async (req, res) => {
      const tokenEmail  =req.user.email
      const email = req.params.email;
      if(tokenEmail !== email){
        return res.status(403).send({ message: 'forbidden  access' })
      }
      const query = { 'buyer.email': email }
      const result = await jobCollection.find(query).toArray()
      res.send(result)
    })
    // delete
    app.delete('/job/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await jobCollection.deleteOne(query);
      res.send(result)
    })
    // update 
    app.put('/job/:id', verifyToken, async (req, res) => {
      const id = req.params.id;
      const jobData = req.body;
      const query = { _id: new ObjectId(id) }
      const option = { upsert: true }
      const updateDoc = {
        $set: {
          ...jobData,
        }
      }
      const result = await jobCollection.updateOne(query, updateDoc, option)
      res.send(result)
    })

    // for bids get all bids for a user from email
    app.get('/my-bids/:email',verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { email }
      const result = await bidCollection.find(query).toArray()
      res.send(result)
    })
    // get all bid requests from db for job owener
    app.get('/bid-requests/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { "buyer.email": email }
      const result = await bidCollection.find(query).toArray()
      res.send(result)
    })
    // update bid status
    app.patch('/bid/:id', async (req, res) => {
      const id = req.params.id;
      const status = req.body;
      const query = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: status,
      }
      const result = await bidCollection.updateOne(query, updateDoc)
      res.send(result)
    })


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
  res.send('Solosphere resource')
})

app.listen(port, () => {
  console.log(`solosphere resource on port ${port}`)
})