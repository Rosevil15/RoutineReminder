// Feature: task-reminder-routine-app
// Unit tests for TaskDetailPage — Requirements 1.5, 1.7, 1.8

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route } from 'react-router-dom';
import { TaskProvider } from '../context/TaskContext';
import { AuthProvider } from '../context/AuthContext';

// Mock the useTasks hook
const mockCreateTask = vi.fn();
const mockUpdateTask = vi.fn();
const mockDeleteTask = vi.fn();
const mockMarkComplete = vi.fn();

vi.mock('../hooks/useTasks', () => ({
  useTasks: () => ({
    tasks: [
      {
        id: 'task-recurring-1',
        userId: 'user-1',
        title: 'Recurring Task',
        scheduledAt: new Date().toISOString(),
        priority: 'medium',
        category: 'personal',
        recurrenceType: 'daily',
        reminderLeadTime: 15,
        isCompleted: false,
        isDirty: false,
        isDeleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    loading: false,
    createTask: mockCreateTask,
    updateTask: mockUpdateTask,
    deleteTask: mockDeleteTask,
    markComplete: mockMarkComplete,
  }),
}));

const { default: TaskDetailPage } = await import('./TaskDetailPage');

function renderPage(id: string) {
  return render(
    <MemoryRouter initialEntries={[`/task-detail/${id}`]}>
      <AuthProvider>
        <TaskProvider>
          <Route path="/task-detail/:id" component={TaskDetailPage} />
        </TaskProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('TaskDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows validation error and does not call createTask when title is empty', () => {
    renderPage('new');

    // Click Save without entering a title — IonInput starts empty
    const saveBtn = screen.getByText('Save');
    fireEvent.click(saveBtn);

    // Validation error should appear
    expect(screen.getByText(/title is required/i)).toBeTruthy();
    expect(mockCreateTask).not.toHaveBeenCalled();
  });

  it('shows validation error for whitespace-only title', () => {
    renderPage('new');

    // Simulate IonInput ionChange with whitespace value
    const titleInput = document.querySelector('ion-input[placeholder="Task title"]');
    expect(titleInput).toBeTruthy();
    fireEvent(titleInput!, new CustomEvent('ionChange', { detail: { value: '   ' }, bubbles: true }));

    const saveBtn = screen.getByText('Save');
    fireEvent.click(saveBtn);

    expect(screen.getByText(/title is required/i)).toBeTruthy();
    expect(mockCreateTask).not.toHaveBeenCalled();
  });

  it('opens recurrence scope action sheet when saving an edit to a recurring task', () => {
    renderPage('task-recurring-1');

    // Page renders in edit mode
    expect(screen.getByText('Edit Task')).toBeTruthy();

    // Click Save — for a recurring task this should open the scope action sheet
    const saveBtn = screen.getByText('Save');
    fireEvent.click(saveBtn);

    // IonActionSheet renders inside <template> in jsdom — check is-open attribute
    const actionSheets = document.querySelectorAll('ion-action-sheet');
    const scopeSheet = Array.from(actionSheets).find(
      (el) => el.getAttribute('header') === 'Edit recurring task'
    );
    expect(scopeSheet).toBeTruthy();
    expect(scopeSheet?.getAttribute('is-open')).toBe('true');
  });
});
