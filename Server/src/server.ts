import app from "./app";

app.listen(process.env.PORT, () =>
  console.log(`Go and get the server on ${process.env.PORT}`)
);
