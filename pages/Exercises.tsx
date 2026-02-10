import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import Card from '../components/Card';
import { getExercises, saveExercise } from '../services/gymService';
import { MuscleGroup, Exercise } from '../types';

const Exercises: React.FC = () => {
  const [allExercises, setAllExercises] = useState<Exercise[]>([]); 
  
  useEffect(() => {
    const fetch = async () => {
        const data = await getExercises();
        setAllExercises(data);
    };
    fetch();
  }, []);
  const [filter, setFilter] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | 'All'>('All');
  
  // Add Exercise State
  const [isAdding, setIsAdding] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseMuscle, setNewExerciseMuscle] = useState<MuscleGroup>('Chest');

  const muscles: (MuscleGroup | 'All')[] = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio', 'Other'];
  const musclesForAdd: MuscleGroup[] = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio', 'Other'];

  const handleAddExercise = async () => {
    if (!newExerciseName.trim()) return;

    const newExercise = {
        id: `custom_${Date.now()}`,
        name: newExerciseName,
        muscle: newExerciseMuscle
    };

    await saveExercise(newExercise);
    const updated = await getExercises();
    setAllExercises(updated); // Refresh list
    
    // Reset form
    setNewExerciseName('');
    setIsAdding(false);
  };

  const filtered = allExercises.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(filter.toLowerCase());
    const matchesMuscle = muscleFilter === 'All' || ex.muscle === muscleFilter;
    return matchesSearch && matchesMuscle;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Exercise Library</h1>
        <button 
            onClick={() => setIsAdding(!isAdding)}
            className="bg-lime-400 text-neutral-950 px-4 py-2 rounded-lg text-sm font-bold hover:bg-lime-500 transition-colors"
        >
            {isAdding ? 'Cancel' : '+ Add Exercise'}
        </button>
      </div>
      
      {/* Add Exercise Form */}
      {isAdding && (
        <Card className="bg-neutral-900 border-lime-500/30 animate-in fade-in slide-in-from-top-4">
            <h3 className="font-bold text-white mb-4">New Custom Exercise</h3>
            <div className="space-y-4">
                <div>
                    <label className="text-xs text-neutral-400 block mb-1">Exercise Name</label>
                    <input 
                        type="text" 
                        placeholder="e.g. Muscle Up"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white focus:border-lime-400 focus:outline-none"
                        value={newExerciseName}
                        onChange={e => setNewExerciseName(e.target.value)}
                    />
                </div>
                <div>
                    <label className="text-xs text-neutral-400 block mb-1">Muscle Group</label>
                    <div className="flex flex-wrap gap-2">
                        {musclesForAdd.map(m => (
                            <button
                                key={m}
                                onClick={() => setNewExerciseMuscle(m)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${newExerciseMuscle === m ? 'bg-lime-400/10 border-lime-400 text-lime-400' : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-600'}`}
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                </div>
                <button 
                    onClick={handleAddExercise}
                    disabled={!newExerciseName.trim()}
                    className="w-full bg-lime-400 text-neutral-950 py-3 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-lime-500 transition-colors"
                >
                    Save Exercise
                </button>
            </div>
        </Card>
      )}

      {/* Search & Filter */}
      <div className="space-y-4">
        <div className="relative">
            <Search className="absolute left-3 top-3.5 text-neutral-500" size={20} />
            <input 
                type="text" 
                placeholder="Find an exercise..." 
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-lime-400 transition-colors text-white"
                value={filter}
                onChange={e => setFilter(e.target.value)}
            />
        </div>
        
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {muscles.map(m => (
                <button 
                    key={m}
                    onClick={() => setMuscleFilter(m)}
                    className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-colors ${muscleFilter === m ? 'bg-lime-400 text-neutral-950' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}
                >
                    {m}
                </button>
            ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.map(ex => (
            <Card key={ex.id} className="flex justify-between items-center group">
                <div>
                    <h3 className="font-bold text-white group-hover:text-lime-400 transition-colors">{ex.name}</h3>
                    <span className="text-xs text-neutral-500">{ex.muscle}</span>
                </div>
            </Card>
        ))}
      </div>
    </div>
  );
};

export default Exercises;
