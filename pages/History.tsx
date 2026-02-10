import React, { useEffect, useState } from 'react';
import { Calendar, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import Card from '../components/Card';
import { Workout } from '../types';
import { getWorkouts } from '../services/gymService';

const History: React.FC = () => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);

  useEffect(() => {
    const fetch = async () => {
        const data = await getWorkouts();
        setWorkouts(data);
    };
    fetch();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">History</h1>
      
      <div className="space-y-4">
        {workouts.length === 0 ? (
            <div className="text-center text-neutral-500 mt-10">No workouts recorded yet.</div>
        ) : (
            workouts.map(w => <HistoryItem key={w.id} workout={w} />)
        )}
      </div>
    </div>
  );
};

const HistoryItem: React.FC<{ workout: Workout }> = ({ workout }) => {
    const [expanded, setExpanded] = useState(false);
    
    // Calculate duration
    const start = new Date(workout.startTime);
    const end = workout.endTime ? new Date(workout.endTime) : new Date();
    const durationMin = Math.round((end.getTime() - start.getTime()) / 60000);

    return (
        <Card className="border-l-4 border-l-lime-400/50 hover:border-l-lime-400 transition-all">
            <div onClick={() => setExpanded(!expanded)} className="cursor-pointer">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-white text-lg">{workout.name}</h3>
                        <div className="flex items-center gap-3 text-xs text-neutral-400 mt-1">
                            <span className="flex items-center gap-1"><Calendar size={12}/> {start.toLocaleDateString()}</span>
                            <span className="flex items-center gap-1"><Clock size={12}/> {durationMin} min</span>
                            <span>{workout.volume.toLocaleString()} kg Vol</span>
                        </div>
                    </div>
                    {expanded ? <ChevronUp className="text-neutral-500" /> : <ChevronDown className="text-neutral-500" />}
                </div>
            </div>
            
            {expanded && (
                <div className="mt-4 pt-4 border-t border-neutral-800 space-y-3">
                    {workout.exercises.map(ex => (
                        <div key={ex.id} className="text-sm">
                            <div className="font-semibold text-lime-400 mb-1">{ex.name}</div>
                            <div className="flex flex-wrap gap-2">
                                {ex.sets.filter(s => s.completed).map((s, i) => (
                                    <span key={i} className="bg-neutral-950 border border-neutral-800 px-2 py-1 rounded text-xs text-neutral-300">
                                        {s.weight}kg x {s.reps}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
};

export default History;
