import React, { useState, useEffect } from 'react';
import { 
  Lock, User, Mail, ChevronRight, ChevronLeft, Loader2, Store, Bike, 
  ShieldAlert, MapPin, Phone, FileText, Briefcase, 
  Wallet, Smartphone, Building, UploadCloud, CheckCircle2
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Login({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [registerStep, setRegisterStep] = useState(1); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [role, setRole] = useState('RESTAURANT'); 
  const [zones, setZones] = useState([]);
  
  const [formData, setFormData] = useState({
    email: '', password: '', fullName: '', phone: '',
    zone: '', vehicleType: 'BIKE', 
    restaurantName: '', address: '', 
    momoProvider: '', momoNumber: '', momoAccountName: '', 
    idCardFront: null, idCardBack: null, drivingLicense: null 
  });

  useEffect(() => {
    const fetchZones = async () => {
      try {
        const res = await fetch(`${API_URL}/zones`);
        if (res.ok) setZones(await res.json());
      } catch (err) { console.error("Zone fetch failed", err); }
    };
    fetchZones();
  }, []);

  const resetForm = (targetRole) => {
    setFormData({
      email: '', password: '', fullName: '', phone: '',
      zone: '', vehicleType: targetRole === 'RIDER' ? 'BIKE' : '', 
      restaurantName: '', address: '', 
      momoProvider: '', momoNumber: '', momoAccountName: '', 
      idCardFront: null, idCardBack: null, drivingLicense: null 
    });
    setError('');
  };

  const handleRoleChange = (newRole) => {
    if (role !== newRole) {
      setRole(newRole);
      resetForm(newRole);
    }
  };

  const toggleAuthMode = () => {
    setIsRegister(!isRegister);
    setRegisterStep(1);
    resetForm(role);
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, [e.target.name]: file }));
    }
  };

  // 🚨 NEW: Vocal Validation for "Next Step"
  const handleNextStep = () => {
    setError('');
    if (registerStep === 1) {
      if (!formData.fullName || !formData.email || !formData.password || !formData.phone) {
        setError("⚠️ Please fill out all identity fields to continue.");
        return;
      }
    }
    if (registerStep === 2) {
      if (!formData.zone) {
        setError("⚠️ Please select an operating zone.");
        return;
      }
      if (role === 'RESTAURANT' && (!formData.restaurantName || !formData.address)) {
        setError("⚠️ Please provide your restaurant name and physical address.");
        return;
      }
    }
    setRegisterStep(prev => prev + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 🚨 NEW: Vocal Validation for "Submit"
    if (isRegister) {
      if (!formData.momoProvider || !formData.momoNumber || !formData.momoAccountName) {
        setError("⚠️ Please complete all MoMo payout details.");
        return;
      }
      if (!formData.idCardFront || !formData.idCardBack) {
        setError("⚠️ Please upload both the Front and Back of your National ID.");
        return;
      }
      if (role === 'RIDER' && !formData.drivingLicense) {
        setError("⚠️ Riders must upload a valid driving license.");
        return;
      }
    }

    setLoading(true);
    const endpoint = isRegister ? '/auth/register' : '/auth/login';
    
    let payload;
    let headers = {};

    if (isRegister) {
      payload = new FormData();
      payload.append('email', formData.email);
      payload.append('password', formData.password);
      payload.append('role', role);
      payload.append('full_name', formData.fullName);
      payload.append('phone', formData.phone);
      payload.append('zone_name', formData.zone);
      
      payload.append('momo_provider', formData.momoProvider);
      payload.append('momo_number', formData.momoNumber);
      payload.append('momo_account_name', formData.momoAccountName);

      if (formData.idCardFront) payload.append('idCardFront', formData.idCardFront);
      if (formData.idCardBack) payload.append('idCardBack', formData.idCardBack);

      if (role === 'RIDER') {
        payload.append('vehicle_type', formData.vehicleType);
        if (formData.drivingLicense) payload.append('drivingLicense', formData.drivingLicense);
      }
      
      if (role === 'RESTAURANT') {
        payload.append('restaurant_name', formData.restaurantName);
        payload.append('address', formData.address);
      }
    } else {
      payload = JSON.stringify({ email: formData.email, password: formData.password });
      headers = { 'Content-Type': 'application/json' };
    }

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: headers,
        body: payload
      });

      const data = await res.json();

      if (res.ok) {
        if (data.token) {
            localStorage.setItem('token', data.token);
            let appRole = 'vendor';
            if (data.role === 'ADMIN') appRole = 'admin';
            if (data.role === 'RIDER') appRole = 'rider';
            
            onLogin({ id: data._id, name: data.name, role: appRole, token: data.token });
        } else {
            setIsRegister(false); 
            setRegisterStep(1); 
            resetForm(role);
            setError("✅ Application Submitted! Please wait for Admin approval before logging in.");
            window.scrollTo(0, 0); 
        }
      } else {
        if (res.status === 403 && data.status === 'PENDING') {
            setError("⏳ Documents Under Review. Please wait for Admin approval.");
        } else if (res.status === 403 && data.message.includes('suspended')) {
            setError("🚫 Account Suspended. Contact Support.");
        } else {
            setError(data.message || "Access Denied");
        }
      }
    } catch (err) {
      setError("Server unresponsive. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 🚨 REMOVED native HTML required attributes so React can handle the errors gracefully
  const FileInput = ({ name, label }) => {
    const file = formData[name];
    return (
      <div className="relative">
        <input 
          key={file ? file.name : 'empty'} 
          type="file" 
          name={name}
          accept="image/jpeg, image/png, application/pdf"
          onChange={handleFileChange}
          className="hidden" 
          id={`file-${name}`}
        />
        <label 
          htmlFor={`file-${name}`}
          className={`flex items-center justify-between w-full p-4 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
            file ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200 hover:border-indigo-400 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <UploadCloud className={file ? 'text-indigo-600' : 'text-slate-400'} size={20} />
            <div className="flex flex-col">
              <span className={`text-xs font-bold ${file ? 'text-indigo-900' : 'text-slate-700'}`}>{label}</span>
              <span className="text-[9px] text-slate-400 font-medium">{file ? file.name : 'PDF, JPG, PNG'}</span>
            </div>
          </div>
          {file && <CheckCircle2 className="text-indigo-500" size={18} />}
        </label>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex bg-white font-sans overflow-hidden">
      
      {/* 👈 LEFT SIDE: FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12 relative z-10 overflow-y-auto">
        <div className="w-full max-w-md space-y-6 animate-in slide-in-from-left duration-700">
          
          <div className="mb-6">
            <h1 className="text-4xl font-black text-slate-900 italic tracking-tighter uppercase mb-2">
              {isRegister ? 'Partner Sign Up' : 'Portal Login'}
            </h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
              {isRegister ? `Step ${registerStep} of 3: ${registerStep === 1 ? 'Identity' : registerStep === 2 ? 'Operations' : 'Payouts & Docs'}` : 'Secure Admin & User Access'}
            </p>
            {isRegister && (
              <div className="w-full h-1.5 bg-slate-100 rounded-full mt-4 overflow-hidden flex">
                <div className={`h-full bg-indigo-600 transition-all duration-500 ${registerStep === 1 ? 'w-1/3' : registerStep === 2 ? 'w-2/3' : 'w-full'}`} />
              </div>
            )}
          </div>

          {/* Form wrapper handles the final submission */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* ================================================= */}
            {/* STEP 1: IDENTITY & ROLE                           */}
            {/* ================================================= */}
            {(!isRegister || registerStep === 1) && (
              <div className="space-y-5 animate-in fade-in zoom-in-95">
                {isRegister && (
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <button type="button" onClick={() => handleRoleChange('RESTAURANT')} className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${role === 'RESTAURANT' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm' : 'border-slate-100 bg-slate-50 text-slate-400 opacity-60 hover:opacity-100'}`}>
                        <Store size={24} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Vendor App</span>
                    </button>
                    <button type="button" onClick={() => handleRoleChange('RIDER')} className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${role === 'RIDER' ? 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-sm' : 'border-slate-100 bg-slate-50 text-slate-400 opacity-60 hover:opacity-100'}`}>
                        <Bike size={24} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Rider App</span>
                    </button>
                  </div>
                )}

                {isRegister && (
                   <div>
                     <div className="relative group">
                       <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                       <input 
                         name="fullName" 
                         value={formData.fullName} onChange={handleChange}
                         placeholder="Legal Full Name" 
                         className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-6 font-bold text-slate-900 outline-none focus:border-indigo-600 transition-all"
                       />
                     </div>
                     <p className="text-[9px] font-bold text-slate-400 mt-1.5 ml-2 uppercase tracking-widest">Must match your National ID Card</p>
                   </div>
                )}

                <div>
                   <div className="relative group">
                     <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                     <input 
                       name="email" type="email" 
                       value={formData.email} onChange={handleChange}
                       placeholder="Email Address" 
                       className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-6 font-bold text-slate-900 outline-none focus:border-indigo-600 transition-all"
                     />
                   </div>
                </div>

                <div>
                   <div className="relative group">
                     <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                     <input 
                       name="password" type="password" 
                       value={formData.password} onChange={handleChange}
                       placeholder="Secure Password" 
                       className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-6 font-bold text-slate-900 outline-none focus:border-indigo-600 transition-all"
                     />
                   </div>
                </div>

                {isRegister && (
                   <div>
                     <div className="relative group">
                       <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                       <input 
                         name="phone" type="tel" 
                         value={formData.phone} onChange={handleChange}
                         placeholder="e.g. 670 000 000" 
                         className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-6 font-bold text-slate-900 outline-none focus:border-indigo-600 transition-all"
                       />
                     </div>
                     <p className="text-[9px] font-bold text-slate-400 mt-1.5 ml-2 uppercase tracking-widest">Active WhatsApp number preferred</p>
                   </div>
                )}
              </div>
            )}

            {/* ================================================= */}
            {/* STEP 2: OPERATIONS                                */}
            {/* ================================================= */}
            {isRegister && registerStep === 2 && (
               <div className="space-y-5 animate-in fade-in zoom-in-95">
                  <div>
                    <div className="relative group">
                      <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <select 
                        name="zone" value={formData.zone} onChange={handleChange}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-6 font-bold text-slate-900 outline-none focus:border-indigo-600 appearance-none"
                      >
                        <option value="">Select Primary Operating Zone</option>
                        {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                      </select>
                    </div>
                  </div>

                  {role === 'RESTAURANT' && (
                    <>
                      <div>
                        <div className="relative group">
                          <Store className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                          <input 
                            name="restaurantName" value={formData.restaurantName} onChange={handleChange}
                            placeholder="e.g. Mama's Kitchen" 
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-6 font-bold text-slate-900 outline-none focus:border-indigo-600"
                          />
                        </div>
                        <p className="text-[9px] font-bold text-slate-400 mt-1.5 ml-2 uppercase tracking-widest">Name shown to customers</p>
                      </div>
                      
                      <div>
                        <div className="relative group">
                          <Building className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                          <input 
                            name="address" value={formData.address} onChange={handleChange}
                            placeholder="e.g. Commercial Avenue, near Total" 
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-6 font-bold text-slate-900 outline-none focus:border-indigo-600"
                          />
                        </div>
                        <p className="text-[9px] font-bold text-slate-400 mt-1.5 ml-2 uppercase tracking-widest">Detailed physical location</p>
                      </div>
                    </>
                  )}

                  {role === 'RIDER' && (
                    <div>
                      <div className="relative group">
                         <Briefcase className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                         <select 
                           name="vehicleType" value={formData.vehicleType} onChange={handleChange}
                           className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-6 font-bold text-slate-900 outline-none focus:border-indigo-600 appearance-none"
                         >
                           <option value="BIKE">Motorbike (Standard)</option>
                           <option value="CAR">Car (High Capacity)</option>
                         </select>
                      </div>
                      <p className="text-[9px] font-bold text-slate-400 mt-1.5 ml-2 uppercase tracking-widest">Your primary delivery vehicle</p>
                    </div>
                  )}
               </div>
            )}

            {/* ================================================= */}
            {/* STEP 3: FINANCIALS & DOCS                         */}
            {/* ================================================= */}
            {isRegister && registerStep === 3 && (
               <div className="space-y-5 animate-in fade-in zoom-in-95">
                 
                 {/* MOMO DETAILS */}
                 <div className="p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-4">
                    <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest flex items-center gap-2 border-b border-emerald-100 pb-2">
                       <Wallet size={12} /> Payout MoMo Account
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                       <select name="momoProvider" value={formData.momoProvider} onChange={handleChange} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:border-emerald-500">
                          <option value="">Provider</option>
                          <option value="MTN">MTN Mobile Money</option>
                          <option value="ORANGE">Orange Money</option>
                       </select>
                       <input name="momoNumber" placeholder="e.g. 670000000" value={formData.momoNumber} onChange={handleChange} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:border-emerald-500" />
                    </div>
                    <div>
                      <input name="momoAccountName" placeholder="e.g. John Doe" value={formData.momoAccountName} onChange={handleChange} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:border-emerald-500" />
                      <p className="text-[9px] font-bold text-emerald-600/70 mt-1.5 ml-1 uppercase tracking-widest">Must match MoMo registered name exactly</p>
                    </div>
                 </div>

                 {/* DIRECT DOCUMENT UPLOADS */}
                 <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 border-b border-slate-200 pb-2">
                       <FileText size={12} /> Direct Uploads (PDF, JPG, PNG)
                    </p>
                    
                    <FileInput name="idCardFront" label="National ID Card (Front)" />
                    <FileInput name="idCardBack" label="National ID Card (Back)" />
                    
                    {role === 'RIDER' && (
                        <FileInput name="drivingLicense" label="Driving License" />
                    )}
                 </div>
               </div>
            )}

            {/* ERROR / SUCCESS BOX */}
            {error && (
              <div className={`p-4 border rounded-xl flex items-center gap-3 animate-in shake ${error.includes('Submitted') || error.includes('Uploaded') ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-500'}`}>
                <ShieldAlert className="flex-shrink-0" size={18} />
                <p className="text-[10px] font-black uppercase tracking-wide leading-tight">{error}</p>
              </div>
            )}

            {/* WIZARD NAVIGATION BUTTONS */}
            <div className="flex gap-3 pt-2">
              {isRegister && registerStep > 1 && (
                 <button type="button" onClick={() => setRegisterStep(prev => prev - 1)} className="w-16 bg-slate-100 text-slate-600 py-5 rounded-2xl flex items-center justify-center hover:bg-slate-200 transition-colors">
                    <ChevronLeft size={20} />
                 </button>
              )}

              {!isRegister ? (
                <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-600 active:scale-95 transition-all flex items-center justify-center gap-3">
                  {loading ? <Loader2 className="animate-spin" /> : <>Enter Portal <ChevronRight size={16} strokeWidth={3} /></>}
                </button>
              ) : (
                registerStep < 3 ? (
                  <button type="button" onClick={handleNextStep} className="flex-1 bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-600 active:scale-95 transition-all flex items-center justify-center gap-3">
                     Next Step <ChevronRight size={16} strokeWidth={3} />
                  </button>
                ) : (
                  <button type="submit" disabled={loading} className="flex-1 bg-emerald-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-500 active:scale-95 transition-all flex items-center justify-center gap-3">
                     {loading ? <Loader2 className="animate-spin" /> : <>Submit Documents <ChevronRight size={16} strokeWidth={3} /></>}
                  </button>
                )
              )}
            </div>

          </form>

          <div className="text-center pt-2">
            <p className="text-xs font-bold text-slate-400">
              {isRegister ? "Already have an account?" : "New to Zamdey?"}
              <button type="button" onClick={toggleAuthMode} className="ml-2 text-indigo-600 font-black uppercase tracking-wide hover:underline">
                {isRegister ? "Login Here" : "Register Partner"}
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* 👉 RIGHT SIDE: HERO IMAGE */}
      <div className="hidden lg:block w-1/2 h-screen relative">
        <div className="absolute inset-0 bg-slate-900/40 z-10" />
        <img 
          src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1974&auto=format&fit=crop" 
          alt="Logistics Background" 
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-20 left-20 z-20 text-white">
          <h2 className="text-5xl font-black italic tracking-tighter uppercase mb-4 drop-shadow-xl">Global <br/> Standards.</h2>
          <div className="flex items-center gap-3">
             <div className="h-1 w-12 bg-emerald-400 rounded-full" />
             <p className="text-sm font-bold uppercase tracking-[0.3em] drop-shadow-md">Zamdey Enterprise</p>
          </div>
        </div>
      </div>
    </div>
  );
}