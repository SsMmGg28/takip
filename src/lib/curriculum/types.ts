export interface CurriculumOutcome {
  code: string;
  description: string;
}

export interface CurriculumUnit {
  name: string;
  outcomes: CurriculumOutcome[];
}

export interface CurriculumSubject {
  subject: string;
  units: CurriculumUnit[];
}
