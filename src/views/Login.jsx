import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Lock, User, Mail, ChevronRight, ChevronLeft, Loader2, Store, Bike, 
  MapPin, Phone, FileText, Briefcase, 
  Wallet, Building, UploadCloud, CheckCircle2
} from 'lucide-react';
import { API_URL, DEFAULT_ZONES, fetchSafeZones } from '../config';
import { useToast } from '../context/ToastContext';
import { 
  loginSchema, 
  partnerRegisterStep1Schema, 
  partnerRegisterStep2Schema, 
  partnerRegisterStep3Schema 
} from '../schemas';
import { FormError } from '../components/FormField';

export default function Login({ onLogin }) {
  const toast = useToast();
  const [isRegister, setIsRegister] = useState(false);
  const [registerStep, setRegisterStep] = useState(1); 
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('RESTAURANT'); 
  const [zones, setZones] = useState(DEFAULT_ZONES);

  // Files state for Step 3 uploads
  const [files, setFiles] = useState({
    idCardFront: null,
    idCardBack: null,
    drivingLicense: null,
  });
  const [fileErrors, setFileErrors] = useState({});

  // 1. React Hook Form for Login
  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onTouched',
  });

  // 2. React Hook Form for Registration
  const {
    register: registerForm,
    handleSubmit: handleRegSubmit,
    watch,
    trigger,
    reset: resetRegForm,
    formState: { errors: regErrors },
  } = useForm({
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      phone: '',
      zone: '',
      vehicleType: 'BIKE',
      restaurantName: '',
      address: '',
      momoProvider: 'MTN',
      momoNumber: '',
      momoAccountName: '',
    },
    mode: 'onTouched',
  });

  useEffect(() => {
    let isMounted = true;
    const loadZones = async () => {
      try {
        const safeZones = await fetchSafeZones();
        if (isMounted && safeZones && safeZones.length > 0) {
          setZones(safeZones);
        }
      } catch {
        if (isMounted) setZones(DEFAULT_ZONES);
      }
    };
    loadZones();
    return () => { isMounted = false; };
  }, []);

  const handleRoleChange = (newRole) => {
    if (role !== newRole) {
      setRole(newRole);
      setFiles({ idCardFront: null, idCardBack: null, drivingLicense: null });
      setFileErrors({});
    }
  };

  const toggleAuthMode = () => {
    setIsRegister(!isRegister);
    setRegisterStep(1);
    setFiles({ idCardFront: null, idCardBack: null, drivingLicense: null });
    setFileErrors({});
  };

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    const file = selectedFiles[0];
    if (file) {
      setFiles(prev => ({ ...prev, [name]: file }));
      setFileErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Step wizard validation using Zod
  const handleNextStep = async () => {
    if (registerStep === 1) {
      const isValid = await trigger(['fullName', 'email', 'password', 'phone']);
      const currentValues = {
        fullName: watch('fullName'),
        email: watch('email'),
        password: watch('password'),
        phone: watch('phone'),
      };
      const parsed = partnerRegisterStep1Schema.safeParse(currentValues);
      if (!isValid || !parsed.success) {
        toast.warning('Please resolve the highlighted fields before proceeding.', 'Incomplete Step 1');
        return;
      }
      setRegisterStep(2);
    } else if (registerStep === 2) {
      const currentValues = {
        zone: watch('zone'),
        restaurantName: role === 'RESTAURANT' ? watch('restaurantName') : undefined,
        address: role === 'RESTAURANT' ? watch('address') : undefined,
        vehicleType: role === 'RIDER' ? watch('vehicleType') : undefined,
      };
      const parsed = partnerRegisterStep2Schema.safeParse(currentValues);
      if (!parsed.success) {
        const firstError = parsed.error.issues[0]?.message || 'Please fill in all operations fields.';
        toast.warning(firstError, 'Incomplete Step 2');
        return;
      }
      setRegisterStep(3);
    }
  };

  // Execute Login
  const onExecuteLogin = async (data) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, password: data.password }),
      });

      const resData = await res.json();

      if (res.ok && resData.token) {
        localStorage.setItem('token', resData.token);
        let appRole = 'vendor';
        if (resData.role === 'ADMIN') appRole = 'admin';
        if (resData.role === 'RIDER') appRole = 'rider';
        
        toast.success(`Welcome back, ${resData.name || 'User'}!`, 'Login Successful');
        onLogin({ id: resData._id, name: resData.name, role: appRole, token: resData.token });
      } else {
        if (res.status === 403 && resData.status === 'PENDING') {
          toast.info('Your partner documents are currently under review by our operations team.', 'Account Pending');
        } else if (res.status === 403 && resData.message?.includes('suspended')) {
          toast.error('This account is currently suspended. Please contact partner support.', 'Account Suspended');
        } else {
          toast.error(resData.message || 'Invalid email or password credentials.', 'Authentication Failed');
        }
      }
    } catch {
      toast.error('Unable to reach the authentication server. Please check your network.', 'Connection Error');
    } finally {
      setLoading(false);
    }
  };

  // Execute Partner Registration
  const onExecuteRegister = async (formValues) => {
    // Validate Step 3 Zod Schema
    const step3Values = {
      momoProvider: formValues.momoProvider,
      momoNumber: formValues.momoNumber,
      momoAccountName: formValues.momoAccountName,
    };
    const parsedStep3 = partnerRegisterStep3Schema.safeParse(step3Values);
    if (!parsedStep3.success) {
      const msg = parsedStep3.error.issues[0]?.message || 'Please check your payout credentials.';
      toast.warning(msg, 'Incomplete Payout Info');
      return;
    }

    // Validate Documents
    const errors = {};
    if (!files.idCardFront) errors.idCardFront = 'National ID (Front) upload is required';
    if (!files.idCardBack) errors.idCardBack = 'National ID (Back) upload is required';
    if (role === 'RIDER' && !files.drivingLicense) errors.drivingLicense = 'Driving license upload is required for riders';

    if (Object.keys(errors).length > 0) {
      setFileErrors(errors);
      toast.warning('Please upload all required verification documents.', 'Missing Documents');
      return;
    }

    setLoading(true);
    const payload = new FormData();
    payload.append('email', formValues.email);
    payload.append('password', formValues.password);
    payload.append('role', role);
    payload.append('full_name', formValues.fullName);
    payload.append('phone', formValues.phone);
    payload.append('zone_name', formValues.zone);
    payload.append('momo_provider', formValues.momoProvider);
    payload.append('momo_number', formValues.momoNumber);
    payload.append('momo_account_name', formValues.momoAccountName);

    if (files.idCardFront) payload.append('idCardFront', files.idCardFront);
    if (files.idCardBack) payload.append('idCardBack', files.idCardBack);

    if (role === 'RIDER') {
      payload.append('vehicle_type', formValues.vehicleType);
      if (files.drivingLicense) payload.append('drivingLicense', files.drivingLicense);
    }
    
    if (role === 'RESTAURANT') {
      payload.append('restaurant_name', formValues.restaurantName);
      payload.append('address', formValues.address);
    }

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        body: payload,
      });

      const data = await res.json();

      if (res.ok) {
        setIsRegister(false);
        setRegisterStep(1);
        resetRegForm();
        setFiles({ idCardFront: null, idCardBack: null, drivingLicense: null });
        toast.success(
          'Your partner application has been submitted! An administrator will review your credentials shortly.',
          'Application Received'
        );
      } else {
        toast.error(data.message || 'Failed to submit registration. Please verify details.', 'Registration Rejected');
      }
    } catch {
      toast.error('Server is temporarily unreachable. Please try again in a few moments.', 'Network Error');
    } finally {
      setLoading(false);
    }
  };

  const FileInput = ({ name, label }) => {
    const file = files[name];
    const err = fileErrors[name];
    return (
      <div className="relative">
        <input 
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
            file 
              ? 'bg-indigo-50 border-indigo-200' 
              : err 
                ? 'bg-rose-50/50 border-rose-300' 
                : 'bg-white border-slate-200 hover:border-indigo-400 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <UploadCloud className={file ? 'text-indigo-600' : err ? 'text-rose-500' : 'text-slate-400'} size={20} />
            <div className="flex flex-col">
              <span className={`text-xs font-bold ${file ? 'text-indigo-900' : 'text-slate-700'}`}>{label}</span>
              <span className="text-[9px] text-slate-400 font-medium">{file ? file.name : 'PDF, JPG, PNG'}</span>
            </div>
          </div>
          {file && <CheckCircle2 className="text-indigo-500" size={18} />}
        </label>
        <FormError message={err} />
      </div>
    );
  };

  return (
    <div className="min-h-screen flex bg-white font-sans overflow-y-auto">
      
      {/* 👈 LEFT SIDE: FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 lg:p-12 relative z-10 my-auto">
        <div className="w-full max-w-md space-y-6 py-6">
          
          <div className="mb-6">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 italic tracking-tighter uppercase mb-2">
              {isRegister ? 'Partner Sign Up' : 'Portal Login'}
            </h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
              {isRegister 
                ? `Step ${registerStep} of 3: ${registerStep === 1 ? 'Identity' : registerStep === 2 ? 'Operations' : 'Payouts & Docs'}` 
                : 'Secure Admin, Vendor & Rider Access'}
            </p>
            {isRegister && (
              <div className="w-full h-1.5 bg-slate-100 rounded-full mt-4 overflow-hidden flex">
                <div className={`h-full bg-indigo-600 transition-all duration-500 ${registerStep === 1 ? 'w-1/3' : registerStep === 2 ? 'w-2/3' : 'w-full'}`} />
              </div>
            )}
          </div>

          {/* 🔑 LOGIN FORM (React Hook Form + Zod) */}
          {!isRegister ? (
            <form onSubmit={handleLoginSubmit(onExecuteLogin)} className="space-y-4">
              <div>
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="email" 
                    placeholder="Email Address" 
                    {...registerLogin('email')}
                    className={`w-full bg-slate-50 border-2 rounded-2xl py-4 pl-12 pr-6 font-bold text-slate-900 outline-none transition-all ${
                      loginErrors.email ? 'border-rose-400 bg-rose-50/20' : 'border-slate-100 focus:border-indigo-600'
                    }`}
                  />
                </div>
                <FormError message={loginErrors.email?.message} />
              </div>

              <div>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="password" 
                    placeholder="Secure Password" 
                    {...registerLogin('password')}
                    className={`w-full bg-slate-50 border-2 rounded-2xl py-4 pl-12 pr-6 font-bold text-slate-900 outline-none transition-all ${
                      loginErrors.password ? 'border-rose-400 bg-rose-50/20' : 'border-slate-100 focus:border-indigo-600'
                    }`}
                  />
                </div>
                <FormError message={loginErrors.password?.message} />
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-600 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-60 cursor-pointer"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <>Enter Portal <ChevronRight size={16} strokeWidth={3} /></>}
              </button>
            </form>
          ) : (
            /* 📝 PARTNER REGISTRATION FORM (React Hook Form + Zod) */
            <form onSubmit={handleRegSubmit(onExecuteRegister)} className="space-y-4">
              
              {/* STEP 1: IDENTITY & ROLE */}
              {registerStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 mb-2">
                    <button 
                      type="button" 
                      onClick={() => handleRoleChange('RESTAURANT')} 
                      className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                        role === 'RESTAURANT' 
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm' 
                          : 'border-slate-100 bg-slate-50 text-slate-400 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <Store size={24} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Vendor Partner</span>
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handleRoleChange('RIDER')} 
                      className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                        role === 'RIDER' 
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-sm' 
                          : 'border-slate-100 bg-slate-50 text-slate-400 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <Bike size={24} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Rider Fleet</span>
                    </button>
                  </div>

                  <div>
                    <div className="relative group">
                      <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        placeholder="Legal Full Name" 
                        {...registerForm('fullName')}
                        className={`w-full bg-slate-50 border-2 rounded-2xl py-4 pl-12 pr-6 font-bold text-slate-900 outline-none transition-all ${
                          regErrors.fullName ? 'border-rose-400 bg-rose-50/20' : 'border-slate-100 focus:border-indigo-600'
                        }`}
                      />
                    </div>
                    <FormError message={regErrors.fullName?.message} />
                  </div>

                  <div>
                    <div className="relative group">
                      <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="email" 
                        placeholder="Email Address" 
                        {...registerForm('email')}
                        className={`w-full bg-slate-50 border-2 rounded-2xl py-4 pl-12 pr-6 font-bold text-slate-900 outline-none transition-all ${
                          regErrors.email ? 'border-rose-400 bg-rose-50/20' : 'border-slate-100 focus:border-indigo-600'
                        }`}
                      />
                    </div>
                    <FormError message={regErrors.email?.message} />
                  </div>

                  <div>
                    <div className="relative group">
                      <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="password" 
                        placeholder="Secure Password (min 6 chars)" 
                        {...registerForm('password')}
                        className={`w-full bg-slate-50 border-2 rounded-2xl py-4 pl-12 pr-6 font-bold text-slate-900 outline-none transition-all ${
                          regErrors.password ? 'border-rose-400 bg-rose-50/20' : 'border-slate-100 focus:border-indigo-600'
                        }`}
                      />
                    </div>
                    <FormError message={regErrors.password?.message} />
                  </div>

                  <div>
                    <div className="relative group">
                      <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="tel" 
                        placeholder="e.g. 670 123 456" 
                        {...registerForm('phone')}
                        className={`w-full bg-slate-50 border-2 rounded-2xl py-4 pl-12 pr-6 font-bold text-slate-900 outline-none transition-all ${
                          regErrors.phone ? 'border-rose-400 bg-rose-50/20' : 'border-slate-100 focus:border-indigo-600'
                        }`}
                      />
                    </div>
                    <FormError message={regErrors.phone?.message} />
                  </div>
                </div>
              )}

              {/* STEP 2: OPERATIONS */}
              {registerStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <div className="relative group">
                      <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <select 
                        {...registerForm('zone')}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-6 font-bold text-slate-900 outline-none focus:border-indigo-600 appearance-none cursor-pointer"
                      >
                        <option value="">Select Primary Operating Zone</option>
                        {zones.map(z => <option key={z.id} value={z.name}>{z.name}</option>)}
                      </select>
                    </div>
                    <FormError message={regErrors.zone?.message} />
                  </div>

                  {role === 'RESTAURANT' && (
                    <>
                      <div>
                        <div className="relative group">
                          <Store className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input 
                            placeholder="Restaurant Trade Name (e.g. Mama's Kitchen)" 
                            {...registerForm('restaurantName')}
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-6 font-bold text-slate-900 outline-none focus:border-indigo-600"
                          />
                        </div>
                        <FormError message={regErrors.restaurantName?.message} />
                      </div>
                      
                      <div>
                        <div className="relative group">
                          <Building className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input 
                            placeholder="Detailed Street Address (e.g. Commercial Ave, near Total)" 
                            {...registerForm('address')}
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-6 font-bold text-slate-900 outline-none focus:border-indigo-600"
                          />
                        </div>
                        <FormError message={regErrors.address?.message} />
                      </div>
                    </>
                  )}

                  {role === 'RIDER' && (
                    <div>
                      <div className="relative group">
                        <Briefcase className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <select 
                          {...registerForm('vehicleType')}
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-6 font-bold text-slate-900 outline-none focus:border-indigo-600 appearance-none cursor-pointer"
                        >
                          <option value="BIKE">Motorbike (Express Fleet)</option>
                          <option value="CAR">Car / Van (High Capacity)</option>
                        </select>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 mt-1.5 ml-2 uppercase tracking-widest">
                        Designated delivery vehicle
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: FINANCIALS & DOCS */}
              {registerStep === 3 && (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-3">
                    <p className="text-[10px] font-black uppercase text-emerald-700 tracking-widest flex items-center gap-2 border-b border-emerald-100 pb-2">
                      <Wallet size={13} /> MoMo Payout Account
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <select 
                        {...registerForm('momoProvider')} 
                        className="w-full bg-white border border-slate-200 rounded-xl py-3 px-3 text-xs font-bold outline-none focus:border-emerald-500"
                      >
                        <option value="MTN">MTN MoMo</option>
                        <option value="ORANGE">Orange Money</option>
                      </select>
                      <input 
                        placeholder="670 000 000" 
                        {...registerForm('momoNumber')} 
                        className="w-full bg-white border border-slate-200 rounded-xl py-3 px-3 text-xs font-bold outline-none focus:border-emerald-500" 
                      />
                    </div>
                    <FormError message={regErrors.momoNumber?.message} />

                    <div>
                      <input 
                        placeholder="Account Subscriber Name (e.g. John Doe)" 
                        {...registerForm('momoAccountName')} 
                        className="w-full bg-white border border-slate-200 rounded-xl py-3 px-3 text-xs font-bold outline-none focus:border-emerald-500" 
                      />
                      <FormError message={regErrors.momoAccountName?.message} />
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 border-b border-slate-200 pb-2">
                      <FileText size={13} /> Identity Documents
                    </p>
                    
                    <FileInput name="idCardFront" label="National ID Card (Front)" />
                    <FileInput name="idCardBack" label="National ID Card (Back)" />
                    
                    {role === 'RIDER' && (
                      <FileInput name="drivingLicense" label="Valid Driving License" />
                    )}
                  </div>
                </div>
              )}

              {/* WIZARD NAVIGATION BUTTONS */}
              <div className="flex gap-3 pt-2">
                {registerStep > 1 && (
                  <button 
                    type="button" 
                    onClick={() => setRegisterStep(prev => prev - 1)} 
                    className="w-16 bg-slate-100 text-slate-600 py-4 rounded-2xl flex items-center justify-center hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    <ChevronLeft size={20} />
                  </button>
                )}

                {registerStep < 3 ? (
                  <button 
                    type="button" 
                    onClick={handleNextStep} 
                    className="flex-1 bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-600 active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer"
                  >
                    Continue <ChevronRight size={16} strokeWidth={3} />
                  </button>
                ) : (
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="flex-1 bg-emerald-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-500 active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60"
                  >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <>Submit Application <ChevronRight size={16} strokeWidth={3} /></>}
                  </button>
                )}
              </div>

            </form>
          )}

          <div className="text-center pt-2">
            <p className="text-xs font-bold text-slate-400">
              {isRegister ? "Already registered?" : "New delivery partner?"}
              <button 
                type="button" 
                onClick={toggleAuthMode} 
                className="ml-2 text-indigo-600 font-black uppercase tracking-wide hover:underline cursor-pointer"
              >
                {isRegister ? "Login to Portal" : "Apply as Partner"}
              </button>
            </p>
          </div>

          {/* Quick Demo Access Buttons */}
          {!isRegister && (
            <div className="pt-4 border-t border-slate-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center mb-2.5">
                Quick Demo Access (RBAC Preview)
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    toast.success('Logged in as Platform Superadmin', 'Demo Mode');
                    onLogin({ id: 'demo-admin-1', full_name: 'Super Administrator', role: 'admin' }, 'demo-admin-token');
                  }}
                  className="py-2.5 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all border border-indigo-200/60 shadow-sm active:scale-95 text-center cursor-pointer"
                >
                  👑 Admin
                </button>
                <button
                  type="button"
                  onClick={() => {
                    toast.success('Logged in as Restaurant Vendor', 'Demo Mode');
                    onLogin({ id: 'demo-vendor-1', full_name: 'Chez Wou Restaurant', role: 'vendor' }, 'demo-vendor-token');
                  }}
                  className="py-2.5 px-2 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all border border-amber-200/60 shadow-sm active:scale-95 text-center cursor-pointer"
                >
                  🍳 Vendor
                </button>
                <button
                  type="button"
                  onClick={() => {
                    toast.success('Logged in as Fleet Rider', 'Demo Mode');
                    onLogin({ id: 'demo-rider-1', full_name: 'Samuel Eto’o', role: 'rider' }, 'demo-rider-token');
                  }}
                  className="py-2.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all border border-emerald-200/60 shadow-sm active:scale-95 text-center cursor-pointer"
                >
                  🏍️ Rider
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 👉 RIGHT SIDE: HERO IMAGE */}
      <div className="hidden lg:block w-1/2 h-screen relative sticky top-0">
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
             <p className="text-sm font-bold uppercase tracking-[0.3em] drop-shadow-md">Zamdey Enterprise Operations</p>
          </div>
        </div>
      </div>
    </div>
  );
}