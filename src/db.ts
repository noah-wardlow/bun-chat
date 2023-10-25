import postgres from "postgres";

const sql = postgres({
  host: "localhost", // Postgres ip address[s] or domain name[s]
  port: 5432, // Postgres server port[s]
  database: "noahwardlow", // Name of database to connect to
  username: "noahwardlow", // Username of database user
  password: "", // Password of database user
});

export default sql;
