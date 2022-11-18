const express = require('express');
const app = express();
const cors = require('cors');
const { initializeApp } = require('firebase-admin/app');
var admin = require("firebase-admin");

const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const ObjectId = require('mongodb').ObjectId;

// middleware
app.use(cors());
app.use(express.json());

// firebase admin initialization: 


var serviceAccount = require("./ema-john-shop-2022-firebase-adminsdk-l36nw-2765fc5dc4.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

//port number
const port = process.env.PORT || 5000;
console.log("port number found: ", port);
const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASS}@cluster0.yq19m.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function verifyIdToken(req, res, next) {
    if (req.headers.authorization) {
        const token = req.headers.authorization.split(" ")[1];
        try {
            const decodedToken = await admin.auth().verifyIdToken(token);
            console.log("decodedToken email: ", decodedToken.email);
            req.decodedUserEmail = decodedToken.email;
        }
        catch (err) { }

    }

    next();
}
const fun = async () => {
    try {
        await client.connect();
        const database = client.db("emajohn");
        const collection = database.collection("products");
        const collection2 = database.collection("orders");
        console.log("Connected to MongoDB");
        /* 
        --------------------------------- 
        GET REQUEST
        --------------------------------- 
        */

        app.get("/products", async (req, res) => {
            console.log("GET /products", req.query);
            const { page, size } = req.query;
            const category = req?.query?.category
            console.log("category: ", category);
            console.log(page, size);
            let cursor, count;
            if (category) {
                cursor = collection.find({ category: category });
                count = await cursor.count();
            }
            else {
                cursor = await collection.find({});
                count = await cursor.count();
            }

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
        app.get("/products/order", verifyIdToken, async (req, res) => {
            const email = req.query.email;
            if (req.decodedUserEmail === email) {
                let query = { email: email };
                const cursor = await collection2.find(query).toArray();
                res.send(cursor);
            }
            else {
                res.status(401).json({ message: 'User not authorized' })
            }

        })

        app.get("/product/categories", async (req, res) => {
            const cursor = await collection.distinct("category");
            // const count = await cursor.count();
            const products = await cursor;
            // const categories = products.map(product => product.category);
            // const uniqueCategories = [...new Set(categories)];
            res.send(products);
            // res.send(uniqueCategories);
        })

        app.get("/product/categories/top", async (req, res) => {
            const cursor = await collection.distinct("category");
            // const count = await cursor.count();
            const products = await cursor;
            // const categories = products.map(product => product.category);
            // const uniqueCategories = [...new Set(categories)];

            const cursor2 = await collection.find({
                category: {
                    $in: products,
                },
                maxShipping: {
                    $max: '$shipping'
                }
            });
            const count = await cursor2.length;
            const products2 = await cursor2.toArray();
            const data = {
                category: products,
                count: count,
                data: products2,
            }
            res.send(data);
            // res.send(uniqueCategories);
        })

        app.get("/product/categories/category", async (req, res) => {
            const category = req.query.category;
            // console.log("category: ", category);
            const cursor = await collection.find({ category: category });   // { category: category }
            const products = await cursor.toArray(); // products
            console.log("products found by category: ", products);
            res.send(products);
        })

        /* 
      --------------------------------- 
      POST REQUEST
      --------------------------------- 
      */
        // USE POST method for get items by id.
        app.post("/products/byKeys", async (req, res) => {
            // console.log("POST /products/byKeys", req.body);
            const keys = req.body;
            const query = { _id: { $in: [] } };
            for (id of keys) {
                // console.log("keys id : ", id);
                query._id.$in.push(ObjectId(id));
            }


            console.log("query", query);
            const cursor = await collection.find(query);
            const products = await cursor.toArray();
            console.log("products in POST /products/byKeys", products);
            res.json(products);
        })


        // USE POST method for placeing order.
        app.post("/products/order", async (req, res) => {
            console.log("POST /products/order", req.body);
            // const order = req.body
            const order = req.body;
            order.createat = new Date();
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