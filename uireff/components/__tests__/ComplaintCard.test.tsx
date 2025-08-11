import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ComplaintCard from '@/components/ComplaintCard';

const mockComplaint = {
  id: 1,
  description: 'A test complaint about a water leak.',
  category: 0, // Water
  status: 0, // Submitted
  complainant: '0x1234567890123456789012345678901234567890',
  timestamp: Date.now(),
};

const categories = ["Water", "Road", "Electricity", "Sanitation", "Health", "Education", "Other"];

describe('ComplaintCard', () => {
  it('renders complaint details correctly for a regular user', () => {
    render(
      <ComplaintCard
        complaint={mockComplaint}
        categories={categories}
        isOfficial={false}
        proposals={[]}
        onProposeAction={vi.fn()}
        onVote={vi.fn()}
        onExecuteProposal={vi.fn()}
        index={0}
      />
    );

    expect(screen.getByText('Complaint #1')).toBeInTheDocument();
    expect(screen.getByText(mockComplaint.description)).toBeInTheDocument();
    expect(screen.getByText('Category: Water')).toBeInTheDocument();
    expect(screen.getByText('Status: Submitted')).toBeInTheDocument();

    // Official actions should not be visible
    expect(screen.queryByRole('button', { name: /propose action/i })).not.toBeInTheDocument();
  });

  it('shows official actions for an official user', () => {
    render(
      <ComplaintCard
        complaint={mockComplaint}
        categories={categories}
        isOfficial={true}
        proposals={[]}
        onProposeAction={vi.fn()}
        onVote={vi.fn()}
        onExecuteProposal={vi.fn()}
        index={0}
      />
    );

    // Official actions should be visible for submitted complaints
    expect(screen.getByRole('button', { name: /propose action/i })).toBeInTheDocument();
  });

  it('does not show official actions for a resolved complaint', () => {
    const resolvedComplaint = { ...mockComplaint, status: 1 }; // Resolved
    render(
      <ComplaintCard
        complaint={resolvedComplaint}
        categories={categories}
        isOfficial={true}
        proposals={[]}
        onProposeAction={vi.fn()}
        onVote={vi.fn()}
        onExecuteProposal={vi.fn()}
        index={0}
      />
    );

    expect(screen.getByText('Status: Resolved')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /propose action/i })).not.toBeInTheDocument();
  });
});
