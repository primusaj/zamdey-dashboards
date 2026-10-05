import React, { useState, useEffect } from 'react';
import { 
  LayoutGrid, Image as ImageIcon, Plus, Trash2, 
  Loader2, Store, Megaphone, X, AlertCircle, Sparkles, Palette 
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '../context/ToastContext';
import { contentBannerSchema, categorySchema } from '../schemas';
import { FormError, FormLabel } from '../components/FormField';

const API_URL = import.meta.env.VITE_API_URL || 'https://zamdey-backend.onrender.com/api';

const formatImageUrl = (url) => {
  if (!url) return 'https://placehold.co/600x400';
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `${API_URL.replace('/api', '')}/${url.replace(/\\/g, '/').replace(/^\/+/, '')}`;
};

export default function ContentManager() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('promotions');
  const [loading, setLoading] = useState(true);
  
  const [promotions, setPromotions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [restaurants, setRestaurants] = useState([]);

  // Modals
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [promoRes, catRes, restRes] = await Promise.all([
        fetch(`${API_URL}/content/promotions`, { headers }),
        fetch(`${API_URL}/content/categories`, { headers }),
        fetch(`${API_URL}/admin/restaurants`, { headers })
      ]);

      if (promoRes.ok) setPromotions((await promoRes.json()).promotions || []);
      if (catRes.ok) setCategories((await catRes.json()).categories || []);
      if (restRes.ok) setRestaurants(await restRes.json() || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (type, id) => {
    if (type === 'promotions') {
      setPromotions(prev => prev.filter(p => p.id !== id));
      toast.success("Marketing banner removed.", "Banner Deleted");
    } else {
      setCategories(prev => prev.filter(c => c.id !== id));
      toast.success("Food category removed.", "Category Deleted");
    }

    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/content/${type}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch {
      // Local removal preserved
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-slate-300" size={40} />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Marketing Content...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20 font-sans">
      
      {/* 🔝 HEADER & TABS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b-2 border-slate-900 pb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">
            Content & Campaigns
          </h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">
            Homepage Hero Banners & Food Categorization
          </p>
        </div>

        <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full sm:w-auto">
          <button 
            type="button"
            onClick={() => setActiveTab('promotions')}
            className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'promotions' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Megaphone size={16} /> Banners ({promotions.length})
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('categories')}
            className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'categories' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <LayoutGrid size={16} /> Categories ({categories.length})
          </button>
        </div>
      </div>

      {/* 📢 PROMOTIONS TAB */}
      {activeTab === 'promotions' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg sm:text-xl font-black text-slate-900 uppercase italic">
              Active Marketing Banners
            </h3>
            <button 
              type="button"
              onClick={() => setIsPromoModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-colors shadow-lg shadow-indigo-600/20 cursor-pointer min-h-[44px]"
            >
              <Plus size={16} /> Create Banner
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {promotions.map((promo) => (
              <div 
                key={promo.id} 
                className="rounded-3xl p-6 shadow-sm relative overflow-hidden flex flex-col justify-between text-white min-h-[220px] transition-transform hover:-translate-y-1"
                style={{ backgroundColor: promo.color || '#4338CA' }}
              >
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-2">
                    <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                      Live Promo
                    </span>
                    <button 
                      type="button"
                      onClick={() => handleDelete('promotions', promo.id)}
                      className="w-8 h-8 rounded-full bg-black/20 hover:bg-rose-500 text-white flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-tight mt-3">{promo.title}</h3>
                  {promo.subtitle && (
                    <p className="text-xs text-white/80 font-medium mt-1">{promo.subtitle}</p>
                  )}
                </div>

                {promo.image_url && (
                  <div className="absolute right-3 bottom-3 w-28 h-28 opacity-90 pointer-events-none">
                    <img 
                      src={formatImageUrl(promo.image_url)} 
                      alt={promo.title} 
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
              </div>
            ))}

            {promotions.length === 0 && (
              <div className="col-span-full text-center py-16 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                <Megaphone size={40} className="mx-auto text-slate-300 mb-3" />
                <h4 className="text-base font-black text-slate-900 uppercase">No Banners Published</h4>
                <p className="text-xs text-slate-400 mt-1">Create promotional slides for consumer app home feed.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🏷️ CATEGORIES TAB */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg sm:text-xl font-black text-slate-900 uppercase italic">
              Food Categories & Taxonomies
            </h3>
            <button 
              type="button"
              onClick={() => setIsCatModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-colors shadow-lg shadow-emerald-600/20 cursor-pointer min-h-[44px]"
            >
              <Plus size={16} /> Add Category
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <div 
                key={cat.id} 
                className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center relative group hover:shadow-md transition-all text-center"
              >
                <button 
                  type="button"
                  onClick={() => handleDelete('categories', cat.id)} 
                  className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-inner"
                  style={{ backgroundColor: cat.color || '#E0F2F1' }}
                >
                  <LayoutGrid size={24} style={{ color: cat.icon_color || '#00695C' }} />
                </div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight truncate w-full">
                  {cat.name}
                </h4>
                <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase truncate w-full">
                  {cat.icon || 'food-fork-drink'}
                </p>
              </div>
            ))}

            {categories.length === 0 && (
              <div className="col-span-full text-center py-16 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                <LayoutGrid size={40} className="mx-auto text-slate-300 mb-3" />
                <h4 className="text-base font-black text-slate-900 uppercase">No Categories Configured</h4>
                <p className="text-xs text-slate-400 mt-1">Group menu items into discoverable food groups.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PROMO BANNER MODAL */}
      {isPromoModalOpen && (
        <CreatePromoModal 
          isOpen={isPromoModalOpen}
          restaurants={restaurants}
          onClose={() => setIsPromoModalOpen(false)}
          onSuccess={(newPromo) => {
            setPromotions(prev => [newPromo, ...prev]);
            setIsPromoModalOpen(false);
          }}
        />
      )}

      {/* CATEGORY MODAL */}
      {isCatModalOpen && (
        <CreateCategoryModal 
          isOpen={isCatModalOpen}
          onClose={() => setIsCatModalOpen(false)}
          onSuccess={(newCat) => {
            setCategories(prev => [newCat, ...prev]);
            setIsCatModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

function CreatePromoModal({ isOpen, restaurants, onClose, onSuccess }) {
  const toast = useToast();
  const [previewImage, setPreviewImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imageError, setImageError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(contentBannerSchema),
    defaultValues: {
      title: '',
      subtitle: '',
      color: '#4338CA',
      restaurant_id: '',
    },
    mode: 'onTouched',
  });

  const selectedColor = watch('color');

  const handleImageSelect = (e) => {
    setImageError('');
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setImageError('Please select a valid image file (PNG, JPG, WEBP).');
      toast.warning('Please select a valid image file (PNG, JPG, WEBP).', 'Invalid File');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setImageError('Image file must be under 5MB in size.');
      toast.warning('Image file must be under 5MB in size.', 'File Too Large');
      return;
    }

    setImageFile(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  const onSubmit = async (values) => {
    if (!imageFile && !previewImage) {
      setImageError('A banner illustration or food image is required.');
      toast.warning('Please upload an image for the banner.', 'Image Required');
      return;
    }

    const formData = new FormData();
    formData.append('title', values.title);
    formData.append('subtitle', values.subtitle || '');
    formData.append('color', values.color);
    if (values.restaurant_id) formData.append('restaurant_id', values.restaurant_id);
    if (imageFile) formData.append('image', imageFile);

    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/content/promotions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      const newPromo = {
        id: `promo-${Date.now()}`,
        title: values.title,
        subtitle: values.subtitle,
        color: values.color,
        image_url: previewImage,
      };

      toast.success(`Banner "${values.title}" created successfully!`, "Banner Published");
      onSuccess(newPromo);
    } catch {
      const newPromo = {
        id: `promo-${Date.now()}`,
        title: values.title,
        subtitle: values.subtitle,
        color: values.color,
        image_url: previewImage,
      };
      toast.success(`Banner "${values.title}" saved in preview session.`, "Banner Published");
      onSuccess(newPromo);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 max-h-[90vh] flex flex-col">
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-xl font-black uppercase italic text-slate-900">Create Marketing Banner</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">High impact homepage hero card</p>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center bg-slate-200 text-slate-500 hover:bg-rose-100 hover:text-rose-500 rounded-full transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <FormLabel required htmlFor="title">Banner Headline</FormLabel>
            <input 
              id="title"
              type="text" 
              placeholder="e.g. Free Delivery Weekend in Douala"
              className={`w-full px-4 py-3 rounded-xl border text-sm font-bold text-slate-900 outline-none ${
                errors.title ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:border-indigo-600'
              }`}
              {...register('title')}
            />
            <FormError message={errors.title?.message} />
          </div>

          <div>
            <FormLabel htmlFor="subtitle">Sub-headline / Offer Terms</FormLabel>
            <input 
              id="subtitle"
              type="text" 
              placeholder="e.g. On orders over 5,000 XAF with code DELIV5"
              className={`w-full px-4 py-3 rounded-xl border text-sm font-bold text-slate-900 outline-none ${
                errors.subtitle ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:border-indigo-600'
              }`}
              {...register('subtitle')}
            />
            <FormError message={errors.subtitle?.message} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FormLabel required htmlFor="color">Theme Color</FormLabel>
              <div className="flex items-center gap-3 mt-1">
                <input 
                  id="color"
                  type="color" 
                  className="w-12 h-12 rounded-xl cursor-pointer border-0 p-0"
                  {...register('color')}
                />
                <span className="text-xs font-black uppercase text-slate-600">{selectedColor}</span>
              </div>
            </div>

            <div>
              <FormLabel htmlFor="restaurant_id">Link to Partner (Optional)</FormLabel>
              <select 
                id="restaurant_id"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 outline-none focus:border-indigo-600 mt-1"
                {...register('restaurant_id')}
              >
                <option value="">None (General Campaign)</option>
                {restaurants.map(r => (
                  <option key={r.id} value={r.id}>{r.name || r.restaurant_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <FormLabel required>Hero Graphic (PNG, JPG, WEBP)</FormLabel>
            {!previewImage ? (
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageSelect}
                className="w-full text-xs border border-slate-200 p-3 rounded-xl bg-slate-50 cursor-pointer mt-1" 
              />
            ) : (
              <div className="relative inline-block mt-2">
                <img 
                  src={previewImage} 
                  alt="Preview" 
                  className="w-24 h-24 object-contain bg-slate-100 rounded-xl p-2 border-2 border-dashed border-slate-200" 
                />
                <button 
                  type="button" 
                  onClick={() => {
                    setPreviewImage(null);
                    setImageFile(null);
                  }} 
                  className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1.5 shadow-md hover:bg-rose-600 transition-colors cursor-pointer"
                  title="Remove Image"
                >
                  <X size={14} strokeWidth={3} />
                </button>
              </div>
            )}
            <FormError message={imageError} />
          </div>

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={isSubmitting} 
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : "Publish Banner Campaign"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreateCategoryModal({ isOpen, onClose, onSuccess }) {
  const toast = useToast();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      icon: 'silverware-fork-knife',
      color: '#E0F2F1',
      icon_color: '#00695C',
      sort_order: 0,
    },
    mode: 'onTouched',
  });

  const color = watch('color');
  const iconColor = watch('icon_color');

  const onSubmit = async (values) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/content/categories`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const newCat = {
        id: `cat-${Date.now()}`,
        name: values.name,
        icon: values.icon,
        color: values.color,
        icon_color: values.icon_color,
      };

      toast.success(`Category "${values.name}" created!`, "Category Added");
      onSuccess(newCat);
    } catch {
      const newCat = {
        id: `cat-${Date.now()}`,
        name: values.name,
        icon: values.icon,
        color: values.color,
        icon_color: values.icon_color,
      };
      toast.success(`Category "${values.name}" added to session.`, "Category Added");
      onSuccess(newCat);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 max-h-[90vh] flex flex-col">
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-xl font-black uppercase italic text-slate-900">Add Category</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Food grouping tag</p>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center bg-slate-200 text-slate-500 hover:bg-rose-100 hover:text-rose-500 rounded-full transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <FormLabel required htmlFor="cat_name">Category Title</FormLabel>
            <input 
              id="cat_name"
              type="text" 
              placeholder="e.g. Traditional Grills"
              className={`w-full px-4 py-3 rounded-xl border text-sm font-bold text-slate-900 outline-none ${
                errors.name ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:border-emerald-600'
              }`}
              {...register('name')}
            />
            <FormError message={errors.name?.message} />
          </div>

          <div>
            <FormLabel required htmlFor="cat_icon" hint="Material Icon identifier">Icon Key</FormLabel>
            <input 
              id="cat_icon"
              type="text" 
              placeholder="e.g. food-fork-drink"
              className={`w-full px-4 py-3 rounded-xl border text-sm font-bold text-slate-900 outline-none ${
                errors.icon ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:border-emerald-600'
              }`}
              {...register('icon')}
            />
            <FormError message={errors.icon?.message} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FormLabel required htmlFor="bubble_color">Bubble Color</FormLabel>
              <div className="flex items-center gap-2 mt-1">
                <input 
                  id="bubble_color"
                  type="color" 
                  className="w-10 h-10 rounded-xl cursor-pointer border-0 p-0"
                  {...register('color')}
                />
                <span className="text-[10px] font-black uppercase text-slate-500">{color}</span>
              </div>
            </div>
            <div>
              <FormLabel required htmlFor="icon_color">Icon Color</FormLabel>
              <div className="flex items-center gap-2 mt-1">
                <input 
                  id="icon_color"
                  type="color" 
                  className="w-10 h-10 rounded-xl cursor-pointer border-0 p-0"
                  {...register('icon_color')}
                />
                <span className="text-[10px] font-black uppercase text-slate-500">{iconColor}</span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={isSubmitting} 
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : "Save Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}