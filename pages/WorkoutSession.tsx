import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Plus, Check, Trash2, Dumbbell, History as HistoryIcon, MoreVertical, X } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import { Exercise, Workout, WorkoutExercise, WorkoutSet } from '../types';
import { getActiveWorkout, getExercises, getLastPerformanceBatch, saveActiveWorkout, saveCompletedWorkout, discardActiveWorkout } from '../services/gymService';

// Helper for random IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

const WorkoutSession: React.FC = () => {
  const navigate = useNavigate();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Optimization: Store last performances in a map to avoid prop drilling delays or multiple fetches
  const [lastPerformances, setLastPerformances] = useState<Record<string, WorkoutExercise>>({});

  // Ref for timer interval
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize or Load
  useEffect(() => {
    const init = async () => {
        const existing = await getActiveWorkout();
        let currentWorkout = existing;

        if (existing) {
            setWorkout(existing);
            // Calculate elapsed time based on start time
            const start = new Date(existing.startTime).getTime();
            const now = new Date().getTime();
            setElapsedTime(Math.floor((now - start) / 1000));
        } else {
            // Start new
            const newWorkout: Workout = {
                id: generateId(),
                name: 'Evening Workout', // Dynamic naming logic can go here
                startTime: new Date().toISOString(),
                exercises: [],
                volume: 0,
                status: 'active'
            };
            // Determine name based on time
            const hour = new Date().getHours();
            if (hour < 12) newWorkout.name = 'Morning Workout';
            else if (hour < 17) newWorkout.name = 'Afternoon Workout';
            else newWorkout.name = 'Evening Workout';

            setWorkout(newWorkout);
            await saveActiveWorkout(newWorkout);
            currentWorkout = newWorkout;
        }
        const exs = await getExercises();
        setAllExercises(exs);

        // Optimization: Batch Fetch Last Performances for all exercises in current workout
        if (currentWorkout && currentWorkout.exercises.length > 0) {
            const ids = currentWorkout.exercises.map(e => e.exerciseId);
            // Remove duplicates
            const uniqueIds = [...new Set(ids)];
            const batchResults = await getLastPerformanceBatch(uniqueIds);
            setLastPerformances(prev => ({ ...prev, ...batchResults }));
        }
    };
    init();
  }, []);

  // Timer Tick
  useEffect(() => {
    if (!workout) return;
    
    timerRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [workout]);

  // Auto-Save Effect
  useEffect(() => {
    if (workout) {
      saveActiveWorkout(workout);
    }
  }, [workout]);

  // optimization: When adding a new exercise, fetch its last performance immediately
  // preventing a waterfall if we did it inside the component
  const addExerciseToWorkout = async (exercise: Exercise) => {
    if (!workout) return;

    const newExercise: WorkoutExercise = {
      id: generateId(),
      exerciseId: exercise.id,
      name: exercise.name,
      muscle: exercise.muscle,
      sets: [
        { id: generateId(), weight: 0, reps: 0, completed: false }
      ]
    };

    // Optimistically update UI
    const updatedWorkout = {
      ...workout,
      exercises: [...workout.exercises, newExercise]
    };
    setWorkout(updatedWorkout);
    setIsAddingExercise(false);
    setSearchQuery('');

    // Fetch previous data for this specific exercise if we don't have it
    if (!lastPerformances[exercise.id]) {
        const result = await getLastPerformanceBatch([exercise.id]);
        setLastPerformances(prev => ({ ...prev, ...result }));
    }
  };

  // Format Time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Logic: Set Operations
  const addSet = (exerciseInstanceId: string) => {
    if (!workout) return;
    const updatedExercises = workout.exercises.map(ex => {
      if (ex.id === exerciseInstanceId) {
        // Copy previous set values if available for convenience
        const lastSet = ex.sets[ex.sets.length - 1];
        return {
          ...ex,
          sets: [...ex.sets, { 
            id: generateId(), 
            weight: lastSet ? lastSet.weight : 0, 
            reps: lastSet ? lastSet.reps : 0, 
            completed: false 
          }]
        };
      }
      return ex;
    });
    setWorkout({ ...workout, exercises: updatedExercises });
  };

  const updateSet = (exerciseInstanceId: string, setId: string, field: 'weight' | 'reps', value: number) => {
    if (!workout) return;
    const updatedExercises = workout.exercises.map(ex => {
      if (ex.id === exerciseInstanceId) {
        const updatedSets = ex.sets.map(s => {
          if (s.id === setId) {
            return { ...s, [field]: value };
          }
          return s;
        });
        return { ...ex, sets: updatedSets };
      }
      return ex;
    });
    setWorkout({ ...workout, exercises: updatedExercises });
  };

  const toggleSetComplete = (exerciseInstanceId: string, setId: string) => {
    if (!workout) return;
    const updatedExercises = workout.exercises.map(ex => {
      if (ex.id === exerciseInstanceId) {
        const updatedSets = ex.sets.map(s => {
          if (s.id === setId) {
            return { ...s, completed: !s.completed };
          }
          return s;
        });
        return { ...ex, sets: updatedSets };
      }
      return ex;
    });
    setWorkout({ ...workout, exercises: updatedExercises });
  };

  const removeSet = (exerciseInstanceId: string, setId: string) => {
      if (!workout) return;
      const updatedExercises = workout.exercises.map(ex => {
          if (ex.id === exerciseInstanceId) {
              return { ...ex, sets: ex.sets.filter(s => s.id !== setId) };
          }
          return ex;
      });
      setWorkout({ ...workout, exercises: updatedExercises });
  }

  const removeExercise = (exerciseInstanceId: string) => {
      if (!workout) return;
      setWorkout({
          ...workout,
          exercises: workout.exercises.filter(ex => ex.id !== exerciseInstanceId)
      });
  }

  // Finish Workout
  const handleFinish = async () => {
    if (!workout) return;
    
    // Calculate volume
    let totalVolume = 0;
    workout.exercises.forEach(ex => {
      ex.sets.forEach(s => {
        if (s.completed) totalVolume += s.weight * s.reps;
      });
    });

    const finishedWorkout: Workout = {
      ...workout,
      endTime: new Date().toISOString(),
      volume: totalVolume,
      status: 'completed'
    };

    await saveCompletedWorkout(finishedWorkout);
    navigate('/');
  };

  const handleCancel = () => {
      if(window.confirm("Discard this workout?")) {
          discardActiveWorkout();
          navigate('/');
      }
  }

  if (isAddingExercise) {
    const filtered = allExercises.filter(e => 
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      e.muscle.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="flex flex-col h-screen bg-neutral-950 p-4">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => setIsAddingExercise(false)} className="p-2 bg-neutral-900 rounded-full text-neutral-400">
            <ArrowLeft size={20} />
          </button>
          <input 
            autoFocus
            type="text" 
            placeholder="Search exercises..." 
            className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-lime-400 transition-colors"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar">
          {filtered.map(ex => (
            <Card key={ex.id} onClick={() => addExerciseToWorkout(ex)} className="flex justify-between items-center group active:scale-[0.98] transition-transform">
              <div>
                <h4 className="font-bold text-white group-hover:text-lime-400 transition-colors">{ex.name}</h4>
                <span className="text-xs text-neutral-500 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">{ex.muscle}</span>
              </div>
              <Plus size={20} className="text-neutral-600 group-hover:text-lime-400" />
            </Card>
          ))}
          {filtered.length === 0 && (
              <div className="text-center text-neutral-500 mt-10">
                  No exercises found. <br/>
                  <span className="text-xs">(Custom exercises creation would go here)</span>
              </div>
          )}
        </div>
      </div>
    );
  }

  if (!workout) return <div className="p-10 text-white">Loading...</div>;

  return (
    <div className="flex flex-col h-screen bg-neutral-950">
      {/* Header */}
      <div className="px-4 py-4 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-20 border-b border-neutral-900">
        <div className="flex justify-between items-center mb-4">
          <button onClick={handleCancel} className="text-neutral-400 hover:text-red-500">
              <X size={24} />
          </button>
          <div className="flex flex-col items-center">
             <span className="font-bold text-white">{workout.name}</span>
             <div className="flex items-center gap-1.5 bg-neutral-900 px-3 py-1 rounded-full border border-neutral-800">
                <Clock size={12} className="text-lime-400" />
                <span className="text-xs font-mono text-lime-400">{formatTime(elapsedTime)}</span>
             </div>
          </div>
          <Button size="sm" onClick={handleFinish} disabled={workout.exercises.length === 0}>
            Finish
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-32 no-scrollbar">
        {workout.exercises.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center space-y-4 opacity-50">
            <Dumbbell size={48} className="text-neutral-700" />
            <p className="text-neutral-400">No exercises added yet.</p>
            <Button variant="outline" onClick={() => setIsAddingExercise(true)}>Add Exercise</Button>
          </div>
        ) : (
          workout.exercises.map((ex, exIndex) => (
            <ExerciseBlock 
              key={ex.id} 
              exercise={ex} 
              lastPerf={lastPerformances[ex.exerciseId]} // Optimization: Pass prop
              onAddSet={() => addSet(ex.id)}
              onUpdateSet={(sid, f, v) => updateSet(ex.id, sid, f, v)}
              onToggleSet={(sid) => toggleSetComplete(ex.id, sid)}
              onRemoveSet={(sid) => removeSet(ex.id, sid)}
              onRemoveExercise={() => removeExercise(ex.id)}
            />
          ))
        )}
        
        <Button 
            variant="secondary" 
            fullWidth 
            className="py-4 border-2 border-dashed border-neutral-800 bg-transparent text-neutral-400 hover:border-lime-500/50 hover:text-lime-400 transition-all"
            onClick={() => setIsAddingExercise(true)}
        >
            <Plus size={20} className="mr-2" />
            Add Exercise
        </Button>
      </div>
    </div>
  );
};

// Sub-component for individual Exercise Block to manage its own "Last Time" logic cleanly
const ExerciseBlock: React.FC<{
  exercise: WorkoutExercise;
  lastPerf: WorkoutExercise | undefined; // Optimization: Receive as prop
  onAddSet: () => void;
  onUpdateSet: (setId: string, field: 'weight' | 'reps', value: number) => void;
  onToggleSet: (setId: string) => void;
  onRemoveSet: (setId: string) => void;
  onRemoveExercise: () => void;
}> = ({ exercise, lastPerf, onAddSet, onUpdateSet, onToggleSet, onRemoveSet, onRemoveExercise }) => {
    // Optimization: Removed internal useEffect fetch
    
    return (
        <div className="space-y-3">
            <div className="flex justify-between items-end px-1">
                <h3 className="text-lg font-bold text-white">{exercise.name}</h3>
                <button onClick={onRemoveExercise} className="text-neutral-600 hover:text-red-500 p-1">
                    <MoreVertical size={16} />
                </button>
            </div>

            {/* Last Performance Hint */}
            {lastPerf && (
                <div className="bg-neutral-900/50 rounded-lg p-2 flex items-center gap-2 text-xs text-neutral-400 border border-neutral-800/50">
                    <HistoryIcon size={12} className="text-lime-400" />
                    <span className="font-semibold text-lime-400/80">Last time:</span>
                    <span className="truncate">
                        {lastPerf.sets.filter(s => s.completed).map(s => `${s.weight}kg x ${s.reps}`).join(', ')}
                    </span>
                </div>
            )}

            <Card className="!p-0 overflow-hidden">
                {/* Header Row */}
                <div className="grid grid-cols-10 gap-2 p-3 bg-neutral-800/30 text-xs font-bold text-neutral-400 uppercase tracking-wider text-center">
                    <div className="col-span-1">Set</div>
                    <div className="col-span-2 text-left pl-2">Previous</div>
                    <div className="col-span-3">kg</div>
                    <div className="col-span-3">Reps</div>
                    <div className="col-span-1"><Check size={14} className="mx-auto" /></div>
                </div>

                {/* Sets */}
                <div className="divide-y divide-neutral-800">
                    {exercise.sets.map((set, idx) => {
                        const prevSet = lastPerf?.sets[idx];
                        const prevText = prevSet && prevSet.completed ? `${prevSet.weight}x${prevSet.reps}` : '-';

                        return (
                            <div key={set.id} className={`grid grid-cols-10 gap-2 p-3 items-center text-center transition-colors ${set.completed ? 'bg-lime-500/10' : ''}`}>
                                <div className="col-span-1 text-sm font-medium text-neutral-500">{idx + 1}</div>
                                <div className="col-span-2 text-xs text-neutral-500 text-left pl-2">{prevText}</div>
                                <div className="col-span-3">
                                    <input 
                                        type="number" 
                                        value={set.weight === 0 ? '' : set.weight} 
                                        onChange={(e) => onUpdateSet(set.id, 'weight', parseFloat(e.target.value) || 0)}
                                        placeholder="0"
                                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-2 text-center font-bold text-white focus:border-lime-400 focus:outline-none focus:ring-1 focus:ring-lime-400 transition-all text-sm"
                                    />
                                </div>
                                <div className="col-span-3">
                                    <input 
                                        type="number" 
                                        value={set.reps === 0 ? '' : set.reps} 
                                        onChange={(e) => onUpdateSet(set.id, 'reps', parseFloat(e.target.value) || 0)}
                                        placeholder="0"
                                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-2 text-center font-bold text-white focus:border-lime-400 focus:outline-none focus:ring-1 focus:ring-lime-400 transition-all text-sm"
                                    />
                                </div>
                                <div className="col-span-1 flex justify-center relative">
                                    <button 
                                        onClick={() => onToggleSet(set.id)}
                                        className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all ${set.completed ? 'bg-lime-400 text-neutral-950 shadow-[0_0_10px_rgba(163,230,53,0.3)]' : 'bg-neutral-800 text-neutral-600 hover:bg-neutral-700'}`}
                                    >
                                        <Check size={18} strokeWidth={3} />
                                    </button>
                                    {!set.completed && (
                                        <button 
                                            onClick={() => onRemoveSet(set.id)}
                                            className="absolute -right-8 text-red-500 opacity-0 group-hover:opacity-100 p-2"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="p-2 bg-neutral-900/50">
                    <button 
                        onClick={onAddSet}
                        className="w-full py-2 flex items-center justify-center gap-2 text-sm font-semibold text-lime-400 hover:bg-neutral-800 rounded-lg transition-colors"
                    >
                        <Plus size={16} /> Add Set
                    </button>
                </div>
            </Card>
        </div>
    );
}

export default WorkoutSession;