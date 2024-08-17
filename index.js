require('dotenv').config()
const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 8000;
const app = express();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion } = require('mongodb');
const corsOptions = {
    origin: ['http://localhost:5173', 'https://trent-mart.web.app'],
    credentials: true,
    optionSuccessStatus: 200,
}
app.use(cors(corsOptions))
app.use(express.json())
app.use(cookieParser())


const uri = process.env.URI;


const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        const productsCollection = await client.db('trendmart').collection('products')

        // All Products
        app.get('/all-products', async (req, res) => {
            const start = parseInt(req.query.start);
            const sort = req.query.sort;
            const search = req.query.search;
            const category = req.query.category;
            const brand = req.query.brand;
            const minPrice = parseInt(req.query.minPrice);
            const maxPrice = parseInt(req.query.maxPrice);
            console.log(brand)
            const time = req.query.time;
            const sortCriteria = {
                price: sort === 'asc' ? 1 : -1,
                creationDate: time === true ? 1 : -1
            };
            let query = { productName: { $regex: search, $options: 'i' }, price: { $gte: minPrice, $lte: maxPrice } }
            if (category && category !== 'null') query.category = category
            if (brand && brand !== 'null') query.brandName = brand
            const skipItem = 9 * (start - 1)
            const result = await productsCollection
                .find(query)
                .sort(sortCriteria)
                .skip(skipItem)
                .limit(9)
                .toArray();
            const totalResult = await productsCollection.countDocuments(query)
            res.send({ result, totalResult })
        })

        app.get('/pro', async(req, res) => {
            const result = await productsCollection.find().toArray();
            res.send(result)
        })

        // Get Token 
        app.post('/jwt', async (req, res) => {
            const user = req.body;

            const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '1d' })
            res
                .cookie('token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
                })
                .send({ message: 'Get Token' });
        })

        app.get('/logout', async (req, res) => {
            res
                .clearCookie('token', {
                    maxAge: 0,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
                })
                .send({ message: 'Log Out' })
        })

        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {

    }
}
run().catch(console.dir);


app.get('/', async (req, res) => {
    res.send({ message: 'Hello World!!!' })
})

app.listen(port, () => {
    console.log('Port running at : ', port)
})