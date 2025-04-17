import express from 'express';
import { explainerRouter } from './routes/explainer';
import { Agenda } from "@hokify/agenda";
import { schedule_run } from './explainer/run_explainer';
import * as dotenv from "dotenv";
import { ExplainRun } from './domain/explain_run';

dotenv.config();

const app = express();
const port = process.env.PORT || 3334;

console.log("Debug output: " + process.env.DEBUG_OUTPUT);
console.log("folder to temporally store the experiment data: " + process.env.TEMP_RUN_FOLDERS);
console.log("Explainer:")
console.log(process.env.EXPLAINER_SERVICE_PLANNER)

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('', explainerRouter);


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});


const mongodbURL = process.env.MONGO_DB || 'localhost:27017/agenda-explainer';
console.log("Database: " + mongodbURL);

export const agenda = new Agenda({
  db: {address: mongodbURL, collection: 'agendaJobs'},
  processEvery: '5 seconds',
  maxConcurrency: 1,
  defaultConcurrency: 1
});

agenda.start().then(
  () => console.log("Job scheduler started!"),
  () => console.log("Job scheduler failed!")
);

agenda.define('explainer call', async job => {
  let explain_run = job.attrs.data[1] as ExplainRun;
  console.log("Schedule job: " + explain_run.request.id);
  schedule_run(explain_run, job);
});

