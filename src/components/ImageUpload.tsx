import { useState, useRef } from "react";
import { Camera, Upload, X, Loader2, ImageIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { SUPABASE_STORAGE_BUCKET } from "@/integrations/supabase/config";
import { toast } from "sonner";

interface ImageUploadProps {
  currentImage?: string;
  onUpload: (url: string) => void;
  onRemove: () => void;
  folder?: string;
}

export function ImageUpload({ currentImage, onUpload, onRemove, folder = "pigeons" }: ImageUploadProps) {
  const { t } = useTranslation();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("common.error_file_too_large") || "File too large (max 5MB)");
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).slice(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;
      const bucket = SUPABASE_STORAGE_BUCKET;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get Public URL
      const { data, error: publicUrlError } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      if (publicUrlError) throw publicUrlError;
      if (!data?.publicUrl) throw new Error("Unable to retrieve public URL after upload.");

      onUpload(data.publicUrl);
      toast.success(t("common.upload_success") || "Image uploaded successfully");
    } catch (error: any) {
      console.error('Error uploading image:', error);
      const message = error?.message || "Error uploading image";
      const bucketMessage = message.includes("Bucket") ? ` (${SUPABASE_STORAGE_BUCKET})` : "";
      toast.error(`${message}${bucketMessage}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative group aspect-[4/3] w-full overflow-hidden rounded-xl border-2 border-dashed bg-muted/50 transition-colors hover:bg-muted">
        {currentImage ? (
          <>
            <img 
              src={currentImage} 
              alt="Preview" 
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={(e) => {
                  e.preventDefault();
                  onRemove();
                }}
                className="gap-2"
              >
                <X className="h-4 w-4" /> {t("common.remove") || "Remove"}
              </Button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground"
          >
            {isUploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : (
              <ImageIcon className="h-10 w-10 opacity-20" />
            )}
            <div className="text-center px-4">
              <p className="text-sm font-semibold text-foreground">
                {isUploading ? t("common.uploading") || "Uploading..." : t("common.upload_image") || "Upload Image"}
              </p>
              <p className="text-xs">{t("common.upload_hint") || "Click or drag and drop"}</p>
            </div>
          </button>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
      />

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1 gap-2"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Upload className="h-4 w-4" /> {t("common.choose_file") || "Choose File"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1 gap-2"
          onClick={() => {
            if (fileInputRef.current) {
              fileInputRef.current.setAttribute("capture", "environment");
              fileInputRef.current.click();
            }
          }}
          disabled={isUploading}
        >
          <Camera className="h-4 w-4" /> {t("common.camera") || "Camera"}
        </Button>
      </div>
    </div>
  );
}
