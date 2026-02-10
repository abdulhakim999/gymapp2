export type MuscleGroup = 'Chest' | 'Back' | 'Legs' | 'Shoulders' | 'Arms' | 'Core' | 'Cardio' | 'Other';

export interface Exercise {
  id: string;
  name: string;
  muscle: MuscleGroup;
  equipment?: string;
}

export interface WorkoutSet {
  id: string;
  weight: number;
  reps: number;
  completed: boolean;
  rpe?: number;
}

export interface WorkoutExercise {
  id: string; // unique instance id in the workout
  exerciseId: string;
  name: string; // cached name
  muscle: MuscleGroup; // cached muscle
  sets: WorkoutSet[];
}

export interface Workout {
  id: string;
  name: string;
  startTime: string; // ISO string
  endTime?: string; // ISO string
  exercises: WorkoutExercise[];
  volume: number;
  status: 'active' | 'completed';
}

export interface UserProfile {
  name: string;
  unit: 'kg' | 'lb';
}
