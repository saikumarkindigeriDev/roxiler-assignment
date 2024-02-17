const express = require("express");


const mysql=require('mysql2') 

const cors=require("cors") 



const app=express() 

app.use(cors());

require('dotenv').config()

app.use(express.urlencoded({extended: false}))
app.use(express.json())


const pool = mysql.createPool({
    host: process.env.DB_HOST, 
    user: process.env.DB_USERNAME, 
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DBNAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0 

    /* host:'localhost',
    user:'root', 
    password:'',
    database:'youtubedb' */
});

pool.getConnection((err, conn) => {
    if(err) console.log(err)
    console.log("Connected successfully")
})

app.get("/",(req,res)=>{
    res.send("Hi Sai")
})



let data;


const wholeData=async()=>{
  try{
    const response=await fetch("https://s3.amazonaws.com/roxiler.com/product_transaction.json") 
    data=await response.json() 
    let results=data.map(eachData=>({
        id:eachData.id,
        title:eachData.title,
        description:eachData.description,
        price:eachData.price, 
        category:eachData.category,
        sold:eachData.sold,
        image:eachData.image,
        dateOfSale:new Date(eachData.dateOfSale).getMonth(),
    }))   
    
    for (const result of results){
        const values=[result.title,result.description,result.price,result.category,result.sold,result.image,result.dateOfSale] ; 
       pool.query(`INSERT INTO TRANSACTIONS (title,description,price,category,sold,image,dateOfSale)
        VALUES(?,?,?,?,?,?,?)`,values,(err,res)=>{
            if (err) {
                console.log(err);
                return;
              }
            
              console.log('Data inserted successfully!');
        })
    }

    

    
  

  

    //console.log(result)  
    
    
    
    
  }catch(err){
    console.log(err)
  }
}

wholeData();  



       
app.get("/transactions/",(req,res)=>{
  const {limit,offset,search_q,category}=req.query 
  const sql2=`SELECT * FROM TRANSACTIONS WHERE title LIKE '%${search_q}%' AND dateOfSale=${category} ORDER BY id 
   LIMIT ${limit} OFFSET ${offset} ;`;  


  pool.query(sql2,(err,dataa)=>{
      if (err){
          console.log(err);
          return res.send("Error");
      } 
      
      
      console.log("Fetched")
      return res.json(dataa);
  });
})


app.get('/transactions/barchart/:category', (req, res) => {
  const selectedMonth = req.params.category;

  
  const sqlQuery = `
    SELECT
      CASE
        WHEN price BETWEEN 0 AND 100 THEN '0-100'
        WHEN price BETWEEN 101 AND 200 THEN '101-200'
        WHEN price BETWEEN 201 AND 300 THEN '201-300'
        WHEN price BETWEEN 301 AND 400 THEN '301-400'
        WHEN price BETWEEN 401 AND 500 THEN '401-500'
        WHEN price BETWEEN 501 AND 600 THEN '501-600'
        WHEN price BETWEEN 601 AND 700 THEN '601-700'
        WHEN price BETWEEN 701 AND 800 THEN '701-800'
        WHEN price BETWEEN 801 AND 900 THEN '801-900'
        WHEN price >= 901 THEN '901-above'
      END AS price_range,
      COUNT(*) AS item_count
    FROM TRANSACTIONS
    WHERE dateOfSale = ?
    GROUP BY price;
  `;


  pool.query(sqlQuery, [selectedMonth], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }
    console.log("Done sai")

  
    res.json(results);
  });
});



app.get('/transactions/piechart/:selectedMonths', (req, res) => {
  const selectedMonth = req.params.selectedMonths;

  const sqlQuery = `
    SELECT category, COUNT(*) AS itemCount
    FROM transactions
    WHERE dateOfSale = ?
    GROUP BY category;
  `;

  pool.query(sqlQuery, [selectedMonth], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    res.json(results);
  });
});


app.get("/",(req,res)=>{
    res.send(data)
})


const PORT = process.env.PORT || 4002

app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`)
})