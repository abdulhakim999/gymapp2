import { Exercise, Workout, WorkoutExercise } from '../types';
import { INITIAL_EXERCISES } from '../constants';
import { supabase } from './supabase';

const KEYS = {
  ACTIVE_WORKOUT: 'irontrack_active_workout',
};

// --- Exercises ---
export const getExercises = async (): Promise<Exercise[]> => {
  // Always start with default exercises
  let exercises = [...INITIAL_EXERCISES];

  // Fetch custom exercises from Supabase if logged in
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session) {
      const { data, error } = await supabase
          .from('custom_exercises')
          .select('*');
      
      if (!error && data) {
          // Map DB structure to Exercise type if needed, assuming direct match based on schema
          exercises = [...exercises, ...data];
      }
  } else {
      // Fallback to local storage for offline/demo (optional, but good for safety)
      const stored = localStorage.getItem('irontrack_exercises');
      if (stored) {
         try {
             // We only want custom ones from local storage to append
             const local: Exercise[] = JSON.parse(stored);
             // Filter out duplicates if any (or just assume local storage is legacy)
             // For now, let's just ignore local storage if we are going full Supabase, 
             // but maybe we should migrate? User didn't ask for migration.
         } catch (e) {}
      }
  }
  
  return exercises;
};

export const saveExercise = async (exercise: Exercise) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session) {
      const { error } = await supabase
        .from('custom_exercises')
        .insert({
            id: exercise.id,
            user_id: session.user.id,
            name: exercise.name,
            muscle: exercise.muscle
        });
        
      if (error) {
          console.error('Error saving exercise:', error);
          alert('Failed to save exercise to cloud.');
      }
  } else {
      console.warn('User not logged in, cannot save to cloud.');
  }
};

// --- Workouts History ---

// Optimization: Added limit to prevent unbounded queries. Default is 50.
// Future improvement: Add cursor-based pagination.
export const getWorkouts = async (limit: number = 50): Promise<Workout[]> => {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) return [];

  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .order('start_time', { ascending: false })
    .limit(limit);

  if (error) {
      console.error('Error fetching workouts:', error);
      // Non-blocking error handling as requested
      return [];
  }

  // Parse JSONB exercises
  return data.map((row: any) => ({
      ...row,
      startTime: row.start_time, // Map snake_case to camelCase
      endTime: row.end_time,
      exercises: typeof row.exercises === 'string' ? JSON.parse(row.exercises) : row.exercises
  }));
};

export const saveCompletedWorkout = async (workout: Workout) => {
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
      const { error } = await supabase
        .from('workouts')
        .insert({
            user_id: session.user.id,
            name: workout.name,
            start_time: workout.startTime,
            end_time: workout.endTime,
            volume: workout.volume,
            exercises: workout.exercises,
            status: 'completed'
        });

      if (error) {
          console.error('Error saving workout:', error);
          // Replaced alert with console error as requested to be non-intrusive
      } else {
          // Clear active workout from local storage
          localStorage.removeItem(KEYS.ACTIVE_WORKOUT);
      }
  }
};

// --- Active Workout (Local only for responsiveness, could be cloud later) ---
export const getActiveWorkout = async (): Promise<Workout | null> => {
  const stored = localStorage.getItem(KEYS.ACTIVE_WORKOUT);
  return stored ? JSON.parse(stored) : null;
};

export const saveActiveWorkout = async (workout: Workout) => {
  localStorage.setItem(KEYS.ACTIVE_WORKOUT, JSON.stringify(workout));
};

export const discardActiveWorkout = async () => {
  localStorage.removeItem(KEYS.ACTIVE_WORKOUT);
};

// --- Analytics / Helper ---

// Optimization: Removed N+1 problem.
// Previously called getWorkouts() (all history) then filtered in JS.
// Now queries DB directly for the *single* latest workout containing this exercise.
export const getLastPerformance = async (exerciseId: string): Promise<WorkoutExercise | null> => {
  const result = await getLastPerformanceBatch([exerciseId]);
  return result[exerciseId] || null;
};

// Optimization: Batch Fetching (1 Request for multiple exercises)
export const getLastPerformanceBatch = async (exerciseIds: string[]): Promise<Record<string, WorkoutExercise>> => {
    if (exerciseIds.length === 0) return {};
    
    // Call the RPC function we created
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return {};

    const { data, error } = await supabase
        .rpc('get_last_performances_batch', { p_exercise_ids: exerciseIds });

    if (error) {
        console.error('Error fetching batch performance:', error);
        return {};
    }

    const resultMap: Record<string, WorkoutExercise> = {};
    
    if (data) {
        (data as any[]).forEach(row => {
             // row = { exercise_id, workout_data (full exercises array), start_time }
             // We need to extract the specific exercise from the array
             const exercises = row.workout_data; // already jsonb
             const found = exercises.find((e: any) => e.exerciseId === row.exercise_id);
             if (found) {
                 resultMap[row.exercise_id] = found;
             }
        });
    }

    return resultMap;
}

// Optimization: Filter at DB level instead of fetching all workouts.
// Fetches only workouts that actually contain this exercise.
export const getExerciseHistory = async (exerciseId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return [];

    // Fetch only relevant workouts, ordered by date
    const { data, error } = await supabase
        .from('workouts')
        .select('exercises, start_time')
        .contains('exercises', JSON.stringify([{ exerciseId: exerciseId }]))
        .order('start_time', { ascending: true }); // Oldest first for charts

    if (error) {
        console.error(`Error fetching history for ${exerciseId}:`, error);
        return [];
    }

    const history: {date: string, maxWeight: number, totalVolume: number}[] = [];

    data.forEach((w: any) => {
        const exercises = typeof w.exercises === 'string' ? JSON.parse(w.exercises) : w.exercises;
        const ex = exercises.find((e: any) => e.exerciseId === exerciseId);
        
        if (ex) {
            let maxWeight = 0;
            let vol = 0;
            ex.sets.forEach((s: any) => {
                if (s.completed) {
                    if (s.weight > maxWeight) maxWeight = s.weight;
                    vol += s.weight * s.reps;
                }
            });
            if (vol > 0) {
                history.push({
                    date: new Date(w.start_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric'}),
                    maxWeight,
                    totalVolume: vol
                });
            }
        }
    });
    return history;
};
