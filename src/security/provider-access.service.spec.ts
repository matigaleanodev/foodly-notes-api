import { Model } from 'mongoose';
import { ProviderAccessService } from './provider-access.service';
import { SecurityCounter } from './security-counter.schema';

describe('Provider access', () => {
  const initialize = jest.fn();
  const consume = jest.fn();
  const counters = {
    updateOne: () => ({ exec: initialize }),
    findOneAndUpdate: () => ({ exec: consume }),
  } as unknown as Model<SecurityCounter>;

  beforeEach(() => {
    initialize.mockReset().mockResolvedValue({});
    consume.mockReset().mockResolvedValue({ count: 1 });
  });

  it('does not call providers when the shared budget is exhausted or Mongo is unavailable', async () => {
    const access = new ProviderAccessService(counters);
    const work = jest.fn().mockResolvedValue('ok');
    consume.mockResolvedValue(null);
    await expect(access.run('spoonacular', work)).rejects.toMatchObject({
      status: 503,
    });
    initialize.mockRejectedValue(new Error('offline'));
    await expect(access.run('spoonacular', work)).rejects.toMatchObject({
      status: 503,
    });
    expect(work).not.toHaveBeenCalled();
  });

  it('bounds concurrent provider requests and releases failed work', async () => {
    const access = new ProviderAccessService(counters);
    let release!: () => void;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    const first = Array.from({ length: 4 }, () =>
      access.run('spoonacular', () => pending),
    );
    await expect(
      access.run('spoonacular', () => Promise.resolve(1)),
    ).rejects.toMatchObject({ status: 503 });
    release();
    await Promise.all(first);
    await expect(
      access.run('spoonacular', () =>
        Promise.reject(new Error('provider failed')),
      ),
    ).rejects.toThrow('provider failed');
    expect(
      await access.run('spoonacular', () => Promise.resolve('retry')),
    ).toBe('retry');
  });
});
