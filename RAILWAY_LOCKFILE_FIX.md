# Fix Railway deploy (npm ci / lock file)

The lock file was updated to declare the `admin` workspace. For `npm ci` on Railway to succeed, the full dependency tree must be in the lock file.

**Run these in order from the repository root:**

1. **Sync the lock file** (adds admin and all workspace deps to package-lock.json):
   ```bash
   npm run sync-lockfile
   ```

2. **Commit and push:**
   ```bash
   git add package-lock.json package.json README.md
   git commit -m "chore: sync package-lock.json with workspaces for Railway deploy"
   git push
   ```

3. **Redeploy** on Railway (or let it deploy from the push).

After step 1, `package-lock.json` will contain the full admin dependency tree so `npm ci` will pass.
