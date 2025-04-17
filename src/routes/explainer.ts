import express, { Request, Response } from 'express';
import { createExplanationRun } from '../explainer/run_explainer';
import { agenda } from '..';
import { auth } from '../middleware/auth';
import { ExplainerRequest } from '../domain/service_communication';


var kill = require('tree-kill');

export const explainerRouter = express.Router();


explainerRouter.get('/:id', async (req: Request, res: Response) => {

    // TODO return status of run with id 

    res.status(201).send("TODO");
});


explainerRouter.post('/explanation', auth, async (req: Request, res: Response) => {

  try{
    
    const request = req.body as ExplainerRequest;

    let exp_run = createExplanationRun(request);

    res.status(201).send({id: request.id, status: exp_run.status});

    await agenda.now('explainer call', [request, exp_run]);

  }
  catch(err){
    console.log(err);
    res.status(500).send();
  }
  
});


explainerRouter.post('/cancel', auth, async (req: Request, res: Response) => {

  try{
    const refId = req.body.id;
    console.log("Cancel: " + refId)

    const jobs = await agenda.jobs({name: 'explainer call'});
    // console.log(jobs.map(d => d['attrs']));

    const cancelJob = jobs.filter(j => j['attrs'].data[0] === refId)[0];

    if (cancelJob === undefined){
      return res.status(400).send();
    }

    // console.log(cancelJob);
    cancelJob.cancel();
    kill(cancelJob.attrs.data[3], 'SIGKILL');
    // console.log(cancelJob);
    // const result = await cancelJob.remove();
    // console.log("Canceled: " + result);
    res.status(201).send();
  }
  catch(err){
    console.log(err);
    res.status(500).send();
  }
});

