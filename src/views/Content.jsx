import React, { useState, useEffect } from 'react';
import { LayoutGrid, Image as ImageIcon, Plus, Trash2, Loader2, Store, Megaphone, X, AlertCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://zamdey-backend.onrender.com/api:5000/api';
// Helper to fix local image paths
const formatImageUrl = (url) => {
    if (!url) return 'https://placehold.co/600x400';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `${API_URL.replace('/api', '')}/${url.replace(/\\/g, '/').replace(/^\/+/, '')}`;
};

export default function ContentManager() {
  const [activeTab, setActiveTab] = useState('promotions'); // 'promotions' or 'categories'
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [promotions, setPromotions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [restaurants, setRestaurants] = useState([]);

  // Modals & Error States
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState(''); // 🚨 NEW: For clean error feedback

  // Forms
  const [promoForm, setPromoForm] = useState({ title: '', subtitle: '', color: '#00B14F', restaurant_id: '', image: null });
  const [catForm, setCatForm] = useState({ name: '', icon: 'silverware-fork-knife', color: '#E0F2F1', icon_color: '#00695C', sort_order: 0 });
  const [previewImage, setPreviewImage] = useState(null);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [promoRes, catRes, restRes] = await Promise.all([
          fetch(`${API_URL}/content/promotions`, { headers }),
          fetch(`${API_URL}/content/categories`, { headers }),
          fetch(`${API_URL}/admin/restaurants`, { headers })
      ]);

      if (promoRes.ok) setPromotions((await promoRes.json()).promotions);
      if (catRes.ok) setCategories((await catRes.json()).categories);
      if (restRes.ok) setRestaurants(await restRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // 🚨 CLEAN RESET HANDLERS
  const closePromoModal = () => {
      setIsPromoModalOpen(false);
      setPromoForm({ title: '', subtitle: '', color: '#00B14F', restaurant_id: '', image: null });
      setPreviewImage(null);
      setErrorMessage('');
  };

  const closeCatModal = () => {
      setIsCatModalOpen(false);
      setCatForm({ name: '', icon: 'silverware-fork-knife', color: '#E0F2F1', icon_color: '#00695C', sort_order: 0 });
      setErrorMessage('');
  };

  // --- HANDLERS ---
  const handleImageChange = (e) => {
      setErrorMessage(''); // Clear previous errors
      const file = e.target.files[0];
      
      if (file) {
          // 🛡️ STRICT VALIDATION: Ensure it's an image
          if (!file.type.startsWith('image/')) {
              setErrorMessage('Invalid file type! Please upload an image (PNG, JPG, or WEBP).');
              e.target.value = null; // Clear the input
              setPromoForm({ ...promoForm, image: null });
              setPreviewImage(null);
              return;
          }

          // 🛡️ STRICT VALIDATION: Size limit (e.g., 5MB)
          if (file.size > 5 * 1024 * 1024) {
              setErrorMessage('File is too large! Please ensure your image is under 5MB.');
              e.target.value = null; // Clear the input
              setPromoForm({ ...promoForm, image: null });
              setPreviewImage(null);
              return;
          }

          setPromoForm({ ...promoForm, image: file });
          setPreviewImage(URL.createObjectURL(file));
      }
  };

  const handleCreatePromo = async (e) => {
      e.preventDefault();
      setErrorMessage('');
      
      if (!promoForm.image) {
          setErrorMessage('Please select a valid image banner to upload.');
          return;
      }

      setIsSubmitting(true);
      const token = localStorage.getItem('token');

      const formData = new FormData();
      formData.append('title', promoForm.title);
      formData.append('subtitle', promoForm.subtitle);
      formData.append('color', promoForm.color);
      if (promoForm.restaurant_id) formData.append('restaurant_id', promoForm.restaurant_id);
      formData.append('image', promoForm.image);

      try {
          const res = await fetch(`${API_URL}/content/promotions`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` },
              body: formData
          });
          
          if (res.ok) {
              closePromoModal();
              fetchData();
          } else {
              const errData = await res.json().catch(() => ({}));
              setErrorMessage(errData.message || "Failed to create promotion. Check your file format and try again.");
          }
      } catch (error) { 
          setErrorMessage("Network error uploading banner. Please check your connection."); 
      } finally {
          setIsSubmitting(false);
      }
  };

  const handleCreateCategory = async (e) => {
      e.preventDefault();
      setErrorMessage('');
      setIsSubmitting(true);
      const token = localStorage.getItem('token');

      try {
          const res = await fetch(`${API_URL}/content/categories`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify(catForm)
          });
          if (res.ok) {
              closeCatModal();
              fetchData();
          } else {
              const data = await res.json();
              setErrorMessage(data.message || "Failed to create category");
          }
      } catch (error) { 
          setErrorMessage("Network error creating category. Please check your connection."); 
      } finally {
          setIsSubmitting(false);
      }
  };

  const handleDelete = async (type, id) => {
      if(!window.confirm("Are you sure you want to delete this?")) return;
      const token = localStorage.getItem('token');
      try {
          await fetch(`${API_URL}/content/${type}/${id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
          });
          fetchData();
      } catch (e) { alert("Delete failed"); }
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={40} /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-7xl mx-auto font-sans">
      
      {/* 👑 HEADER */}
      <div className="flex justify-between items-end border-b-2 border-slate-900 pb-6">
        <div>
           <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">Content Command</h1>
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Manage App Home Screen Banners & Categories</p>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <button 
                onClick={() => setActiveTab('promotions')} 
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${activeTab === 'promotions' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
                <Megaphone size={14} /> Banners
            </button>
            <button 
                onClick={() => setActiveTab('categories')} 
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${activeTab === 'categories' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
                <LayoutGrid size={14} /> Categories
            </button>
        </div>
      </div>

      {/* 🖼️ PROMOTIONS TAB */}
      {activeTab === 'promotions' && (
          <div>
              <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black text-slate-900 uppercase italic">Active Promos</h3>
                  <button onClick={() => setIsPromoModalOpen(true)} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20">
                      <Plus size={16} /> Add Banner
                  </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {promotions.length === 0 && <p className="text-sm text-slate-400 font-bold">No banners added yet.</p>}
                  {promotions.map(promo => (
                      <div key={promo.id} className="relative rounded-[24px] overflow-hidden shadow-xl" style={{ backgroundColor: promo.color }}>
                          <div className="p-8 flex justify-between items-center h-40">
                              <div className="flex-1 pr-4 z-10">
                                  <span className="bg-white/20 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest mb-3 inline-block">PROMO</span>
                                  <h4 className="text-2xl font-black text-white leading-tight">{promo.title}</h4>
                                  <p className="text-sm text-white/80 font-medium mt-1">{promo.subtitle}</p>
                                  {promo.restaurant && <p className="text-[10px] font-black uppercase text-white/60 mt-3 flex items-center gap-1"><Store size={12}/> {promo.restaurant.restaurant_name}</p>}
                              </div>
                              <img src={formatImageUrl(promo.image_url)} alt="Promo" className="w-24 h-24 object-contain z-10 drop-shadow-2xl" />
                          </div>
                          <button onClick={() => handleDelete('promotions', promo.id)} className="absolute top-4 right-4 w-8 h-8 bg-black/20 hover:bg-rose-500 rounded-full flex items-center justify-center text-white transition-colors z-20">
                              <Trash2 size={14} />
                          </button>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* 🗂️ CATEGORIES TAB */}
      {activeTab === 'categories' && (
          <div>
              <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black text-slate-900 uppercase italic">Food Categories</h3>
                  <button onClick={() => setIsCatModalOpen(true)} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20">
                      <Plus size={16} /> Add Category
                  </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {categories.map(cat => (
                      <div key={cat.id} className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex flex-col items-center relative group hover:shadow-md transition-all">
                          <button onClick={() => handleDelete('categories', cat.id)} className="absolute top-3 right-3 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Trash2 size={16} />
                          </button>
                          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-inner" style={{ backgroundColor: cat.color }}>
                              <LayoutGrid size={28} style={{ color: cat.icon_color }} />
                          </div>
                          <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide">{cat.name}</h4>
                          <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Icon: {cat.icon}</p>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* 🚀 ADD PROMO MODAL */}
      {isPromoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95">
                <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-xl font-black uppercase italic text-slate-900">Create Banner</h3>
                    <button onClick={closePromoModal} className="w-8 h-8 flex items-center justify-center bg-slate-200 text-slate-500 hover:bg-rose-100 hover:text-rose-500 rounded-full transition-colors"><X size={16} /></button>
                </div>

                {errorMessage && (
                    <div className="mx-6 mt-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
                        <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={18} />
                        <p className="text-xs font-bold text-rose-700">{errorMessage}</p>
                    </div>
                )}

                <form onSubmit={handleCreatePromo} className="p-6 space-y-4">
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Headline</label>
                        <input type="text" required value={promoForm.title} onChange={e => setPromoForm({...promoForm, title: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-indigo-500 mt-1" placeholder="e.g. Free Delivery Weekend" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Subtitle</label>
                        <input type="text" value={promoForm.subtitle} onChange={e => setPromoForm({...promoForm, subtitle: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-indigo-500 mt-1" placeholder="e.g. On all local dishes" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Background Color</label>
                            <input type="color" value={promoForm.color} onChange={e => setPromoForm({...promoForm, color: e.target.value})} className="w-full h-12 rounded-xl cursor-pointer mt-1 border-0 p-0" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Link to Vendor (Optional)</label>
                            <select value={promoForm.restaurant_id} onChange={e => setPromoForm({...promoForm, restaurant_id: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-indigo-500 mt-1">
                                <option value="">None (Static Banner)</option>
                                {restaurants.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Floating Image (PNG/JPG/WEBP)</label>
                        {!previewImage ? (
                            <input type="file" accept="image/*" required onChange={handleImageChange} className="w-full text-xs border border-slate-200 p-3 rounded-xl bg-slate-50" />
                        ) : (
                            <div className="relative inline-block">
                                <img src={previewImage} alt="Preview" className="w-24 h-24 object-contain bg-slate-100 rounded-xl p-2 border-2 border-dashed border-slate-200" />
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        setPreviewImage(null);
                                        setPromoForm({ ...promoForm, image: null });
                                    }} 
                                    className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1.5 shadow-md hover:bg-rose-600 transition-colors"
                                    title="Remove Image"
                                >
                                    <X size={14} strokeWidth={3} />
                                </button>
                            </div>
                        )}
                    </div>
                    <button type="submit" disabled={isSubmitting} className="w-full py-4 mt-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : "Publish Banner"}
                    </button>
                </form>
            </div>
        </div>
      )}

      {/* 🚀 ADD CATEGORY MODAL */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95">
                <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-xl font-black uppercase italic text-slate-900">Add Category</h3>
                    <button onClick={closeCatModal} className="w-8 h-8 flex items-center justify-center bg-slate-200 text-slate-500 hover:bg-rose-100 hover:text-rose-500 rounded-full transition-colors"><X size={16} /></button>
                </div>

                {errorMessage && (
                    <div className="mx-6 mt-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
                        <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={18} />
                        <p className="text-xs font-bold text-rose-700">{errorMessage}</p>
                    </div>
                )}

                <form onSubmit={handleCreateCategory} className="p-6 space-y-4">
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Name</label>
                        <input type="text" required value={catForm.name} onChange={e => setCatForm({...catForm, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 mt-1" placeholder="e.g. Burgers" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Icon Name (MaterialCommunityIcons)</label>
                        <input type="text" required value={catForm.icon} onChange={e => setCatForm({...catForm, icon: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 mt-1" placeholder="e.g. hamburger" />
                        <a href="https://icons.expo.fyi/Index" target="_blank" rel="noreferrer" className="text-[9px] text-indigo-500 font-bold mt-1 inline-block hover:underline">Find icon names here</a>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Bubble Color</label>
                            <input type="color" value={catForm.color} onChange={e => setCatForm({...catForm, color: e.target.value})} className="w-full h-12 rounded-xl cursor-pointer mt-1 border-0 p-0" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Icon Color</label>
                            <input type="color" value={catForm.icon_color} onChange={e => setCatForm({...catForm, icon_color: e.target.value})} className="w-full h-12 rounded-xl cursor-pointer mt-1 border-0 p-0" />
                        </div>
                    </div>
                    <button type="submit" disabled={isSubmitting} className="w-full py-4 mt-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : "Save Category"}
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}