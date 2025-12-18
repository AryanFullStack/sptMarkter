import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const filename = `${timestamp}-${random}.webp`;

    // Ensure products directory exists
    const productsDir = path.join(process.cwd(), "public", "products");
    if (!existsSync(productsDir)) {
      await mkdir(productsDir, { recursive: true });
    }

    // Compress and convert to WebP
    const compressedBuffer = await sharp(buffer)
      .resize(1200, 1200, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 80 })
      .toBuffer();

    // Save to public/products folder
    const filepath = path.join(productsDir, filename);
    await writeFile(filepath, compressedBuffer);

    // Return public URL
    const url = `/products/${filename}`;

    return NextResponse.json({ url, success: true });
  } catch (error: any) {
    console.error("Image upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload image", details: error.message },
      { status: 500 }
    );
  }
}
