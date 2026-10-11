import { SingleFlight } from './single-flight';

describe('SingleFlight', () => {
  it('shares concurrent work and releases failures for retry', async () => {
    const flights = new SingleFlight<string, number>();
    const work = jest.fn().mockResolvedValue(42);
    expect(
      await Promise.all([flights.run('same', work), flights.run('same', work)]),
    ).toEqual([42, 42]);
    expect(work).toHaveBeenCalledTimes(1);
    await expect(
      flights.run('same', () => Promise.reject(new Error('failed'))),
    ).rejects.toThrow('failed');
    expect(await flights.run('same', work)).toBe(42);
    const promises: Promise<number>[] = [];
    for (let i = 0; i < 64; i++)
      promises.push(flights.run(String(i), () => new Promise(() => undefined)));
    await expect(flights.run('overflow', work)).rejects.toMatchObject({
      status: 503,
    });
  });
});
