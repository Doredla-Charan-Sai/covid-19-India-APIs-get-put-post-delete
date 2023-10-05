const express = require("express");
const app = express();

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

app.use(express.json());
const path = require("path");
const dbpath = path.join(__dirname, "covid19India.db");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:300/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const forAPI1Fun = (item) => {
  return {
    stateId: item.state_id,
    stateName: item.state_name,
    population: item.population,
  };
};

const forAPI8fun = (item) => {
  return {
    stateName: item.state_name,
  };
};

const forAPI4fun = (item) => {
  return {
    districtId: item.district_id,
    districtName: item.district_name,
    stateId: item.state_id,
    cases: item.cases,
    cured: item.cured,
    active: item.active,
    deaths: item.deaths,
  };
};

// API 1
app.get("/states/", async (request, response) => {
  const getAPI1Query = `SELECT * FROM state;`;
  const dbAPI1Response = await db.all(getAPI1Query);
  response.send(dbAPI1Response.map((eachObj) => forAPI1Fun(eachObj)));
});

// API 2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getAPI2Query = `SELECT * FROM state WHERE state_id = ${stateId};`;
  const dbAPI2Response = await db.get(getAPI2Query);
  response.send(forAPI1Fun(dbAPI2Response));
});

// API 3
app.post("/districts/", async (request, response) => {
  const api3Details = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = api3Details;
  const getAPI3Query = `INSERT INTO district (district_name,state_id,cases,cured,active,deaths) 
    VALUES ('${districtName}',${stateId},${cases},${cured},${active},${deaths});`;
  await db.run(getAPI3Query);
  response.send("District Successfully Added");
});

// API 4
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getAPI4Query = `SELECT * FROM district WHERE district_id = ${districtId};`;
  const dbAPI4Response = await db.get(getAPI4Query);
  response.send(forAPI4fun(dbAPI4Response));
});

// API 5
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getAPI5Query = `DELETE FROM district WHERE district_id = ${districtId};`;
  await db.run(getAPI5Query);
  response.send("District Removed");
});

// API 6
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const api6Details = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = api6Details;
  const getAPI6Query = `UPDATE district SET  
    district_name='${districtName}',state_id=${stateId},cases=${cases},cured=${cured},active=${active},deaths=${deaths} 
    WHERE district_id=${districtId};`;
  await db.run(getAPI6Query);
  response.send("District Details Updated");
});

// API 7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getAPI7Query = `SELECT SUM(cases) as totalCases, 
    SUM(cured) as totalCured, 
    SUM(active) as totalActive, 
    SUM(deaths) as totalDeaths
    FROM district LEFT JOIN state
    ON district.state_id = state.state_id
    GROUP BY district.state_id
    HAVING district.state_id = ${stateId};`;
  const dbAPI7Response = await db.get(getAPI7Query);
  const forAPI7Fun = (item) => {
    return {
      totalCases: item.totalCases,
      totalCured: item.totalCured,
      totalActive: item.totalActive,
      totalDeaths: item.totalDeaths,
    };
  };
  response.send(dbAPI7Response);
});

// API 8
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getAPI8Query = `SELECT state.state_name FROM state LEFT JOIN district ON state.state_id = district.state_id WHERE district.district_id = ${districtId};`;
  const dbAPI8Response = await db.get(getAPI8Query);
  response.send(forAPI8fun(dbAPI8Response));
});

module.exports = app;
