import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// Mock framer-motion to disable animations in tests
vi.mock('framer-motion', () => {
  const createMotionComponent = (tag: string) => {
    return React.forwardRef((props: any, ref: any) => {
      const { initial, animate, exit, whileHover, whileTap, transition, layout, ...rest } = props;
      return React.createElement(tag, { ...rest, ref });
    });
  };
  
  return {
    motion: {
      div: createMotionComponent('div'),
      span: createMotionComponent('span'),
      button: createMotionComponent('button'),
      input: createMotionComponent('input'),
      p: createMotionComponent('p'),
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  };
});

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
    
    // Use userEvent.upload - now safe because we added stopPropagation in component
    await user.upload(fileInput, file);
    
    expect(screen.getByText('test.txt')).toBeInTheDocument();
    expect(screen.getByText('Загрузить 1 файл')).toBeInTheDocument();
  });

  it('should not add file when it exceeds max size', async () => {
    const { container } = render(<FileUpload onUploadComplete={mockOnUploadComplete} />);
    
    // Wait for component to initialize with mock settings
    await waitFor(() => {
      expect(screen.getByText(/Максимум 100 МБ на файл/)).toBeInTheDocument();
    });
    
    // Create file larger than 10 MB (mock returns maxFileSize: 10 MB)
    // Use actual content to ensure correct file size
    const largeContent = 'x'.repeat(11 * 1024 * 1024); // 11 MB
    const largeFile = new File([largeContent], 'large.txt', { type: 'text/plain' });
    
    // Verify file size is correct
    expect(largeFile.size).toBe(11 * 1024 * 1024);
    
    // Find the hidden file input directly
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    
    // Use fireEvent.change with stopPropagation already on input
    fireEvent.change(fileInput, { target: { files: [largeFile] } });
    
    // Wait for state update and validation
    await waitFor(() => {
      // File should not be added to the list due to size validation
      expect(screen.queryByText('large.txt')).not.toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Upload button should not appear
    expect(screen.queryByText(/Загрузить 1 файл/)).not.toBeInTheDocument();
  });

  it('should upload file and show success message', async () => {
    const user = userEvent.setup();
    const { container } = render(<FileUpload onUploadComplete={mockOnUploadComplete} />);
    
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    
    // Find the hidden file input directly
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    
    // Use userEvent.upload - now safe because we added stopPropagation in component
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
    
    // Use userEvent.upload - now safe because we added stopPropagation in component
    await user.upload(fileInput, file);
    
    expect(screen.getByText('test.txt')).toBeInTheDocument();
    
    // Find the file container by file name, then find the remove button inside it
    const fileContainer = screen.getByText('test.txt').closest('.bg-white');
    const removeButton = fileContainer?.querySelector('button');
    
    expect(removeButton).toBeTruthy();
    await user.click(removeButton!);
    
    await waitFor(() => {
      expect(screen.queryByText('test.txt')).not.toBeInTheDocument();
    });
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
    
    // Use userEvent.upload - now safe because we added stopPropagation in component
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
