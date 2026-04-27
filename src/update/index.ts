(() => {
  if (GetConvarInt('pg_versioncheck', 1) === 0) return;

  const resourceName = GetCurrentResourceName();
  const currentVersion = GetResourceMetadata(resourceName, 'version', 0);

  if (currentVersion) {
    console.log(`^5[pry-pgadapter] ${resourceName} v${currentVersion} loaded^0`);
  }
})();
