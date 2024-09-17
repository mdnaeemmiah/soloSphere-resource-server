const express = require('express')
const app = express()
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const port =process.env.PORT || 9000;

app.use(cors({
    origin: ['http://localhost:5173'],
    credentials:true,
    optionsSuccessStatus:200,
}))
app.use(express.json())



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
    const jobCollection =client.db('soloSphere').collection('jobs')
    const bidCollection =client.db('soloSphere').collection('bids')
    
    // get all jobs data from db
    app.get('/jobs',async (req,res) => {
      const result =await jobCollection.find().toArray()
      res.send(result);
    })
    // get a single job data db useing id
    app.get('/job/:id',async (req,res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await jobCollection.findOne(query)
      res.send(result);
    })
    // save bid data
    app.post('/bid',async (req,res) => {
      const bidData = req.body;
      const result = await bidCollection.insertOne(bidData);
      res.send(result)
    })
     // save job data
    app.post('/job',async (req,res) => {
      const bidData = req.body;
      const result = await jobCollection.insertOne(bidData);
      res.send(result)
    })
    // get all jobs posted by specific use
    app.get('/jobs/:email',async (req,res) => {
      const email =req.params.email;
      const query = {'buyer.email':email}
      const result= await jobCollection.find(query).toArray()
      res.send(result)
    })
    // delete
    app.delete('/job/:id',async (req,res) => {
      const id =req.params.id;
      const query = {_id:new ObjectId(id)}
      const result= await jobCollection.deleteOne(query);
      res.send(result)
    })
    // update 
    app.put('/job/:id',async (req,res) => {
      const id= req.params.id;
      const jobData = req.body;
      const query = {_id:new ObjectId(id)}
      const option = {upsert:true}
      const updateDoc= {
        $set:{
          ...jobData,
        }
      }
      const result= await jobCollection.updateOne(query,updateDoc,option)
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