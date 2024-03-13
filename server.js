const express = require("express")
const cors = require("cors")
const app = express()
const MongoClient = require("mongodb").MongoClient
require("dotenv").config()
app.use(express.urlencoded({extended: true}))
app.set("view engine", "ejs")
app.use(express.static("./views"))
app.use("/diary", require("./routes/member.js"))

const db_id = process.env.DB_ID;
const db_pw = process.env.DB_PW;
const db_cluster = process.env.DB_CLUSTER;
const server_port = process.env.SERVER_PORT;
const db_uri = 'mongodb+srv://' + db_id + ':' + db_pw + '@' + db_cluster + '.zpxsdxo.mongodb.net/?retryWrites=true&w=majority';
const client = new MongoClient(db_uri)
const db = client.db("backendtest")
const db2 = client.db("diary")
global.col = db.collection("login")
global.pos = db2.collection("post")


app.listen(server_port, () => {
    console.log("server on")
})

app.get("/", (req, res)=>{
    res.render("index.ejs")
})
