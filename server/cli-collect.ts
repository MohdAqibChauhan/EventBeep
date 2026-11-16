import { initStore, saveStore } from './db';
import { runCollectorsAndDedupe } from './collectors';

async function main() {
  const store = await initStore();
  const directRecruiterJobs = store.jobs.filter((j) => j.posted_by != null);
  const res = await runCollectorsAndDedupe(directRecruiterJobs);
  store.jobs = [...directRecruiterJobs, ...res.newJobs];
  store.duplicate_logs = res.duplicates;
  store.meta.last_refresh_at = new Date().toISOString();
  store.meta.next_refresh_at = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
  saveStore(store);
  console.log(
    JSON.stringify({
      status: 'ok',
      total_unique_jobs: store.jobs.length,
      fetched: res.fetchedCount,
      new_inserted: res.newJobs.length,
      duplicates_removed: res.duplicates.length,
      duplicates_by_layer: res.duplicatesByLayer
    })
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
