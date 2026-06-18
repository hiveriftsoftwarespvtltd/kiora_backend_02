import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadService {
  async saveBase64Image(filename: string, base64: string): Promise<string> {
    // Strip data URI prefix if present
    const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    if (buffer.length > 5 * 1024 * 1024) {
      throw new Error('File size exceeds 5MB limit');
    }

    const safeName = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueName = `upload-${Date.now()}-${safeName}`;

    // 1. Save to frontend's public folder so it's immediately available in dev
    const frontendPublicImages = 'd:\\kioralifestye\\public\\images';
    if (fs.existsSync(frontendPublicImages)) {
      const destPath = path.join(frontendPublicImages, uniqueName);
      fs.writeFileSync(destPath, buffer);
      console.log(`📸 Image saved to frontend public assets: ${destPath}`);
    }

    // 2. Save to backend local storage for consistency
    const backendImagesDir = path.join(process.cwd(), 'public', 'images');
    if (!fs.existsSync(backendImagesDir)) {
      fs.mkdirSync(backendImagesDir, { recursive: true });
    }
    const backendDestPath = path.join(backendImagesDir, uniqueName);
    fs.writeFileSync(backendDestPath, buffer);
    console.log(`📸 Image saved to backend storage: ${backendDestPath}`);

    const baseUrl = process.env.BACKEND_URL || 'http://localhost:8009';
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    return `${cleanBaseUrl}/images/${uniqueName}`;
  }
}
