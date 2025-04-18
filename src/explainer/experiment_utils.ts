
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
    console.log("soft_goals: ", goalDefinition.soft_goals);
    console.log("hard_goals: ", goalDefinition.hard_goals);

    const properties_path = expFolder + '/problem_props.json'
    fs.writeFileSync(
        properties_path,
        JSON.stringify(goalDefinition.plan_properties)
    )
}


export function cleanUpExperimentEnvironment(expFolder: string){
    fs.rmSync(expFolder, { recursive: true, force: true });
}
