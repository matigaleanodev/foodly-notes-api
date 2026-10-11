const mongoose = require('mongoose');
const { existsSync } = require('node:fs');

async function main() {
  if (existsSync('.env')) process.loadEnvFile('.env');
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is required.');
  await mongoose.connect(process.env.MONGO_URI, {
    autoIndex: false,
    serverSelectionTimeoutMS: 5000,
  });
  try {
    const db = mongoose.connection.db;
    const definitions = [
      {
        collection: 'securitycounters',
        key: { expiresAt: 1 },
        options: { expireAfterSeconds: 0, name: 'security_counter_expiry' },
      },
      {
        collection: 'recipes',
        key: { sourceId: 1 },
        options: { unique: true, name: 'recipe_source_unique' },
      },
      {
        collection: 'dailyrecipes',
        key: { date: 1 },
        options: { unique: true, name: 'daily_date_unique' },
      },
      {
        collection: 'translationentries',
        key: { sourceText: 1, targetLang: 1 },
        options: { unique: true },
      },
      {
        collection: 'translationentries',
        key: { createdAt: 1 },
        options: {
          expireAfterSeconds: 2592000,
          name: 'translation_cache_expiry',
        },
      },
    ];
    for (const definition of definitions.filter((d) => d.options.unique)) {
      const fields = Object.fromEntries(
        Object.keys(definition.key).map((key) => [key, '$' + key]),
      );
      const duplicates = await db
        .collection(definition.collection)
        .aggregate([
          { $group: { _id: fields, count: { $sum: 1 } } },
          { $match: { count: { $gt: 1 } } },
          { $limit: 1 },
        ])
        .toArray();
      if (duplicates.length)
        throw new Error(
          `Duplicate cache keys in ${definition.collection}. Resolve duplicates before creating unique indexes; no data was deleted.`,
        );
    }
    if (!process.argv.includes('--apply')) {
      console.log(
        'No duplicate cache keys. Use --apply to create the required indexes.',
      );
      return;
    }
    for (const { collection, key, options } of definitions) {
      await db.collection(collection).createIndex(key, options);
      console.log(
        `Index ready: ${collection} (${Object.keys(key).join(', ')}).`,
      );
    }
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : 'Cache index preparation failed.',
  );
  process.exitCode = 1;
});
