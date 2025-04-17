
import fs from 'fs'
import { PlanningModel } from '../domain/model';
import { PlanProperty } from '../domain/plan_property';
import assert from 'assert';

export interface GoalDefinition {
    plan_properties: PlanProperty[],
    hard_goals: string[],
    soft_goals: string[]
}

export function setupExperimentEnvironment(model: PlanningModel, goalDefinition: GoalDefinition, expFolder: string){

    fs.mkdirSync(expFolder);

    const problem_path = expFolder + '/problem_base.json'
    fs.writeFileSync(problem_path, JSON.stringify(model))

    console.log("plan_properties: ", goalDefinition.plan_properties);
    var properties = []
    if (goalDefinition.plan_properties !== undefined) {
        assert(goalDefinition.soft_goals.length == 0);
        properties = goalDefinition.plan_properties.filter((item) => goalDefinition.hard_goals.includes(item._id)).map((item) => item);
    }

    const properties_path = expFolder + '/problem_props.json'
    fs.writeFileSync(
        properties_path,
        JSON.stringify(properties),
    )
}


export function cleanUpExperimentEnvironment(expFolder: string){
    fs.rmSync(expFolder, { recursive: true, force: true });
}
