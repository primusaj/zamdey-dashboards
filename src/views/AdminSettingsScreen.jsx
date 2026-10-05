import React, { useState, useEffect } from 'react';
import { Phone, MessageCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://zamdey-backend.onrender.com/api';

export default function AdminSettingsScreen() {
    const [phone, setPhone] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const token = localStorage.getItem('token');
                // 🚨 CONNECTED TO NEW BACKEND ROUTE
                const response = await fetch(`${API_URL}/admin/settings`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (response.ok) {
                    const json = await response.json();
                    if (json) {
                        setPhone(json.support_phone || '');
                        setWhatsapp(json.support_whatsapp || '');
                    }
                }
            } catch (error) {
                console.error("Failed to load settings:", error);
            } finally {
                setLoading(false);
            }
        };
        loadSettings();
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');
        
        try {
            const token = localStorage.getItem('token');
            // 🚨 CONNECTED TO NEW BACKEND ROUTE
            const response = await fetch(`${API_URL}/admin/settings`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                // 🚨 MAPPED TO PRISMA SCHEMA FIELDS
                body: JSON.stringify({ 
                    support_phone: phone, 
                    support_whatsapp: whatsapp 
                })
            });

            if (response.ok) {
                setMessage("✅ Settings updated successfully.");
            } else {
                const json = await response.json();
                setMessage(`❌ Error: ${json.message}`);
            }
        } catch (error) {
            setMessage("❌ Network Error: Could not connect to the server.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto bg-white p-4 sm:p-8 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 sm:mb-6">Platform Settings</h2>
            <p className="text-xs sm:text-sm text-slate-500 mb-6 sm:mb-8">
                Update the central support contact numbers here. The mobile app will sync to these immediately for Live Chat and Call Support.
            </p>

            {message && (
                <div className={`p-4 mb-6 rounded-lg font-semibold ${message.includes('✅') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {message}
                </div>
            )}

            <form onSubmit={handleSave} className="space-y-6">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Support Phone Number (Calls)</label>
                    <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            required
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="e.g. +237 670 00 00 00"
                            className="w-full pl-12 pr-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-bold text-slate-900"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">WhatsApp Business Number</label>
                    <div className="relative">
                        <MessageCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" size={18} />
                        <input 
                            type="text" 
                            required
                            value={whatsapp}
                            onChange={(e) => setWhatsapp(e.target.value)}
                            placeholder="e.g. 237670000000"
                            className="w-full pl-12 pr-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-bold text-slate-900"
                        />
                    </div>
                    <p className="text-xs text-slate-400 mt-2">Include the country code (e.g. 237) without the + sign.</p>
                </div>

                <div className="pt-6 border-t border-slate-100">
                    <button 
                        type="submit" 
                        disabled={saving}
                        className="w-full bg-slate-900 text-white font-bold py-4 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-70 flex justify-center items-center gap-2 uppercase tracking-widest text-xs"
                    >
                        {saving ? (
                            <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                        ) : (
                            "Save Settings"
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}