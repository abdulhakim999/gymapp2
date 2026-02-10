import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronRight, Activity, Calendar, LogOut } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import { getWorkouts, getActiveWorkout } from '../services/gymService';
import { Workout } from '../types';
import { MuscleDistributionChart, WeeklyVolumeChart } from '../components/Charts';
import { supabase } from '../services/supabase';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<Workout[]>([]);
  const [activeSession, setActiveSession] = useState<Workout | null>(null);

  useEffect(() => {
    const fetch = async () => {
        const h = await getWorkouts();
        setHistory(h.slice(0, 3)); 
        const a = await getActiveWorkout();
        setActiveSession(a);
    };
    fetch();
  }, []);

  const handleStartWorkout = () => {
    navigate('/session');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Hello, Athlete</h1>
          <p className="text-neutral-400 text-sm">Ready to crush it today?</p>
        </div>
        <div className="flex items-center gap-3">
            <button 
                onClick={handleLogout}
                className="h-10 w-10 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-400 hover:text-red-400 hover:border-red-500/50 transition-colors"
                title="Sign Out"
            >
                <LogOut size={18} />
            </button>
            <div className="h-10 w-10 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center">
                <span className="text-lg">🏋️</span>
            </div>
        </div>
      </div>

      {/* Active Session Card */}
      {activeSession ? (
        <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-lime-400 to-emerald-500 rounded-2xl blur opacity-30"></div>
            <Card className="relative bg-neutral-900 !border-lime-500/30">
            <div className="flex justify-between items-start mb-4">
                <div>
                <h3 className="text-lime-400 font-bold text-lg">Workout in Progress</h3>
                <p className="text-neutral-400 text-xs">Started: {new Date(activeSession.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                </div>
                <div className="animate-pulse">
                <Activity size={20} className="text-lime-400" />
                </div>
            </div>
            <div className="flex gap-2">
                <Button fullWidth onClick={() => navigate('/session')}>Resume Workout</Button>
            </div>
            </Card>
        </div>
      ) : (
        <Card className="bg-gradient-to-br from-neutral-800 to-neutral-900 border-none">
          <div className="flex flex-col items-center text-center py-4 space-y-4">
            <div className="h-16 w-16 bg-lime-400 rounded-full flex items-center justify-center shadow-lg shadow-lime-400/20 text-neutral-950">
              <Plus size={32} />
            </div>
            <div>
              <h2 className="font-bold text-xl">Start Workout</h2>
              <p className="text-neutral-400 text-sm">Log your sets, track your progress.</p>
            </div>
            <Button fullWidth onClick={handleStartWorkout} className="mt-2">
              New Empty Workout
            </Button>
          </div>
        </Card>
      )}



      {/* Analytics Dashboard */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold">Training Analytics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="flex flex-col">
            <h4 className="text-sm font-medium text-neutral-400 mb-4">Muscle Distribution</h4>
            <MuscleDistributionChart />
          </Card>
          <Card className="flex flex-col">
             <h4 className="text-sm font-medium text-neutral-400 mb-4">Weekly Volume</h4>
            <WeeklyVolumeChart />
          </Card>
        </div>
      </div>

      {/* Recent History */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Recent History</h3>
          <Button variant="ghost" size="sm" onClick={() => navigate('/history')} className="text-lime-400">
            See all
          </Button>
        </div>

        <div className="space-y-3">
          {history.length === 0 ? (
            <div className="text-center py-8 text-neutral-500 text-sm">
                No workouts yet. Start one!
            </div>
          ) : (
            history.map((workout) => (
              <Card key={workout.id} className="group hover:border-lime-500/50 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-400 group-hover:text-lime-400 transition-colors">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">{workout.name}</h4>
                      <div className="flex gap-2 text-xs text-neutral-400">
                        <span>{new Date(workout.startTime).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{workout.exercises.length} Exercises</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-neutral-600 group-hover:text-lime-400" />
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
