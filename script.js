const express = require ("express")
const BodyParser = require("body-parser")
const cors = require('cors')
const knex =require("knex")
const bcrypt = require('bcryptjs')


const database = knex({
    client: 'mysql',
    // version: '15.1',
    
    connection: {  
        host : process.env.HOST,
        user : process.env.USER,
        password : process.env.PASSWORD,
        database : process.env.DATABASE,
        timezone: 'utc',
        port: "3306"
}
  });  


const app = express()

app.use(BodyParser.json())
app.use(BodyParser.urlencoded({ extended: false }))
app.use(cors())



app.get('/' , (req , res) =>  {
    res.send("its working")
})

app.post('/register',(req,res) =>{
    const{email, name ,password} = req.body
    if (!email || !name || !password) {
        return res.status(400).json("incorrect form submission")
    }
    const hash = bcrypt.hashSync(password)
    database.transaction(trx =>{
        trx.insert({
            password:hash,
            email:email
        })
        .into('user_details') 
        .then(loginEmail =>{
            return trx('persons')
            .insert({
                Email:email,
                Name:name
            }) 
            .then(user =>{ 
                res.status(200).json("success")
                })
            })
        .then(trx.commit)
        .catch(trx.rollback)
    })
        .catch(err => res.status(400).json(err))
    
})

app.post ('/signin', (req,res) => {
    const{email ,password} = req.body
    if (!email  || !password) {
        return res.status(400).json("incorrect form submission")
    }
  database.select('email' , "password")
  .from('user_details')
  .where('email' , "=" , email)
  .then(data =>{
    const isValid = bcrypt.compareSync(password , data[0].password)
    if (isValid) {
       return database.select('*').from ('persons')
        .where('email', '=', email)
        
        .then(user =>{
            res.status(200).json(user[0])
        })
        .then(users =>{
        database.insert
       ({
           email: email,
           Time_LoggedIn:new Date()

        })
       .into("logins")
      .then(user=>{
        res.status(200).json()
        })
        .catch(err=>{
            console.log(err)
        })
        })

        .catch(err => res.status(400).json("unable to connect"))
    }else{
        res.status(400).json("Wrong credentials")
    }
  })
 
  
  .catch(err => res.status(400).json("Wrong credentials"))
})



app.listen(4000)