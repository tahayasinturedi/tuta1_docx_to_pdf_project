import { useMutation } from "@tanstack/react-query";
import { UploadZone } from "./components/UploadZone";
import { apiRequest } from "./lib/queryClient";

function App() {
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
      alert(`${data.conversions.length} dosya yüklendi!`);
    },
    onError: (error) => {
      console.error("❌ Upload hatası:", error);
      alert("Yükleme başarısız: " + (error as Error).message);
    },
  });

  const handleFileUpload = (files: FileList) => {
  console.log("📤 Dosyalar yükleniyor:", files);
  console.log("📋 Dosya sayısı:", files.length);
  console.log("📄 İlk dosya:", files[0]);
  
  // Dosya kontrolü
  const validFiles = Array.from(files).filter(file => {
    console.log("🔍 Kontrol ediliyor:", file.name, file.type, file.size);
    
    if (file.size > 10 * 1024 * 1024) {
      alert(`${file.name} çok büyük (max 10MB)`);
      return false;
    }
    if (!file.name.toLowerCase().endsWith('.docx')) {
      alert(`${file.name} .docx değil`);
      return false;
    }
    return true;
  });
  
  console.log("✅ Geçerli dosyalar:", validFiles.length);
  
  if (validFiles.length > 0) {
    // FileList'e dönüştür
    const dataTransfer = new DataTransfer();
    validFiles.forEach(file => dataTransfer.items.add(file));
    uploadMutation.mutate(dataTransfer.files);
  } else {
    alert("Geçerli dosya bulunamadı!");
   }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            📄 DOCX to PDF Converter
          </h1>
          <p className="text-gray-600">
            Word dosyalarınızı kolayca PDF'e çevirin
          </p>
        </div>

        {/* Upload Zone */}
        <UploadZone
          onFileUpload={handleFileUpload}
          isUploading={uploadMutation.isPending}
        />

        {/* Debug Info */}
        {uploadMutation.isPending && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">⏳ Yükleniyor...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;