const express = require('express')
const cors = require('cors')
const app = express()
const port = process.env.PORT || 3000
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
//MIDDLE
app.use(cors())
app.use(express.json())

//mongo setup
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.vtekdls.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri)
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

//mongodb-related
async function run() {
    try {
        const usersCollection = client.db('daily-amols').collection('users')
        const amolsCollection = client.db('daily-amols').collection('amols')


        //veryfie guider
        const veryfieGuider = async (req, res, next) => {
            const decodedEmail = req.decoded.email
            const query = { email: decodedEmail }
            const user = await usersCollection.findOne(query)
            if (user?.role !== "guider") {
                return res.status(403).send({ message: "forbidden access" })
            }
            next()
        }
        // guider individual
        app.get('/users/guider/:email', async (req, res) => {
            const email = req.params.email
            const query = { email }
            const user = await usersCollection.findOne(query)
            res.send({ isGuider: user?.role === "guider" })
        })
        //post single user 
        app.post('/users', async (req, res) => {
            const user = req.body
            const result = await usersCollection.insertOne(user)
            res.send(result)
        })
        //ge all useers 
        app.get('/users', async (req, res) => {
            const query = {}
            const result = await usersCollection.find(query).toArray()
            res.send(result)
        })
        //single amol post
        app.post('/amols', async (req, res) => {
            const amols = req.body
            const result = await amolsCollection.insertOne(amols)
            res.send(result)
        })

        //get single person amol
        app.get('/amolByEmail', async (req, res) => {
            const email = req.query.email
            const query = { email: email }
            const cursor = amolsCollection.find(query).sort({ date: -1 })
            const result = await cursor.toArray()
            res.send(result)

        })
        // //  get all persons amols by date
        app.get('/amols', async (req, res) => {
            const query = {}
            const result = await amolsCollection.find(query).sort({ date: -1 }).toArray()
            // console.log(result)
            res.send(result)
        })
        app.delete('/amols/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const result = await amolsCollection.deleteOne(query)
            res.send(result)
        })

        //get individual amols emailwise collection
        app.get('/individuals', async (req, res) => {
            // const query = {}
            const users = await usersCollection.find({}, { email: 1 }).toArray()
            let amols = []
            users.forEach(user => {
                amols.push(amolsCollection.find({ email: user.email }).toArray())
            })
            // Promise.all(amols)
            const result = await Promise.all(amols)
            res.send(result)

        })



    }
    finally {

    }
}
run().catch(err => console.log(err))


//basic
app.get('/', (req, res) => {
    res.send('Alhamdulillah server is running')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})