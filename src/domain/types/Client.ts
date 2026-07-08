import { DietPlan } from "./DietPlan";
import { DailyStep } from "./DailySteps";
import { DailyWeight } from "./DailyWeight";
import { MeasurementPoint } from "./MeasurementPoint";
import { BodyMeasurement } from "./BodyMeasurement";

export interface Client {
    name: string;
    targetWeight?: number;
    coachId: string;
    authId?: string;
    plans: DietPlan[];
    dailySteps?: DailyStep[];
    dailyWeights?: DailyWeight[];
    stepGoal?: number;
    updatedAt?: string | Date;
    measurementPoints?: MeasurementPoint[];
    measurements?: BodyMeasurement[];
}
