import React, { useMemo, useState, useEffect } from 'react';
import { 
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { getMuscleDistribution, getWeeklyVolume, MuscleDistribution, WeeklyVolume } from '../services/AnalyticsService';

const COLORS = ['#84cc16', '#10b981', '#0ea5e9', '#6366f1', '#a855f7', '#f43f5e', '#f59e0b'];
const GOAL_SETS_PER_WEEK = 12;

export const MuscleDistributionChart: React.FC = () => {
    const [data, setData] = useState<MuscleDistribution[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const dist = await getMuscleDistribution();
            // Take top 5
            setData(dist.slice(0, 5));
            setLoading(false);
        };
        fetchData();
    }, []);

    const totalSets = useMemo(() => data.reduce((acc, curr) => acc + curr.value, 0), [data]);

    // Empty State Data
    const displayData = data.length > 0 ? data : [{ name: 'Empty', value: 1 }];
    const isPlaceholder = data.length === 0;

    if (loading) return <div className="h-48 flex items-center justify-center text-neutral-500">Loading...</div>;

    return (
        <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Ring Chart */}
            <div className="relative h-48 w-48 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={displayData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={isPlaceholder ? 0 : 5}
                            cornerRadius={isPlaceholder ? 0 : 10}
                            dataKey="value"
                            stroke="none"
                        >
                            {displayData.map((entry, index) => (
                                <Cell 
                                    key={`cell-${index}`} 
                                    fill={isPlaceholder ? '#262626' : COLORS[index % COLORS.length]} 
                                />
                            ))}
                        </Pie>
                        {!isPlaceholder && (
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#171717', borderColor: '#262626', color: '#fff', borderRadius: '8px' }}
                                itemStyle={{ color: '#fff' }}
                                formatter={(value: number) => [`${value} Sets`, 'Volume']}
                            />
                        )}
                    </PieChart>
                </ResponsiveContainer>
                {/* Center Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-bold text-white">{totalSets}</span>
                    <span className="text-xs text-neutral-400 uppercase tracking-wider">Sets</span>
                </div>
            </div>

            {/* Legend / List */}
            <div className="flex-1 w-full space-y-3">
                {isPlaceholder ? (
                    <div className="flex flex-col gap-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center justify-between opacity-30">
                                <div className="flex items-center gap-3">
                                    <div className="w-1 h-8 rounded-full bg-neutral-700"></div>
                                    <div>
                                        <div className="h-4 w-12 bg-neutral-700 rounded mb-1"></div>
                                        <div className="h-3 w-20 bg-neutral-800 rounded"></div>
                                    </div>
                                </div>
                                <div className="w-16 h-1.5 bg-neutral-800 rounded-full"></div>
                            </div>
                        ))}
                        <div className="text-center text-xs text-neutral-500 mt-2">
                            Start a workout to see your stats!
                        </div>
                    </div>
                ) : (
                    data.map((item, index) => {
                        const color = COLORS[index % COLORS.length];
                        const percentage = Math.min(100, (item.value / GOAL_SETS_PER_WEEK) * 100);
                        
                        return (
                            <div key={item.name} className="flex items-center justify-between group">
                               <div className="flex items-center gap-3">
                                    <div className="w-1 h-8 rounded-full" style={{ backgroundColor: color }}></div>
                                    <div>
                                        <div className="text-sm font-bold text-white leading-none mb-1">
                                            {item.value}<span className="text-neutral-500 text-xs font-normal">/{GOAL_SETS_PER_WEEK} sets</span>
                                        </div>
                                        <div className="text-xs text-neutral-400 font-medium">{item.name}</div>
                                    </div>
                               </div>
                               
                               {/* Mini Progress Bar */}
                               <div className="w-16 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full rounded-full transition-all duration-500" 
                                        style={{ width: `${percentage}%`, backgroundColor: color }}
                                    ></div>
                               </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export const WeeklyVolumeChart: React.FC = () => {
    const [data, setData] = useState<WeeklyVolume[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const vol = await getWeeklyVolume();
            setData(vol);
            setLoading(false);
        };
        fetchData();
    }, []);

    const hasData = data.some(d => d.volume > 0);

    if (loading) return <div className="h-48 flex items-center justify-center text-neutral-500 text-sm">Loading...</div>;

    if (!hasData) {
        return (
            <div className="h-48 flex flex-col items-center justify-center text-neutral-500 text-sm border-2 border-dashed border-neutral-800 rounded-lg">
                <BarChart width={100} height={40} data={[{v:1}, {v:2}, {v:1}, {v:3}]}>
                    <Bar dataKey="v" fill="#262626" />
                </BarChart>
                <span className="mt-2">No volume data yet</span>
            </div>
        );
    }

    return (
        <div className="h-48 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                    <XAxis 
                        dataKey="day" 
                        stroke="#525252" 
                        tick={{ fill: '#737373', fontSize: 10 }} 
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                    />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#171717', borderColor: '#262626', color: '#fff', borderRadius: '8px' }}
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    />
                    <Bar dataKey="volume" fill="#84cc16" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};
