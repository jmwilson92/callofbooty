// Prints a clickable Codespaces URL when running inside a codespace.
const port = process.env.PORT || process.argv[2] || '5173';
const name = process.env.CODESPACE_NAME;
if (name) {
  const url = `https://${name}-${port}.app.github.dev/`;
  console.log('');
  console.log('  ─────────────────────────────────────────────');
  console.log(`  Codespaces game URL:`);
  console.log(`  ${url}`);
  console.log('  (open this if the Ports tab is blank)');
  console.log('  ─────────────────────────────────────────────');
  console.log('');
} else {
  console.log(`  Local: http://localhost:${port}/`);
}
