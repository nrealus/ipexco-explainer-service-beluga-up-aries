export interface PlanProperty {
    _id?: string;
    definition: unknown;
    name: string;
    project: string;
    type: string;
    naturalLanguageDescription: string;
    isUsed: boolean;
    globalHardGoal: boolean;
    utility: number;
    ranking: number;
}