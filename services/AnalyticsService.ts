import { Workout, MuscleGroup } from '../types';
import { getWorkouts } from './gymService';

export interface MuscleDistribution {
  name: string;
  value: number;
}

export interface WeeklyVolume {
  day: string;
  volume: number;
}

export const getMuscleDistribution = async (): Promise<MuscleDistribution[]> => {
  const workouts = await getWorkouts();
  const distribution: Record<string, number> = {};

  workouts.forEach(workout => {
    workout.exercises.forEach(exercise => {
      // Count sets for muscle focus
      const SetCount = exercise.sets.filter(s => s.completed).length;
      if (SetCount > 0) {
        distribution[exercise.muscle] = (distribution[exercise.muscle] || 0) + SetCount;
      }
    });
  });

  return Object.entries(distribution).map(([name, value]) => ({
    name,
    value
  })).sort((a, b) => b.value - a.value);
};

export const getWeeklyVolume = async (): Promise<WeeklyVolume[]> => {
  const workouts = await getWorkouts();
  const volumeByDay: Record<string, number> = {};
  
  // Initialize last 7 days with 0
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dayName = days[d.getDay()];
    volumeByDay[dayName] = 0; // Initialize
  }

  // Aggregate stats
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  workouts.forEach(workout => {
    const d = new Date(workout.startTime);
    if (d >= oneWeekAgo) {
      const dayName = days[d.getDay()];
      
      // Calculate total volume for this workout
      let workoutVolume = 0;
      workout.exercises.forEach(e => {
          e.sets.forEach(s => {
              if (s.completed) workoutVolume += s.weight * s.reps;
          });
      });

      if (volumeByDay[dayName] !== undefined) {
          volumeByDay[dayName] += workoutVolume;
      }
    }
  });

  // Convert to array in correct order (last 7 days)
  const result: WeeklyVolume[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dayName = days[d.getDay()];
    result.push({ day: dayName, volume: volumeByDay[dayName] });
  }

  return result;
};
