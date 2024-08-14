const pg = require('pg')
const express = require('express')
const client = new pg.Client(process.env.DATABASE_URL||'postgres://localhost/the_acme_flavors_db')
const app = express()
const PORT = "3000"

app.use(express.json());
app.use(require('morgan')('dev'));

app.post('/api/flavors', async(req, res, next) => {
try{
  const body = req.body
  const name = body.name
  const SQL = `
  INSERT INTO flavors(name)
  VALUES($1)
  RETURNING *;`
  const response = await client.query(SQL, [name])
  res.send(response.rows[0])
}catch(err){
  next(err)
}
});
app.get('/api/flavors', async(req, res, next) => {
  try{
    const SQL = `
    SELECT * FROM flavors ORDER BY created_at DESC;`
    const response = await client.query(SQL)
    res.send(response.rows)
  }catch(err){
    next(err)
  }
});
app.put('/api/flavors/:id', async(req, res, next) => {
  try{
    const id = Number(req.params.id)
    const body = req.body
    const name = body.name
    const is_favorite = body.is_favorite
    const SQL = `
    UPDATE flavors
    SET name = $1, is_favorite = $2, updated_at = now()
    WHERE id = $3 RETURNING *;`
    const response = await client.query(SQL, [name, is_favorite, id])
    res.send(response.rows[0])
  }catch(err){
    next(err)
  }
});
app.delete('/api/flavors/:id', async(req, res, next) => {
  try{
    const id = req.params.id
    const SQL = `
    DELETE from flavors
    WHERE id = $1;`
    const response = await client.query(SQL, [id])
    res.sendStatus(204)
  }catch(err){
    next(err)
  }
});

const init = async () => {
  await client.connect();
  console.log("Successfully connected to the database");
  const SQL = `
  DROP TABLE IF EXISTS flavors;
  CREATE TABLE flavors(
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
  );`
  await client.query(SQL);
  console.log(`Sucessfully created tables`);
  const SQLTwo = `
  INSERT INTO flavors(name, is_favorite) VALUES('Cookies n Cream', true);
  INSERT INTO flavors(name) VALUES('Vanilla');
  INSERT INTO flavors(name) VALUES('Chocolate');
  INSERT INTO flavors(name, is_favorite) VALUES('Sea Salt Caramel', true);
  INSERT INTO flavors(name) VALUES('Mango');`
  await client.query(SQLTwo);
  console.log('Successfully seeded database');
  app.listen(PORT, () => {
    console.log('Your server is running!')
  })
};

init();