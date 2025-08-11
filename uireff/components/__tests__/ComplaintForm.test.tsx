import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ComplaintForm from '@/components/ComplaintForm';

describe('ComplaintForm', () => {
  it('renders the form elements', () => {
    const handleSubmit = vi.fn();
    render(<ComplaintForm onSubmit={handleSubmit} loading={false} account="0x123" />);

    expect(screen.getByPlaceholderText("Describe your grievance in detail...")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit complaint/i })).toBeInTheDocument();
  });

  it('calls onSubmit with the complaint text when submitted', async () => {
    const handleSubmit = vi.fn();
    render(<ComplaintForm onSubmit={handleSubmit} loading={false} account="0x123" />);

    const textarea = screen.getByPlaceholderText("Describe your grievance in detail...");
    const submitButton = screen.getByRole('button', { name: /submit complaint/i });

    const complaintText = 'There is a large pothole on my street.';
    await fireEvent.change(textarea, { target: { value: complaintText } });
    await fireEvent.click(submitButton);

    expect(handleSubmit).toHaveBeenCalledOnce();
    expect(handleSubmit).toHaveBeenCalledWith(complaintText, null); // proofData is null for now
  });

  it('disables the submit button when loading', () => {
    const handleSubmit = vi.fn();
    render(<ComplaintForm onSubmit={handleSubmit} loading={true} account="0x123" />);

    const submitButton = screen.getByRole('button', { name: /submitting/i });
    expect(submitButton).toBeDisabled();
  });

  it('disables the submit button when no account is connected', () => {
    const handleSubmit = vi.fn();
    render(<ComplaintForm onSubmit={handleSubmit} loading={false} account={null} />);

    const submitButton = screen.getByRole('button', { name: /connect wallet to submit/i });
    expect(submitButton).toBeDisabled();
  });

  it('does not call onSubmit if the description is empty', async () => {
    const handleSubmit = vi.fn();
    render(<ComplaintForm onSubmit={handleSubmit} loading={false} account="0x123" />);

    const submitButton = screen.getByRole('button', { name: /submit complaint/i });
    await fireEvent.click(submitButton);

    expect(handleSubmit).not.toHaveBeenCalled();
  });
});
