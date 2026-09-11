export type ContentType = 'file' | 'text' | 'image';
export interface ShareItem {
    id: string;
    shortUrl: string;
    type: ContentType;
    name: string;
    size: number;
    mimeType: string;
    storagePath: string;
    createdAt: Date;
    expiresAt: Date;
    maxDownloads: number | null;
    downloadCount: number;
    password: string | null;
}
export interface TextSnippet {
    id: string;
    shortUrl: string;
    title: string;
    content: string;
    language: string;
    createdAt: Date;
    expiresAt: Date;
}
export interface CreateFileInput {
    name: string;
    size: number;
    mimeType: string;
    storagePath: string;
    expiresInDays: number;
    maxDownloads?: number;
    password?: string;
}
export interface CreateTextInput {
    title: string;
    content: string;
    language: string;
    expiresInDays: number;
}
//# sourceMappingURL=index.d.ts.map