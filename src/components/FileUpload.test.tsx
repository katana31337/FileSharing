import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileUpload from './FileUpload';

// Mock adminService
vi.mock('../services/adminService', () => ({
  getAdminSettings: () => ({
    maxFileSize: 10 * 1024 * 1024, // 10 MB
    minExpirationDays: 1,
    maxExpirationDays: 30,
    defaultExpirationDays: 7,
    adminLogin: 'admin',
    adminPassword: 'password',
    adminSecretPath: 'admin',
    logo: '',
    logoType: 'none' as const,
  }),
}));

// Mock storageService
vi.mock('../services/storageService', () => ({
  saveFile: vi.fn().mockImplementation((file, options, onProgress) => {
    // Simulate progress
    if (onProgress) {
      setTimeout(() => onProgress(50), 100);
      setTimeout(() => onProgress(100), 200);
    }
    return Promise.resolve({
      id: 'test-id',
      shortUrl: 'abc123',
      type: 'file',
      name: file.name,
      size: file.size,
      mimeType: file.type,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      expiresInDays: 7,
      downloads: 0,
    });
  }),
  formatFileSize: (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  },
}));

describe('FileUpload Component', () => {
  const mockOnUploadComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render upload zone', () => {
    render(<FileUpload onUploadComplete={mockOnUploadComplete} />);
    
    expect(screen.getByText(/Перетащите файлы/i)).toBeInTheDocument();
  });

  it('should render expiration options', () => {
    render(<FileUpload onUploadComplete={mockOnUploadComplete} />);
    
    expect(screen.getByText('Срок хранения')).toBeInTheDocument();
    expect(screen.getByText('7 дней')).toBeInTheDocument();
  });

  it('should allow selecting expiration period', async () => {
    const user = userEvent.setup();
    render(<FileUpload onUploadComplete={mockOnUploadComplete} />);
    
    const threeDaysButton = screen.getByText('3 дня');
    await user.click(threeDaysButton);
    
    expect(threeDaysButton).toHaveClass('bg-indigo-600');
  });

  it('should handle file selection', async () => {
    const user = userEvent.setup();
    const { container } = render(<FileUpload onUploadComplete={mockOnUploadComplete} />);
    
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    
    // Find the hidden file input directly
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, file);
    
    expect(screen.getByText('test.txt')).toBeInTheDocument();
    expect(screen.getByText('Загрузить 1 файл')).toBeInTheDocument();
  });

  it('should show error toast when file exceeds max size', async () => {
    const user = userEvent.setup();
    const { container } = render(<FileUpload onUploadComplete={mockOnUploadComplete} />);
    
    // Create file larger than 10 MB
    const largeFile = new File([new ArrayBuffer(11 * 1024 * 1024)], 'large.txt', { type: 'text/plain' });
    
    // Find the hidden file input directly
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, largeFile);
    
    await waitFor(() => {
      expect(screen.getByText('Файл слишком большой')).toBeInTheDocument();
    });
  });

  it('should upload file and show success message', async () => {
    const user = userEvent.setup();
    const { container } = render(<FileUpload onUploadComplete={mockOnUploadComplete} />);
    
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    
    // Find the hidden file input directly
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, file);
    
    const uploadButton = screen.getByText('Загрузить 1 файл');
    await user.click(uploadButton);
    
    await waitFor(() => {
      expect(mockOnUploadComplete).toHaveBeenCalled();
      expect(screen.getByText('Загружено успешно')).toBeInTheDocument();
    });
  });

  it('should remove file from list', async () => {
    const user = userEvent.setup();
    const { container } = render(<FileUpload onUploadComplete={mockOnUploadComplete} />);
    
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    
    // Find the hidden file input directly
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, file);
    
    expect(screen.getByText('test.txt')).toBeInTheDocument();
    
    const removeButton = screen.getByRole('button', { name: '' });
    await user.click(removeButton);
    
    expect(screen.queryByText('test.txt')).not.toBeInTheDocument();
  });

  it('should copy link to clipboard', async () => {
    const user = userEvent.setup();
    
    // Mock clipboard API
    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      writable: true,
      configurable: true,
    });
    
    const { container } = render(<FileUpload onUploadComplete={mockOnUploadComplete} />);
    
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    
    // Find the hidden file input directly
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, file);
    
    const uploadButton = screen.getByText('Загрузить 1 файл');
    await user.click(uploadButton);
    
    await waitFor(() => {
      const copyButton = screen.getByText('Копировать');
      return user.click(copyButton);
    });
    
    expect(mockWriteText).toHaveBeenCalled();
  });
});
