import React, { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { getExercises, getExerciseHistory } from '../services/gymService';
import { Exercise } from '../types';
import Card from '../components/Card';
import { ChevronDown } from 'lucide-react';

const Progress: React.FC = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState('');
  const [data, setData] = useState<{date: string, maxWeight: number, totalVolume: number}[]>([]);

  useEffect(() => {
    const fetchExercises = async () => {
        const exs = await getExercises();
        setExercises(exs);
        if (exs.length > 0 && !selectedExerciseId) {
            setSelectedExerciseId(exs[0].id);
        }
    };
    fetchExercises();
  }, []);

  useEffect(() => {
    if (!selectedExerciseId) return;
    const fetchData = async () => {
        const history = await getExerciseHistory(selectedExerciseId);
        setData(history);
    };
    fetchData();
  }, [selectedExerciseId]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Progress</h1>

      {/* Selector */}
      <div className="relative">
          <select 
            value={selectedExerciseId}
            onChange={(e) => setSelectedExerciseId(e.target.value)}
            className="w-full appearance-none bg-neutral-900 border border-neutral-800 text-white py-3 px-4 rounded-xl focus:outline-none focus:border-lime-400"
          >
              {exercises.map(ex => (
                  <option key={ex.id} value={ex.id}>{ex.name}</option>
              ))}
          </select>
          <ChevronDown className="absolute right-4 top-3.5 text-neutral-500 pointer-events-none" size={20} />
      </div>

      {data.length < 2 ? (
          <div className="flex flex-col items-center justify-center h-64 text-neutral-500 text-center p-8 border-2 border-dashed border-neutral-800 rounded-2xl">
              <p>Not enough data yet.</p>
              <p className="text-xs mt-2">Complete at least 2 workouts with this exercise to see a chart.</p>
          </div>
      ) : (
          <div className="space-y-8">
              {/* Max Weight Chart */}
              <Card>
                  <h3 className="text-lg font-bold text-white mb-4">Max Weight (kg)</h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                            <XAxis dataKey="date" stroke="#525252" tick={{fontSize: 12}} tickMargin={10} />
                            <YAxis stroke="#525252" tick={{fontSize: 12}} />
                            <Tooltip 
                                contentStyle={{backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '8px', color: '#fff'}}
                            />
                            <Line 
                                type="monotone" 
                                dataKey="maxWeight" 
                                stroke="#a3e635" // lime-400
                                strokeWidth={3}
                                dot={{fill: '#a3e635', r: 4}}
                                activeDot={{r: 6, fill: '#fff'}}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                  </div>
              </Card>

               {/* Volume Chart */}
               <Card>
                  <h3 className="text-lg font-bold text-white mb-4">Total Volume (kg)</h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                            <XAxis dataKey="date" stroke="#525252" tick={{fontSize: 12}} tickMargin={10} />
                            <YAxis stroke="#525252" tick={{fontSize: 12}} />
                            <Tooltip 
                                contentStyle={{backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '8px', color: '#fff'}}
                            />
                            <Line 
                                type="monotone" 
                                dataKey="totalVolume" 
                                stroke="#3b82f6" // blue-500
                                strokeWidth={3}
                                dot={{fill: '#3b82f6', r: 4}}
                                activeDot={{r: 6, fill: '#fff'}}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                  </div>
              </Card>
          </div>
      )}
    </div>
  );
};

export default Progress;
