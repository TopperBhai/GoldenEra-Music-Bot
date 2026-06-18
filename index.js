
process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
});

// Login
client.login(botToken).catch(err => {
  console.error('\n❌ Failed to login:', err);
  console.log('\n💡 Make sure you have:\n   1. Added your bot token to Render Environment Variables (DISCORD_TOKEN)\n   2. Or added it in config.json locally');
  process.exit(1);
});
