const express = require('express');
const app = express();
const cors = require('cors');
app.use(cors());
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const ObjectId = require('mongodb').ObjectId;
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
        const collection2 = database.collection("orders");
        console.log("Connected to MongoDB");

        app.get("/products", async (req, res) => {
            // console.log("GET /products", req.query);
            const { page, size } = req.query;
            console.log(page, size);
            const cursor = await collection.find({});
            const count = await cursor.count();
            let products;
            if (page) {
                products = await cursor.skip(page * size).limit(parseInt(size)).toArray();
            }
            else {
                products = await cursor.toArray();
            }
            console.log(`for page: ${page} --> products found: , `, products.length);
            res.send({ count, products });
        })

        // USE POST method for get items by id.
        app.post("/products/byKeys", async (req, res) => {
            console.log("POST /products/byKeys", req.body);
            const keys = req.body;
            const query = { _id: { $in: [] } };
            for (id of keys) {
                // console.log("keys id : ", id);
                query._id.$in.push(ObjectId(id));
            }
            // console.log("query", query);
            const cursor = await collection.find(query);
            const products = await cursor.toArray();
            // console.log("products in POST /products/byKeys", products);
            res.json(products);
        })
        // USE POST method for placeing order.
        app.post("/products/order", async (req, res) => {

            console.log("POST /products/order", req.body);
            // const order = req.body
            const order = req.body;

            const cursor = await collection2.insertOne(order);
            const result = await cursor.insertedId;
            console.log("result", result);
            res.json(cursor);

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