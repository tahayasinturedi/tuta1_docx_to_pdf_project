import type { Conversion } from "@shared/schema";

interface ProcessingQueueProps {
  conversions: Conversion[];
  isLoading: boolean;
  onDownload: (id: string) => void;
  onDelete: (id: string) => void;
  onRetry: (id: string) => void;
}

export function ProcessingQueue({
  conversions,
  isLoading,
  onDownload,
  onDelete,
  onRetry,
}: ProcessingQueueProps) {
  
  // Dosya boyutunu formatlama
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Status ikonu
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading':
        return (
          <div className="bg-blue-100 text-blue-600 p-3 rounded-lg">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'converting':
        return (
          <div className="bg-blue-100 text-blue-600 p-3 rounded-lg">
            <svg className="w-6 h-6 animate-spin" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'completed':
        return (
          <div className="bg-green-100 text-green-600 p-3 rounded-lg">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'failed':
        return (
          <div className="bg-red-100 text-red-600 p-3 rounded-lg">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  // Status metni
  const getStatusText = (status: string) => {
    switch (status) {
      case 'uploading': return 'Yükleniyor...';
      case 'converting': return 'PDF\'e çevriliyor...';
      case 'completed': return 'Tamamlandı';
      case 'failed': return 'Başarısız';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg p-6 animate-pulse">
            <div className="flex items-center space-x-4">
              <div className="bg-gray-200 w-12 h-12 rounded-lg" />
              <div className="flex-1">
                <div className="bg-gray-200 h-4 rounded w-48 mb-2" />
                <div className="bg-gray-200 h-3 rounded w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversions.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg">
        <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-800 mb-2">Henüz dosya yüklenmedi</h3>
        <p className="text-gray-600">Başlamak için yukarıdan DOCX dosyası yükleyin</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {conversions.map((conversion) => (
        <div
          key={conversion.id}
          className={`bg-white rounded-lg p-6 transition-all ${
            conversion.status === 'failed' ? 'border-2 border-red-200' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            {/* Sol taraf: Icon + Info */}
            <div className="flex items-center space-x-4">
              {getStatusIcon(conversion.status)}
              
              <div>
                <h4 className="font-semibold text-gray-800">{conversion.filename}</h4>
                <div className="text-sm text-gray-600">
                  <span>{formatFileSize(conversion.originalSize)}</span>
                  <span className="mx-2">•</span>
                  <span className={
                    conversion.status === 'completed' ? 'text-green-600' :
                    conversion.status === 'failed' ? 'text-red-600' :
                    'text-blue-600'
                  }>
                    {getStatusText(conversion.status)}
                  </span>
                </div>
                {conversion.error && (
                  <p className="text-sm text-red-600 mt-1">{conversion.error}</p>
                )}
              </div>
            </div>

            {/* Sağ taraf: Butonlar */}
            <div className="flex items-center space-x-2">
              {(conversion.status === 'uploading' || conversion.status === 'converting') && (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-blue-600">{conversion.progress}%</span>
                </div>
              )}

              {conversion.status === 'completed' && (
                <button
                  onClick={() => onDownload(conversion.id)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  PDF İndir
                </button>
              )}

              {conversion.status === 'failed' && (
                <button
                  onClick={() => onRetry(conversion.id)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Tekrar Dene
                </button>
              )}

              <button
                onClick={() => onDelete(conversion.id)}
                className="text-gray-400 hover:text-red-600 p-2 rounded-lg transition-colors"
                title="Sil"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}