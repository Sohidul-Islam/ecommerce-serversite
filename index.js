const express = require('express');
const app = express();
const cors = require('cors');
app.use(cors());
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
app.use(express.json());
port = 5000;

const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASS}@cluster0.yq19m.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
// client.connect(err => {
//     const collection = client.db("test").collection("devices");
//     // perform actions on the collection object
//     client.close();
// });

const fun = async () => {
    try {
        await client.connect();
        const database = client.db("emajohn");
        const collection = database.collection("products");
        console.log("Connected to MongoDB");

        app.get("/products", async (req, res) => {
            const cursor = await collection.find({});
            const products = await cursor.toArray();
            // const products = await collection.find({}).limit(5).toArray();
            const count = await cursor.count();
            res.send({ count, products });
        })
    } finally {
        // await client.close();
    }
}

fun().catch(console.error);

app.get("/", (req, res) => {
    res.send("Hello World");
})
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});