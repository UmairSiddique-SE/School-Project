import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';

type CloudinaryUploadResponse = {
  secure_url?: string;
  public_id?: string;
  resource_type?: string;
  format?: string;
  bytes?: number;
  width?: number;
  height?: number;
};

@Injectable()
export class MediaService {
  private readonly maxImageBytes = 2 * 1024 * 1024;
  private readonly allowedFormats = new Set(['image/jpeg', 'image/png']);

  constructor(private readonly config: ConfigService) {}

  private getConfig() {
    const cloudName = this.config.get<string>('CLOUDINARY_CLOUD_NAME')?.trim();
    const apiKey = this.config.get<string>('CLOUDINARY_API_KEY')?.trim();
    const apiSecret = this.config.get<string>('CLOUDINARY_API_SECRET')?.trim();

    if (!cloudName || !apiKey || !apiSecret) {
      throw new InternalServerErrorException('Cloudinary storage is not configured on the server');
    }

    return { cloudName, apiKey, apiSecret };
  }

  private sign(params: Record<string, string | number>, apiSecret: string) {
    const serialized = Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('&');

    return createHash('sha1').update(serialized + apiSecret).digest('hex');
  }

  async uploadImage(file: Express.Multer.File, schoolId: string, category: string) {
    if (!file) throw new BadRequestException('Image file is required');
    if (!schoolId?.trim()) throw new BadRequestException('School ID is required');

    if (!this.allowedFormats.has(file.mimetype)) {
      throw new BadRequestException('Only JPG and PNG images are allowed');
    }

    if (file.size > this.maxImageBytes) {
      throw new BadRequestException('Image must be 2 MB or smaller');
    }

    const safeCategory = String(category || 'general')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '')
      .slice(0, 40) || 'general';

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = `edusphere/schools/${schoolId}/${safeCategory}`;
    const { cloudName, apiKey, apiSecret } = this.getConfig();

    const signature = this.sign({ folder, timestamp }, apiSecret);

    const form = new FormData();
    form.append('file', new Blob([file.buffer], { type: file.mimetype }), file.originalname || 'image');
    form.append('api_key', apiKey);
    form.append('timestamp', String(timestamp));
    form.append('folder', folder);
    form.append('signature', signature);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: form,
    });

    const payload = (await response.json()) as CloudinaryUploadResponse & { error?: { message?: string } };

    if (!response.ok || !payload.secure_url || !payload.public_id) {
      throw new BadRequestException(payload.error?.message || 'Cloudinary image upload failed');
    }

    return {
      url: payload.secure_url,
      publicId: payload.public_id,
      resourceType: payload.resource_type || 'image',
      format: payload.format,
      bytes: payload.bytes,
      width: payload.width,
      height: payload.height,
    };
  }

  async deleteImage(publicId: string) {
    if (!publicId?.trim()) throw new BadRequestException('Cloudinary public ID is required');

    const timestamp = Math.floor(Date.now() / 1000);
    const { cloudName, apiKey, apiSecret } = this.getConfig();
    const signature = this.sign({ public_id: publicId, timestamp }, apiSecret);

    const form = new URLSearchParams();
    form.append('public_id', publicId);
    form.append('api_key', apiKey);
    form.append('timestamp', String(timestamp));
    form.append('signature', signature);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });

    const payload = (await response.json()) as { result?: string; error?: { message?: string } };

    if (!response.ok || payload.result !== 'ok') {
      throw new BadRequestException(payload.error?.message || 'Cloudinary image deletion failed');
    }

    return { deleted: true, publicId };
  }
}
