import { useState, useRef } from "react";

interface UploadZoneProps {
  onFileUpload: (files: FileList) => void;
  isUploading?: boolean;
}

export function UploadZone({ onFileUpload, isUploading }: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onFileUpload(files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileUpload(files);
    }
    e.target.value = '';
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className={`
        border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
        transition-all duration-300 hover:border-blue-500 hover:bg-blue-50
        ${isDragOver ? 'border-blue-500 bg-blue-50 scale-105' : 'border-gray-300 bg-white'}
        ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={!isUploading ? handleClick : undefined}
    >
      <div className="space-y-4">
        <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
          {isUploading ? (
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          )}
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            {isUploading ? "Dosyalar yükleniyor..." : "DOCX dosyalarınızı buraya sürükleyin"}
          </h3>
          <p className="text-gray-600 mb-4">
            {isUploading ? "Lütfen bekleyin..." : "veya dosya seçmek için tıklayın"}
          </p>
          
          {!isUploading && (
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors">
              Dosya Seç
            </button>
          )}
        </div>

        <div className="text-sm text-gray-500">
          <p>Desteklenen format: .docx dosyaları (max 10MB)</p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".docx"
        multiple
        className="hidden"
        onChange={handleFileSelect}
        disabled={isUploading}
      />
    </div>
  );
}