import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UploadZone } from "./components/UploadZone";
import { ProcessingQueue } from "./components/ProcessingQueue";
import { apiRequest } from "./lib/queryClient";
import type { Conversion } from "@shared/schema";

function App() {
  const queryClient = useQueryClient();

  // Conversions listesini çek
  const { data: conversions = [], isLoading } = useQuery<Conversion[]>({
    queryKey: ["/api/conversions"],
    refetchInterval: 2000, // Her 2 saniyede bir güncelle
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (files: FileList) => {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append("files", file);
      });

      const response = await apiRequest("POST", "/api/upload", formData);
      return response.json();
    },
    onSuccess: (data) => {
      console.log("✅ Upload başarılı:", data);
      // Listeyi güncelle
      queryClient.invalidateQueries({ queryKey: ["/api/conversions"] });
    },
    onError: (error) => {
      console.error("❌ Upload hatası:", error);
      alert("Yükleme başarısız: " + (error as Error).message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/conversions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversions"] });
    },
    onError: (error) => {
      alert("Silme başarısız: " + (error as Error).message);
    },
  });

  // Retry mutation
  const retryMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/api/conversions/${id}/retry`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversions"] });
    },
    onError: (error) => {
      alert("Tekrar deneme başarısız: " + (error as Error).message);
    },
  });

  // Download fonksiyonu
  const handleDownload = async (id: string) => {
    try {
      const response = await apiRequest("GET", `/api/download/${id}`);
      const data = await response.json();
      
      // Yeni sekmede aç
      window.open(data.downloadUrl, "_blank");
    } catch (error) {
      alert("İndirme başarısız: " + (error as Error).message);
    }
  };

  const handleFileUpload = (files: FileList) => {
    console.log("📤 Dosyalar yükleniyor:", files);
    
    // Dosya kontrolü
    const validFiles = Array.from(files).filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} çok büyük (max 10MB)`);
        return false;
      }
      if (!file.name.toLowerCase().endsWith('.docx')) {
        alert(`${file.name} .docx dosyası değil`);
        return false;
      }
      return true;
    });
    
    if (validFiles.length > 0) {
      const dataTransfer = new DataTransfer();
      validFiles.forEach(file => dataTransfer.items.add(file));
      uploadMutation.mutate(dataTransfer.files);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                DOCX to PDF Converter
              </h1>
              <p className="text-gray-600 text-sm">
                Word dosyalarınızı kolayca PDF'e çevirin
              </p>
            </div>
          </div>
        </div>

        {/* Upload Zone */}
        <UploadZone
          onFileUpload={handleFileUpload}
          isUploading={uploadMutation.isPending}
        />

        {/* Processing Queue */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Dosyalarınız
          </h2>
          <ProcessingQueue
            conversions={conversions}
            isLoading={isLoading}
            onDownload={handleDownload}
            onDelete={(id) => deleteMutation.mutate(id)}
            onRetry={(id) => retryMutation.mutate(id)}
          />
        </div>

      </div>
    </div>
  );
}

export default App;