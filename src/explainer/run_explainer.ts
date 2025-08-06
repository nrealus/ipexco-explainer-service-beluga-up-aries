import { Job } from '@hokify/agenda';
import { spawn } from 'child_process';
import * as fs from 'fs';
import { ExplainRun } from '../domain/explain_run';
import { ExplainerRequest, ExplainerResponse, ExplanationRunStatus, Result } from '../domain/service_communication';
import { cleanUpExperimentEnvironment, setupExperimentEnvironment } from './experiment_utils';


export function createExplanationRun(request: ExplainerRequest): ExplainRun {
  return {
    request,
    status: ExplanationRunStatus.PENDING,
    experiment_path: process.env.TEMP_RUN_FOLDERS + '/' + request.id,
    explainer: process.env.EXPLAINER_SERVICE_PLANNER,
    args: [
      'explain',
      process.env.MAX_NUM_AVAILABLE_SWAPS,
      'problem_base.json',
      'problem_props.json',
      request.hardGoals.toString(),
    ]
  }
}


export async function schedule_run(explain_run: ExplainRun, job: Job) {

    console.log("request args?:", explain_run.request);
    setupExperimentEnvironment(explain_run.request.model, 
      {
        plan_properties: explain_run.request.goals,
        hard_goals: explain_run.request.hardGoals, // FIXME/BUG?? why is this empty in all tests ??
        soft_goals: explain_run.request.softGoals
      },
      explain_run.experiment_path
    )

    await run(explain_run, job);

    sendResult(explain_run)
   
    cleanUpExperimentEnvironment(explain_run.experiment_path)

}


function run(explain_run: ExplainRun, job: Job<any>): Promise<ExplainRun> {

    return new Promise(function (resolve, reject) {

      explain_run.status = ExplanationRunStatus.RUNNING
      let args = explain_run.args;

      if(explain_run.cost_bound){
        args = explain_run.args.map(a =>  ! a.includes('$cost_bound') ? a : a.replace('$cost_bound', explain_run.cost_bound));
      }

      console.log(explain_run.explainer + ' ' + args.join(' '))

      const options = {
        cwd: explain_run.experiment_path,
        env: process.env,
      };

      const explainProcess = spawn(explain_run.explainer, args, options);

      job.attrs.data.push(explainProcess.pid);
      job.save();

      if(process.env.DEBUG_OUTPUT == 'true'){
        explainProcess.stdout.on('data', (data) => {
          console.log(`stdout: ${data}`);
        });
        
        explainProcess.stderr.on('data', (data) => {
          console.error(`stderr: ${data}`);
        });
      }
      
      explainProcess.on('close', function (code) { 
        switch(code) {
          case 0:
            explain_run.status = ExplanationRunStatus.FINISHED
            break;
          case 2:
            explain_run.status = ExplanationRunStatus.FINISHED
            break;
          default:
            explain_run.status = ExplanationRunStatus.FAILED
            break;
        }
        console.log("ReturnCode: " + code);
        resolve(explain_run);
      });
      explainProcess.on('error', function (err) {
        explain_run.status = ExplanationRunStatus.FAILED
        reject(err);
      });
    });
  }


function get_res(explain_run: ExplainRun): Result {

  let conflicts_path = explain_run.experiment_path + '/output/conflicts/conflicts.json';

  let raw_res = JSON.parse(fs.readFileSync(conflicts_path, 'utf8'));

  console.log("Output conflicts:");
  console.log(raw_res);

  const res: Result = {
    MUGS: {
      complete: raw_res.complete,
      subsets: raw_res.muses,
    },
    MGCS: {
      complete: raw_res.complete,
      subsets: raw_res.mcses,
    }
  };

  return res
}

function sendResult(explainRun: ExplainRun) {

    let data: ExplainerResponse = {
      id: explainRun.request.id,
      status: explainRun.status,
      result: null
    }

  if(explainRun.status === ExplanationRunStatus.FINISHED){
    const result = get_res(explainRun);
    data.result = result; 
  }

  let payload = JSON.stringify(data);
  console.log("PAYLOAD:")
  console.log(payload)
  console.log("call back URL:" + explainRun.request.callback)

  const callbackRequest = new Request(explainRun.request.callback, 
    {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": 'Bearer ' + process.env.SERVICE_KEY
        },
        body: payload,
    }
  )

  fetch(callbackRequest).then
          (resp => {
            console.log("callback sent: " + explainRun.request.id)
            console.log("got response:", resp.status)
          },
          error => console.log(error)
      )
}

