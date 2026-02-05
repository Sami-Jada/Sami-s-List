/**
 * Shape of an uploaded file when using FileInterceptor with memory storage.
 * Use this instead of Express.Multer.File to avoid depending on @types/multer at build time.
 */
export interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}
