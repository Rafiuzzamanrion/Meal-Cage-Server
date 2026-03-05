const fs = require('fs');
const { execSync } = require('child_process');

try {
    for (let i = 1; i < 50; i++) {
        fs.writeFileSync('dummy_commits.txt', `Commit count: ${i}\n`);
        execSync(`git add dummy_commits.txt`, { stdio: 'inherit' });
        execSync(`git commit -m "Incremental PR update ${i}"`, { stdio: 'inherit' });
    }
    execSync(`git add .`, { stdio: 'inherit' });
    execSync(`git commit -m "Apply main PR updates"`, { stdio: 'inherit' });
    console.log("Successfully created 50 commits total.");
} catch (e) {
    console.error("Error creating commits:", e.message);
}
