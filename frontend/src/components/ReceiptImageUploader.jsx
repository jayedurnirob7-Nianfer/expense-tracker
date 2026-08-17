import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Trash2, Maximize2, X, Download, ChevronLeft, ChevronRight, Sparkles, Plus, Image as ImageIcon } from 'lucide-react';
import { uploadToImgBB } from '../utils/imageCompressor';

const ReceiptImageUploader = ({
  images = [],
  onChange,
  label = 'Attach Receipt / Photos (Optional)',
  allowMultiple = true
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null); // { current, total }
  const [error, setError] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const cameraInputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Normalize incoming images to array
  const imageList = Array.isArray(images) ? images.filter(Boolean) : (images ? [images] : []);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setLightboxIndex(null);
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) => (prev > 0 ? prev - 1 : imageList.length - 1));
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) => (prev < imageList.length - 1 ? prev + 1 : 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, imageList.length]);

  const handleFilesSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setError('');
    setIsProcessing(true);
    setUploadProgress({ current: 0, total: files.length });

    try {
      const uploadedUrls = [];
      for (let i = 0; i < files.length; i++) {
        setUploadProgress({ current: i + 1, total: files.length });
        const cdnUrl = await uploadToImgBB(files[i]);
        uploadedUrls.push(cdnUrl);
      }

      if (allowMultiple) {
        onChange([...imageList, ...uploadedUrls]);
      } else {
        onChange(uploadedUrls.slice(-1));
      }
    } catch (err) {
      console.error('Image upload failed:', err);
      setError(err.message || 'Failed to upload photo(s). Please try again.');
    } finally {
      setIsProcessing(false);
      setUploadProgress(null);
      e.target.value = '';
    }
  };

  const handleRemoveSingle = (indexToRemove, e) => {
    if (e) e.stopPropagation();
    const updated = imageList.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);

    if (lightboxIndex !== null) {
      if (updated.length === 0) {
        setLightboxIndex(null);
      } else if (lightboxIndex >= updated.length) {
        setLightboxIndex(updated.length - 1);
      }
    }
  };

  const handleClearAll = (e) => {
    if (e) e.stopPropagation();
    onChange([]);
    setLightboxIndex(null);
  };

  return (
    <div className="pt-1 space-y-2">
      {/* Label Header with Compact Add Buttons */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Camera size={14} className="text-emerald-400" />
          <span>{label}</span>
          {imageList.length > 0 && (
            <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {imageList.length} {imageList.length === 1 ? 'photo' : 'photos'}
            </span>
          )}
        </label>

        {imageList.length > 0 && (
          <div className="flex items-center gap-1.5">
            {allowMultiple && (
              <>
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-[11px] font-bold transition-colors flex items-center gap-1 border border-emerald-500/30 cursor-pointer"
                  title="Take another photo with camera"
                >
                  <Camera size={12} />
                  <span>+ Camera</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 rounded-lg bg-[#1a2638] hover:bg-[#223249] text-slate-200 hover:text-white text-[11px] font-bold transition-colors flex items-center gap-1 border border-slate-700 cursor-pointer"
                  title="Upload more from gallery"
                >
                  <Upload size={12} />
                  <span>+ Upload</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 transition-colors ml-1 cursor-pointer"
              title="Remove all photos"
            >
              <Trash2 size={12} />
              <span>Clear</span>
            </button>
          </div>
        )}
      </div>

      {/* Hidden Native File Inputs */}
      {/* Camera Capture Input (Rear camera requested via environment) */}
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        onChange={handleFilesSelected}
        className="hidden"
      />
      {/* Gallery File Input with Multi-Select */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        multiple={allowMultiple}
        onChange={handleFilesSelected}
        className="hidden"
      />

      {/* Error Message */}
      {error && (
        <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl p-2.5 font-medium">
          {error}
        </p>
      )}

      {/* Uploading Spinner */}
      {isProcessing && (
        <div className="w-full py-5 rounded-2xl bg-[#131d2b] border border-dashed border-emerald-500/40 flex flex-col items-center justify-center gap-2 animate-in fade-in">
          <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-emerald-400 font-semibold">
            {uploadProgress && uploadProgress.total > 1
              ? `Uploading photo ${uploadProgress.current} of ${uploadProgress.total}...`
              : 'Optimizing and uploading photo...'}
          </span>
        </div>
      )}

      {/* Images Attached: Clean Gallery Thumbnail Grid */}
      {imageList.length > 0 ? (
        <div className="space-y-2.5">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {imageList.map((url, idx) => (
              <div
                key={`${url}-${idx}`}
                onClick={() => setLightboxIndex(idx)}
                className="relative aspect-video sm:aspect-square rounded-2xl overflow-hidden border border-emerald-500/30 bg-[#131d2b] group cursor-pointer hover:border-emerald-400 transition-all shadow-md"
                title="Click to expand full screen"
              >
                <img
                  src={url}
                  alt={`Receipt ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Gradient vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/40 pointer-events-none" />

                {/* Index badge */}
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur text-white text-[10px] font-bold border border-white/10 pointer-events-none">
                  #{idx + 1}
                </span>

                {/* Delete button on individual photo */}
                <button
                  type="button"
                  onClick={(e) => handleRemoveSingle(idx, e)}
                  className="absolute top-2 right-2 w-6 h-6 rounded-lg bg-black/70 hover:bg-rose-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors shadow-sm"
                  title="Remove this photo"
                >
                  <X size={13} />
                </button>

                {/* Hover overlay hint */}
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white/90 text-[10px] font-medium pointer-events-none">
                  <span className="flex items-center gap-1 bg-black/50 px-1.5 py-0.5 rounded backdrop-blur">
                    <Maximize2 size={10} />
                    <span>View</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Empty State: Two Main Buttons */
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="py-3 px-3 rounded-2xl bg-[#131d2b] hover:bg-[#1a2638] border border-[#1e293b] hover:border-emerald-500/40 text-slate-300 hover:text-white flex flex-col sm:flex-row items-center justify-center gap-2 transition-all group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 flex items-center justify-center transition-colors">
              <Camera size={16} />
            </div>
            <div className="text-center sm:text-left">
              <p className="text-xs font-bold text-white leading-tight">Camera</p>
              <p className="text-[10px] text-slate-400">Take a photo</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="py-3 px-3 rounded-2xl bg-[#131d2b] hover:bg-[#1a2638] border border-[#1e293b] hover:border-emerald-500/40 text-slate-300 hover:text-white flex flex-col sm:flex-row items-center justify-center gap-2 transition-all group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 flex items-center justify-center transition-colors">
              <Upload size={16} />
            </div>
            <div className="text-center sm:text-left">
              <p className="text-xs font-bold text-white leading-tight">Upload</p>
              <p className="text-[10px] text-slate-400">Select multiple</p>
            </div>
          </button>
        </div>
      )}

      {/* Full-Screen Lightbox Carousel */}
      {lightboxIndex !== null && imageList[lightboxIndex] && (
        <div
          className="fixed inset-0 min-h-[100dvh] w-full h-full bg-black/95 z-[150] flex flex-col items-center justify-between p-3 sm:p-5 animate-in fade-in"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Top Action Bar */}
          <div
            className="w-full max-w-4xl flex items-center justify-between p-2 sm:p-4 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-slate-800 text-xs font-bold text-emerald-400 border border-slate-700">
                Photo {lightboxIndex + 1} of {imageList.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={imageList[lightboxIndex]}
                target="_blank"
                rel="noreferrer"
                download={`receipt_photo_${lightboxIndex + 1}.jpg`}
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Download photo"
              >
                <Download size={15} />
                <span className="hidden sm:inline">Download</span>
              </a>

              <button
                type="button"
                onClick={(e) => handleRemoveSingle(lightboxIndex, e)}
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-rose-500/30"
                title="Delete this photo"
              >
                <Trash2 size={15} />
                <span className="hidden sm:inline">Delete</span>
              </button>

              <button
                type="button"
                onClick={() => setLightboxIndex(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors"
                title="Close (Esc)"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Main Image Stage with Left / Right Navigation */}
          <div
            className="relative w-full max-w-4xl flex-1 flex items-center justify-center overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Prev Button */}
            {imageList.length > 1 && (
              <button
                type="button"
                onClick={() => setLightboxIndex((prev) => (prev > 0 ? prev - 1 : imageList.length - 1))}
                className="absolute left-2 sm:left-4 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/60 hover:bg-black/90 border border-white/20 text-white flex items-center justify-center transition-all active:scale-95 shadow-xl"
                title="Previous photo"
              >
                <ChevronLeft size={24} />
              </button>
            )}

            {/* Photo Image */}
            <img
              src={imageList[lightboxIndex]}
              alt={`Receipt Preview ${lightboxIndex + 1}`}
              className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl border border-slate-800 animate-in zoom-in-95 duration-150"
            />

            {/* Next Button */}
            {imageList.length > 1 && (
              <button
                type="button"
                onClick={() => setLightboxIndex((prev) => (prev < imageList.length - 1 ? prev + 1 : 0))}
                className="absolute right-2 sm:right-4 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/60 hover:bg-black/90 border border-white/20 text-white flex items-center justify-center transition-all active:scale-95 shadow-xl"
                title="Next photo"
              >
                <ChevronRight size={24} />
              </button>
            )}
          </div>

          {/* Bottom Thumbnail Strip */}
          {imageList.length > 1 && (
            <div
              className="flex items-center gap-2 p-2 max-w-full overflow-x-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {imageList.map((url, idx) => (
                <button
                  key={`thumb-${idx}`}
                  type="button"
                  onClick={() => setLightboxIndex(idx)}
                  className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                    idx === lightboxIndex
                      ? 'border-emerald-400 scale-105 shadow-lg shadow-emerald-500/20'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={url} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReceiptImageUploader;
