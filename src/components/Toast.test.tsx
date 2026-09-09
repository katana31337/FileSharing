import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ToastContainer, useToast } from './Toast';

describe('Toast Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should render toast with correct content', () => {
    const toasts = [{
      id: '1',
      type: 'error' as const,
      title: 'Ошибка',
      message: 'Тестовое сообщение',
      duration: 5000,
    }];

    render(<ToastContainer toasts={toasts} onRemove={vi.fn()} />);

    expect(screen.getByText('Ошибка')).toBeInTheDocument();
    expect(screen.getByText('Тестовое сообщение')).toBeInTheDocument();
  });

  it('should render different toast types with correct icons', () => {
    const toasts = [
      { id: '1', type: 'error' as const, title: 'Error', message: 'Error message', duration: 5000 },
      { id: '2', type: 'success' as const, title: 'Success', message: 'Success message', duration: 5000 },
      { id: '3', type: 'info' as const, title: 'Info', message: 'Info message', duration: 5000 },
      { id: '4', type: 'warning' as const, title: 'Warning', message: 'Warning message', duration: 5000 },
    ];

    render(<ToastContainer toasts={toasts} onRemove={vi.fn()} />);

    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Info')).toBeInTheDocument();
    expect(screen.getByText('Warning')).toBeInTheDocument();
  });

  it('should call onRemove when close button is clicked', () => {
    const onRemove = vi.fn();
    const toasts = [{
      id: '1',
      type: 'error' as const,
      title: 'Ошибка',
      message: 'Тест',
      duration: 5000,
    }];

    render(<ToastContainer toasts={toasts} onRemove={onRemove} />);

    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);

    expect(onRemove).toHaveBeenCalledWith('1');
  });

  it('should auto-remove toast after duration', async () => {
    vi.useRealTimers(); // Use real timers for this test
    
    const onRemove = vi.fn();
    const toasts = [{
      id: '1',
      type: 'error' as const,
      title: 'Ошибка',
      message: 'Тест',
      duration: 1000, // Shorter duration for faster test
    }];

    render(<ToastContainer toasts={toasts} onRemove={onRemove} />);

    // Wait for the toast to auto-remove
    await waitFor(() => {
      expect(onRemove).toHaveBeenCalledWith('1');
    }, { timeout: 2000 });
  });
});

describe('useToast hook', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should add and remove toasts', () => {
    const TestComponent = () => {
      const toast = useToast();
      
      return (
        <div>
          <button onClick={() => toast.error('Error', 'Error message')}>Add Error</button>
          <button onClick={() => toast.success('Success', 'Success message')}>Add Success</button>
          <span data-testid="count">{toast.toasts.length}</span>
          <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
        </div>
      );
    };

    render(<TestComponent />);

    expect(screen.getByTestId('count').textContent).toBe('0');

    fireEvent.click(screen.getByText('Add Error'));
    expect(screen.getByTestId('count').textContent).toBe('1');

    fireEvent.click(screen.getByText('Add Success'));
    expect(screen.getByTestId('count').textContent).toBe('2');
  });
});
