import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Plus, Edit3, Trash2, X, Save, 
  UploadCloud, PackageOpen, ChevronRight, 
  Flame, Sparkles, Loader2, Star, Tag, DollarSign
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { menuItemSchema } from '../../schemas';
import { FormError, FormLabel } from '../../components/FormField';

const API_URL = import.meta.env.VITE_API_URL || 'https://zamdey-backend.onrender.com/api';

const DEFAULT_ITEMS = [
  {
    id: 'demo-item-1',
    name: 'Ndole Royal & Plantains',
    price: 3500,
    promo_price: 3000,
    category: 'Traditional Grills',
    description: 'Fresh bitterleaf cooked with peanut paste, beef, smoked fish and crayfish, served with ripe fried plantains.',
    tags: ['Traditional', 'Chef Special', 'Spicy'],
    is_popular: true,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500',
  },
  {
    id: 'demo-item-2',
    name: 'Poulet DG Special',
    price: 4500,
    promo_price: null,
    category: 'Poultry',
    description: 'Directeur General chicken sautéed with carrots, bell peppers, green beans, onions and sweet fried plantains.',
    tags: ['Signature', 'Popular'],
    is_popular: true,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=500',
  },
  {
    id: 'demo-item-3',
    name: 'Grilled Braai Fish (Bar)',
    price: 5000,
    promo_price: 4500,
    category: 'Seafood',
    description: 'Whole charcoal grilled fish seasoned with Cameroon spices, served with miondo and pepper sauce.',
    tags: ['Grill', 'Seafood'],
    is_popular: false,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=500',
  },
];

export default function Inventory() { 
  const toast = useToast();
  const [menu, setMenu] = useState(DEFAULT_ITEMS);
  const [loading, setLoading] = useState(true);
  
  // UI States
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [activeItem, setActiveItem] = useState(null); // Null = Create Mode
  const [previewImage, setPreviewImage] = useState(null);
  const [isPopular, setIsPopular] = useState(false);
  const fileInputRef = useRef(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name: '',
      price: 2500,
      category: 'Main Dish',
      description: '',
      image: '',
      is_available: true,
    },
    mode: 'onTouched',
  });

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
        if (Array.isArray(data) && data.length > 0) {
          setMenu(data);
        }
      }
    } catch {
      // Keep defaults
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchMenu(); 
  }, []);

  const openForCreate = () => {
    setActiveItem(null);
    setPreviewImage(null);
    setIsPopular(false);
    reset({
      name: '',
      price: 2500,
      category: 'Main Dish',
      description: '',
      image: '',
      is_available: true,
    });
    setIsPanelOpen(true);
  };

  const openForEdit = (item) => {
    setActiveItem(item);
    setPreviewImage(item.image_url);
    setIsPopular(item.is_popular || false);
    reset({
      name: item.name || '',
      price: item.price || 1000,
      category: item.category || 'Main Dish',
      description: item.description || '',
      image: item.image_url || '',
      is_available: item.is_available ?? true,
    });
    setIsPanelOpen(true);
  };

  const closePanel = () => { 
    setIsPanelOpen(false); 
    setActiveItem(null); 
    setPreviewImage(null); 
    setIsPopular(false);
  };

  // 🖼️ HANDLE IMAGE PREVIEW
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

          const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
          setPreviewImage(dataUrl);
          setValue('image', dataUrl);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  // ⚡ SAVE WITH REACT HOOK FORM + ZOD
  const onSaveItem = async (data) => {
    const token = localStorage.getItem('token');
    
    const payload = {
      name: data.name.trim(),
      price: Number(data.price),
      category: data.category.trim(),
      description: data.description ? data.description.trim() : '',
      is_popular: isPopular,
      image_url: previewImage || activeItem?.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500", 
      is_available: activeItem ? activeItem.is_available : true,
    };

    const tempId = activeItem?.id || `item-${Date.now()}`;
    const optimisticItem = { id: tempId, ...payload };

    if (!activeItem) {
      setMenu(prev => [optimisticItem, ...prev]);
    } else {
      setMenu(prev => prev.map(i => i.id === activeItem.id ? optimisticItem : i));
    }
    
    closePanel(); 

    try {
      let response;
      if (activeItem?.id && !activeItem.id.startsWith('demo-') && !activeItem.id.startsWith('item-')) {
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

      if (response && response.ok) {
        const realItem = await response.json();
        setMenu(currentMenu => currentMenu.map(item => 
          (item.id === tempId || item.id === activeItem?.id) ? realItem : item
        ));
        toast.success(`"${payload.name}" updated in your live catalog.`, 'Menu Updated');
      } else {
        toast.success(`"${payload.name}" saved to your active session menu.`, 'Item Saved');
      }
    } catch {
      toast.info(`"${payload.name}" saved locally in preview mode.`, 'Saved Locally');
    }
  };

  const handleDelete = async (id, name) => {
    setMenu(prev => prev.filter(i => i.id !== id));
    toast.success(`"${name}" removed from menu.`, 'Item Deleted');

    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/restaurant/menu/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch {
      // Local removal already reflected
    }
  };

  const toggleItemStatus = async (item) => {
    const nextStatus = !item.is_available;
    const updatedMenu = menu.map(i => i.id === item.id ? {...i, is_available: nextStatus} : i);
    setMenu(updatedMenu);

    toast.info(
      `"${item.name}" is now ${nextStatus ? 'marked Available' : 'marked Sold Out'}.`,
      nextStatus ? 'Item In Stock' : 'Item Out of Stock'
    );

    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/restaurant/menu/${item.id}/status`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch {
      // Keep optimistic update
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-140px)] sm:h-[calc(100vh-140px)] bg-[#FDFCFB] rounded-2xl sm:rounded-[40px] border-2 border-slate-900 overflow-hidden font-sans shadow-xl">
      
      {/* 🚀 HEADER */}
      <div className="p-4 sm:p-8 border-b-2 border-slate-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white relative">
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase italic tracking-tighter flex items-center gap-3">
            <Flame className="text-orange-500" fill="currentColor" /> Meal Listing & Menu
          </h1>
          <p className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] sm:tracking-[0.3em] mt-1 ml-1">
            Menu catalog & real-time inventory management
          </p>
        </div>
        
        <button 
          onClick={openForCreate}
          className="w-full sm:w-auto bg-indigo-600 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-900 transition-all duration-300 shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
        >
          <Plus size={18} strokeWidth={3} /> Add New Meal
        </button>
      </div>

      {/* 📋 LIST VIEW */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4 py-20">
            <Loader2 className="animate-spin text-slate-900" size={48} />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Inventory...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {menu.map((item) => (
              <div 
                key={item.id} 
                className="group bg-white border border-slate-900 rounded-2xl sm:rounded-[32px] overflow-hidden hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 shadow-sm relative flex flex-col justify-between"
              >
                <div>
                  {/* Popular Badge */}
                  {item.is_popular && (
                    <div className="absolute top-4 left-4 z-10 bg-orange-500 text-white px-3 py-1.5 rounded-xl border border-slate-900 flex items-center gap-1 shadow-md">
                      <Star size={12} fill="currentColor" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Featured</span>
                    </div>
                  )}

                  <div className="h-44 sm:h-48 relative overflow-hidden">
                    <img 
                      src={getFullImageUrl(item.image_url)} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                      alt={item.name} 
                    />
                    
                    {/* Status Toggle Button */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleItemStatus(item); }}
                      className={`absolute top-4 right-4 px-3 py-1.5 rounded-xl border border-slate-900 flex items-center gap-2 cursor-pointer hover:scale-105 transition-transform z-10 ${
                        item.is_available ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                      }`}
                    >
                      <div className="w-2 h-2 rounded-full bg-white" />
                      <span className="text-[9px] font-black uppercase tracking-widest">
                        {item.is_available ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </button>
                  </div>
                  
                  <div className="p-4 sm:p-6">
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase italic truncate flex-1">{item.name}</h3>
                      <div className="text-right shrink-0">
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
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 truncate">{item.category}</p>
                    {item.description && (
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">{item.description}</p>
                    )}
                  </div>
                </div>

                <div className="p-4 sm:p-6 pt-0 border-t border-slate-100 mt-auto flex justify-between items-center">
                  <button 
                    onClick={() => openForEdit(item)}
                    className="text-[10px] font-black text-slate-500 uppercase hover:text-indigo-600 flex items-center gap-1.5 min-h-[36px] cursor-pointer"
                  >
                    <Edit3 size={14} /> Edit Item <ChevronRight size={14}/>
                  </button>
                  <button 
                    onClick={() => handleDelete(item.id, item.name)} 
                    className="text-slate-400 hover:text-rose-600 transition-colors p-2 rounded-lg cursor-pointer"
                    title="Delete meal listing"
                  >
                    <Trash2 size={18} />
                  </button>
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

      {/* 🛠️ SLIDE-OVER DRAWER WITH REACT HOOK FORM + ZOD */}
      {isPanelOpen && (
        <>
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[99] animate-in fade-in" onClick={closePanel} />
          <div className="fixed inset-x-0 bottom-0 top-12 sm:inset-y-4 sm:left-auto sm:right-4 w-full sm:w-[500px] max-w-full bg-white z-[100] rounded-t-3xl sm:rounded-[40px] border-t-2 sm:border-2 border-slate-900 flex flex-col animate-in slide-in-from-bottom sm:slide-in-from-right duration-300 sm:duration-500 shadow-2xl">
            <form onSubmit={handleSubmit(onSaveItem)} className="h-full flex flex-col">
              
              <div className="p-4 sm:p-8 border-b border-slate-100 flex justify-between items-center shrink-0">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase italic flex items-center gap-2">
                  <Sparkles className="text-indigo-600" size={24} /> {activeItem ? 'Edit Meal Listing' : 'New Meal Listing'}
                </h2>
                <button type="button" onClick={closePanel} className="p-2 hover:bg-slate-50 rounded-full transition-colors cursor-pointer">
                  <X size={24}/>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 custom-scrollbar">
                
                {/* IMAGE UPLOAD ZONE */}
                <div className="space-y-2">
                  <FormLabel hint="Optional photo">Product Photo</FormLabel>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-44 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[28px] flex flex-col items-center justify-center relative overflow-hidden cursor-pointer hover:border-indigo-600 group transition-all"
                  >
                    {previewImage ? (
                      <img src={previewImage} className="w-full h-full object-cover" alt="Preview" />
                    ) : (
                      <div className="text-center group-hover:scale-105 transition-transform p-4">
                        <UploadCloud className="mx-auto text-slate-300 mb-2" size={32}/>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Click to upload photo</p>
                      </div>
                    )}
                    <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <FormLabel required htmlFor="item-name">Meal Title</FormLabel>
                    <input 
                      id="item-name"
                      placeholder="e.g. Ndole Royal & Fried Plantains"
                      className={`w-full bg-slate-50 border rounded-2xl py-3.5 px-4 font-black text-slate-900 outline-none transition-all ${
                        errors.name ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:border-slate-900'
                      }`}
                      {...register('name')}
                    />
                    <FormError message={errors.name?.message} />
                  </div>

                  <div>
                    <FormLabel htmlFor="item-desc" hint="Max 250 chars">Recipe & Description</FormLabel>
                    <textarea 
                      id="item-desc"
                      placeholder="Describe ingredients, cooking style, portion size..."
                      className={`w-full bg-slate-50 border rounded-2xl py-3.5 px-4 font-bold text-slate-700 outline-none h-24 transition-all resize-none ${
                        errors.description ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:border-slate-900'
                      }`}
                      {...register('description')}
                    />
                    <FormError message={errors.description?.message} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <FormLabel required htmlFor="item-price">Base Price (XAF)</FormLabel>
                      <div className="relative">
                        <input 
                          id="item-price"
                          type="number" 
                          step="100"
                          placeholder="2500"
                          className={`w-full bg-slate-50 border rounded-2xl py-3.5 px-4 font-black text-slate-900 outline-none transition-all ${
                            errors.price ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:border-slate-900'
                          }`}
                          {...register('price')}
                        />
                      </div>
                      <FormError message={errors.price?.message} />
                    </div>

                    <div>
                      <FormLabel required htmlFor="item-cat">Category</FormLabel>
                      <input 
                        id="item-cat"
                        placeholder="e.g. Traditional, Grills"
                        className={`w-full bg-slate-50 border rounded-2xl py-3.5 px-4 font-black text-slate-900 outline-none transition-all ${
                          errors.category ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:border-slate-900'
                        }`}
                        {...register('category')}
                      />
                      <FormError message={errors.category?.message} />
                    </div>
                  </div>

                  {/* FEATURED TOGGLE */}
                  <div 
                    onClick={() => setIsPopular(!isPopular)}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                      isPopular ? 'border-orange-500 bg-orange-50' : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <p className={`text-xs font-black uppercase tracking-widest ${isPopular ? 'text-orange-600' : 'text-slate-500'}`}>
                        Chef's Featured Recommendation
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">Highlight this item on the marketplace feed</p>
                    </div>
                    <div className={`w-12 h-6 rounded-full relative transition-colors ${isPopular ? 'bg-orange-500' : 'bg-slate-200'}`}>
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isPopular ? 'left-7' : 'left-1'}`} />
                    </div>
                  </div>

                </div>
              </div>

              <div className="p-6 bg-slate-50/50 border-t border-slate-100">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60"
                >
                  <Save size={18}/> {activeItem ? 'Update Listing' : 'Sync Meal to Menu'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}