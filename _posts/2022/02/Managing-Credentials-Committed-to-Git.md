---
title: "Managing Credentials Committed to Git: Recovery and Prevention"
date: 2022-02-13
categories: Development
tags: [Security, Git, Credentials]
excerpt: "Accidentally committed credentials to Git? Learn how to properly remove them, why git history rewriting isn't enough, and how to prevent future leaks."
thumbnail: /assets/git/thumbnail.png
---

Every developer's nightmare: you commit code, push to the repository, and suddenly realize your AWS access keys, database passwords, or API tokens are now in Git history. Panic sets in. You quickly remove the credentials and commit again, but the damage is done—those secrets remain in Git history, accessible to anyone who clones the repository.

This scenario plays out thousands of times daily across organizations. The response often involves frantic Googling, attempting to rewrite Git history, and hoping the credentials weren't already compromised. However, proper credential leak response requires more than just removing files—it demands understanding Git's internals, immediate credential rotation, and implementing prevention mechanisms.

## The Git History Problem

Git's design makes credential leaks particularly dangerous. Understanding why requires examining how Git stores data.

### Why Deletion Isn't Enough

When you commit a file containing credentials and later delete it, the credentials remain in Git history:

!!!error "🚫 The Deletion Illusion"
    **What Developers Often Do**
    - Commit code with credentials accidentally included
    - Realize the mistake
    - Delete the file or remove credentials
    - Commit the deletion
    - Assume the problem is solved
    
    **Why This Fails**
    - Git preserves complete history of all commits
    - Previous commits still contain the credentials
    - Anyone can checkout old commits
    - `git log -p` reveals the credentials
    - Cloning the repository includes full history
    
    **The Reality**
    - Credentials remain accessible indefinitely
    - All repository clones contain the leak
    - Forks and mirrors preserve the credentials
    - Search engines may have indexed the leak
    - Automated scanners continuously monitor public repositories

Simply deleting credentials in a new commit is like locking your door after posting the key online—the damage is already done.

### Git's Immutable History

Git's content-addressable storage makes history modification complex:

!!!anote "🔗 Git Storage Model"
    **How Git Stores Data**
    - Each commit has a unique SHA-1 hash
    - Hash computed from commit content, parent hash, and metadata
    - Changing any commit changes its hash
    - All descendant commits also change hashes
    - Creates a cryptographic chain of history
    
    **Implications for Credential Removal**
    - Removing credentials requires rewriting history
    - All commits after the leak must be recreated
    - New hashes break existing references
    - Collaborators must discard their local copies
    - Forks and mirrors remain unaffected
    
    **The Coordination Challenge**
    - Every developer must fetch rewritten history
    - Old commits must be garbage collected
    - Remote repositories must force-push new history
    - CI/CD systems must update references
    - Backup systems may preserve old history

This architecture means credential leaks cannot be truly "undone"—only mitigated through rotation and history rewriting.

## Immediate Response: Rotate First, Clean Later

When credentials leak into Git, the priority order matters critically.

### Step 1: Rotate Credentials Immediately

Before attempting any Git history manipulation, rotate the compromised credentials:

!!!error "⚠️ Rotate Before Cleaning"
    **Why Rotation Comes First**
    - Git history rewriting takes time
    - Credentials may already be compromised
    - Automated scanners detect leaks within minutes
    - Cleaning Git doesn't revoke access
    - Attackers may have already cloned the repository
    
    **What to Rotate**
    - API keys and tokens
    - Database passwords
    - SSH private keys
    - OAuth client secrets
    - Encryption keys
    - Service account credentials
    
    **Rotation Checklist**
    - Generate new credentials immediately
    - Update all services using the credentials
    - Revoke old credentials completely
    - Monitor for unauthorized access attempts
    - Document the incident for security review
    - Consider short-lived credentials for future use

Rotating credentials immediately limits the window of vulnerability. Cleaning Git history is important but secondary.

!!!tip "⏱️ Short-Lived Credentials Recommendation"
    **Why Short-Lived Credentials Matter**
    - Automatically expire after defined period
    - Reduce exposure window if leaked
    - No manual rotation required
    - Limit blast radius of compromise
    
    **Implementation Options**
    - AWS STS temporary credentials (15 min - 12 hours)
    - Vault dynamic secrets (minutes to hours)
    - OAuth tokens with short expiration
    - Service account tokens with TTL
    
    **Post-Incident Action**
    - Migrate to short-lived credentials where possible
    - Reduces impact of future leaks
    - See [prevention strategies](/2022/03/Preventing-Credentials-in-Git/) for implementation details

### Step 2: Assess the Exposure

Determine how widely the credentials have spread:

!!!anote "🔍 Exposure Assessment"
    **Questions to Answer**
    - Was the repository public or private?
    - How long were credentials exposed?
    - How many people have repository access?
    - Are there forks or mirrors?
    - Did CI/CD systems access the credentials?
    - Were commits pushed to multiple remotes?
    
    **Public Repository Exposure**
    - Assume credentials are fully compromised
    - GitHub, GitLab, Bitbucket notify security researchers
    - Automated scanners detect secrets within minutes
    - Search engines may have indexed the content
    - Credential rotation is mandatory, not optional
    
    **Private Repository Exposure**
    - Assess who has repository access
    - Check access logs for unexpected activity
    - Review audit logs for credential usage
    - Consider insider threat scenarios
    - Rotate credentials as precaution

The exposure assessment determines the urgency and scope of response actions.

## Removing Credentials from Git History

After rotating credentials, clean Git history to prevent future exposure.

### Using git filter-branch (Legacy Approach)

The traditional method uses `git filter-branch` to rewrite history:

```bash
# Remove specific file from all commits
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch path/to/credentials.txt" \
  --prune-empty --tag-name-filter cat -- --all

# Force garbage collection
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

!!!warning "⚠️ filter-branch Limitations"
    **Why filter-branch Is Problematic**
    - Extremely slow on large repositories
    - Complex syntax prone to errors
    - Doesn't handle all edge cases
    - Can corrupt repository if interrupted
    - Git documentation recommends alternatives
    
    **When It Might Still Be Used**
    - Legacy systems without BFG or filter-repo
    - Simple single-file removal scenarios
    - Small repositories with limited history
    - When other tools are unavailable

Modern tools provide better alternatives for most scenarios.

### Using BFG Repo-Cleaner (Recommended)

BFG Repo-Cleaner offers a faster, simpler approach:

```bash
# Download BFG (requires Java)
# https://rtyley.github.io/bfg-repo-cleaner/

# Remove specific file
java -jar bfg.jar --delete-files credentials.txt repo.git

# Remove files matching pattern
java -jar bfg.jar --delete-files "*.key" repo.git

# Replace credentials in all files
echo "password123" > passwords.txt
java -jar bfg.jar --replace-text passwords.txt repo.git

# Clean up
cd repo.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

!!!success "✅ BFG Advantages"
    **Why BFG Is Better**
    - 10-720x faster than filter-branch
    - Simple, intuitive syntax
    - Protects HEAD commit by default
    - Handles large repositories efficiently
    - Well-tested and widely used
    
    **BFG Capabilities**
    - Remove files by name or pattern
    - Replace text across all files
    - Remove large files
    - Strip blobs by size
    - Preserve recent commits

BFG is the recommended tool for most credential removal scenarios.

### Using git filter-repo (Modern Alternative)

`git filter-repo` provides the most powerful and flexible approach:

```bash
# Install filter-repo
pip install git-filter-repo

# Remove specific file
git filter-repo --path path/to/credentials.txt --invert-paths

# Remove files matching pattern
git filter-repo --path-glob '*.key' --invert-paths

# Replace credentials using callback
git filter-repo --replace-text <(echo "password123==>REDACTED")

# Remove credentials from specific directory
git filter-repo --path secrets/ --invert-paths
```

!!!tip "🔧 filter-repo Features"
    **Advanced Capabilities**
    - Fast performance on large repositories
    - Powerful filtering options
    - Python-based extensibility
    - Comprehensive safety checks
    - Detailed operation logging
    
    **Complex Scenarios**
    - Conditional file removal
    - Content transformation
    - Path rewriting
    - Commit message modification
    - Author information updates

For complex scenarios or large repositories, `git filter-repo` offers the best balance of power and safety.

## Force Pushing and Coordination

After rewriting history, propagate changes to all repository copies.

### Force Push to Remote

Rewritten history requires force pushing:

```bash
# Force push to origin
git push origin --force --all

# Force push tags
git push origin --force --tags

# Alternative: force-with-lease (safer)
git push origin --force-with-lease --all
```

!!!warning "⚠️ Force Push Risks"
    **Dangers of Force Pushing**
    - Overwrites remote history
    - Breaks other developers' local copies
    - Can lose commits if not coordinated
    - May be blocked by repository settings
    - Requires special permissions
    
    **Using --force-with-lease**
    - Safer than plain --force
    - Checks if remote has unexpected changes
    - Prevents accidental overwrites
    - Still requires coordination
    - Recommended over --force

Force pushing should be coordinated with all repository users.

### Coordinating with Team Members

All collaborators must update their local copies:

!!!anote "👥 Team Coordination Steps"
    **Communication Required**
    - Notify all team members before rewriting
    - Explain why history is being rewritten
    - Provide clear instructions for updating
    - Set a deadline for local updates
    - Verify everyone has updated successfully
    
    **Instructions for Team Members**
    ```bash
    # Save any local work
    git stash
    
    # Fetch rewritten history
    git fetch origin
    
    # Reset to match remote
    git reset --hard origin/main
    
    # Clean up old references
    git reflog expire --expire=now --all
    git gc --prune=now --aggressive
    
    # Restore local work
    git stash pop
    ```
    
    **Handling Conflicts**
    - Local commits must be rebased onto new history
    - May require manual conflict resolution
    - Consider creating patches before updating
    - Test thoroughly after updating

Poor coordination can result in old history being reintroduced.

## Handling Forks and Mirrors

Repository forks and mirrors preserve the original history.

### The Fork Problem

Forks are independent copies that retain leaked credentials:

!!!error "🚫 Forks Preserve Leaks"
    **Why Forks Are Problematic**
    - Forks are independent repositories
    - Rewriting parent history doesn't affect forks
    - Fork owners may not be aware of the leak
    - Public forks are discoverable
    - No mechanism to force fork updates
    
    **Mitigation Strategies**
    - Contact fork owners directly
    - Request they delete or update forks
    - File DMCA takedown for public forks (extreme cases)
    - Monitor forks for credential usage
    - Accept that some forks may remain

For public repositories, assume forked credentials are permanently exposed.

### Dealing with Mirrors and Backups

Mirrors and backup systems may preserve old history:

!!!warning "⚠️ Mirror Considerations"
    **Common Mirror Locations**
    - CI/CD system caches
    - Backup systems
    - Code review tools
    - IDE repository caches
    - Container image layers
    - Deployment artifacts
    
    **Cleanup Actions**
    - Clear CI/CD caches
    - Update backup systems
    - Rebuild container images
    - Redeploy applications
    - Clear IDE caches
    - Update documentation repositories

Comprehensive cleanup requires identifying all repository copies.

## Prevention: The Better Approach

While this post focuses on recovery, prevention is far more effective than remediation. A comprehensive prevention strategy involves multiple layers:

!!!success "🛡️ Prevention Layers"
    **Configuration**
    - `.gitignore` patterns for credential files
    - Global gitignore for personal patterns
    - Template files (`.env.example`) for guidance
    
    **Code Practices**
    - Environment variables instead of hardcoded credentials
    - Configuration validation at startup
    - Code review for credential detection
    
    **Automated Scanning**
    - Pre-commit hooks (git-secrets, detect-secrets)
    - CI/CD pipeline scanning
    - Platform-provided scanning (GitHub, GitLab)
    
    **Secrets Management**
    - AWS Secrets Manager, HashiCorp Vault
    - Runtime secret injection
    - Automatic credential rotation

For a comprehensive guide to preventing credential leaks with detailed code samples and implementation strategies, see [Preventing Credentials in Git: A Layered Defense Strategy](/2022/03/Preventing-Credentials-in-Git/).

The investment in prevention eliminates the need for complex recovery procedures, Git history rewriting, and emergency credential rotation. Every hour spent building prevention systems saves days of incident response.

## Real-World Incident: The AWS Key Leak

A common scenario illustrates the full response process:

!!!warning "⚠️ Incident Timeline"
    **Day 1: The Leak**
    - Developer commits AWS access keys in config file
    - Pushes to public GitHub repository
    - GitHub secret scanning detects keys within 5 minutes
    - AWS receives notification and alerts account owner
    - Automated scanners begin attempting to use keys
    
    **Hour 1: Discovery and Response**
    - Security team receives GitHub alert
    - Immediately rotates AWS access keys
    - Reviews CloudTrail logs for unauthorized access
    - Discovers cryptocurrency mining instances launched
    - Terminates unauthorized resources
    
    **Hour 2-4: Cleanup**
    - Uses BFG to remove keys from Git history
    - Force pushes cleaned history
    - Contacts fork owners to update
    - Updates CI/CD systems
    - Clears backup systems
    
    **Day 2-7: Post-Incident**
    - Implements pre-commit hooks
    - Adds AWS patterns to git-secrets
    - Conducts security training
    - Reviews other repositories for leaks
    - Documents incident and response

This incident demonstrates why immediate rotation is critical—attackers exploit leaked credentials within minutes.

## Conclusion

Managing credentials committed to Git requires understanding that deletion alone is insufficient. Git's immutable history preserves leaked credentials indefinitely, accessible to anyone with repository access. The proper response prioritizes immediate credential rotation over Git history cleanup—attackers exploit leaked credentials within minutes, while history rewriting takes hours or days.

Removing credentials from Git history involves rewriting commits using tools like BFG Repo-Cleaner or git filter-repo, followed by force pushing and coordinating with all collaborators. However, forks, mirrors, and backup systems may preserve the original history, making complete removal impossible for public repositories. This reality reinforces that credential rotation is mandatory, not optional.

The key insight: treat any credential committed to Git as fully compromised, regardless of repository visibility. Rotate immediately, clean history thoroughly, and implement [comprehensive prevention mechanisms](/2022/03/Preventing-Credentials-in-Git/) to avoid future incidents. Consider migrating to short-lived credentials that automatically expire—they dramatically reduce the impact of future leaks by limiting the exposure window. The operational burden of proper secrets management is far less than the cost of credential compromise and the complexity of post-incident response.
