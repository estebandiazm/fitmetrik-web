import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db/mongodb', () => ({
  default: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/models/Client', () => ({
  ClientModel: { findById: vi.fn() },
}));

import { addDailyWeight } from '@/app/actions/clientActions';
import { ClientModel } from '@/lib/models/Client';

function makeFakeDoc(dailyWeights: any[] = []) {
  const doc: any = {
    dailyWeights,
    save: vi.fn().mockResolvedValue(undefined),
  };
  doc.toObject = vi.fn().mockReturnValue({
    _id: 'client-1',
    name: 'Test',
    coachId: 'coach-1',
    plans: [],
    dailySteps: [],
    dailyWeights: doc.dailyWeights,
    updatedAt: new Date('2026-07-13'),
  });
  return doc;
}

describe('addDailyWeight — notes persistence (Bug 3 regression)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should include notes (not finalNotes) when pushing a new weight entry', async () => {
    const doc = makeFakeDoc();
    vi.mocked(ClientModel.findById).mockResolvedValue(doc);

    await addDailyWeight('client-1', new Date('2026-07-10'), 80.5, 'After breakfast');

    expect(doc.dailyWeights).toHaveLength(1);
    expect(doc.dailyWeights[0]).toHaveProperty('notes', 'After breakfast');
    expect(doc.dailyWeights[0]).not.toHaveProperty('finalNotes');
    expect(doc.save).toHaveBeenCalledOnce();
  });

  it('should include notes (not finalNotes) when updating an existing weight entry for the same date', async () => {
    const existingDate = new Date('2026-07-10');
    existingDate.setHours(0, 0, 0, 0);
    const doc = makeFakeDoc([{ date: existingDate, weight: 79.0, notes: 'old note' }]);
    vi.mocked(ClientModel.findById).mockResolvedValue(doc);

    await addDailyWeight('client-1', new Date('2026-07-10'), 81.0, 'Updated note');

    expect(doc.dailyWeights[0]).toHaveProperty('notes', 'Updated note');
    expect(doc.dailyWeights[0]).not.toHaveProperty('finalNotes');
  });

  it('should persist cleanly with no stray finalNotes key when no notes are provided', async () => {
    const doc = makeFakeDoc();
    vi.mocked(ClientModel.findById).mockResolvedValue(doc);

    await addDailyWeight('client-1', new Date('2026-07-10'), 80.5);

    expect(doc.dailyWeights[0]).not.toHaveProperty('finalNotes');
    expect(doc.dailyWeights[0].notes).toBeUndefined();
  });
});
