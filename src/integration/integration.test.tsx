// Feature: task-reminder-routine-app
// Integration and smoke tests — Requirements 2.4, 2.5, 7.3

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Network } from '@capacitor/network';
import { LocalNotifications } from '@capacitor/local-notifications';
import { AuthProvider } from '../context/AuthContext';
import { SyncProvider } from '../context/SyncContext';
import { useSync } from '../hooks/useSync';
import { useNotifications } from '../hooks/useNotifications';

// ============================================================
// 30.3 — Notification channel registration on app init
// Validates: Requirement 2.4
// ============================================================
describe('30.3: App.tsx registers notification channel on mount', () => {
  it('calls LocalNotifications.createChannel with id: task-reminders', async () => {
    const mockCreateChannel = vi.mocked(LocalNotifications.createChannel);
    mockCreateChannel.mockClear();

    const { default: App } = await import('../App');

    await act(async () => {
      render(<App />);
    });

    expect(mockCreateChannel).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'task-reminders' })
    );
  });
});

// ============================================================
// 30.1 — Notification tap listener is registered on mount
// Validates: Requirement 2.5
// ============================================================
describe('30.1: useNotifications tap listener navigates to task detail', () => {
  it('registers localNotificationActionPerformed listener on mount', async () => {
    const mockAddListener = vi.mocked(LocalNotifications.addListener);
    mockAddListener.mockClear();

    const TestComponent: React.FC = () => {
      useNotifications();
      return null;
    };

    await act(async () => {
      render(
        <MemoryRouter>
          <TestComponent />
        </MemoryRouter>
      );
    });

    const listenerNames = mockAddListener.mock.calls.map((c) => c[0]);
    expect(listenerNames).toContain('localNotificationActionPerformed');
  });
});

// ============================================================
// 30.2 — Sync triggers on network reconnect
// Validates: Requirement 7.3
// ============================================================
describe('30.2: useSync registers networkStatusChange listener', () => {
  beforeEach(() => {
    vi.mocked(Network.addListener).mockClear();
  });

  it('registers networkStatusChange listener on mount', async () => {
    const TestComponent: React.FC = () => {
      useSync();
      return null;
    };

    await act(async () => {
      render(
        <AuthProvider>
          <SyncProvider>
            <TestComponent />
          </SyncProvider>
        </AuthProvider>
      );
    });

    const listenerNames = vi.mocked(Network.addListener).mock.calls.map((c) => c[0]);
    expect(listenerNames).toContain('networkStatusChange');
  });
});
