const express = require('express')
const app = express()
const mysql = require('mysql')

app.get('/submissions/:id', (req, res) => {
    console.log("fetching user with id: " + req.params.id)
    // res.end()

    const connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        database: 'audience_database'
    })

    const queryString = "SELECT * FROM submissions WHERE submission_id = ?"
    const userId = req.params.id
    connection.query(queryString, [userId], (err, rows, fields) => {
        console.log("Fetched successfully")
        res.send(rows)
    })
})



app.get("/", (req, res) => {
    console.log("reponding to root route")
    res.send("hello from root")
})

app.get("/users", (req, res) => {
    var user1 = {firstName: "Stephen", lastName: "Curry"}
    const user2 = {firstName: "Kevin", lastName: "Durant"}
    res.json([user1, user2])
})

app.listen(3003, () =>{
    console.log("Server is up and listening to 3003")
})
