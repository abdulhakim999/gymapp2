import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Button from '../components/Button';
import { User, Mail, Ruler, Weight, Calendar, Upload, LogOut } from 'lucide-react';

interface ProfileData {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  height: number | null;
  weight: number | null;
  age: number | null;
  gender: string | null;
}

const Profile: React.FC = () => {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    id: '',
    email: '',
    full_name: '',
    avatar_url: null,
    height: null,
    weight: null,
    age: null,
    gender: null
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (user) {
      getProfile();
    }
  }, [user]);

  const getProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setProfile(data);
      }
    } catch (error: any) {
        console.error('Error loading profile:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const updates = {
        id: user!.id,
        full_name: profile.full_name,
        height: profile.height,
        weight: profile.weight,
        age: profile.age,
        // gender: profile.gender, // Optional to add to UI later if needed
        updated_at: new Date(),
      };

      const { error } = await supabase.from('profiles').upsert(updates);

      if (error) {
        throw error;
      }
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };
  
  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setSaving(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user!.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase.from('profiles').upsert({
         id: user!.id,
         avatar_url: publicUrl,
         updated_at: new Date()
      });


      if (updateError) {
        throw updateError;
      }

      setProfile({ ...profile, avatar_url: publicUrl });
      setMessage({ type: 'success', text: 'Avatar uploaded!' });

    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };


  if (loading) {
     return <div className="p-4 text-center text-neutral-400">Loading profile...</div>;
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">My Profile</h1>
        <button 
            onClick={handleSignOut}
            className="p-2 text-neutral-400 hover:text-red-400 transition-colors"
            title="Sign Out"
        >
            <LogOut size={20} />
        </button>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.type === 'error' ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
          {message.text}
        </div>
      )}

      {/* Avatar Section */}
      <div className="flex flex-col items-center space-y-4">
        <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-neutral-700 bg-neutral-800 flex items-center justify-center">
                {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                    <User size={40} className="text-neutral-500" />
                )}
            </div>
            <label htmlFor="avatar-upload" className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
                <Upload size={20} className="text-white" />
            </label>
            <input 
                type="file" 
                id="avatar-upload" 
                accept="image/*" 
                onChange={uploadAvatar} 
                className="hidden" 
                disabled={saving}
            />
        </div>
        <p className="text-xs text-neutral-500">Tap image to change</p>
      </div>


      <Card className="space-y-4 border-neutral-800">
        <div className="space-y-4">
            {/* Email (Read Only) */}
            <div>
                <label className="text-xs font-medium text-neutral-500 flex items-center gap-2 mb-1">
                    <Mail size={12} /> Email
                </label>
                <input 
                    type="text" 
                    value={user?.email || ''} 
                    disabled 
                    className="w-full bg-neutral-900/50 border border-neutral-800 rounded-lg p-3 text-neutral-400 cursor-not-allowed"
                />
            </div>

            {/* Full Name */}
            <div>
                <label className="text-xs font-medium text-neutral-400 flex items-center gap-2 mb-1">
                    <User size={12} /> Full Name
                </label>
                <input 
                    type="text" 
                    value={profile.full_name || ''} 
                    onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                    placeholder="Enter your name"
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-3 text-white focus:border-lime-400 focus:outline-none"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Age */}
                <div>
                    <label className="text-xs font-medium text-neutral-400 flex items-center gap-2 mb-1">
                        <Calendar size={12} /> Age
                    </label>
                    <input 
                        type="number" 
                        value={profile.age || ''} 
                        onChange={(e) => setProfile({...profile, age: parseInt(e.target.value) || null})}
                        placeholder="Age"
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-3 text-white focus:border-lime-400 focus:outline-none"
                    />
                </div>
                 {/* Empty slot or Gender could go here */}
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Height */}
                <div>
                    <label className="text-xs font-medium text-neutral-400 flex items-center gap-2 mb-1">
                        <Ruler size={12} /> Height (cm)
                    </label>
                    <input 
                        type="number" 
                        value={profile.height || ''} 
                        onChange={(e) => setProfile({...profile, height: parseFloat(e.target.value) || null})}
                        placeholder="cm"
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-3 text-white focus:border-lime-400 focus:outline-none"
                    />
                </div>

                {/* Weight */}
                <div>
                    <label className="text-xs font-medium text-neutral-400 flex items-center gap-2 mb-1">
                        <Weight size={12} /> Weight (kg)
                    </label>
                    <input 
                        type="number" 
                        value={profile.weight || ''} 
                        onChange={(e) => setProfile({...profile, weight: parseFloat(e.target.value) || null})}
                        placeholder="kg"
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-3 text-white focus:border-lime-400 focus:outline-none"
                    />
                </div>
            </div>
        </div>

        <div className="pt-4">
            <Button onClick={updateProfile} disabled={saving} fullWidth>
                {saving ? 'Saving...' : 'Save Changes'}
            </Button>
        </div>
      </Card>
    </div>
  );
};

export default Profile;
