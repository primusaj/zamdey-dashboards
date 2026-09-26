import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Search, Edit3, Trash2, X, Save, 
  UploadCloud, HelpCircle, PackageOpen, ChevronRight, 
  Flame, Sparkles, Loader2, Star, Tag
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Inventory() { 
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // UI States
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [activeItem, setActiveItem] = useState(null); // Null = Create Mode
  const [previewImage, setPreviewImage] = useState(null);
  const [isPopular, setIsPopular] = useState(false); // 🆕 NEW: Featured Toggle
  const fileInputRef = useRef(null);

  // 🚀 HELPER: Fixes broken image paths by attaching the backend URL
  const getFullImageUrl = (path) => {
    if (!path) return "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500";
    if (path.startsWith('uploads/') || path.startsWith('uploads\\')) {
      return `${API_URL.replace('/api', '')}/${path.replace(/\\/g, '/')}`;
    }
    return path;
  };

  // 🔄 1. SYNC: Fetch Vendor's Own Menu
  const fetchMenu = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_URL}/restaurant/menu`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setMenu(data);
      }
    } catch (error) {
      console.error("Network Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMenu(); }, []);

  // 🖼️ HANDLE IMAGE PREVIEW (Compressed to 600px for Speed)
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          const MAX_SIZE = 600; 
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          setPreviewImage(canvas.toDataURL('image/jpeg', 0.6)); 
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  // ⚡ SAVE WITH OPTIMISTIC UI
  const handleSave = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const formData = new FormData(e.target);
    
    // 1. Prepare Data
    const rawTags = formData.get('tags');
    const tagsArray = rawTags ? rawTags.split(',').map(t => t.trim()).filter(Boolean) : [];

    const payload = {
      name: formData.get('name'),
      price: parseFloat(formData.get('price')),
      promo_price: formData.get('promo_price') ? parseFloat(formData.get('promo_price')) : null, 
      description: formData.get('description'),
      category: formData.get('category'),
      tags: tagsArray, 
      is_popular: isPopular, 
      image_url: previewImage || activeItem?.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500", 
      is_available: activeItem ? activeItem.is_available : true,
    };

    // 2. ⚡ OPTIMISTIC UPDATE
    const tempId = Date.now().toString(); 
    const optimisticItem = {
        id: tempId,
        ...payload,
        price: parseFloat(payload.price)
    };

    if (!activeItem) {
        setMenu([optimisticItem, ...menu]);
    }
    
    closePanel(); 

    // 3. BACKGROUND UPLOAD
    try {
      let response;
      if (activeItem?.id) {
        response = await fetch(`${API_URL}/restaurant/menu/${activeItem.id}`, {
          method: 'PUT',
          headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify(payload)
        });
      } else {
        response = await fetch(`${API_URL}/restaurant/menu`, {
          method: 'POST',
          headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify(payload)
        });
      }

      if (!response.ok) throw new Error("Server rejected item");
      
      const realItem = await response.json();

      // 4. SWAP temp/active with real item
      setMenu(currentMenu => currentMenu.map(item => 
          (item.id === tempId || item.id === activeItem?.id) ? realItem : item
      ));

    } catch (error) {
      console.error("Save error:", error);
      alert("Save failed! Please check your connection.");
      if (!activeItem) {
         setMenu(currentMenu => currentMenu.filter(item => item.id !== tempId));
      } else {
         fetchMenu(); // Re-sync if update fails to restore original state
      }
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    
    const previousMenu = [...menu];
    setMenu(menu.filter(i => i.id !== id));

    try {
        const token = localStorage.getItem('token');
        await fetch(`${API_URL}/restaurant/menu/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
    } catch (error) {
        alert("Delete failed");
        setMenu(previousMenu); 
    }
  };

  const toggleItemStatus = async (item) => {
    const updatedMenu = menu.map(i => i.id === item.id ? {...i, is_available: !i.is_available} : i);
    setMenu(updatedMenu);

    try {
        const token = localStorage.getItem('token');
        await fetch(`${API_URL}/restaurant/menu/${item.id}/status`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
        });
    } catch (error) {
        fetchMenu(); 
    }
  };

  const closePanel = () => { 
    setIsPanelOpen(false); 
    setActiveItem(null); 
    setPreviewImage(null); 
    setIsPopular(false); // Reset toggle
  };

  // Populate form when editing an item
  useEffect(() => {
      if (activeItem) {
          setIsPopular(activeItem.is_popular || false);
      }
  }, [activeItem]);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-[#FDFCFB] rounded-[40px] border-2 border-slate-900 overflow-hidden font-sans shadow-xl">
      
      {/* 🚀 HEADER */}
      <div className="p-8 border-b-2 border-slate-900 flex items-center justify-between bg-white relative">
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter flex items-center gap-3">
            <Flame className="text-orange-500 animate-pulse" fill="currentColor" /> Meal Listing
          </h1>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1 ml-1">Live Database Connection Active</p>
        </div>
        
        <button 
          onClick={() => { setActiveItem(null); setIsPanelOpen(true); }}
          className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-900 transition-all duration-300 shadow-lg shadow-indigo-200 flex items-center gap-2"
        >
          <Plus size={18} strokeWidth={3} /> Add New Meal
        </button>
      </div>

      {/* 📋 LIST VIEW */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
              <Loader2 className="animate-spin text-slate-900" size={48} />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Inventory...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menu.map((item) => (
              <div 
                key={item.id} 
                className="group bg-white border border-slate-900 rounded-[32px] overflow-hidden hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 shadow-sm relative"
              >
                {/* Popular Badge */}
                {item.is_popular && (
                  <div className="absolute top-4 left-4 z-10 bg-orange-500 text-white px-3 py-1.5 rounded-xl border border-slate-900 flex items-center gap-1 shadow-md">
                    <Star size={12} fill="currentColor" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Featured</span>
                  </div>
                )}

                <div className="h-48 relative overflow-hidden">
                  {/* 🚀 FIXED: Using getFullImageUrl to build the correct path */}
                  <img src={getFullImageUrl(item.image_url)} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
                  
                  {/* Status Toggle Button */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleItemStatus(item); }}
                    className={`absolute top-4 right-4 px-3 py-1.5 rounded-xl border border-slate-900 flex items-center gap-2 cursor-pointer hover:scale-105 transition-transform z-10 ${item.is_available ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}
                  >
                    <div className={`w-2 h-2 rounded-full bg-white`} />
                    <span className="text-[9px] font-black uppercase tracking-widest">{item.is_available ? 'In Stock' : 'Out of Stock'}</span>
                  </button>
                </div>
                
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-black text-slate-900 uppercase italic truncate w-40">{item.name}</h3>
                    <div className="text-right">
                        {item.promo_price ? (
                           <>
                             <span className="text-slate-400 font-bold text-xs line-through block">{Number(item.price).toLocaleString()} XAF</span>
                             <span className="text-rose-600 font-black text-sm">{Number(item.promo_price).toLocaleString()} XAF</span>
                           </>
                        ) : (
                           <span className="text-indigo-600 font-black text-sm">{Number(item.price).toLocaleString()} XAF</span>
                        )}
                    </div>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">{item.category}</p>
                  
                  <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                    <button 
                        onClick={() => { setActiveItem(item); setPreviewImage(item.image_url); setIsPanelOpen(true); }}
                        className="text-[9px] font-black text-slate-300 uppercase hover:text-indigo-600 flex items-center gap-1"
                    >
                        View Details <ChevronRight size={14}/>
                    </button>
                    <button onClick={() => handleDelete(item.id, item.name)} className="text-slate-300 hover:text-rose-600 transition-colors">
                        <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {menu.length === 0 && (
                <div className="col-span-full py-20 text-center opacity-50">
                    <PackageOpen className="mx-auto mb-4 text-slate-300" size={48} />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No items in menu</p>
                </div>
            )}
          </div>
        )}
      </div>

      {/* 🛠️ SLIDE-OVER PANEL */}
      {isPanelOpen && (
        <>
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[99] animate-in fade-in" onClick={closePanel} />
          <div className="fixed top-4 right-4 bottom-4 w-[500px] bg-white z-[100] rounded-[40px] border-2 border-slate-900 flex flex-col animate-in slide-in-from-right duration-500 shadow-2xl">
            <form onSubmit={handleSave} className="h-full flex flex-col">
              
              <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-2xl font-black text-slate-900 uppercase italic flex items-center gap-2">
                  <Sparkles className="text-indigo-600" size={24} /> Meal Master
                </h2>
                <button type="button" onClick={closePanel} className="p-2 hover:bg-slate-50 rounded-full transition-colors"><X size={24}/></button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
                
                {/* IMAGE UPLOAD ZONE */}
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-900 uppercase tracking-widest ml-1">Product Visuals</label>
                  <div 
                    onClick={() => fileInputRef.current.click()}
                    className="w-full h-56 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[32px] flex flex-col items-center justify-center relative overflow-hidden cursor-pointer hover:border-indigo-600 group transition-all"
                  >
                    {/* 🚀 FIXED: Applying getFullImageUrl for editing existing items without a new preview */}
                    {previewImage || activeItem?.image_url ? (
                      <img src={previewImage || getFullImageUrl(activeItem?.image_url)} className="w-full h-full object-cover" alt="Preview" />
                    ) : (
                      <div className="text-center group-hover:scale-105 transition-transform">
                        <UploadCloud className="mx-auto text-slate-300 mb-2" size={32}/>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tap to Upload </p>
                      </div>
                    )}
                    <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Meal Name </label>
                    <input name="name" required defaultValue={activeItem?.name} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 font-black text-slate-900 outline-none focus:border-slate-900" />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Meal Description </label>
                    <textarea 
                      name="description" required defaultValue={activeItem?.description} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 font-bold text-slate-700 outline-none h-32 focus:border-slate-900 resize-none" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Base Price (XAF) </label>
                      <input name="price" type="number" required defaultValue={activeItem?.price} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 font-black text-slate-900 outline-none" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1 text-rose-500">Promo Price (Opt) </label>
                      <input name="promo_price" type="number" defaultValue={activeItem?.promo_price} className="w-full bg-rose-50/50 border border-rose-200 rounded-2xl py-4 px-6 font-black text-rose-600 outline-none placeholder:text-rose-300" placeholder="e.g. 1500" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Category </label>
                        <input name="category" required defaultValue={activeItem?.category || "Main Dish"} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 font-black text-slate-900 outline-none" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Dietary Tags </label>
                        <div className="relative">
                            <Tag size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input name="tags" defaultValue={activeItem?.tags?.join(', ')} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-10 pr-6 font-bold text-slate-700 outline-none text-sm placeholder:font-medium placeholder:text-slate-300" placeholder="Vegan, Spicy..." />
                        </div>
                      </div>
                  </div>

                  {/* FEATURED TOGGLE */}
                  <div 
                      onClick={() => setIsPopular(!isPopular)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${isPopular ? 'border-orange-500 bg-orange-50' : 'border-slate-200 bg-white'}`}
                  >
                      <div>
                          <p className={`text-xs font-black uppercase tracking-widest ${isPopular ? 'text-orange-600' : 'text-slate-500'}`}>Chef's Choice / Featured</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-1">Highlight this item on your menu</p>
                      </div>
                      <div className={`w-12 h-6 rounded-full relative transition-colors ${isPopular ? 'bg-orange-500' : 'bg-slate-200'}`}>
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isPopular ? 'left-7' : 'left-1'}`} />
                      </div>
                  </div>

                </div>
              </div>

              <div className="p-10 bg-slate-50/50 border-t border-slate-100">
                <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3">
                  <Save size={18}/> {activeItem ? 'Update Listing' : 'Sync New Meal'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}