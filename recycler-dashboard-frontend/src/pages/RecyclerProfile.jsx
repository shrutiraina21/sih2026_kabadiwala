import { useState, useEffect } from 'react';
import { Save, Loader } from 'lucide-react';

export default function RecyclerProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const AVAILABLE_MATERIALS = ['PCB', 'Battery', 'Cable', 'CRT', 'LCD', 'Motor', 'Mixed Plastic'];

  useEffect(() => {
    fetch('http://localhost:5000/api/recycler/profile')
      .then(res => res.json())
      .then(data => {
        setProfile(data);
        setLoading(false);
      });
  }, []);

  const handleToggleMaterial = (material) => {
    const isAccepted = profile.acceptedMaterials.includes(material);
    let newAccepted = [...profile.acceptedMaterials];
    
    if (isAccepted) {
      newAccepted = newAccepted.filter(m => m !== material);
    } else {
      newAccepted.push(material);
    }
    
    setProfile({ ...profile, acceptedMaterials: newAccepted });
  };

  const handleRateChange = (material, value) => {
    setProfile({
      ...profile,
      rates: { ...profile.rates, [material]: Number(value) }
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    
    try {
      const res = await fetch('http://localhost:5000/api/recycler/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      if (res.ok) {
        setMessage('Profile updated successfully!');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      console.error(err);
      setMessage('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-gray-500">Loading profile...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Recycler Profile</h1>
        <p className="text-gray-500 mt-1">Manage accepted materials and offered rates. This data feeds the Dealer App matching algorithm.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Basic Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 border-b pb-4">Facility Details</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Facility Name</label>
              <input type="text" value={profile.name || ''} disabled className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 border px-3 py-2 text-gray-500 cursor-not-allowed" />
              <p className="mt-1 text-xs text-gray-500">Name is locked to CPCB registration</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Service Radius (km)</label>
              <input 
                type="number" 
                value={profile.serviceRadiusKm || 0} 
                onChange={(e) => setProfile({...profile, serviceRadiusKm: Number(e.target.value)})}
                className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2 focus:border-green-500 focus:ring-green-500" 
              />
            </div>
            <div className="sm:col-span-2 flex items-center">
              <input 
                type="checkbox" 
                id="pickup" 
                checked={profile.pickupAvailable} 
                onChange={(e) => setProfile({...profile, pickupAvailable: e.target.checked})}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded" 
              />
              <label htmlFor="pickup" className="ml-2 block text-sm text-gray-900">
                We offer logistics/pickup from scrap dealer yards
              </label>
            </div>
          </div>
        </div>

        {/* Accepted Materials & Rates */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 border-b pb-4">Accepted Materials & Market Rates</h2>
          <p className="text-sm text-gray-500 mb-6">Select the materials you are authorized to recycle and set your current buying rate per kg.</p>
          
          <div className="space-y-4">
            {AVAILABLE_MATERIALS.map(material => {
              const isAccepted = profile.acceptedMaterials?.includes(material);
              const rate = profile.rates?.[material] || 0;
              
              return (
                <div key={material} className={`flex items-center justify-between p-4 rounded-lg border ${isAccepted ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id={`mat-${material}`} 
                      checked={isAccepted}
                      onChange={() => handleToggleMaterial(material)}
                      className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded" 
                    />
                    <label htmlFor={`mat-${material}`} className="ml-3 block text-base font-medium text-gray-900">
                      {material}
                    </label>
                  </div>
                  
                  {isAccepted && (
                    <div className="flex items-center">
                      <label className="mr-3 text-sm text-gray-600">Rate (₹/kg):</label>
                      <input 
                        type="number"
                        value={rate}
                        onChange={(e) => handleRateChange(material, e.target.value)}
                        className="block w-24 rounded-md border-gray-300 border px-3 py-1 focus:border-green-500 focus:ring-green-500 sm:text-sm"
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-green-600 font-medium">{message}</div>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex justify-center items-center py-3 px-8 border border-transparent shadow-sm text-base font-medium rounded-lg text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader className="animate-spin h-5 w-5 mr-2" /> : <Save className="h-5 w-5 mr-2" />}
            Save Profile
          </button>
        </div>
      </form>
    </div>
  );
}
