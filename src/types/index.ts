export type UserRole = "client" | "coach" | "admin";

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  restSeconds: number;
  thumbnailUrl?: string;
}

export interface WorkoutDay {
  id: string;
  label: string;
  exercises: Exercise[];
}
