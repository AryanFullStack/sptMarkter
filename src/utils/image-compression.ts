/**
 * Compress an image file using canvas
 * @param file - The image file to compress
 * @param maxWidth - Maximum width of the compressed image
 * @param maxHeight - Maximum height of the compressed image
 * @param quality - Quality of the compressed image (0-1)
 * @returns Promise<File> - The compressed image file
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1200,
  maxHeight: number = 1200,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Canvas to Blob conversion failed"));
              return;
            }

            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          },
          file.type,
          quality
        );
      };

      img.onerror = () => {
        reject(new Error("Image load failed"));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error("File read failed"));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Upload image to Supabase Storage
 * @param file - The file to upload
 * @param bucket - The storage bucket name
 * @param folder - Optional folder path
 * @returns Promise<string> - The public URL of the uploaded image
 */
export async function uploadImageToStorage(
  file: File,
  bucket: string = "product-images",
  folder: string = ""
): Promise<string> {
  const { createClient } = await import("@/supabase/client");
  const supabase = createClient();

  // Generate unique filename
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 9);
  const fileExt = file.name.split(".").pop();
  const fileName = `${folder ? folder + "/" : ""}${timestamp}-${randomString}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("Upload error:", error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName);

  return publicUrl;
}

/**
 * Compress and upload image
 * @param file - The image file
 * @param bucket - Storage bucket name
 * @param folder - Optional folder path
 * @returns Promise<string> - The public URL of the uploaded compressed image
 */
export async function compressAndUploadImage(
  file: File,
  bucket: string = "product-images",
  folder: string = ""
): Promise<string> {
  // Compress image first
  const compressedFile = await compressImage(file);
  
  // Upload compressed image
  const url = await uploadImageToStorage(compressedFile, bucket, folder);
  
  return url;
}
