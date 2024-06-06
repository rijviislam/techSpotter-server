const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const port = process.env.PORT || 5000;

const corsOptions = {
  origin: ["http://localhost:5173", "http://localhost:5174"],
  credentials: true,
};

// MIDDLE-WARE //
app.use(cors(corsOptions));
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_TECHSPOTTER_USER}:${process.env.DB_TECHSPOTTER_PASS}@cluster0.yy4jwyq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    const usersCollection = client.db("techSpotterDB").collection("users");
    const reviewCollection = client.db("techSpotterDB").collection("reviews");
    const couponsCollection = client.db("techSpotterDB").collection("coupons");
    const productsCollection = client
      .db("techSpotterDB")
      .collection("products");

    // SIGN TOKEN //
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(
        user,
        process.env.TECHSPOTTER_ASSESS_SECRET_TOKEN,
        {
          expiresIn: "1h",
        }
      );
      res.send({ token });
    });

    // VERIFY TOKEN //
    const verifyToken = (req, res, next) => {
      console.log("inside verify token", req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "Anauthorized Access!" });
      }
      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(
        token,
        process.env.TECHSPOTTER_ASSESS_SECRET_TOKEN,
        (err, decoded) => {
          if (err) {
            return res.status(401).send({ message: "unauthorized access" });
          }
          req.decoded = decoded;
          next();
        }
      );
    };

    app.get("/feature-products", async (req, res) => {
      const result = await productsCollection.find().toArray();
      res.send(result);
    });
    app.get("/trending-products", async (req, res) => {
      const result = await productsCollection.find().toArray();
      res.send(result);
    });
    app.get("/product-review-queue", verifyToken, async (req, res) => {
      const result = await productsCollection.find().toArray();
      res.send(result);
    });
    app.patch(
      "/product-review-queue-accept/:id",
      verifyToken,
      async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: {
            status: "accepted",
          },
        };
        const result = await productsCollection.updateOne(query, updateDoc);
        res.send(result);
      }
    );
    app.patch(
      "/product-review-queue-reject/:id",
      verifyToken,
      async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: {
            status: "reject",
          },
        };
        const result = await productsCollection.updateOne(query, updateDoc);
        res.send(result);
      }
    );
    // ADMIN //
    app.get("/all-users", verifyToken, async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });
    app.get("/all-product", verifyToken, async (req, res) => {
      const result = await productsCollection.find().toArray();
      res.send(result);
    });
    app.get("/all-review", verifyToken, async (req, res) => {
      const result = await reviewCollection.find().toArray();
      res.send(result);
    });
    //MAKE MODERATOR
    app.patch(
      "/make-moderator/:id",
verifyToken,
      async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: {
            role: "moderator",
          },
        };
        const result = await usersCollection.updateOne(query, updateDoc);
        res.send(result);
      }
    );
    // MAKE ADMIN
    app.patch("/make-admin/:id",verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await usersCollection.updateOne(query, updateDoc);
      res.send(result);
    });
    // UPDATE PRODUCT //
    app.get("/product/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productsCollection.findOne(query);
      res.send(result);
    });
    app.get("/product-details/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productsCollection.findOne(query);
      res.send(result);
    });
    app.get("/product", async (req, res) => {
      const query = { status: "accepted" };
      const result = await productsCollection.find(query).toArray();
      res.send(result);
    });
    app.patch("/trending-products/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          voteCount: req.body.voteCount,
        },
      };
      const result = await productsCollection.updateOne(query, updateDoc);
      res.send(result);
    });
    app.patch("/product/:id", async (req, res) => {
      const updateProduct = req.body;
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          productName: updateProduct.productName,
          links: updateProduct.links,
          description: updateProduct.description,
          productImage: updateProduct.productImage,
        },
      };
      const result = await productsCollection.updateOne(query, updatedDoc);
      res.send(result);
    });
    app.get("/reported-products", verifyToken, async (req, res) => {
      const reported = req.query?.reported;
      const query = reported === "true" ? { reported: "true" } : {};

      const result = await productsCollection.find(query).toArray();
      console.log(result);
      res.send(result);
    });
    app.patch("/product-details/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          reported: "true",
        },
      };
      const result = await productsCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });
    // GET USER FROM DB //
    app.get("/users/user/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      res.send(user);
    });
    app.get("/my-product/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await productsCollection.find(query).toArray();
      res.send(result);
    });
    app.put("/user", async (req, res) => {
      const user = req.body;
      const query = { email: user?.email };
      //   console.log(query);
      //   const isExistUser = await usersCollection.findOne(query);
      //   if (isExistUser) {
      //     return res.send({ message: "user already exist!", insertedId: null });
      //   }

      const isExist = await usersCollection.findOne(query);
      if (isExist) {
        if (user.status === "verified") {
          // if existing user try to change his role
          const result = await usersCollection.updateOne(query, {
            $set: { status: user?.status },
          });
          return res.send(result);
        } else {
          // if existing user login again
          return res.send(isExist);
        }
      }
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          ...user,
          timestamp: Date.now(),
        },
      };

      const result = await usersCollection.updateOne(query, updateDoc, options);
      res.send(result);
    });
    app.post("/product", verifyToken, async (req, res) => {
      const product = req.body;
      const result = await productsCollection.insertOne(product);
      res.send(result);
    });
    // REVIEW POST //
    app.post("/review", async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.send(result);
    });
    // POST COUPON //
    app.post("/coupons",verifyToken, async (req, res) => {
      const coupon = req.body;
      const result = await couponsCollection.insertOne(coupon);
      res.send(result);
    });
    app.get("/coupons",verifyToken, async (req, res) => {
      const result = await couponsCollection.find().toArray();
      res.send(result);
    });
    app.delete("/coupons/:id",verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await couponsCollection.deleteOne(query);
      res.send(result);
    });
    app.get("/review", async (req, res) => {
      const result = await reviewCollection.find().toArray();
      res.send(result);
    });
    app.delete("/product/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productsCollection.deleteOne(query);
      res.send(result);
    });
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Tech Spotter is running!!!");
});
app.listen(port, () => {
  console.log(`Tech Spotter is running on Port ${port} `);
});
